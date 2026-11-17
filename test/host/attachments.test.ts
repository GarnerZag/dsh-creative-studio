import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject } from '../../src/domain/project.js';
import { addAttachment, removeAttachment, attachmentKind } from '../../src/domain/attachments.js';
import { ATTACHMENT_CHUNK_BYTES, MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES } from '../../src/domain/attachment-schema.js';
import { AttachmentStore, attachmentKey, type StoredAttachment } from '../../src/host/attachment-store.js';
import { decodeUpload } from '../../src/host/attachment-upload.js';

const meta = (id: string, name = 'brief.md', mime = 'text/markdown') => ({ id, name, mime, size: 12, createdAt: '2026-11-17T00:00:00Z' });

test('attachments keep the requirement content revision untouched and reject duplicates', () => {
  const project = createProject('p', 'P');
  const next = addAttachment(project, meta('a'));
  assert.equal(next.contentRevision, project.contentRevision);
  assert.equal(next.projectRevision, project.projectRevision + 1);
  assert.equal(next.attachments.length, 1);
  assert.equal(next.attachments[0]!.kind, 'text');
  assert.throws(() => addAttachment(next, meta('a')), /ATTACHMENT_EXISTS/);
  const removed = removeAttachment(next, 'a');
  assert.equal(removed.attachments.length, 0);
  assert.throws(() => removeAttachment(removed, 'a'), /ATTACHMENT_NOT_FOUND/);
});

test('attachment limits and kind inference are enforced on the domain record', () => {
  assert.equal(attachmentKind('image/png', 'x.png'), 'image');
  assert.equal(attachmentKind('application/octet-stream', 'notes.md'), 'text');
  assert.equal(attachmentKind('application/pdf', 'deck.pdf'), 'other');
  let project = createProject('p', 'P');
  for (let index = 0; index < MAX_ATTACHMENTS; index++) project = addAttachment(project, meta(`a${index}`));
  assert.throws(() => addAttachment(project, meta('overflow')), /ATTACHMENT_LIMIT/);
  assert.throws(() => addAttachment(createProject('q', 'Q'), { ...meta('big'), size: MAX_ATTACHMENT_BYTES + 1 }), /too_big|max|Too big/i);
});

test('stored bytes stream back in bounded chunks and purge with the project', async () => {
  const rows = new Map<string, StoredAttachment>();
  const table = {
    get: (id: string) => rows.get(id),
    put: async (id: string, row: StoredAttachment) => { rows.set(id, structuredClone(row)); },
    entries: () => rows.entries(),
    delete: async (id: string) => rows.delete(id),
  };
  const store = new AttachmentStore(table);
  const bytes = Buffer.alloc(ATTACHMENT_CHUNK_BYTES + 1000, 7);
  await store.put('p1', 'a1', bytes);
  const first = store.chunk('p1', 'a1', 0, ATTACHMENT_CHUNK_BYTES);
  assert.equal(Buffer.from(first.base64, 'base64').length, ATTACHMENT_CHUNK_BYTES);
  assert.equal(first.nextOffset, ATTACHMENT_CHUNK_BYTES);
  const second = store.chunk('p1', 'a1', first.nextOffset!, ATTACHMENT_CHUNK_BYTES);
  assert.equal(Buffer.from(second.base64, 'base64').length, 1000);
  assert.equal(second.nextOffset, null);
  assert.throws(() => store.chunk('p1', 'a1', -1, 10), /INVALID_CHUNK/);
  assert.throws(() => store.chunk('p1', 'a1', 0, ATTACHMENT_CHUNK_BYTES + 1), /INVALID_CHUNK/);
  assert.throws(() => store.chunk('other', 'a1', 0, 10), /ATTACHMENT_NOT_FOUND/);
  await store.put('p2', 'a2', Buffer.from('x'));
  assert.equal(await store.purge('p1'), 1);
  assert.equal(rows.size, 1);
});

test('multi-chunk reads reassemble exactly the bytes that were stored', async () => {
  const rows = new Map<string, StoredAttachment>();
  const table = {
    get: (id: string) => rows.get(id),
    put: async (id: string, row: StoredAttachment) => { rows.set(id, structuredClone(row)); },
    entries: () => rows.entries(),
    delete: async (id: string) => rows.delete(id),
  };
  const store = new AttachmentStore(table);
  const bytes = Buffer.alloc(700 * 1024);
  for (let index = 0; index < bytes.length; index++) bytes[index] = index % 251;
  await store.put('p', 'a', bytes);
  const parts: Buffer[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const read = store.chunk('p', 'a', offset, 256 * 1024);
    const piece = Buffer.from(read.base64, 'base64');
    assert.ok(piece.length > 0);
    parts.push(piece);
    if (read.nextOffset === null) break;
    offset = read.nextOffset;
  }
  assert.equal(Buffer.concat(parts).equals(bytes), true);
  assert.equal(store.chunk('p', 'a', 0, 256 * 1024).total, bytes.length);
});

test('storage keys stay path-safe and upload payloads are validated before writing', async () => {
  const rows = new Map<string, StoredAttachment>();
  const table = {
    get: (id: string) => rows.get(id),
    put: async (id: string, row: StoredAttachment) => {
      assert.match(id, /^[a-zA-Z0-9_-]+$/, 'per-record keys must be path-safe');
      rows.set(id, structuredClone(row));
    },
    entries: () => rows.entries(),
    delete: async (id: string) => rows.delete(id),
  };
  const store = new AttachmentStore(table);
  const projectId = 'b2180d17-6944-4746-be48-30142e9e4a30';
  const attachmentId = 'd4373246-e8de-480d-b1b4-c0da3acf5293';
  assert.equal(attachmentKey(projectId, attachmentId), `${projectId}__${attachmentId}`);
  await store.put(projectId, attachmentId, Buffer.from('hello'));
  assert.equal(Buffer.from(store.chunk(projectId, attachmentId, 0, 16).base64, 'base64').toString(), 'hello');
  assert.throws(() => decodeUpload('not base64!!'), /ATTACHMENT_ENCODING/);
  assert.throws(() => decodeUpload(''), /ATTACHMENT_EMPTY/);
  assert.throws(() => decodeUpload(Buffer.alloc(MAX_ATTACHMENT_BYTES + 1).toString('base64')), /ATTACHMENT_TOO_LARGE/);
  assert.equal(decodeUpload(Buffer.from('ok').toString('base64')).toString(), 'ok');
});

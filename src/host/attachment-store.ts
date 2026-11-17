import { z } from 'zod';
import { ATTACHMENT_CHUNK_BYTES } from '../domain/attachment-schema.js';

/** Bytes live beside the project record so the project itself stays small. */
export const StoredAttachmentSchema = z.object({
  projectId: z.string().min(1),
  attachmentId: z.string().min(1),
  total: z.number().int().nonnegative(),
  chunks: z.array(z.string()).max(64),
}).strict();
export type StoredAttachment = z.infer<typeof StoredAttachmentSchema>;

interface AttachmentTable {
  get(id: string): StoredAttachment | undefined;
  put(id: string, value: StoredAttachment): Promise<void>;
  delete?(id: string): Promise<boolean>;
  entries?(): IterableIterator<[string, StoredAttachment]>;
}

const key = (projectId: string, attachmentId: string) => `${projectId}:${attachmentId}`;

export class AttachmentStore {
  constructor(private readonly table: AttachmentTable) {}

  async put(projectId: string, attachmentId: string, bytes: Buffer): Promise<void> {
    if (this.table.get(key(projectId, attachmentId))) throw new Error('ATTACHMENT_BYTES_EXIST');
    const chunks: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += ATTACHMENT_CHUNK_BYTES) {
      chunks.push(bytes.subarray(offset, offset + ATTACHMENT_CHUNK_BYTES).toString('base64'));
    }
    await this.table.put(key(projectId, attachmentId), StoredAttachmentSchema.parse({ projectId, attachmentId, total: bytes.length, chunks }));
  }

  chunk(projectId: string, attachmentId: string, offset: number, maxBytes: number): { base64: string; nextOffset: number | null; total: number; attachmentId: string } {
    const row = this.record(projectId, attachmentId);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > row.total) throw new Error('INVALID_CHUNK');
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > ATTACHMENT_CHUNK_BYTES) throw new Error('INVALID_CHUNK');
    const index = Math.floor(offset / ATTACHMENT_CHUNK_BYTES);
    const chunkStart = index * ATTACHMENT_CHUNK_BYTES;
    const bytes = Buffer.from(row.chunks[index] ?? '', 'base64');
    const end = Math.min(row.total, offset + maxBytes, chunkStart + bytes.length);
    const slice = bytes.subarray(offset - chunkStart, end - chunkStart);
    if (slice.length !== end - offset) throw new Error('ATTACHMENT_BYTES_CORRUPT');
    return { base64: slice.toString('base64'), nextOffset: end < row.total ? end : null, total: row.total, attachmentId };
  }

  /** Whole file, used when text attachments are fed to the model as material. */
  bytes(projectId: string, attachmentId: string): Buffer {
    const row = this.record(projectId, attachmentId);
    const bytes = Buffer.concat(row.chunks.map(chunk => Buffer.from(chunk, 'base64')));
    if (bytes.length !== row.total) throw new Error('ATTACHMENT_BYTES_CORRUPT');
    return bytes;
  }

  async remove(projectId: string, attachmentId: string): Promise<void> {
    const remove = this.table.delete;
    if (remove) await remove.call(this.table, key(projectId, attachmentId));
  }

  async purge(projectId: string): Promise<number> {
    const entries = this.table.entries, remove = this.table.delete;
    if (!entries || !remove) return 0;
    const keys: string[] = [];
    for (const [id, row] of entries.call(this.table)) if (row.projectId === projectId) keys.push(id);
    for (const id of keys) await remove.call(this.table, id);
    return keys.length;
  }

  private record(projectId: string, attachmentId: string): StoredAttachment {
    const row = this.table.get(key(projectId, attachmentId));
    if (!row || row.projectId !== projectId) throw new Error('ATTACHMENT_NOT_FOUND');
    return row;
  }
}

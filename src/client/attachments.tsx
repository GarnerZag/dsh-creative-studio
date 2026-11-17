import React from 'react';
import type { ProjectSnapshot } from '../types.js';

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_FILES = 20;

export interface AttachmentActions {
  upload(project: ProjectSnapshot, file: { name: string; mime: string; base64: string }): Promise<ProjectSnapshot>;
  remove(project: ProjectSnapshot, attachmentId: string): Promise<ProjectSnapshot>;
  read(project: ProjectSnapshot, attachmentId: string): Promise<Blob>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Turns transport or domain codes into something a product person can act on. */
function describeError(message: string, t: (key: string) => string): string {
  if (message.includes('CONFLICT')) return t('attachmentConflict');
  if (message.includes('ATTACHMENT_LIMIT')) return t('attachmentLimit');
  if (message.includes('ATTACHMENT_TOO_LARGE')) return t('attachmentTooLargeServer');
  if (message.includes('ATTACHMENT_NOT_FOUND')) return t('attachmentGone');
  if (message.includes('HTTP 404') || message.includes('not found')) return t('attachmentUnavailable');
  return message;
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      resolve(text.slice(text.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

/** Supporting material for the idea stage: requirement docs, screenshots, competitor notes. */
export function AttachmentsPanel({ project, t, busy, actions }: { project: ProjectSnapshot; t: (key: string) => string; busy: boolean; actions: AttachmentActions }): React.ReactElement {
  const [localBusy, setLocalBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [urls, setUrls] = React.useState<Record<string, string>>({});
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const disabled = busy || localBusy;
  const list = project.attachments ?? [];
  const images = list.filter(item => item.kind === 'image');

  React.useEffect(() => {
    let live = true;
    const created: string[] = [];
    const pending = images.filter(item => !urls[item.id]);
    void Promise.all(pending.map(async item => {
      try {
        const blob = await actions.read(project, item.id);
        const url = URL.createObjectURL(blob);
        created.push(url);
        return [item.id, url] as const;
      } catch {
        return null;
      }
    })).then(pairs => {
      if (!live) { created.forEach(url => URL.revokeObjectURL(url)); return; }
      const next: Record<string, string> = {};
      for (const pair of pairs) if (pair) next[pair[0]] = pair[1];
      if (Object.keys(next).length) setUrls(prev => ({ ...prev, ...next }));
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, list.map(item => item.id).join(',')]);

  const add = async (files: FileList | null): Promise<void> => {
    if (!files?.length) return;
    setError('');
    setLocalBusy(true);
    try {
      let current = project;
      let room = MAX_FILES - list.length;
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) { setError(t('attachmentTooLarge').replace('{name}', file.name)); continue; }
        if (room <= 0) { setError(t('attachmentLimit')); break; }
        const base64 = await readBase64(file);
        current = await actions.upload(current, { name: file.name, mime: file.type || 'application/octet-stream', base64 });
        room -= 1;
      }
    } catch (caught) {
      setError(describeError(caught instanceof Error ? caught.message : String(caught), t));
    } finally {
      setLocalBusy(false);
    }
  };

  const remove = async (attachmentId: string): Promise<void> => {
    setError('');
    setLocalBusy(true);
    try {
      await actions.remove(project, attachmentId);
      setUrls(prev => {
        const next = { ...prev };
        const url = next[attachmentId];
        if (url) URL.revokeObjectURL(url);
        delete next[attachmentId];
        return next;
      });
      if (openId === attachmentId) setOpenId(null);
    } catch (caught) {
      setError(describeError(caught instanceof Error ? caught.message : String(caught), t));
    } finally {
      setLocalBusy(false);
    }
  };

  const counts = { text: 0, image: 0, other: 0 };
  for (const item of list) counts[item.kind] += 1;
  const material: string[] = [];
  if (counts.text) material.push(t('attachmentMaterialText').replace('{n}', String(counts.text)));
  if (counts.image) material.push(t('attachmentMaterialImage').replace('{n}', String(counts.image)));
  if (counts.other) material.push(t('attachmentMaterialOther').replace('{n}', String(counts.other)));

  return (
    <section
      className={dragging ? 'cs-attachments cs-drop' : 'cs-attachments'}
      aria-label={t('attachmentsTitle')}
      onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) void add(event.dataTransfer.files); }}
      onPaste={event => {
        if (disabled) return;
        const files = Array.from(event.clipboardData.files ?? []).filter(file => file.type.startsWith('image/'));
        if (!files.length) return;
        event.preventDefault();
        const transfer = new DataTransfer();
        files.forEach(file => transfer.items.add(file));
        void add(transfer.files);
      }}
      tabIndex={0}
    >
      <div className="cs-toolbar">
        <label className="cs-file-button">
          {localBusy ? t('attachmentBusy') : t('attachmentAdd')}
          <input type="file" multiple disabled={disabled} onChange={event => { void add(event.currentTarget.files); event.currentTarget.value = ''; }} />
        </label>
        <span className="cs-hint">{t('attachmentsHint')}</span>
        <span className="cs-hint">{t('attachmentDrop')}</span>
        <span className="cs-hint">{t('attachmentPaste')}</span>
      </div>
      {error && <p role="alert" className="cs-error">{error}</p>}
      {list.length === 0
        ? null
        : (
          <ul className="cs-attachment-list">
            {list.map(item => (
              <li key={item.id}>
                <button type="button" className="cs-attachment-open" disabled={disabled} aria-expanded={openId === item.id} onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                  {item.kind === 'image' && urls[item.id]
                    ? <img src={urls[item.id]} alt="" width={40} height={40} />
                    : <span className="cs-attachment-badge" aria-hidden="true">{item.kind === 'text' ? 'TXT' : item.kind === 'image' ? 'IMG' : 'FILE'}</span>}
                  <span className="cs-attachment-name">{item.name}</span>
                  <span className="cs-hint">{formatSize(item.size)}</span>
                </button>
                <button type="button" className="cs-quiet" disabled={disabled} aria-label={`${t('attachmentRemove')} ${item.name}`} onClick={() => { void remove(item.id); }}>{t('attachmentRemove')}</button>
                {openId === item.id && item.kind === 'image' && urls[item.id] && <img className="cs-attachment-preview" src={urls[item.id]} alt={item.name} />}
              </li>
            ))}
          </ul>
        )}
      {material.length > 0 && <p className="cs-hint">{t('attachmentMaterial')}{material.join(t('listJoin'))}</p>}
    </section>
  );
}

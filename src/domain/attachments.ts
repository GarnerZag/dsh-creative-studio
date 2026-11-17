import type { Project } from './project.js';
import {
  AttachmentSchema,
  attachmentKind,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  type Attachment,
} from './attachment-schema.js';

export { MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES, attachmentKind };
export type { Attachment };

export interface AttachmentInput {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
}

/** Attachments are supporting material, so they bump the revision but never the requirement content. */
export function addAttachment(current: Project, input: AttachmentInput): Project {
  const meta = AttachmentSchema.parse({ ...input, kind: attachmentKind(input.mime, input.name) });
  if (current.attachments.some((item) => item.id === meta.id)) throw new Error('ATTACHMENT_EXISTS');
  if (current.attachments.length >= MAX_ATTACHMENTS) throw new Error('ATTACHMENT_LIMIT');
  const next = structuredClone(current);
  next.attachments = [...next.attachments, meta];
  next.projectRevision++;
  return next;
}

export function removeAttachment(current: Project, id: string): Project {
  if (!current.attachments.some((item) => item.id === id)) throw new Error('ATTACHMENT_NOT_FOUND');
  const next = structuredClone(current);
  next.attachments = next.attachments.filter((item) => item.id !== id);
  next.projectRevision++;
  return next;
}

import { z } from 'zod';

/** One uploaded file the owner attached to a project as supporting material. */
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
export const MAX_ATTACHMENTS = 20;
/** Bytes returned per chunk read; the client stitches chunks back together. */
export const ATTACHMENT_CHUNK_BYTES = 256 * 1024;

export const AttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  mime: z.string().trim().max(120),
  size: z.number().int().nonnegative().max(MAX_ATTACHMENT_BYTES),
  kind: z.enum(['image', 'text', 'other']),
  createdAt: z.string().min(1),
}).strict();
export type Attachment = z.infer<typeof AttachmentSchema>;

/** Images preview inline, text can be read as material, everything else is just kept. */
export function attachmentKind(mime: string, name: string): Attachment['kind'] {
  if (/^image\//i.test(mime)) return 'image';
  if (/^text\//i.test(mime)) return 'text';
  if (/\.(md|markdown|txt|json|csv|ya?ml)$/i.test(name)) return 'text';
  return 'other';
}

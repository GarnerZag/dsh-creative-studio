import { MAX_ATTACHMENT_BYTES } from '../domain/attachment-schema.js';

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/** Validates the wire payload before anything is written to storage. */
export function decodeUpload(base64: string): Buffer {
  if (typeof base64 !== 'string' || !BASE64.test(base64)) throw new Error('ATTACHMENT_ENCODING');
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length === 0) throw new Error('ATTACHMENT_EMPTY');
  if (bytes.length > MAX_ATTACHMENT_BYTES) throw new Error('ATTACHMENT_TOO_LARGE');
  return bytes;
}

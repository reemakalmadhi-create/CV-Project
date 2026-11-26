/** Reading an uploaded image from a multipart request (server only). */
import { sniffImage, type ImageExt } from "./db";

export const MAX_UPLOAD = 4 * 1024 * 1024; // the browser resizes before sending (Vercel body limit is 4.5 MB)
export const MAX_POSES = 12;
export const MAX_GARMENTS = 40;

export async function readUpload(value: FormDataEntryValue | null | undefined): Promise<{ buf: Buffer; ext: ImageExt } | { error: string }> {
  if (!(value instanceof File) || value.size === 0) return { error: "Please add a photo." };
  if (value.size > MAX_UPLOAD) return { error: "That image is too large." };
  const buf = Buffer.from(await value.arrayBuffer());
  const ext = sniffImage(buf);
  if (!ext) return { error: "The photo must be a JPG, PNG or WEBP image." };
  return { buf, ext };
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

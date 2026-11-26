/**
 * Person-photo checks in the browser (quality hints, not AI):
 * format, file size, resolution, orientation, lighting, focus (Laplacian variance).
 * Also prepares the model input: the photo fitted onto a 768×1024 canvas (the try-on input size).
 */
export type CheckKey = "to.chk.format" | "to.chk.big" | "to.chk.res" | "to.chk.portrait" | "to.chk.light" | "to.chk.focus" | "to.chk.read";
export interface Check { key: CheckKey; vars?: Record<string, string | number>; ok: boolean; blocking: boolean }
export interface PhotoReport {
  accepted: boolean;
  checks: Check[];
  width: number;
  height: number;
  preparedUrl?: string; // 768×1024 JPEG data URL sent to the API
}

const MAX_BYTES = 10 * 1024 * 1024;
const MIN_W = 384, MIN_H = 512;
export const MODEL_W = 768, MODEL_H = 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = src;
  });
}

function stats(img: HTMLImageElement) {
  const w = 256, h = Math.max(1, Math.round((256 * img.naturalHeight) / img.naturalWidth));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sum += gray[i];
  }
  // variance of the Laplacian = sharpness
  let n = 0, m = 0, m2 = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const lap = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
    n++; const d = lap - m; m += d / n; m2 += d * (lap - m);
  }
  return { brightness: sum / (w * h), sharpness: n > 1 ? m2 / (n - 1) : 0 };
}

/** Fit the photo inside 768×1024 on white, centred (sent to the try-on service). */
function prepare(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = MODEL_W; c.height = MODEL_H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, MODEL_W, MODEL_H);
  const s = Math.min(MODEL_W / img.naturalWidth, MODEL_H / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (MODEL_W - w) / 2, (MODEL_H - h) / 2, w, h);
  return c.toDataURL("image/jpeg", 0.92);
}

export async function checkPhoto(file: File): Promise<PhotoReport> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return { accepted: false, width: 0, height: 0, checks: [{ key: "to.chk.format", ok: false, blocking: true }] };
  if (file.size > MAX_BYTES)
    return { accepted: false, width: 0, height: 0, checks: [{ key: "to.chk.big", ok: false, blocking: true }] };
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { naturalWidth: w, naturalHeight: h } = img;
    const { brightness, sharpness } = stats(img);
    const checks: Check[] = [
      { key: "to.chk.format", ok: true, blocking: true },
      { key: "to.chk.res", vars: { mw: MIN_W, mh: MIN_H, w, h }, ok: w >= MIN_W && h >= MIN_H, blocking: true },
      { key: "to.chk.portrait", ok: h >= w * 1.1, blocking: false },
      { key: "to.chk.light", ok: brightness >= 45 && brightness <= 225, blocking: false },
      { key: "to.chk.focus", ok: sharpness >= 40, blocking: false },
    ];
    const accepted = checks.every((c) => c.ok || !c.blocking);
    return { accepted, checks, width: w, height: h, preparedUrl: accepted ? prepare(img) : undefined };
  } catch {
    return { accepted: false, width: 0, height: 0, checks: [{ key: "to.chk.read", ok: false, blocking: true }] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(body);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Own garment photos (e.g. saved from a shop website): no person checks, just readable,
 * not tiny, fitted inside 1024 px on white (transparent PNGs get a white background).
 */
export async function prepareGarment(file: File): Promise<{ url: string } | { error: "to.chk.format" | "to.chk.big" | "to.chk.read" | "mc.tooSmall" }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "to.chk.format" };
  if (file.size > MAX_BYTES) return { error: "to.chk.big" };
  const src = URL.createObjectURL(file);
  try {
    const img = await loadImage(src);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (w < 160 || h < 160) return { error: "mc.tooSmall" };
    const s = Math.min(1, 1024 / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * s); c.height = Math.round(h * s);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { url: c.toDataURL("image/jpeg", 0.92) };
  } catch {
    return { error: "to.chk.read" };
  } finally {
    URL.revokeObjectURL(src);
  }
}

// Browser-side half of an upload: check the file, then send it straight to Vercel Blob with a
// short-lived token from /api/admin/upload. The server re-checks everything when the URL is committed.
import { upload } from "@vercel/blob/client";
import { formatBytes, SNIFF_BYTES, sniffImage, UPLOAD_RULES, uploadPathname, type ImageInfo, type UploadKind } from "@/lib/uploads";

export class UploadError extends Error {}

/** Mirrors the server rules for instant feedback: real PNG/JPEG/WebP bytes and the kind's size cap. */
export async function inspectImage(file: File, kind: UploadKind): Promise<ImageInfo> {
  const rules = UPLOAD_RULES[kind];
  if (file.size > rules.maxBytes) {
    throw new UploadError(`${file.name} is ${formatBytes(file.size)}. ${rules.label}s must be ${formatBytes(rules.maxBytes)} or smaller.`);
  }
  let info = sniffImage(new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer()));
  if (!info && file.size > SNIFF_BYTES) info = sniffImage(new Uint8Array(await file.arrayBuffer()));
  if (!info) throw new UploadError(`${file.name} isn't a PNG, JPEG or WebP image. SVG and GIF aren't supported.`);
  return info;
}

export async function uploadImage(file: File, kind: UploadKind, info: ImageInfo, onProgress?: (pct: number) => void) {
  try {
    const blob = await upload(uploadPathname(kind, file.name, info.type), file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      clientPayload: JSON.stringify({ kind }),
      contentType: info.type,
      onUploadProgress: onProgress ? ({ percentage }) => onProgress(percentage) : undefined,
    });
    return blob.url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new UploadError(`Upload failed: ${msg.replace(/^Vercel Blob: /, "")}`);
  }
}

export const ACCEPT = "image/png,image/jpeg,image/webp";

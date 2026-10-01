import "server-only";
import { BlobNotFoundError, del, head } from "@vercel/blob";
import { HttpError } from "@/lib/auth/guard";
import { ALLOWED_CONTENT_TYPES, SNIFF_BYTES, sniffImage, UPLOAD_RULES, type ImageInfo, type UploadKind } from "@/lib/uploads";

/**
 * Server-side checks for a client upload (SPEC §7), run before its URL is written to the database:
 * the blob is in our store, under the kind's prefix, with an allowed content type and size, and its
 * bytes really are a PNG / JPEG / WebP (so a renamed .exe declared as image/png still fails).
 */

/** Store id from the token (vercel_blob_rw_<storeId>_<secret>); public URLs are https://<storeId>.public.blob.vercel-storage.com. */
function storeHost(): string | null {
  const m = /^vercel_blob_rw_([a-z0-9]+)_/i.exec(process.env.BLOB_READ_WRITE_TOKEN ?? "");
  return m ? `${m[1].toLowerCase()}.public.blob.vercel-storage.com` : null;
}

export function isOurBlobUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = storeHost();
  return host ? u.hostname.toLowerCase() === host : u.hostname.endsWith(".public.blob.vercel-storage.com");
}

async function readBytes(url: string, partial: boolean): Promise<Uint8Array> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: partial ? { range: `bytes=0-${SNIFF_BYTES - 1}` } : {},
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new HttpError(502, "Couldn't read the uploaded file back. Try again.");
  return new Uint8Array(await res.arrayBuffer());
}

export interface VerifiedUpload extends ImageInfo {
  url: string;
  size: number;
}

export async function verifyUpload(url: string, kind: UploadKind): Promise<VerifiedUpload> {
  const rules = UPLOAD_RULES[kind];
  if (!isOurBlobUrl(url)) throw new HttpError(400, "That file isn't in this site's storage.");

  let meta;
  try {
    meta = await head(url);
  } catch (err) {
    if (err instanceof BlobNotFoundError) throw new HttpError(400, "That upload wasn't found. Try again.");
    throw err;
  }

  const reject = async (message: string): Promise<never> => {
    await deleteBlob(url); // a fresh, unreferenced upload that failed checks
    throw new HttpError(400, message);
  };

  if (!meta.pathname.startsWith(rules.prefix)) throw new HttpError(400, "That file was uploaded for something else.");
  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(meta.contentType))
    return reject("Only PNG, JPEG or WebP images are allowed.");
  if (meta.size > rules.maxBytes) return reject(`${rules.label} must be ${rules.maxBytes / 1024 / 1024} MB or smaller.`);

  let bytes = await readBytes(meta.url, meta.size > SNIFF_BYTES);
  let info = sniffImage(bytes);
  if (!info && meta.size > SNIFF_BYTES && bytes.length < meta.size) {
    // A JPEG whose metadata pushes the frame header past the first chunk: read the whole file.
    bytes = await readBytes(meta.url, false);
    info = sniffImage(bytes);
  }
  if (!info) return reject("That file isn't a valid PNG, JPEG or WebP image.");
  if (info.type !== meta.contentType) return reject("The file's contents don't match its image type.");

  return { url: meta.url, size: meta.size, ...info };
}

/** Deletes one of our blobs; never throws (an orphan is acceptable, a failed save is not). */
export async function deleteBlob(url: string | null | undefined) {
  if (!url || !isOurBlobUrl(url)) return;
  try {
    await del(url);
  } catch (err) {
    console.warn(`[blob] delete failed for ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Upload rules (SPEC §7), shared by the token route, the commit check and the admin UI.
// Pure: no secrets, no server-only imports.

export type UploadKind = "thumbnail" | "showcase" | "logo";

export const ALLOWED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<UploadKind, { prefix: string; maxBytes: number; label: string }> = {
  thumbnail: { prefix: "thumbnails/", maxBytes: 8 * MB, label: "Thumbnail" },
  showcase: { prefix: "showcase/", maxBytes: 8 * MB, label: "Image" },
  logo: { prefix: "logo/", maxBytes: 2 * MB, label: "Logo" },
};

export const isUploadKind = (v: unknown): v is UploadKind =>
  typeof v === "string" && Object.hasOwn(UPLOAD_RULES, v);

const EXT: Record<AllowedContentType, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** `${prefix}${slug}.${ext}`; the Blob API appends a random suffix before the extension. */
export function uploadPathname(kind: UploadKind, fileName: string, type: AllowedContentType): string {
  const base = fileName.replace(/\.[^.]*$/, "");
  const slug =
    base
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
  return `${UPLOAD_RULES[kind].prefix}${slug}.${EXT[type]}`;
}

/** The only pathnames the token route will sign for a kind. */
export const pathnamePattern = (kind: UploadKind) =>
  new RegExp(`^${UPLOAD_RULES[kind].prefix.replace("/", "\\/")}[a-z0-9-]{1,40}\\.(png|jpg|webp)$`);

export interface ImageInfo {
  type: AllowedContentType;
  width: number;
  height: number;
}

/**
 * Identifies PNG / JPEG / WebP from the file's bytes (not its name or declared type) and reads its
 * pixel size. Returns null for anything else, so an .exe renamed to .png, an SVG or a GIF fails.
 */
export function sniffImage(bytes: Uint8Array): ImageInfo | null {
  const b = bytes;
  const u16be = (o: number) => (b[o] << 8) | b[o + 1];
  const u16le = (o: number) => b[o] | (b[o + 1] << 8);
  const u24le = (o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
  const u32be = (o: number) => ((b[o] << 24) >>> 0) + ((b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]);
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  const valid = (type: AllowedContentType, width: number, height: number) =>
    width > 0 && height > 0 ? { type, width, height } : null;

  // PNG: signature, then IHDR as the first chunk.
  if (b.length >= 24 && u32be(0) === 0x89504e47 && u32be(4) === 0x0d0a1a0a && ascii(12, 4) === "IHDR") {
    return valid("image/png", u32be(16), u32be(20));
  }

  // JPEG: SOI, then walk segments to the first start-of-frame marker.
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) return null;
      const marker = b[o + 1];
      if (marker === 0xff) {
        o += 1; // fill byte
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        o += 2; // markers without a length
        continue;
      }
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) return valid("image/jpeg", u16be(o + 7), u16be(o + 5));
      if (marker === 0xd9 || marker === 0xda) return null; // end of image / scan data before any frame
      o += 2 + u16be(o + 2);
    }
    return null;
  }

  // WebP: RIFF....WEBP with a VP8 / VP8L / VP8X first chunk.
  if (b.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8 " && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
      return valid("image/webp", u16le(26) & 0x3fff, u16le(28) & 0x3fff);
    }
    if (chunk === "VP8L" && b[20] === 0x2f) {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return valid("image/webp", (bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    }
    if (chunk === "VP8X") return valid("image/webp", u24le(24) + 1, u24le(27) + 1);
  }
  return null;
}

/** Bytes needed to sniff almost any file; JPEGs with huge metadata fall back to the whole file. */
export const SNIFF_BYTES = 256 * 1024;

export const formatBytes = (n: number) =>
  n >= MB ? `${(n / MB).toFixed(n % MB === 0 ? 0 : 1)} MB` : `${Math.ceil(n / 1024)} KB`;

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { adminRoute, HttpError, json } from "@/lib/auth/guard";
import { ALLOWED_CONTENT_TYPES, isUploadKind, pathnamePattern, UPLOAD_RULES } from "@/lib/uploads";

/**
 * Client-upload token endpoint (SPEC §7). adminRoute has already required a full admin session
 * (401 otherwise) and a same-site Origin. The token pins the content types, size cap and a random
 * suffix; the pathname must sit under the kind's prefix. No onUploadCompleted: the client commits
 * the URL through a verified admin route instead, which also works on localhost.
 */
export const POST = adminRoute(async (req) => {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
  if (body?.type !== "blob.generate-client-token") throw new HttpError(400, "Unsupported upload event.");

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let kind: unknown;
        try {
          kind = JSON.parse(clientPayload ?? "{}").kind;
        } catch {}
        if (!isUploadKind(kind)) throw new HttpError(400, "Unknown upload kind.");
        if (!pathnamePattern(kind).test(pathname)) throw new HttpError(400, "Invalid upload path.");
        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: UPLOAD_RULES[kind].maxBytes,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return json(result);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error("[upload]", err);
    throw new HttpError(500, "Uploads aren't configured. Check BLOB_READ_WRITE_TOKEN.");
  }
});

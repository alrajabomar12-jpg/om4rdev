import { eq, sql } from "drizzle-orm";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, json, readJson } from "@/lib/auth/guard";
import { deleteBlob, verifyUpload } from "@/lib/blob";
import { getDb, schema } from "@/lib/db";
import { getSettings } from "@/lib/home";
import { blobUrlSchema } from "@/lib/validation";

const setLogo = (url: string | null) =>
  getDb()
    .update(schema.siteSettings)
    .set({ logoUrl: url, updatedAt: sql`now()` })
    .where(eq(schema.siteSettings.id, 1));

// Replace the logo with a finished upload, then delete the previous uploaded logo.
export const PUT = adminRoute(async (req) => {
  const { url } = await readJson(req, blobUrlSchema);
  const previous = (await getSettings()).logoUrl;
  const blob = await verifyUpload(url, "logo");
  await setLogo(blob.url);
  if (previous !== blob.url) await deleteBlob(previous);
  revalidatePublic();
  return json({ url: blob.url });
});

// Reset to default: logo_url = null (→ /brand/om4r-logo.png) and delete the uploaded blob.
export const DELETE = adminRoute(async () => {
  const previous = (await getSettings()).logoUrl;
  await setLogo(null);
  await deleteBlob(previous);
  revalidatePublic();
  return json({ ok: true });
});

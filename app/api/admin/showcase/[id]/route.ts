import { eq } from "drizzle-orm";
import { parseId } from "@/lib/admin/reorder";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, HttpError, json, readJson } from "@/lib/auth/guard";
import { deleteBlob } from "@/lib/blob";
import { getDb, schema } from "@/lib/db";
import { effectiveAlt, showcaseUpdateSchema } from "@/lib/validation";

type Params = { id: string };
const t = schema.showcaseItems;

export const PATCH = adminRoute<Params>(async (req, _s, { id }) => {
  const { caption, alt } = await readJson(req, showcaseUpdateSchema);
  const rows = await getDb()
    .update(t)
    .set({ caption, alt: effectiveAlt(alt, caption) })
    .where(eq(t.id, parseId(id)))
    .returning({ id: t.id });
  if (!rows.length) throw new HttpError(404, "That image no longer exists.");
  revalidatePublic();
  return json({ ok: true });
});

// Deletes the item and its blob.
export const DELETE = adminRoute<Params>(async (_req, _s, { id }) => {
  const rows = await getDb()
    .delete(t)
    .where(eq(t.id, parseId(id)))
    .returning({ imageUrl: t.imageUrl });
  if (!rows.length) throw new HttpError(404, "That image no longer exists.");
  await deleteBlob(rows[0].imageUrl);
  revalidatePublic();
  return json({ ok: true });
});

import { eq, sql } from "drizzle-orm";
import { getGame } from "@/lib/admin/games";
import { parseId } from "@/lib/admin/reorder";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, json, readJson } from "@/lib/auth/guard";
import { deleteBlob, verifyUpload } from "@/lib/blob";
import { getDb, schema } from "@/lib/db";
import { blobUrlSchema } from "@/lib/validation";

type Params = { id: string };

const setThumbnail = (id: string, url: string | null) =>
  getDb()
    .update(schema.games)
    .set({ customThumbnailUrl: url, updatedAt: sql`now()` })
    .where(eq(schema.games.id, id));

// Commit a finished upload: verify it, store it, then delete the previous custom thumbnail.
export const PUT = adminRoute<Params>(async (req, _s, { id }) => {
  const game = await getGame(parseId(id));
  const { url } = await readJson(req, blobUrlSchema);
  const blob = await verifyUpload(url, "thumbnail");
  await setThumbnail(id, blob.url);
  if (game.customThumbnailUrl !== blob.url) await deleteBlob(game.customThumbnailUrl);
  revalidatePublic();
  return json({ url: blob.url, width: blob.width, height: blob.height });
});

// Remove: back to Roblox's thumbnail.
export const DELETE = adminRoute<Params>(async (_req, _s, { id }) => {
  const game = await getGame(parseId(id));
  await setThumbnail(id, null);
  await deleteBlob(game.customThumbnailUrl);
  revalidatePublic();
  return json({ ok: true });
});

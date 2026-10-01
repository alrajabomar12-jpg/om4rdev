import { eq, sql } from "drizzle-orm";
import { getGame } from "@/lib/admin/games";
import { parseId } from "@/lib/admin/reorder";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, json, readJson } from "@/lib/auth/guard";
import { deleteBlob } from "@/lib/blob";
import { getDb, schema } from "@/lib/db";
import { gameUpdateSchema } from "@/lib/validation";

type Params = { id: string };

export const PATCH = adminRoute<Params>(async (req, _s, { id }) => {
  await getGame(parseId(id));
  const input = await readJson(req, gameUpdateSchema);
  await getDb()
    .update(schema.games)
    .set({ ...input, updatedAt: sql`now()` })
    .where(eq(schema.games.id, id));
  revalidatePublic();
  return json({ ok: true });
});

// Deletes the game and its custom thumbnail blob.
export const DELETE = adminRoute<Params>(async (_req, _s, { id }) => {
  const game = await getGame(parseId(id));
  await getDb().delete(schema.games).where(eq(schema.games.id, id));
  await deleteBlob(game.customThumbnailUrl);
  revalidatePublic({ roblox: true });
  return json({ ok: true });
});

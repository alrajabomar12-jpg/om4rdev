import { previewGame } from "@/lib/admin/games";
import { nextSortOrder } from "@/lib/admin/reorder";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, HttpError, json, readJson } from "@/lib/auth/guard";
import { getDb, schema } from "@/lib/db";
import { gameCreateSchema } from "@/lib/validation";

// Add a game: the server re-runs the preview checks itself and never trusts a client-sent universe ID.
export const POST = adminRoute(async (req) => {
  const { url, role } = await readJson(req, gameCreateSchema);
  const preview = await previewGame(url);
  try {
    const [row] = await getDb()
      .insert(schema.games)
      .values({
        placeId: preview.placeId,
        universeId: preview.universeId,
        role,
        sortOrder: await nextSortOrder("games"),
      })
      .returning({ id: schema.games.id });
    revalidatePublic({ roblox: true });
    return json({ id: row.id }, 201);
  } catch (err) {
    // Unique place_id: a concurrent add of the same game.
    if (String((err as { cause?: { code?: string } })?.cause?.code ?? "") === "23505")
      throw new HttpError(409, "That game is already in the list.");
    throw err;
  }
});

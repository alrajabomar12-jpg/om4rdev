import { z } from "zod";
import { previewGame } from "@/lib/admin/games";
import { adminRoute, json, readJson } from "@/lib/auth/guard";

export const POST = adminRoute(async (req) => {
  const { url } = await readJson(req, z.object({ url: z.string().max(500) }));
  return json({ preview: await previewGame(url) });
});

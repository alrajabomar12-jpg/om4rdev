import { moveRow, parseId } from "@/lib/admin/reorder";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, json, readJson } from "@/lib/auth/guard";
import { moveSchema } from "@/lib/validation";

export const POST = adminRoute<{ id: string }>(async (req, _s, { id }) => {
  const { direction } = await readJson(req, moveSchema);
  await moveRow("games", parseId(id), direction);
  revalidatePublic({ roblox: true });
  return json({ ok: true });
});

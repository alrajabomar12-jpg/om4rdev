import { eq, sql } from "drizzle-orm";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, json, readJson } from "@/lib/auth/guard";
import { getDb, schema } from "@/lib/db";
import { parseProfileUrl } from "@/lib/roblox/parse";
import { settingsSchema } from "@/lib/validation";

export const PUT = adminRoute(async (req) => {
  const input = await readJson(req, settingsSchema);
  // settingsSchema already guarantees the URL parses; the user ID is derived, never sent by the client.
  const robloxUserId = parseProfileUrl(input.robloxProfileUrl)!;
  await getDb()
    .update(schema.siteSettings)
    .set({ ...input, robloxUserId, updatedAt: sql`now()` })
    .where(eq(schema.siteSettings.id, 1));
  revalidatePublic();
  return json({ ok: true });
});

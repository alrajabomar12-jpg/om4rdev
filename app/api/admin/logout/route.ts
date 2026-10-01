import { z } from "zod";
import { adminRoute, json, readJson } from "@/lib/auth/guard";
import { clearSessionCookie, deleteAllSessionsQuery, deleteSessionQuery } from "@/lib/auth/session";

const bodySchema = z.object({ everywhere: z.boolean().optional() });

// "Log out" removes this session; "Log out everywhere" removes all of them.
export const POST = adminRoute(
  async (req, session) => {
    const { everywhere } = await readJson(req, bodySchema);
    await (everywhere ? deleteAllSessionsQuery() : deleteSessionQuery(session.idHash));
    await clearSessionCookie();
    return json({ redirect: "/admin/login" });
  },
  { allowMustChange: true },
);

import { adminRoute, HttpError, json, readJson } from "@/lib/auth/guard";
import { hashPassword, isInitialPassword, setPasswordQuery } from "@/lib/auth/password";
import { deleteAllSessionsQuery, newSession, setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { setPasswordSchema } from "@/lib/validation";

// Forced set-password (first login / after a reset). Reachable by must-change sessions.
export const POST = adminRoute(
  async (req, session) => {
    if (!session.mustChangePassword) throw new HttpError(409, "Your password is already set. Use Account to change it.");
    const { password } = await readJson(req, setPasswordSchema);
    if (isInitialPassword(password)) throw new HttpError(400, "Choose a password different from the initial one.");

    // One transaction: store the hash, delete every session, issue a fresh one.
    const fresh = newSession(false);
    const passwordHash = await hashPassword(password);
    await getDb().batch([setPasswordQuery(passwordHash), deleteAllSessionsQuery(), fresh.insert]);
    await setSessionCookie(fresh.token, fresh.expiresAt);
    return json({ redirect: "/admin" });
  },
  { allowMustChange: true },
);

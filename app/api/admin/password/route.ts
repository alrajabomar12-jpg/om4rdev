import { adminRoute, HttpError, json, readJson } from "@/lib/auth/guard";
import { hashPassword, isInitialPassword, setPasswordQuery, verifyCurrentPassword } from "@/lib/auth/password";
import { deleteAllSessionsQuery, newSession, setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";

// Account → change password. Rotates sessions: every other device is signed out.
export const POST = adminRoute(async (req) => {
  const { current, password } = await readJson(req, changePasswordSchema);
  if (!(await verifyCurrentPassword(current))) throw new HttpError(400, "Your current password isn't right.");
  if (isInitialPassword(password)) throw new HttpError(400, "Choose a password different from the initial one.");

  const fresh = newSession(false);
  const passwordHash = await hashPassword(password);
  await getDb().batch([setPasswordQuery(passwordHash), deleteAllSessionsQuery(), fresh.insert]);
  await setSessionCookie(fresh.token, fresh.expiresAt);
  return json({ ok: true });
});

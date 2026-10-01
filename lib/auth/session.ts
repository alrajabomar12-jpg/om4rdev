import "server-only";
import { cookies } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { randomToken, sha256Hex } from "./crypto";

/**
 * Database sessions (SPEC §8). The cookie holds a random 32-byte token; the database stores only
 * its SHA-256. TTL is 7 days, sliding, with last_seen_at written at most once per hour.
 */

const isProd = process.env.NODE_ENV === "production";
// The __Host- prefix requires Secure, which requires https, so dev uses a plain name.
export const SESSION_COOKIE = isProd ? "__Host-om4r_session" : "om4r_session";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 60 * 60 * 1000;

export interface Session {
  idHash: string;
  mustChangePassword: boolean;
  expiresAt: Date;
}

const cookieOptions = (expires: Date) =>
  ({ httpOnly: true, secure: isProd, sameSite: "strict", path: "/", expires }) as const;

/**
 * Builds a new session: the raw token (for the cookie) and the row to insert. The caller inserts it,
 * often in one batch with other writes, then calls setSessionCookie.
 */
export function newSession(mustChangePassword: boolean) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  const insert = getDb()
    .insert(schema.sessions)
    .values({ idHash: sha256Hex(token), mustChangePassword, expiresAt });
  return { token, expiresAt, insert };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}

/**
 * Reads the cookie and re-checks the session against the database on every call.
 * `canSetCookie` is true in route handlers, where a slid expiry can also refresh the cookie
 * (Server Component renders cannot set cookies).
 */
export async function getSession({ canSetCookie = false } = {}): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const idHash = sha256Hex(token);
  const db = getDb();
  const [row] = await db.select().from(schema.sessions).where(eq(schema.sessions.idHash, idHash)).limit(1);
  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await db.delete(schema.sessions).where(eq(schema.sessions.idHash, idHash));
    return null;
  }

  let expiresAt = row.expiresAt;
  if (now - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    expiresAt = new Date(now + TTL_MS);
    await db
      .update(schema.sessions)
      .set({ lastSeenAt: new Date(now), expiresAt })
      .where(eq(schema.sessions.idHash, idHash));
    if (canSetCookie) await setSessionCookie(token, expiresAt);
  }
  return { idHash, mustChangePassword: row.mustChangePassword, expiresAt };
}

export const deleteSessionQuery = (idHash: string) =>
  getDb().delete(schema.sessions).where(eq(schema.sessions.idHash, idHash));

export const deleteAllSessionsQuery = () => getDb().delete(schema.sessions);

export const pruneExpiredSessionsQuery = () =>
  getDb().delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));

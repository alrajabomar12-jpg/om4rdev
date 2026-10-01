import "server-only";
import { hash, verify, type Algorithm } from "@node-rs/argon2";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { safeEqual, sha256Hex } from "./crypto";

// OWASP minimum for argon2id (also the library defaults), pinned so a library change can't weaken it.
// (Algorithm is an ambient const enum, unusable under isolatedModules; 2 is Argon2id.)
const ARGON2 = { algorithm: 2 as Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (password: string) => hash(password, ARGON2);

export async function getAdminRow() {
  const [row] = await getDb().select().from(schema.admin).where(eq(schema.admin.id, 1)).limit(1);
  if (!row) throw new Error("admin row missing: run npm run db:migrate");
  return row;
}

const initialPassword = () => process.env.ADMIN_INITIAL_PASSWORD ?? "";

/** True when `password` equals ADMIN_INITIAL_PASSWORD (constant time). Never true if it is unset. */
export function isInitialPassword(password: string): boolean {
  const initial = initialPassword();
  return initial.length > 0 && safeEqual(password, initial);
}

/** A usable reset token is ≥ 32 chars; returns its SHA-256, or null when none is configured. */
function resetTokenHash(): string | null {
  const token = process.env.ADMIN_RESET_TOKEN ?? "";
  return token.length >= 32 ? sha256Hex(token) : null;
}

/**
 * Atomically marks the current reset token as consumed. Only one concurrent caller can win, which is
 * what makes a reset login work exactly once. Also forces a password change.
 */
async function consumeResetToken(tokenHash: string): Promise<boolean> {
  const t = schema.admin;
  const rows = await getDb()
    .update(t)
    .set({ consumedResetTokenHash: tokenHash, mustChangePassword: true })
    .where(and(eq(t.id, 1), or(isNull(t.consumedResetTokenHash), ne(t.consumedResetTokenHash, tokenHash))))
    .returning({ id: t.id });
  return rows.length === 1;
}

export type LoginResult = { ok: true; mustChangePassword: boolean } | { ok: false };

/**
 * SPEC §8 login rules:
 *  - no password set yet → compare against ADMIN_INITIAL_PASSWORD, then force set-password
 *  - otherwise argon2 verify against the stored hash
 *  - recovery: while sha256(ADMIN_RESET_TOKEN) ≠ consumed hash, the current initial password is
 *    accepted once, which consumes the token and forces set-password
 */
export async function verifyLogin(password: string): Promise<LoginResult> {
  const admin = await getAdminRow();
  const tokenHash = resetTokenHash();

  if (admin.passwordHash === null) {
    if (!isInitialPassword(password)) return { ok: false };
    // A pending reset token is spent too, so it can't be replayed after this password is set.
    if (tokenHash && admin.consumedResetTokenHash !== tokenHash) await consumeResetToken(tokenHash);
    return { ok: true, mustChangePassword: true };
  }

  let matches = false;
  try {
    matches = await verify(admin.passwordHash, password);
  } catch {
    matches = false;
  }
  if (matches) return { ok: true, mustChangePassword: admin.mustChangePassword };

  if (tokenHash && admin.consumedResetTokenHash !== tokenHash && isInitialPassword(password)) {
    if (await consumeResetToken(tokenHash)) return { ok: true, mustChangePassword: true };
  }
  return { ok: false };
}

export async function verifyCurrentPassword(password: string): Promise<boolean> {
  const admin = await getAdminRow();
  if (!admin.passwordHash) return false;
  try {
    return await verify(admin.passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * The admin row update for an already-hashed password, run in a batch with the session rotation.
 * Deliberately sync: a Drizzle query is thenable, so returning it from an async function would run it.
 */
export function setPasswordQuery(passwordHash: string) {
  return getDb()
    .update(schema.admin)
    .set({ passwordHash, mustChangePassword: false, passwordChangedAt: sql`now()` })
    .where(eq(schema.admin.id, 1));
}

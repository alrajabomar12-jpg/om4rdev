import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const sha256Hex = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

/** Constant-time string comparison: timingSafeEqual on SHA-256 digests, so lengths never leak. */
export function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db);
}

/** 32 random bytes, base64url: the raw session token that only ever lives in the cookie. */
export const randomToken = () => randomBytes(32).toString("base64url");

/** HMAC-SHA256 of the client IP with AUTH_SECRET; raw IPs are never stored. */
export function hashIp(ip: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return createHmac("sha256", secret).update(ip, "utf8").digest("hex");
}

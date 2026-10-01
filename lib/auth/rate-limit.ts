import "server-only";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashIp } from "./crypto";

/**
 * Postgres-backed login throttling (SPEC §8), so it holds across serverless instances.
 *  - per IP: 5 failed attempts in a sliding 15 minutes → 429 until the oldest of them ages out
 *  - global: once 50 failures land within any 15-minute window, all logins lock for 15 minutes
 * Only failures count; throttled requests are not recorded.
 */

const PER_IP_MAX = 5;
const GLOBAL_MAX = 50;
const WINDOW = sql.raw("interval '15 minutes'");

export function clientIp(headers: Headers): string {
  // On Vercel, x-forwarded-for is set by the platform; the first value is the client.
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || "unknown";
}

export const ipHashFor = (headers: Headers) => hashIp(clientIp(headers));

type Row = { until: Date | string | null };
const toDate = (v: Date | string | null | undefined) => (v ? new Date(v) : null);

/** Returns when this request may try again, or null if it is allowed now. */
export async function checkLoginThrottle(ipHash: string): Promise<Date | null> {
  const db = getDb();
  const t = schema.loginAttempts;

  const [perIp, global] = await Promise.all([
    db.execute<Row>(sql`
      SELECT CASE WHEN count(*) >= ${PER_IP_MAX} THEN min(attempted_at) + ${WINDOW} END AS until
      FROM (
        SELECT ${t.attemptedAt} AS attempted_at FROM ${t}
        WHERE ${t.ipHash} = ${ipHash} AND ${t.success} = false AND ${t.attemptedAt} > now() - ${WINDOW}
        ORDER BY ${t.attemptedAt} DESC
        LIMIT ${PER_IP_MAX}
      ) recent`),
    // The latest moment any 15-minute window reached 50 failures, plus the 15-minute lock.
    db.execute<Row>(sql`
      SELECT max(attempted_at) + ${WINDOW} AS until
      FROM (
        SELECT ${t.attemptedAt} AS attempted_at,
               count(*) OVER (ORDER BY ${t.attemptedAt} RANGE BETWEEN ${WINDOW} PRECEDING AND CURRENT ROW) AS n
        FROM ${t}
        WHERE ${t.success} = false AND ${t.attemptedAt} > now() - interval '30 minutes'
      ) w
      WHERE n >= ${GLOBAL_MAX}`),
  ]);

  const now = Date.now();
  const candidates = [toDate(perIp.rows[0]?.until), toDate(global.rows[0]?.until)].filter(
    (d): d is Date => d !== null && d.getTime() > now,
  );
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}

export async function recordLoginAttempt(ipHash: string, success: boolean) {
  const db = getDb();
  const t = schema.loginAttempts;
  await db.batch([
    db.insert(t).values({ ipHash, success }),
    db.delete(t).where(sql`${t.attemptedAt} < now() - interval '24 hours'`),
  ]);
}

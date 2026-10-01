import "server-only";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError } from "@/lib/auth/guard";
import { getDb, schema } from "@/lib/db";

const tables = { games: schema.games, showcase: schema.showcaseItems } as const;

/** Route params: a malformed id is a 404, not a Postgres error. */
export function parseId(id: string): string {
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, "Not found.");
  return id;
}

/** Moves one row up or down and rewrites sort_order as 0..n-1 in one transaction. */
export async function moveRow(kind: keyof typeof tables, id: string, direction: "up" | "down") {
  const t = tables[kind];
  const db = getDb();
  const rows = await db.select({ id: t.id }).from(t).orderBy(asc(t.sortOrder), asc(t.createdAt));
  const ids = rows.map((r) => r.id);
  const from = ids.indexOf(id);
  if (from === -1) throw new HttpError(404, "Not found.");
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length) return; // already at the edge
  [ids[from], ids[to]] = [ids[to], ids[from]];
  const [first, ...rest] = ids.map((rowId, i) => db.update(t).set({ sortOrder: i }).where(eq(t.id, rowId)));
  await db.batch([first, ...rest]);
}

export async function nextSortOrder(kind: keyof typeof tables): Promise<number> {
  const t = tables[kind];
  const rows = await getDb().select({ s: t.sortOrder }).from(t).orderBy(asc(t.sortOrder));
  return rows.length ? rows[rows.length - 1].s + 1 : 0;
}

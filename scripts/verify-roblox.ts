/**
 * Exercises the Roblox data layer against the real IDs, outside Next.
 *   npm run verify:roblox            live, then Roblox unreachable (snapshot fallback)
 *   npm run verify:roblox -- --no-snapshot   also: unreachable with the snapshot removed
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { getDb, schema } from "@/lib/db";
import { resolveUniverseId } from "@/lib/roblox/api";
import { getLiveGames, getLiveProfile } from "@/lib/roblox/live";
import { parsePlaceUrl, parseProfileUrl } from "@/lib/roblox/parse";

const SEED = [
  { placeId: "127590941940388", universeId: "8284003604" },
  { placeId: "113715117929887", universeId: "9720389580" },
  { placeId: "112184582330960", universeId: "9935665660" },
  { placeId: "89946550882405", universeId: "9767488558" },
];
const USER_ID = "3049207260";
const ids = SEED.map((s) => s.universeId);

function printGames(r: Awaited<ReturnType<typeof getLiveGames>>) {
  console.log(`  source=${r.source} fetchedAt=${r.fetchedAt}`);
  if (!r.data) return console.log("  (no game data)");
  console.table(
    ids.map((id) => {
      const g = r.data![id];
      return g
        ? {
            universe: id,
            name: g.name,
            playing: g.playing,
            visits: g.visits,
            creator: g.creator.name,
            verified: g.creator.hasVerifiedBadge,
            thumb: g.thumbnailUrl ? g.thumbnailUrl.slice(0, 40) + "..." : null,
          }
        : { universe: id, name: "(missing)" };
    }),
  );
}

async function printProfile() {
  const p = await getLiveProfile(USER_ID);
  console.log(`  profile source=${p.source} fetchedAt=${p.fetchedAt}`, p.data);
}

async function main() {
  console.log("\n== URL parsing ==");
  for (const u of [
    "https://www.roblox.com/games/127590941940388/RECODE-Build-A-Cart",
    "https://roblox.com/games/113715117929887?privateServerLinkCode=x",
    "https://www.roblox.com/games/89946550882405/",
    "https://evil.com/games/123",
    "http://www.roblox.com/games/123",
    "https://www.roblox.com/catalog/123",
  ])
    console.log(`  place ${JSON.stringify(parsePlaceUrl(u))}  <- ${u}`);
  for (const u of ["https://www.roblox.com/users/3049207260/profile", "https://www.roblox.com/groups/1"])
    console.log(`  user  ${JSON.stringify(parseProfileUrl(u))}  <- ${u}`);

  console.log("\n== Place -> universe (real API) ==");
  for (const s of SEED) {
    const got = await resolveUniverseId(s.placeId);
    console.log(`  ${s.placeId} -> ${got} ${got === s.universeId ? "OK" : `MISMATCH (expected ${s.universeId})`}`);
  }
  console.log(`  999999999999999999 -> ${await resolveUniverseId("999999999999999999")} (expect null = "Game not found")`);

  console.log("\n== 1. Live ==");
  printGames(await getLiveGames(ids));
  await printProfile();

  console.log("\n== 2. Roblox unreachable (ROBLOX_API_DOMAIN=roblox.invalid) -> snapshot ==");
  process.env.ROBLOX_API_DOMAIN = "roblox.invalid";
  printGames(await getLiveGames(ids));
  await printProfile();

  if (process.argv.includes("--no-snapshot")) {
    console.log("\n== 3. Unreachable AND no snapshot -> render without live data ==");
    const db = getDb();
    const saved = await db.select().from(schema.robloxSnapshot);
    await db.delete(schema.robloxSnapshot);
    try {
      printGames(await getLiveGames(ids));
      await printProfile();
    } finally {
      for (const row of saved) await db.insert(schema.robloxSnapshot).values(row);
      console.log(`  (restored ${saved.length} snapshot rows)`);
    }
  }

  console.log("\n== 4. Other failure modes (stubbed fetch, real host names) ==");
  delete process.env.ROBLOX_API_DOMAIN;
  const realFetch = globalThis.fetch;
  const stubs: [string, typeof fetch][] = [
    ["HTTP 503", async () => new Response("down", { status: 503 })],
    ["unexpected shape", async () => Response.json({ data: [{ id: 1, nope: true }] })],
    [
      "hangs past the 5s timeout",
      (_url, init) =>
        new Promise((_, reject) =>
          init?.signal?.addEventListener("abort", () => reject(init.signal!.reason), { once: true }),
        ),
    ],
  ];
  for (const [label, stub] of stubs) {
    // Only Roblox hosts are stubbed; the Neon driver also uses fetch and must stay real.
    globalThis.fetch = (input, init) =>
      String(input instanceof Request ? input.url : input).includes(".roblox.com/")
        ? stub(input, init)
        : realFetch(input, init);
    const t0 = Date.now();
    // AbortSignal.timeout's timer is unref'd; keep this script alive the way a server would be.
    const keepAlive = setInterval(() => {}, 1000);
    const r = await getLiveGames(ids);
    clearInterval(keepAlive);
    console.log(`  ${label}: source=${r.source} games=${r.data ? Object.keys(r.data).length : 0} (${Date.now() - t0} ms)`);
  }
  globalThis.fetch = realFetch;

  console.log("\n== Snapshot table ==");
  for (const row of await getDb().select().from(schema.robloxSnapshot))
    console.log(`  ${row.key}: fetched_at=${row.fetchedAt.toISOString()} keys=${Object.keys(row.data as object).length}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);

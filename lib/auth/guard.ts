import "server-only";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, type Session } from "./session";

/**
 * requireAdmin(): every admin entry point calls this itself (SPEC §2, §8). Nothing relies on
 * middleware/proxy for authorization.
 */

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
} as const;

export function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE_HEADERS, ...headers } });
}

export const errorJson = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  json({ error, ...extra }, status);

/** Thrown inside handlers to short-circuit with a JSON error response. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Pages: full admin only. Unauthenticated → login; must-change → set-password. */
export async function requireAdminPage(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.mustChangePassword) redirect("/admin/set-password");
  return session;
}

/**
 * Route handlers: the Origin header must name this site, either NEXT_PUBLIC_SITE_URL or the host the
 * request was served on (covers preview deployments and local ports).
 */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      allowed.add(new URL(site).host);
    } catch {}
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) allowed.add(host.split(",")[0].trim());
  return allowed.has(originHost);
}

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: Request, session: Session, params: P) => Promise<Response>;

/**
 * Wraps an /api/admin/* handler:
 *   no or invalid session → 401
 *   session still has to change its password → 403 (unless allowMustChange)
 *   Origin missing or foreign → 403
 *   zod errors → 400 with the first issue; HttpError → its status
 */
export function adminRoute<P = Record<string, never>>(
  handler: Handler<P>,
  { allowMustChange = false } = {},
) {
  return async (req: Request, ctx: Ctx<P>): Promise<Response> => {
    const session = await getSession({ canSetCookie: true });
    if (!session) return errorJson(401, "Not signed in.");
    if (session.mustChangePassword && !allowMustChange) return errorJson(403, "Set a new password first.");
    if (!originAllowed(req)) return errorJson(403, "Bad origin.");
    try {
      const res = await handler(req, session, await ctx.params);
      for (const [k, v] of Object.entries(NO_STORE_HEADERS)) res.headers.set(k, v);
      return res;
    } catch (err) {
      if (err instanceof HttpError) return errorJson(err.status, err.message);
      if (err instanceof z.ZodError) return errorJson(400, err.issues[0]?.message ?? "Invalid input.");
      console.error("[admin]", err);
      return errorJson(500, "Something went wrong. Try again.");
    }
  };
}

/** Parses a JSON body with a zod schema; malformed JSON is a 400. */
export async function readJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
  return schema.parse(body);
}

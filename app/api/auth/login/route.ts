import { errorJson, json, originAllowed } from "@/lib/auth/guard";
import { verifyLogin } from "@/lib/auth/password";
import { checkLoginThrottle, ipHashFor, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { newSession, pruneExpiredSessionsQuery, setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

// The only public auth endpoint. Every outcome takes at least this long, so timing reveals little.
const MIN_RESPONSE_MS = 300;

async function handle(req: Request): Promise<Response> {
  if (!originAllowed(req)) return errorJson(403, "Bad origin.");

  let password: string;
  try {
    password = loginSchema.parse(await req.json()).password;
  } catch {
    return errorJson(400, "Enter the password.");
  }

  const ipHash = ipHashFor(req.headers);
  const retryAt = await checkLoginThrottle(ipHash);
  if (retryAt) {
    const seconds = Math.max(1, Math.ceil((retryAt.getTime() - Date.now()) / 1000));
    const minutes = Math.ceil(seconds / 60);
    return json(
      { error: `Too many attempts, try again in ${minutes} min.` },
      429,
      { "Retry-After": String(seconds) },
    );
  }

  const result = await verifyLogin(password);
  await recordLoginAttempt(ipHash, result.ok);
  if (!result.ok) return errorJson(401, "That password isn't right.");

  const session = newSession(result.mustChangePassword);
  await getDb().batch([pruneExpiredSessionsQuery(), session.insert]);
  await setSessionCookie(session.token, session.expiresAt);
  return json({ redirect: result.mustChangePassword ? "/admin/set-password" : "/admin" });
}

export async function POST(req: Request) {
  const started = Date.now();
  let res: Response;
  try {
    res = await handle(req);
  } catch (err) {
    console.error("[login]", err);
    res = errorJson(500, "Something went wrong. Try again.");
  }
  const wait = MIN_RESPONSE_MS - (Date.now() - started);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  return res;
}

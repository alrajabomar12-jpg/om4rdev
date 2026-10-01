// Browser-side fetch helper for /api/admin/*. Holds no secrets: the session is an httpOnly cookie.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function api<T = { ok: true }>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, error: "Network error. Check your connection and try again." };
  }

  const payload = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (res.ok) return { ok: true, data: payload };

  // The session ended (expired, logged out elsewhere, password changed): go sign in again.
  if (res.status === 401 && !path.startsWith("/api/auth/")) hardNavigate("/admin/login");
  return { ok: false, status: res.status, error: payload.error ?? `Request failed (${res.status}).` };
}

/**
 * Full page load for auth transitions (sign-in, set-password, logout). Unlike router.push it drops
 * the client router cache, so admin pages can't be shown again from memory after a logout.
 */
export function hardNavigate(path: string) {
  window.location.assign(path);
}

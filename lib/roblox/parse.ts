// Pure URL parsing, shared by admin validation and scripts. No server-only import: no secrets here.

const ROBLOX_HOSTS = new Set(["www.roblox.com", "roblox.com"]);

function toUrl(input: string): URL | null {
  try {
    return new URL(input.trim());
  } catch {
    return null;
  }
}

/** Accepts https://(www.)roblox.com/games/{digits}[/slug][?…]. Returns the place ID or null. */
export function parsePlaceUrl(input: string): string | null {
  const url = toUrl(input);
  if (!url || url.protocol !== "https:" || !ROBLOX_HOSTS.has(url.hostname.toLowerCase())) return null;
  const match = /^\/games\/(\d{1,20})(?:\/[^/]*)?\/?$/.exec(url.pathname);
  return match ? match[1] : null;
}

/** Accepts https://(www.)roblox.com/users/{digits}/profile (trailing parts optional). Returns the user ID or null. */
export function parseProfileUrl(input: string): string | null {
  const url = toUrl(input);
  if (!url || url.protocol !== "https:" || !ROBLOX_HOSTS.has(url.hostname.toLowerCase())) return null;
  const match = /^\/users\/(\d{1,20})(?:\/.*)?$/.exec(url.pathname);
  return match ? match[1] : null;
}

export const gameUrl = (placeId: string) => `https://www.roblox.com/games/${placeId}`;

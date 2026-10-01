// Admin form rules, shared by the server (authoritative) and the admin UI (instant feedback).
// Pure zod: no secrets, no server-only imports.
import { z } from "zod";
import { parsePlaceUrl, parseProfileUrl } from "@/lib/roblox/parse";

const INT_MAX = 2_147_483_647;

const text = (label: string, max: number, min = 1) =>
  z
    .string()
    .transform((s) => s.replace(/\r\n?/g, "\n").trim())
    .pipe(
      z
        .string()
        .min(min, min === 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
        .max(max, `${label} must be ${max} characters or fewer.`),
    );

/** "" or null → null (field cleared); otherwise a whole number ≥ 0. */
const optionalCount = (label: string) =>
  z.union([z.number(), z.string(), z.null()]).transform((v, ctx) => {
    if (v === null || (typeof v === "string" && v.trim() === "")) return null;
    const n = typeof v === "number" ? v : Number(v.trim());
    if (!Number.isInteger(n) || n < 0 || n > INT_MAX) {
      ctx.addIssue({ code: "custom", message: `${label} must be a whole number of 0 or more.` });
      return z.NEVER;
    }
    return n;
  });

/** Trimmed; empty means "not set" (null). */
const optionalText = (label: string, max: number) =>
  z
    .string()
    .nullable()
    .transform((s) => (s ?? "").trim())
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer.`))
    .transform((s) => (s === "" ? null : s));

export const settingsSchema = z.object({
  heroTitle: text("Hero title", 80),
  tagline: text("Tagline", 200),
  aboutText: text("About text", 2000),
  robloxProfileUrl: z
    .string()
    .trim()
    .refine((u) => parseProfileUrl(u) !== null, "Use a Roblox profile URL like https://www.roblox.com/users/123/profile."),
  discordUsername: z
    .string()
    .trim()
    .regex(/^[a-z0-9_.]{2,32}$/, "Discord usernames are 2–32 characters: lowercase letters, numbers, _ and ."),
  highestPeakCcu: optionalCount("Highest peak CCU"),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const placeUrlSchema = z
  .string()
  .trim()
  .refine((u) => parsePlaceUrl(u) !== null, "Paste a Roblox game URL like https://www.roblox.com/games/123456789/Name.");

export const roleSchema = text("Role", 300);

export const gameCreateSchema = z.object({ url: placeUrlSchema, role: roleSchema });

export const gameUpdateSchema = z.object({
  role: roleSchema,
  displayNameOverride: optionalText("Display name", 100),
  peakCcu: optionalCount("Peak CCU"),
  includeInTotals: z.boolean(),
  hidden: z.boolean(),
});
export type GameUpdateInput = z.input<typeof gameUpdateSchema>;

export const moveSchema = z.object({ direction: z.enum(["up", "down"]) });

export const captionSchema = text("Caption", 200, 0);
export const altSchema = optionalText("Alt text", 200);

export const showcaseUpdateSchema = z.object({ caption: captionSchema, alt: altSchema });

const dimension = z.number().int().min(1).max(20000);
export const showcaseCreateSchema = z.object({
  url: z.string().url(),
  caption: captionSchema,
  alt: altSchema,
  width: dimension,
  height: dimension,
});

export const blobUrlSchema = z.object({ url: z.string().url() });

const newPassword = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use 128 characters or fewer.");

const confirmMatches = <T extends { password: string; confirm: string }>(v: T) => v.password === v.confirm;
const confirmIssue = { message: "The passwords don't match.", path: ["confirm"] };

export const setPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine(confirmMatches, confirmIssue);

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Enter your current password.").max(128), password: newPassword, confirm: z.string() })
  .refine(confirmMatches, confirmIssue);

export const loginSchema = z.object({ password: z.string().min(1, "Enter the password.").max(256) });

/** Default alt text: the caption, otherwise a generic description (SPEC §5). */
export const effectiveAlt = (alt: string | null, caption: string) => alt || caption || "3D model by om4r";

/** First zod issue as a user-facing message, for the client mirror. */
export function firstIssue(result: z.ZodSafeParseResult<unknown>): string | null {
  return result.success ? null : (result.error.issues[0]?.message ?? "Invalid input.");
}

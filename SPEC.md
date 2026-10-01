# om4r.dev: Site Specification

Portfolio for **Omar (Roblox: om4r / @Om4rIsAl)**, a solo Roblox 3D modeler & builder.
Single public page + password-protected `/admin`. Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel.
References in `/references/` are for layout and feel only: never copy their text, logos or exact designs.

---

## 1. What we take from each reference

| # | Reference | Take | Leave |
|---|-----------|------|-------|
| 01 | Praxis hero | Huge confident headline with one accent-colored phrase; compact stats row under the hero with hairline dividers | Light theme, serif display type, tilted service cards, "agency" copy |
| 02 | Praxis services | Thumbnail with name + visits overlaid on a dark gradient; small uppercase eyebrow labels above headings | Two-discipline service cards, lavender palette |
| 03 | Praxis portfolio + CTA | Edge-to-edge thumbnail cards, name + "visits · playing" overlaid bottom-left, 3-col rhythm; big rounded dark CTA panel | "View the full practice" multi-page structure |
| 04 | Breakout hero + stats | Dark near-black base, faint grid texture, single stats bar with 3 cells (icon, big number, tracked uppercase label), LIVE indicator | Gold accent, left-aligned agency hero |
| 05 | Breakout portfolio | Card anatomy: thumbnail top, title, stat row (● players, 👁 visits, 🏆 peak) with icons; subtle border, rounded-2xl; hover arrow | Category pills (LIVEOPS/FUNDED) — we use his **role** instead |
| 06 | Breakout about grid | Numbered eyebrow ("01 · GAMES"), heading-left / content-right about layout | 4-service grid (out of scope) |
| 07 | Breakout partner + contact | Restrained contact row with Discord icon tile; minimal one-line footer | Partnership offer cards, multiple Discord contacts |
| 08 | Beamo hero collage | **Primary hero reference**: tilted rows of blurred game thumbnails behind a centered name + one-line role; floating pill navbar with avatar | Plain white wordmark (we use his logo) |
| 09 | Beamo stats | "All-time peak CCU" as a hero number; white text with blue accent word; stats in one bordered panel | Members count |
| 10 | Beamo games carousel | "Games I've …" heading with accent word; cards with name + playing/visits overlaid; solo-dev voice | Carousel (grid is clearer with 4 games), "What I do" services |
| 11 | Beamo contact cards | **Primary contact reference**: card with Discord icon, @username, "Copy username" button | Email card |
| 12 | Ape hero stats | Icon tiles above stat numbers; two-tone wordmark idea (white + accent) | Yellow/orange palette, typing effect |
| 13 | Ape portfolio | Glow under cards on hover; stats overlaid on thumbnail | Uneven carousel sizing |
| 14 | Ape about cards | Icon tile + title + text card pattern (for admin, not public site) | Studio about copy |
| 15 | Ape contact + footer | — | Contact form, multi-column footer (too heavy for solo) |
| 16 | DuoCore hero collage | **Visual-polish reference**: dense tilted thumbnail wall darkened with gradient; headline with gradient-tinted last words; stats bar overlapping hero bottom with glassy dark fill | Studio copy, "Join our Discord" server CTA |
| 17 | DuoCore about + team | Verified check next to names (we make it far bigger); ticker of game chips; rounded avatar rings in accent color | Team grid |
| 18 | DuoCore contact + footer | Large rounded contact panel with soft bottom glow; footer with logo, anchor links, icon buttons | Discord-server link, studio blurb |

---

## 2. Sitemap

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Single-page portfolio. Anchors: `#games`, `#showcase` (only if items exist), `#about`, `#contact` | Public |
| `/admin/login` | Password login | Public |
| `/admin/set-password` | Forced new-password screen (first login / after reset) | Session with `mustChangePassword` |
| `/admin` | Dashboard: tabs Site · Games · Showcase · Branding · Account | Session, password already changed |
| `/api/admin/upload` | Vercel Blob client-upload token endpoint | Session |
| `/robots.txt`, `/sitemap.xml` | Disallow `/admin`; list `/` | Public |
| 404 | Simple branded not-found | Public |

Mutations use **Server Actions** (or route handlers under `/api/admin/*`); every one calls `requireAdmin()` itself. No reliance on middleware/proxy for authorization.

---

## 3. Public page: sections

Global: dark only. Container `max-w-[1200px]`, side gutter 16px (mobile) / 24px / 32px. No horizontal scroll at 320px+.

### 3.0 Navbar
Floating pill centered at top (Beamo 08), sticky, `backdrop-blur` + translucent surface + 1px border.
Left: small logo. Right: Games · Showcase (only if items) · About · Contact, then a Discord icon button (→ #contact).
Mobile (<768px): logo + menu button opening a full-width sheet; focus-trapped, Esc closes.

### 3.1 Hero
- `min-h-[90svh]`, content centered (Beamo).
- **Background collage** (Beamo 08 / DuoCore 16):
  - 3 rows of game thumbnails, using the same thumbnail each card shows. Repeat them to fill the row.
  - Whole wall rotated about −8°, blurred about 6px, opacity about 35%.
  - Each row drifts slowly sideways (60–90s loop, rows alternate direction).
  - Overlay: a radial vignette plus a bottom gradient into `--bg`.
  - Images are decorative: `alt=""`, `aria-hidden`.
  - Use small thumbnail sizes so this doesn't hurt LCP.
- Foreground stack:
  1. **Logo** (`logoUrl` from settings, falling back to `/brand/om4r-logo.png`), max-w 420px (260px mobile). This is the LCP image, so load it with `priority`.
  2. **Identity row:**
     - Avatar headshot: 72px in a circle with an accent ring and soft glow.
     - **Display name** "om4r" in the display font at about 40px (28px on mobile).
     - **Verified badge** right after the name, only when `hasVerifiedBadge === true`:
       - Size: a 32px (24px on mobile) blue seal with a white check, `--accent` fill, a soft outer glow and a slow shimmer on load.
       - Pill on ≥sm: "Verified on Roblox", on an accent-tinted background.
       - Mobile: the pill is hidden and the badge keeps `aria-label="Verified on Roblox"`.
       - The badge is drawn as our own SVG, not Roblox's asset.
     - Below the name, in muted text: "@Om4rIsAl".
  3. **H1 = editable title** (default "3D Modeler & Builder"). The display font, `clamp(2.75rem, 7vw, 6rem)`, with the last word filled with the accent gradient (DuoCore 16).
  4. **Tagline** (editable), muted, max 2 lines.
  5. CTAs:
     - Primary pill: "View Roblox profile" with an external-link icon, opening `robloxProfileUrl` in a new tab.
     - Secondary outline pill: "See my games" → `#games`.

### 3.2 Stats bar
- Overlaps the hero bottom (DuoCore 16). It's one rounded-2xl panel: glassy dark surface, 1px border, 3 cells split by dividers (Breakout 04). On mobile the cells stack vertically.
- The three cells, each with an icon tile, a big number in the display font with tabular numerals, and a tracked uppercase label:
  1. **Total visits**: live sum of `visits` over games where `!hidden && includeInTotals`.
  2. **Playing now**: live sum of `playing`, with a pulsing green dot.
  3. **Highest peak CCU**: the manual setting, default `40000`, shown as "40K". **If it's empty, this cell isn't rendered** and the panel becomes 2 cells.
- Number format: `Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })`, so 130.6M, 28, 40K.
- Numbers count up once when scrolled into view. With reduced motion they render final values immediately.
- Caption under the panel: "● Live · updated N min ago" (from the snapshot's `fetchedAt`). If the data is stale (over 30 min), the caption reads "Last updated …" instead of "Live".

### 3.3 Games (centerpiece)
- Eyebrow: "01 · GAMES". H2: "Games I've worked on.", with "worked on" in the accent color.
- Grid: 1 column, 2 columns from md. It stays 2 columns on desktop: big 16:9 thumbnails read better than 3 small ones with 4 games. Gap 24px.
- Order comes from `sortOrder`. Hidden games aren't rendered.
- **Card anatomy:**
  - **Thumbnail (16:9)**:
    - Image: the custom thumbnail if set, otherwise Roblox's thumbnail, otherwise a gradient placeholder with the game name.
    - Overlay, bottom gradient:
      - **Name**: the override if set, otherwise the Roblox name. Bold, 1–2 lines.
      - **Live stat row**: ● green dot + "N playing" · eye icon + "N visits" · trophy + "40K peak". The peak item is **omitted entirely when `peakCcu` is null** (never "0" or "N/A"). If live data is unavailable, the playing and visits items are omitted.
  - **Body** (below the thumbnail, on the card surface):
    - Creator line: "by Usky Studio" plus a small 16px verified check **only if the creator's `hasVerifiedBadge`**.
    - **Role block**: an uppercase micro-label "MY ROLE" and the role text in regular weight, with a 2px left accent border. Always visible, never truncated.
    - A trailing ↗ icon in the corner.
  - **Link**: the whole card is one link to the game URL (`https://www.roblox.com/games/{placeId}`), new tab, `rel="noopener noreferrer"`. The creator name is plain text, not a nested link.
  - **Hover**: lift −4px, the thumbnail scales to 1.03, the border shifts toward the accent, and a soft blue glow appears under the card (Ape 13). Focus-visible gets the same treatment plus an outline ring.
- If there are no visible games, show the section heading with a muted "Projects coming soon." line. That's a public-site safety net only; the seed data includes 4 games.

### 3.4 Model showcase
- **Rendered only if there's at least one showcase item**, and the nav link is hidden otherwise. No placeholder.
- Eyebrow: "02 · SHOWCASE". H2: "Models & builds."
- Masonry grid using CSS columns: 1 / 2 (sm) / 3 (lg). Images keep their aspect ratio (`width`/`height` stored).
- Captions: shown under the image on mobile. On desktop they appear on hover or focus as an overlay, and stay visible to screen readers.
- **Lightbox**: built ourselves on the native `<dialog>`.
  - Shows a large image, the caption and an "n / total" counter.
  - Controls: ←/→ arrow buttons and keys, Esc and a close button, swipe on touch.
  - Focus returns to the clicked thumbnail on close, and the body doesn't scroll while it's open.
- Images are served through `next/image` with responsive `sizes`.

### 3.5 About
- Two columns on lg (Breakout 06): eyebrow "03 · ABOUT" plus H2 "About me" on the left, text on the right (max 65ch). One column on mobile.
- The text is editable **plain text**, split into paragraphs on blank lines. No HTML or markdown rendering.

### 3.6 Contact
- A large rounded panel with a soft blue bottom glow (DuoCore 18). Centered: eyebrow "CONTACT", H2 "Let's build something.", and the muted line "The fastest way to reach me is Discord."
- An inner card (Beamo 11):
  - Discord icon tile, then the username `om4risal` (from settings) in a mono-ish large style.
  - Buttons:
    - **"Copy username"** (primary). Uses `navigator.clipboard.writeText`; if that's unavailable, it falls back to selecting the text. On success the button changes to "✓ Copied!" for 2s, and the change is announced via `aria-live="polite"`.
    - **"Open Discord"** (secondary). Links to `https://discord.com/app` in a new tab. Discord has no public deep link to a user by username, so the copy-then-open flow is intended.

### 3.7 Footer
A top hairline border. Left: the small logo and "© {current year} om4r.dev". Center: anchor links. Right: icon buttons for the Roblox profile and Discord (→ #contact). Below, a tiny muted line: "Not affiliated with Roblox Corporation."

### 3.8 Metadata
`<title>`: "om4r: Roblox 3D Modeler & Builder". The description comes from the tagline, and the OG image is a static branded image generated from the logo. Favicon comes from the logo mark.

---

## 4. Design tokens

Approximated from the logo by eye. Check them with an eyedropper during implementation and adjust within ±5% if needed. Define them as Tailwind v4 `@theme` tokens in `app/globals.css`.

### Color
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#05070D` | Page background (blue-tinted near-black) |
| `--surface` | `#0B1020` | Cards, panels |
| `--surface-2` | `#111833` | Raised / hover surfaces, icon tiles |
| `--border` | `rgb(120 160 255 / 0.12)` | Hairlines, card borders |
| `--border-strong` | `rgb(120 160 255 / 0.28)` | Hover borders |
| `--text` | `#F2F6FF` | Primary text (logo's glossy white) |
| `--text-muted` | `#9AA6C4` | Body copy, labels |
| `--text-dim` | `#5F6B8A` | Captions, footer |
| `--accent` | `#1E8CFF` | Electric blue ("dev" in logo): buttons, links, verified badge |
| `--accent-bright` | `#3FC3FF` | Highlights, gradient start, glow |
| `--accent-deep` | `#0A4DFF` | Gradient end, pressed states |
| `--accent-navy` | `#0A1A4F` | Logo outline tone: accent-tinted backgrounds |
| `--live` | `#22C55E` | "Playing" dot |
| `--danger` | `#F04438` | Admin destructive actions |
| `--gradient-accent` | `linear-gradient(135deg, #3FC3FF 0%, #1E8CFF 50%, #0A4DFF 100%)` | Headline accent words, primary button |
| `--glow` | `0 0 40px rgb(30 140 255 / 0.35)` | Badge, hover glow |

Contrast: `--text-muted` on `--bg` must be ≥ 4.5:1, and white on `--accent` buttons must be ≥ 4.5:1. If white on `--accent` falls short, put the button text on `--accent-deep`.

### Type
- **Display**: Bricolage Grotesque, weights 700/800, letter-spacing −0.03em. Headlines, numbers and names. Its chunky, confident feel echoes the logo without being cartoonish.
- **Body**: Inter 400/500/600.
- Both are loaded via `next/font/google` and self-hosted (no layout shift). Numbers use `font-variant-numeric: tabular-nums`.

| Role | Size | Weight / line-height |
|------|------|----------------------|
| H1 | `clamp(2.75rem, 7vw, 6rem)` | 800 / 1.0 |
| H2 | `clamp(2rem, 4.5vw, 3.5rem)` | 800 / 1.05 |
| H3 / card title | 1.25rem | 700 / 1.25 |
| Stat number | `clamp(2rem, 4vw, 3rem)` | 800 / 1 |
| Body | 1rem (1.0625rem ≥lg) | 400 / 1.6 |
| Small / meta | 0.875rem | 500 / 1.4 |
| Eyebrow | 0.75rem, uppercase, tracking 0.2em | 600 |

### Spacing, radius, motion
- 4px base scale (Tailwind defaults).
- Section padding: `py-24 md:py-32`. Gaps: 16px within cards, 24px between cards.
- Radius: cards and panels 16px (`rounded-2xl`), the contact panel 28px, buttons and nav fully rounded (pills), icon tiles 12px.
- Motion:
  - Sections fade up 16px over 400ms ease-out, once, when scrolled into view.
  - Hover transitions take 200ms.
  - The collage drift is CSS-only.
  - With `prefers-reduced-motion: reduce`: no drift, no count-up, no fade-ups, no shimmer.

---

## 5. Data model (Postgres via Drizzle ORM)

Roblox IDs are stored as `text`: universe and place IDs can exceed int32 and should never be used in arithmetic.

**`site_settings`** (single row, `id = 1`)
| Column | Type | Default |
|--------|------|---------|
| `hero_title` | text not null, ≤80 | `3D Modeler & Builder` |
| `tagline` | text not null, ≤200 | `I model and build the worlds Roblox players spend hours in.` (placeholder; Omar edits) |
| `about_text` | text not null, ≤2000 | Short placeholder paragraph (Omar edits) |
| `roblox_profile_url` | text not null | `https://www.roblox.com/users/3049207260/profile` |
| `roblox_user_id` | text not null | `3049207260` (parsed from the URL on save) |
| `discord_username` | text not null, `^[a-z0-9_.]{2,32}$` | `om4risal` |
| `highest_peak_ccu` | integer null, ≥0 | `40000` |
| `logo_url` | text null | null, so `/brand/om4r-logo.png` is used |
| `updated_at` | timestamptz | now() |

**`games`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `place_id` | text not null unique | From the URL |
| `universe_id` | text not null | Resolved once when the game is added |
| `display_name_override` | text null, ≤100 | Null means the live Roblox name is used |
| `role` | text not null, 1–300 | Required: credits must be explicit |
| `peak_ccu` | integer null, ≥0 | Null means it isn't displayed |
| `custom_thumbnail_url` | text null | Blob URL; null means Roblox's thumbnail |
| `include_in_totals` | boolean not null default true | |
| `hidden` | boolean not null default false | |
| `sort_order` | integer not null | |
| `created_at`, `updated_at` | timestamptz | |

**`showcase_items`**: `id` uuid, `image_url` text, `caption` text ≤200 (may be empty), `alt` text ≤200 (defaults to the caption, otherwise "3D model by om4r"), `width` int, `height` int, `sort_order` int, `created_at`.

**`admin`** (single row, `id = 1`)
| Column | Notes |
|--------|-------|
| `password_hash` | text null. Null means no password has been set yet, so the initial password applies |
| `must_change_password` | boolean, default true |
| `consumed_reset_token_hash` | text null. SHA-256 of the last `ADMIN_RESET_TOKEN` used |
| `password_changed_at` | timestamptz null |

**`sessions`**: `id_hash` text pk (SHA-256 of a 32-byte random token; the raw token lives only in the cookie), `must_change_password` boolean, `created_at`, `expires_at`, `last_seen_at`.

**`login_attempts`**: `id`, `ip_hash` (HMAC-SHA256 of the IP with `AUTH_SECRET`; raw IPs are never stored), `success` boolean, `attempted_at`. Rows older than 24h are pruned on each login.

**`roblox_snapshot`**: `key` text pk (`games` | `profile`), `data` jsonb, `fetched_at` timestamptz. This holds the last good response, so the page can show the last cached numbers if Roblox fails.

### Seed (initial migration)
- Settings use the defaults above.
- Games, in this order. The role text is verbatim from the client and must stay accurate:

| # | place_id | universe_id | role | peak_ccu |
|---|----------|-------------|------|----------|
| 1 | 127590941940388 | 8284003604 | Built a map and engine models used in the game. | 40000 |
| 2 | 113715117929887 | 9720389580 | Modeled and built the entire game (full time). | 4000 |
| 3 | 112184582330960 | 9935665660 | Modeler and builder (full time). | null |
| 4 | 89946550882405 | 9767488558 | Modeler and builder. | null |

- All 4 games start with `include_in_totals = true`. Omar decides in admin whether to switch Build A Cart off.
- Display-name overrides start null. Omar may set them, e.g. "Build A Cart" instead of "[🔥RECODE] Build A Cart".

---

## 6. Roblox data flow

Browsers can't call Roblox (CORS), so everything is fetched server-side. All of these were verified with curl on 2026-09-30 using the real IDs:

| Step | Endpoint | Fields used |
|------|----------|-------------|
| Place → universe (once, when adding a game) | `GET https://apis.roblox.com/universes/v1/places/{placeId}/universe` | `universeId` |
| Game details (batched) | `GET https://games.roblox.com/v1/games?universeIds={id,id,…}` | `data[].id, name, playing, visits, rootPlaceId, creator.{id,name,type,hasVerifiedBadge}` |
| Game thumbnails (batched) | `GET https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds={…}&countPerUniverse=1&size=768x432&format=Png&isCircular=false` | `data[].universeId, thumbnails[0].{state,imageUrl}` |
| Profile | `GET https://users.roblox.com/v1/users/{userId}` | `name, displayName, hasVerifiedBadge` |
| Headshot | `GET https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={userId}&size=420x420&format=Png&isCircular=false` | `data[0].{state,imageUrl}` |

Sample values from 2026-09-30:
- User: `displayName "om4r"`, `name "Om4rIsAl"`, `hasVerifiedBadge true`.
- Build A Cart: creator "incredible_games" (Group, verified).
- LAVA Survival and +1 Jump: "Usky Studio" (verified).
- Be a Dragon Ball: "Usky Studios", a **different group, not verified**. This is why the badge must come from the API.

Rules:
- **Place URL parsing**: accept `https://www.roblox.com/games/{digits}[/slug][?…]`, with or without `www.`. Reject any other host or format with a clear admin error.
- **Batching**: one games call and one thumbnails call for all games, plus two profile calls. That's 4 requests per refresh.
- **Caching**:
  - Requests use `fetch(url, { next: { revalidate: 300, tags: ['roblox'] }, signal: AbortSignal.timeout(5000) })`.
  - The home page uses ISR with `revalidate = 300`.
- **Fallback**:
  - On success, upsert `roblox_snapshot`, but only if the stored snapshot is more than 5 minutes old, to limit writes.
  - On error, timeout, non-2xx or an unexpected shape (validated with zod), use the snapshot's data and its `fetchedAt`.
  - If there's no snapshot either, render without live numbers: hide the stat items and use name overrides or placeholders. **The page must never throw because of Roblox.**
- **Thumbnail state**: anything other than `"Completed"` counts as missing.
- **Image URLs are temporary** (`tr.rbxcdn.com/30DAY-…`, `180DAY-…`). Never store them as canonical data; they're only kept inside the snapshot.
- `next.config` `images.remotePatterns`: `tr.rbxcdn.com`, `*.public.blob.vercel-storage.com`.
- **Creator verified badge** comes from `creator.hasVerifiedBadge`, and the profile badge from `hasVerifiedBadge`. Neither is ever hard-coded.
- **Profile URL change in admin**: parse `/users/{digits}/` into `roblox_user_id`. If it doesn't parse, reject the change.
- **Add-game flow (admin)**:
  1. Parse the place ID.
  2. Resolve the universe. On 404, show "Game not found".
  3. Fetch details and thumbnail for a preview, with no caching.
  4. Admin confirms and enters the role, which is required.
  5. Insert the game.
  6. Run `revalidateTag('roblox')` and `revalidatePath('/')`.
  7. Duplicate place IDs are rejected.

---

## 7. Admin panel (`/admin`)

Layout: a left sidebar on desktop, top tabs on mobile. It uses the same dark tokens, styled as a calm utility UI. Every form validates with zod on the server, and the client mirrors the rules for instant feedback. Every successful mutation calls `revalidatePath('/')`, so **changes are live without a redeploy**. Success and error toasts are announced through `aria-live`.

- **Site**: hero title, tagline, about text (textarea with a character counter), Roblox profile URL, Discord username, highest peak CCU (number; clearing it removes the stat cell). Changes are saved explicitly with a Save button, not autosaved.
- **Games**:
  - List in display order. Each row shows the thumbnail, the effective name, live playing/visits, and badges for Hidden and Excluded from totals.
  - **Add**: paste a URL, see the preview, enter the role, save (see §6).
  - **Edit**:
    - Role (required) and display-name override (clear it to use the Roblox name).
    - Peak CCU (empty means hidden), the include-in-totals toggle and the hidden toggle.
  - **Custom thumbnail**:
    - Upload one to replace Roblox's thumbnail. "Remove" clears it, deletes the blob, and falls back to Roblox's.
    - The recommended size is 16:9, at least 1280×720.
  - **Reorder**: ↑/↓ buttons, which are accessible. Drag-and-drop is optional and only if trivial.
  - **Delete**: a confirm dialog that names the game. Also deletes the custom thumbnail blob.
- **Showcase**:
  - Upload one or more images, each with a caption and optional alt text.
  - Edit captions, reorder with ↑/↓, delete (with a confirm; also deletes the blob).
  - The image's width and height are read in the browser before upload and validated server-side.
- **Branding**: upload a new logo, with a preview on a dark background. "Reset to default" sets `logo_url` to null and deletes the uploaded blob.
- **Account**: change password (current, new, confirm). "Log out" removes this session; "Log out everywhere" removes all sessions.

### Uploads (Vercel Blob, public store)
- The store is **public**: portfolio images are meant to be public, and served directly from the CDN. The access mode **can't be changed after the store is created**.
- **Client uploads** with `@vercel/blob/client` `upload()` and a server token route that uses `handleUpload`. This avoids Vercel's 4.5 MB Function body limit.
- `onBeforeGenerateToken` (server) handles these steps:
  1. Calls `requireAdmin()`; anything other than an admin session gets 401.
  2. Validates the requested `kind` (`thumbnail` | `showcase` | `logo`) and pins the pathname prefix (`thumbnails/`, `showcase/`, `logo/`).
  3. Sets `allowedContentTypes: ['image/png','image/jpeg','image/webp']`. **No SVG or GIF.**
  4. Sets `maximumSizeInBytes`: 8 MB for thumbnails and showcase images, 2 MB for the logo.
  5. Sets `addRandomSuffix: true`, so blobs are immutable and there are no cache surprises.
- After the upload finishes, the client calls a Server Action with the blob URL. The server checks it like this:
  1. Checks the session.
  2. Calls `head(url)` to confirm the blob is in our store, under the expected prefix, with an allowed `contentType` and `size`.
  3. Writes the URL to the database.
  4. Deletes the previous blob, if there is one.
- Orphaned blobs from abandoned uploads are acceptable; there's no cleanup job.

---

## 8. Auth flow

- **Single account.** There's no username field, only a password.
- **Hashing**: argon2id via `@node-rs/argon2` with library defaults or stronger (memory ≥ 19 MiB, t ≥ 2). All hashing happens in server code only.
- **First login**:
  - While `admin.password_hash` is null, the submitted password is compared to `ADMIN_INITIAL_PASSWORD`. The comparison is constant-time: `timingSafeEqual` on SHA-256 digests.
  - On success, a session is created with `must_change_password = true`, and the user is redirected to `/admin/set-password`.
- **Set password**:
  - Requires new and confirm fields. Minimum 10 characters, max 128.
  - The new password must differ from `ADMIN_INITIAL_PASSWORD`.
  - On success:
    1. The hash is stored and `must_change_password` is cleared.
    2. **All sessions are deleted.**
    3. A fresh session is issued and the user goes to `/admin`.
  - Sessions with `must_change_password` can reach **only** `/admin/set-password` and logout. Every page, action and the upload route enforce this.
- **Normal login**: argon2 verify against `password_hash`.
- **Recovery (env-var reset)**:
  1. The site owner sets `ADMIN_RESET_TOKEN` to a new random value (≥32 chars) and **also sets a fresh `ADMIN_INITIAL_PASSWORD`**, then redeploys.
  2. While `sha256(ADMIN_RESET_TOKEN) ≠ consumed_reset_token_hash`, a login with the current `ADMIN_INITIAL_PASSWORD` is accepted **once**.
  3. That login stores the token hash as consumed and forces set-password.
  4. Afterwards, remove or rotate the env var. A token that has already been consumed does nothing.
- **Sessions**:
  - The cookie holds a random 32-byte token; the database stores only its SHA-256.
  - Cookie settings: `httpOnly`, `secure` (in production), `sameSite: 'strict'`, `path: '/'`. The name is `__Host-om4r_session` in production and `om4r_session` in dev, because the `__Host-` prefix requires https.
  - TTL is 7 days, sliding, with `last_seen_at` updated at most once per hour.
  - Logout deletes the row and the cookie.
- **Rate limiting** is backed by Postgres (works across serverless instances, no extra service):
  - Per IP: 5 failed attempts per 15 minutes, then HTTP 429 with "Too many attempts, try again in N min".
  - Global: 50 failed attempts per 15 minutes, then all logins are locked for 15 minutes. This protects the single account from distributed guessing.
  - Successful logins don't count.
  - Each attempt has a deliberate ~300ms minimum response time.
  - IPs are read from the `x-forwarded-for` header (first value) on Vercel.
- **Every admin entry point** (pages, Server Actions, route handlers) calls `requireAdmin()` on the server and re-checks the session against the database. Route handlers also verify that `Origin` matches the site; Server Actions have Next's built-in origin check.
- **Never in client code**: password logic, hashes, env secrets or session lookups. Admin client components receive only display data.
- `/admin/*` responses send `Cache-Control: no-store` and `X-Robots-Tag: noindex`.

---

## 9. Environment variables

| Name | Where it comes from | Notes |
|------|---------------------|-------|
| `DATABASE_URL` | Neon via Vercel Marketplace (`vercel install neon`) | Pooled; used at runtime |
| `DATABASE_URL_UNPOOLED` | Neon integration | Used by `drizzle-kit migrate` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store connected to the project | Required for `handleUpload` client tokens. `BLOB_STORE_ID` and `VERCEL_OIDC_TOKEN` are added automatically |
| `ADMIN_INITIAL_PASSWORD` | Set manually | Initially `Omar123`. Only usable before the first password is set, or once per reset token |
| `ADMIN_RESET_TOKEN` | Set manually, optional | Recovery only (§8) |
| `AUTH_SECRET` | Set manually: 32+ random bytes (`openssl rand -base64 32`) | HMAC key for IP hashing |
| `NEXT_PUBLIC_SITE_URL` | Set manually | `https://om4r.dev` (metadata, sitemap, Origin check) |

- `.env.example` lists every name with an empty or placeholder value. `.env*.local` is gitignored.
- No secret is prefixed with `NEXT_PUBLIC_`.

---

## 10. Stack and conventions
- Next.js, current stable, with the App Router, TypeScript strict mode and Tailwind v4.
- Drizzle ORM with `@neondatabase/serverless`, `zod`, `@vercel/blob`, `@node-rs/argon2`, and `lucide-react` for icons. Discord and Roblox brand icons are drawn as simple inline SVGs.
- Migrations: `drizzle-kit generate` locally. `npm run db:migrate` runs `drizzle-kit migrate` against `DATABASE_URL_UNPOOLED`. The Vercel build command is `npm run db:migrate && next build`.
- Server-only modules (database, auth, Roblox, blob) import `server-only`.

## 11. Development and handoff (Omar owns the accounts)
- **Development**:
  - Use the developer's own free Neon project and a Hobby Vercel Blob store (public), with values in `.env.local`.
  - Use `ADMIN_INITIAL_PASSWORD=Omar123` locally.
  - The development and production data are separate; production is seeded by the migration.
- **Handoff checklist for Omar:**
  1. Create a Vercel account or team and import the Git repository.
  2. Install Neon from the Marketplace and connect it to the project (Production + Preview).
  3. Create a Blob store set to **Public**, in a region near the Neon region, and connect it to the project.
  4. Add `ADMIN_INITIAL_PASSWORD`, `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`.
  5. Deploy. The migrations seed the data.
  6. Add the domain `om4r.dev`.
  7. Log in at `/admin` and set a new password.
  8. Optionally, invite the developer to the team for maintenance.

---

## 12. Out of scope (ask before adding)
- Light mode and theme toggle
- Blog, case-study pages, a "view all games" page, multiple pages
- Email, contact forms, or any way to message Omar on the site
- Services or "what I do" section, testimonials, team section
- Multiple admin users, email-based password reset, 2FA
- Analytics, cookies other than the admin session (so no consent banner)
- Roblox OAuth, automatic discovery of games he worked on
- Video uploads, image editing or cropping in admin, a blob cleanup job
- Internationalization
- Editing section headings or eyebrow copy from admin (only the fields listed in §7 are editable)

---

## 13. Verification checklist (all must pass before "done")

**Build and quality**
- [ ] `npm run build` passes with no type errors; `npm run lint` is clean
- [ ] No secret, hash or password logic in client bundles. Grep `.next/static` for `ADMIN_`, `argon`, `DATABASE_URL`, `BLOB_READ_WRITE`
- [ ] `.env.example` is complete; no `.env*.local` is committed; no personal name or email anywhere in the repo

**Public site**
- [ ] The hero shows the logo, the headshot, display name "om4r" and @Om4rIsAl, and a **large** verified badge driven by `hasVerifiedBadge`. To check, temporarily force it to false: the badge disappears
- [ ] The stats bar shows the sum of visits and playing over games that are visible and included in totals, plus the "40K" peak. Clearing the peak in admin removes the cell
- [ ] There are 4 game cards in seed order, with the correct thumbnail, name, creator and correct creator check (Be a Dragon Ball has **no** check), live playing/visits, role text verbatim, and a link to the correct game in a new tab
- [ ] Peak CCU shows "40K peak" / "4K peak" on the first two cards and is **absent** (not 0 or N/A) on the last two
- [ ] The showcase section and its nav link are absent with 0 items and appear after the first upload. The lightbox handles keyboard nav, swipe, Esc and focus return
- [ ] "Copy username" copies `om4risal` and shows the copied state. "Open Discord" opens discord.com/app
- [ ] Roblox failure: block the Roblox hosts (or set an invalid base URL in dev). The page still renders with the last snapshot numbers and the "Last updated" caption, and with no snapshot it renders without stats. No 500
- [ ] Data is cached about 5 minutes (repeated loads don't hit Roblox; checked in server logs)
- [ ] Responsive at 320, 375, 768, 1024 and 1440 px: no horizontal scroll, the 16px gutter holds on mobile, and the nav sheet works
- [ ] `prefers-reduced-motion` disables drift, count-up and fade-ups
- [ ] Lighthouse (mobile) on `/`: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- [ ] Keyboard-only pass: everything is reachable, focus rings are visible, and there's no focus trap outside dialogs

**Admin and auth**
- [ ] `/admin` without a session redirects to login. Every `/api/admin/*` route and Server Action returns 401 without a session (tested with curl)
- [ ] First login with `ADMIN_INITIAL_PASSWORD`, then a forced set-password; the dashboard is unreachable until a password is set. After setting it, `Omar123` no longer works
- [ ] Cookie flags in production: HttpOnly, Secure, SameSite=Strict, `__Host-` prefix
- [ ] The 6th wrong password from one IP within 15 minutes gets 429
- [ ] Reset flow: a new `ADMIN_RESET_TOKEN` plus a new initial password lets in exactly one login, which forces set-password; reusing the same token fails
- [ ] Each setting edit appears on `/` after refresh without a redeploy
- [ ] Add a game by URL: details auto-fetch. A non-Roblox URL, a bad ID or a duplicate each show clear errors
- [ ] Edit the role, override name, peak, toggles, reorder and delete: all are reflected on `/`
- [ ] Custom thumbnail upload replaces Roblox's; remove falls back to Roblox's, and the old blob is deleted
- [ ] Uploads: a `.svg`, a renamed `.exe` and a 9 MB image are rejected (thumbnail and showcase); a 3 MB logo is rejected. Valid PNG, JPEG and WebP are accepted
- [ ] Logo replace and reset to default both work
- [ ] Change password and "log out everywhere" invalidate the other sessions

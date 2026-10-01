import Image, { getImageProps } from "next/image";
import { ArrowDown, ExternalLink } from "lucide-react";
import type { HomeData } from "@/lib/home";
import { VerifiedSeal } from "./icons";

const ROW_DURATIONS = [80, 68, 90]; // seconds, within the 60–90s range; rows alternate direction
const TILES_PER_SET = 8;

/**
 * Plain <img> props from next/image's optimizer. The wall repeats ~48 tiles, and each <Image>
 * would be a client component to hydrate; these are static, decorative and never need it.
 */
function tileProps(src: string) {
  return getImageProps({ src, alt: "", width: 768, height: 432, sizes: "128px", loading: "lazy", fetchPriority: "low" })
    .props;
}

function HeroCollage({ thumbnails }: { thumbnails: (string | null)[] }) {
  const pool = thumbnails.length ? thumbnails : [null, null, null, null];
  const props = new Map(pool.filter((s): s is string => !!s).map((s) => [s, tileProps(s)]));
  const rows = [0, 1, 2].map((r) => {
    // Each row starts at a different game so neighbouring rows don't line up.
    const set = Array.from({ length: TILES_PER_SET }, (_, i) => pool[(i + r * 3) % pool.length]);
    return [...set, ...set]; // duplicated → translating by -50% loops seamlessly
  });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [contain:strict]">
      <div className="absolute left-1/2 top-1/2 flex w-[260%] -translate-x-1/2 -translate-y-1/2 -rotate-[8deg] flex-col gap-4 opacity-35 sm:w-[200%] sm:gap-6">
        {rows.map((tiles, r) => (
          <div
            key={r}
            // Blur lives on each drifting row: 3 layers rasterized once, then moved by the compositor.
            className="collage-row flex w-max gap-4 blur-[6px] will-change-transform sm:gap-6"
            data-direction={r % 2 ? "right" : "left"}
            style={{ ["--drift-duration" as string]: `${ROW_DURATIONS[r]}s` }}
          >
            {tiles.map((src, i) => (
              <div
                key={i}
                className="relative aspect-video w-[220px] shrink-0 overflow-hidden rounded-2xl bg-surface-2 sm:w-[340px]"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props (incl. alt="") come from getImageProps
                  <img {...props.get(src)} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a1a4f,#111833_60%,#0a4dff)]" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Vignette + fade into the page background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgb(5_7_13/0.55)_0%,rgb(5_7_13/0.2)_55%,rgb(5_7_13/0.75)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="img"
        aria-label="Verified on Roblox"
        className="relative inline-flex size-6 shrink-0 overflow-hidden rounded-full text-accent drop-shadow-[0_0_12px_rgb(30_140_255/0.65)] sm:size-8"
      >
        <VerifiedSeal size={32} className="size-full" />
        <span className="badge-shimmer absolute inset-y-[-20%] left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </span>
      <span
        aria-hidden="true"
        className="hidden rounded-full border border-accent/40 bg-accent-navy/70 px-2.5 py-1 text-xs font-semibold text-accent-bright sm:inline-block"
      >
        Verified on Roblox
      </span>
    </span>
  );
}

export function Hero({ settings, profile, thumbnails }: Pick<HomeData, "settings" | "profile"> & { thumbnails: (string | null)[] }) {
  const title = settings.heroTitle.trim();
  const split = title.lastIndexOf(" ");
  const head = split > 0 ? title.slice(0, split) : "";
  const tail = split > 0 ? title.slice(split + 1) : title;

  return (
    <section id="top" className="relative isolate flex min-h-[90svh] items-center overflow-hidden pb-28 pt-28 sm:pb-36">
      <HeroCollage thumbnails={thumbnails} />

      <div className="container-site relative flex flex-col items-center text-center">
        <Image
          src={settings.logoUrl}
          alt="om4r.dev"
          width={2172}
          height={724}
          // LCP element: fetch it first. (Next 16 docs advise loading/fetchPriority over `preload` here.)
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 640px) 420px, 260px"
          className="h-auto w-[260px] drop-shadow-[0_10px_40px_rgb(30_140_255/0.35)] sm:w-[420px]"
        />

        <div className="mt-8 flex items-center gap-4 text-left">
          <div className="relative size-[72px] shrink-0 rounded-full p-[3px] [background:var(--gradient-accent)] shadow-glow">
            {profile.headshotUrl ? (
              <Image
                src={profile.headshotUrl}
                alt={`${profile.displayName}'s Roblox avatar`}
                width={72}
                height={72}
                className="size-full rounded-full bg-surface-2 object-cover"
              />
            ) : (
              <div className="font-display flex size-full items-center justify-center rounded-full bg-surface-2 text-2xl font-extrabold">
                {profile.displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-display text-[28px] font-extrabold leading-none sm:text-[40px]">
                {profile.displayName}
              </span>
              {profile.hasVerifiedBadge && <VerifiedBadge />}
            </p>
            {profile.username && <p className="mt-1.5 text-sm font-medium text-muted">@{profile.username}</p>}
          </div>
        </div>

        <h1 className="font-display text-h1 mt-8 max-w-[14ch] text-balance">
          {head && <>{head} </>}
          <span className="text-gradient">{tail}</span>
        </h1>

        <p className="mt-5 line-clamp-2 max-w-[36rem] text-balance text-base text-muted sm:text-lg">{settings.tagline}</p>

        <div className="mt-8 flex flex-col items-stretch gap-3 min-[400px]:flex-row min-[400px]:items-center">
          <a href={settings.robloxProfileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            View Roblox profile <ExternalLink size={16} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a href="#games" className="btn btn-outline">
            See my games <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

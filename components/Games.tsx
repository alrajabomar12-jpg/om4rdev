import Image from "next/image";
import { ArrowUpRight, Eye, Trophy } from "lucide-react";
import { formatCompact } from "@/lib/format";
import type { GameCard as Game } from "@/lib/home";
import { VerifiedSeal } from "./icons";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";

function GameCard({ game }: { game: Game }) {
  return (
    <a
      href={game.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-200 ease-out hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_60px_-20px_rgb(30_140_255/0.45)] focus-visible:-translate-y-1 focus-visible:border-border-strong focus-visible:shadow-[0_24px_60px_-20px_rgb(30_140_255/0.45)]"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {game.thumbnailUrl ? (
          <Image
            src={game.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1200px) 556px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#0a1a4f,#111833_55%,#0a4dff)] p-6">
            <span className="font-display text-center text-2xl font-extrabold text-text/80">{game.name}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(5_7_13/0.96)] from-25% via-[rgb(5_7_13/0.7)] via-55% to-transparent px-5 pb-4 pt-20 [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
          <h3 className="font-display line-clamp-2 text-xl font-bold leading-tight tracking-[-0.02em]">{game.name}</h3>
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-text/85">
            {game.playing != null && (
              <li className="flex items-center gap-1.5">
                <span className="live-dot" aria-hidden="true" />
                <span className="tabular">{formatCompact(game.playing)}</span> playing
              </li>
            )}
            {game.visits != null && (
              <li className="flex items-center gap-1.5">
                <Eye size={15} aria-hidden="true" className="text-muted" />
                <span className="tabular">{formatCompact(game.visits)}</span> visits
              </li>
            )}
            {game.peakCcu != null && (
              <li className="flex items-center gap-1.5">
                <Trophy size={15} aria-hidden="true" className="text-muted" />
                <span className="tabular">{formatCompact(game.peakCcu)}</span> peak
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-4 p-5 pr-14">
        {game.creator && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
            by <span className="text-text">{game.creator.name}</span>
            {game.creator.verified && (
              <span role="img" aria-label="Verified creator" className="inline-flex text-accent">
                <VerifiedSeal size={16} />
              </span>
            )}
          </p>
        )}
        <div className="border-l-2 border-accent pl-3">
          <p className="eyebrow text-[0.6875rem] text-accent-bright">My role</p>
          <p className="mt-1 text-text/90">{game.role}</p>
        </div>
        <ArrowUpRight
          size={20}
          aria-hidden="true"
          className="absolute right-5 top-5 text-muted transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-bright"
        />
      </div>
      <span className="sr-only">(opens on Roblox in a new tab)</span>
    </a>
  );
}

export function Games({ games }: { games: Game[] }) {
  return (
    <section id="games" aria-labelledby="games-heading" className="py-24 md:py-32">
      <Reveal className="container-site">
        <Eyebrow index="01" label="Games" />
        <h2 id="games-heading" className="font-display text-h2 mt-4">
          Games I&apos;ve <span className="text-accent">worked on</span>.
        </h2>
        {games.length === 0 ? (
          <p className="mt-8 text-muted">Projects coming soon.</p>
        ) : (
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {games.map((g) => (
              <li key={g.id} className="flex">
                <GameCard game={g} />
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </section>
  );
}

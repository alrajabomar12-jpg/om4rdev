import type { Metadata } from "next";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Games } from "@/components/Games";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Showcase } from "@/components/Showcase";
import { StatsBar } from "@/components/StatsBar";
import { getHomeData, getSettings } from "@/lib/home";

// ISR: regenerate at most every 5 minutes (Roblox fetches share the same 300s window).
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    description: settings.tagline,
    openGraph: { title: "om4r: Roblox 3D Modeler & Builder", description: settings.tagline, url: "/", type: "website" },
    twitter: { card: "summary_large_image", description: settings.tagline },
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const { settings, profile, games, stats, showcase } = await getHomeData();
  const hasShowcase = showcase.length > 0;

  return (
    <>
      <a
        href="#games"
        className="sr-only z-[60] rounded-full bg-accent-deep px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar logoUrl={settings.logoUrl} showShowcase={hasShowcase} />
      <main>
        <Hero settings={settings} profile={profile} thumbnails={games.map((g) => g.thumbnailUrl)} />
        <StatsBar stats={stats} />
        <Games games={games} />
        {hasShowcase && <Showcase items={showcase} />}
        <About text={settings.aboutText} index={hasShowcase ? "03" : "02"} />
        <Contact discordUsername={settings.discordUsername} />
      </main>
      <Footer logoUrl={settings.logoUrl} robloxProfileUrl={settings.robloxProfileUrl} showShowcase={hasShowcase} />
    </>
  );
}

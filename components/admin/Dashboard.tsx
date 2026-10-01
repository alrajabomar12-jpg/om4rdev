"use client";

import Image from "next/image";
import { ExternalLink, Gamepad2, Images, LogOut, Palette, Settings2, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import type { AdminData } from "@/lib/admin/data";
import { AccountTab } from "./AccountTab";
import { api, hardNavigate } from "./api";
import { BrandingTab } from "./BrandingTab";
import { GamesTab } from "./GamesTab";
import { ShowcaseTab } from "./ShowcaseTab";
import { SiteTab } from "./SiteTab";
import { ToastProvider } from "./Toasts";

export type TabId = "site" | "games" | "showcase" | "branding" | "account";

const TABS: { id: TabId; label: string; icon: typeof Settings2 }[] = [
  { id: "site", label: "Site", icon: Settings2 },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "showcase", label: "Showcase", icon: Images },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "account", label: "Account", icon: UserRound },
];

/**
 * Admin shell: sidebar on desktop, top tabs on mobile (one tablist that changes orientation).
 * Arrow keys move between tabs, per the WAI-ARIA tabs pattern.
 */
export function Dashboard({ data, initialTab }: { data: AdminData; initialTab: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: TabId, focus = false) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
    if (focus) tabRefs.current[id]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Move relative to the focused tab (which may differ from the selected one).
    const focused = TABS.findIndex((t) => tabRefs.current[t.id] === document.activeElement);
    const i = focused !== -1 ? focused : TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (i + 1) % TABS.length
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (i - 1 + TABS.length) % TABS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? TABS.length - 1
              : -1;
    if (next === -1) return;
    e.preventDefault();
    select(TABS[next].id, true);
  }

  async function logout() {
    await api("/api/admin/logout", "POST", {});
    hardNavigate("/admin/login");
  }

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-svh w-full max-w-[1200px] flex-col lg:flex-row">
        <aside className="border-b border-border px-4 pb-0 pt-4 sm:px-6 lg:sticky lg:top-0 lg:h-svh lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
            <Image src="/brand/om4r-logo.png" alt="om4r.dev admin" width={2172} height={724} sizes="120px" className="h-auto w-[120px]" />
            {/* Wrapper carries lg:hidden: .btn's display is unlayered CSS and would beat a utility on the link itself. */}
            <div className="lg:hidden">
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                View site <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Admin sections"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:mt-8 lg:flex-col lg:overflow-visible lg:px-0"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === tab;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(id)}
                  className={`flex shrink-0 items-center gap-2.5 border-b-2 px-2 py-3 text-sm sm:px-3 font-semibold transition-colors duration-200 lg:rounded-xl lg:border-b-0 lg:py-2.5 ${
                    active
                      ? "border-accent text-text lg:bg-surface-2"
                      : "border-transparent text-muted hover:text-text lg:hover:bg-surface"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" className={`hidden sm:block ${active ? "text-accent-bright" : ""}`} />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-8 hidden flex-col gap-2 lg:flex">
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm justify-start">
              <ExternalLink size={14} aria-hidden="true" /> View site
            </a>
            <button type="button" onClick={logout} className="btn btn-outline btn-sm justify-start">
              <LogOut size={14} aria-hidden="true" /> Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {TABS.map(({ id, label }) => (
            <section
              key={id}
              id={`panel-${id}`}
              role="tabpanel"
              aria-labelledby={`tab-${id}`}
              hidden={id !== tab}
              tabIndex={0}
              className="focus-visible:outline-none"
            >
              <h1 className="font-display text-3xl font-extrabold">{label}</h1>
              <div className="mt-6">
                {id === "site" && <SiteTab settings={data.settings} />}
                {id === "games" && <GamesTab games={data.games} liveAvailable={data.liveAvailable} />}
                {id === "showcase" && <ShowcaseTab items={data.showcase} />}
                {id === "branding" && <BrandingTab logo={data.logo} />}
                {id === "account" && <AccountTab onLogout={logout} />}
              </div>
            </section>
          ))}
        </main>
      </div>
    </ToastProvider>
  );
}

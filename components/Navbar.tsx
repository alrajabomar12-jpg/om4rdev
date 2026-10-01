"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useRef } from "react";
import { DiscordIcon } from "./icons";

interface Props {
  logoUrl: string;
  showShowcase: boolean;
}

export function Navbar({ logoUrl, showShowcase }: Props) {
  const sheet = useRef<HTMLDialogElement>(null);
  const links = [
    { href: "#games", label: "Games" },
    ...(showShowcase ? [{ href: "#showcase", label: "Showcase" }] : []),
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:pt-4">
      <nav
        aria-label="Primary"
        className="pointer-events-auto mx-auto flex h-14 max-w-[760px] items-center justify-between gap-4 rounded-full border border-border bg-[rgb(11_16_32/0.7)] pl-4 pr-2 shadow-[0_8px_32px_-12px_rgb(0_0_0/0.8)] backdrop-blur-md"
      >
        <a href="#top" className="flex shrink-0 items-center rounded-full" aria-label="om4r.dev, back to top">
          <Image src={logoUrl} alt="" width={2172} height={724} sizes="108px" className="h-auto w-[108px]" />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            aria-label="Discord: contact me"
            className="ml-1 inline-flex size-10 items-center justify-center rounded-full bg-accent-deep text-white transition-shadow duration-200 hover:shadow-glow"
          >
            <DiscordIcon size={18} />
          </a>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full text-text hover:bg-surface-2 md:hidden"
          aria-label="Open menu"
          aria-haspopup="dialog"
          onClick={() => sheet.current?.showModal()}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </nav>

      {/* Native modal dialog: focus is trapped and Esc closes it without extra code. */}
      <dialog
        ref={sheet}
        aria-label="Menu"
        className="pointer-events-auto m-0 mb-auto w-full max-w-none rounded-b-2xl border-b border-border bg-surface px-2 pb-3 pt-3 text-text backdrop:bg-[rgb(2_4_10/0.7)] md:hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) sheet.current?.close();
        }}
      >
        <div className="flex items-center justify-between py-1 pl-4 pr-2">
          <Image src={logoUrl} alt="om4r.dev" width={2172} height={724} sizes="108px" className="h-auto w-[108px]" />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-2"
            aria-label="Close menu"
            onClick={() => sheet.current?.close()}
            autoFocus
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <ul className="mt-1 flex flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => sheet.current?.close()}
                className="block rounded-xl px-3 py-3.5 text-lg font-semibold hover:bg-surface-2"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-2">
            <a
              href="#contact"
              onClick={() => sheet.current?.close()}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-lg font-semibold hover:bg-surface-2"
            >
              <DiscordIcon size={20} className="text-accent-bright" /> Discord
            </a>
          </li>
        </ul>
      </dialog>
    </header>
  );
}

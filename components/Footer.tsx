import Image from "next/image";
import { DiscordIcon, RobloxIcon } from "./icons";

export function Footer({
  logoUrl,
  robloxProfileUrl,
  showShowcase,
}: {
  logoUrl: string;
  robloxProfileUrl: string;
  showShowcase: boolean;
}) {
  const links = [
    { href: "#games", label: "Games" },
    ...(showShowcase ? [{ href: "#showcase", label: "Showcase" }] : []),
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];
  const iconBtn =
    "inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors duration-200 hover:border-border-strong hover:text-text";

  return (
    <footer className="border-t border-border">
      <div className="container-site flex flex-col items-center gap-6 py-10 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-3">
          <Image src={logoUrl} alt="om4r.dev" width={2172} height={724} sizes="96px" className="h-auto w-24" />
          <span className="text-sm text-muted">© {new Date().getFullYear()} om4r.dev</span>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-1 gap-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-block rounded-full px-3 py-2 text-sm text-muted hover:text-text">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex gap-2 md:justify-self-end">
          <a href={robloxProfileUrl} target="_blank" rel="noopener noreferrer" aria-label="Roblox profile (opens in a new tab)" className={iconBtn}>
            <RobloxIcon size={18} />
          </a>
          <a href="#contact" aria-label="Discord: contact me" className={iconBtn}>
            <DiscordIcon size={18} />
          </a>
        </div>
      </div>
      <p className="container-site pb-8 text-center text-xs text-muted md:text-left">Not affiliated with Roblox Corporation.</p>
    </footer>
  );
}

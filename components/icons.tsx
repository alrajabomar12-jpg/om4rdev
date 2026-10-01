// Brand marks drawn as simple inline SVGs (SPEC §10), not the companies' assets.

type IconProps = { className?: string; size?: number };

export function DiscordIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1a15.6 15.6 0 0 0-5.8 0l-.5-1a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17.2 17.2 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a17.1 17.1 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM8.5 14.7c-1 0-1.9-1-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.8 2.1-1.9 2.1Zm7 0c-1 0-1.9-1-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.8 2.1-1.9 2.1Z" />
    </svg>
  );
}

/** A tilted rounded square with a square hole: a generic nod to the Roblox tile, not its logo file. */
export function RobloxIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M6.1 2.6 21.4 6.7 17.9 21.4 2.6 17.3 6.1 2.6Zm4.4 7.1-.8 3.4 3.4.8.8-3.4-3.4-.8Z"
      />
    </svg>
  );
}

/** Scalloped verification seal with a check. `fill` is the seal color. */
export function VerifiedSeal({ className, size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 1.5l2.3 1.7 2.8-.3 1.1 2.6 2.6 1.1-.3 2.8 1.7 2.3-1.7 2.3.3 2.8-2.6 1.1-1.1 2.6-2.8-.3L12 22.5l-2.3-1.7-2.8.3-1.1-2.6-2.6-1.1.3-2.8L1.8 12l1.7-2.3-.3-2.8 2.6-1.1 1.1-2.6 2.8.3L12 1.5Z"
      />
      <path
        d="m7.6 12.3 3 3 5.9-6.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

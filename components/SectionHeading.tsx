/** Eyebrow label, e.g. "01 · GAMES" (Breakout 06 numbered style) or plain "CONTACT". */
export function Eyebrow({ index, label, className = "" }: { index?: string; label: string; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-2 text-accent-bright ${className}`}>
      {index && (
        <>
          <span className="tabular">{index}</span>
          <span aria-hidden="true" className="text-muted">
            ·
          </span>
        </>
      )}
      <span>{label}</span>
    </p>
  );
}

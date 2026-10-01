const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** 130_600_000 → "130.6M", 28 → "28", 40_000 → "40K". */
export const formatCompact = (n: number) => compact.format(n);

export const STALE_AFTER_MS = 30 * 60 * 1000;

export function fmtTime(iso?: string, tz?: string): string {
  if (!iso) return "TBD";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });
  } catch {
    return iso;
  }
}

export function fmtDay(iso?: string, tz?: string): string {
  if (!iso) return "TBD";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: tz,
    });
  } catch {
    return iso;
  }
}

export function fmtDayTime(iso?: string, tz?: string): string {
  if (!iso) return "TBD";
  return `${fmtDay(iso, tz)} · ${fmtTime(iso, tz)}`;
}

export function relativeTime(iso?: string, now: Date = new Date()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = t - now.getTime();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const h = Math.round(abs / 3600000);
  const d = Math.round(abs / 86400000);
  let label: string;
  if (m < 1) label = "now";
  else if (m < 60) label = `${m}m`;
  else if (h < 24) label = `${h}h`;
  else label = `${d}d`;
  if (label === "now") return "now";
  return diff > 0 ? `in ${label}` : `${label} ago`;
}

export const ROUND_NAMES: Record<number, string> = {
  1: "Practice",
  2: "Qualification",
  3: "Quarterfinal",
  4: "Semifinal",
  5: "Final",
  6: "Round of 16",
  15: "Round Robin",
  16: "Round Robin",
};

export function roundLabel(round: number): string {
  return ROUND_NAMES[round] ?? `Round ${round}`;
}

export function shortMatchName(m: {
  round: number;
  instance: number;
  matchnum: number;
  name?: string;
}): string {
  if (m.name) return m.name;
  const base = roundLabel(m.round);
  if (m.round === 2 || m.round === 1) return `${base} ${m.matchnum}`;
  return `${base} ${m.instance}-${m.matchnum}`;
}

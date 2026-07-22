// Shared formatters for AnnouncementsPanel + ShipHistoryPanel. Same pure logic
// as src/components/product/format.ts, kept as a separate local copy rather
// than an import so Brain has no runtime dependency on the /product folder
// once that surface is retired.
export function relTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const ms = Date.now() - t;
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function fmtUsd(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? Number(n) : (n ?? 0);
  if (!v) return "$0";
  const isNegative = v < 0;
  const absV = Math.abs(v);
  const sign = isNegative ? "-" : "";
  return absV < 0.01 ? `${sign}$${absV.toFixed(4)}` : `${sign}$${absV.toFixed(2)}`;
}

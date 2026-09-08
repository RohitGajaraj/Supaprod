/**
 * THE ONE CLUSTER TO START WITH, AND WHY.
 *
 * ── THE COMPLAINT (founder, 2026-09-08) ──────────────────────────────────
 * Findings opened on Helio Labs with "133 clusters need your decisions." A
 * count is data; a hundred and thirty-three decisions is not a thing a
 * person can do this afternoon, and the ranking underneath had already
 * decided which one comes first. So the headline says that: start with this
 * one, because its severity, its newest signal and its corroboration put it
 * at the top, and the count moves to the sub line as the depth of the queue
 * behind it. Nothing new is read; `ranked[0]` already carries every fact.
 *
 * ── WHAT IT REFUSES ──────────────────────────────────────────────────────
 * An Example cluster is never the instruction (`the-brain-does-not-rank-
 * fiction` is the standing law), so a sample at the top yields null and the
 * surface keeps its count sentence. A fact the row does not carry is left
 * out, never zeroed: no severity, no "Severity 0 of 5".
 *
 * Pure.
 */

export type RankedLead = {
  theme: {
    title: string;
    severity?: number | null;
    frequency?: number | null;
    is_sample?: boolean | null;
  };
  /** ISO of the newest signal in the cluster, or null. */
  lastAt: string | null;
  /** Distinct sources the cluster's signals came from. */
  sources: number;
};

const TITLE_MAX = 90;

function clipTitle(s: string): string {
  const t = s.trim();
  if (t.length <= TITLE_MAX) return t;
  const cut = t.lastIndexOf(" ", TITLE_MAX - 1);
  return `${t.slice(0, cut > TITLE_MAX * 0.6 ? cut : TITLE_MAX - 1).trimEnd()}…`;
}

/** "just now", "12m ago", "3h ago", "5d ago": the ranking row's own register,
 *  read live beside it on 2026-09-08 ("5 d ago" over a row saying "5d ago"). */
export function ago(iso: string | null, nowMs: number): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  const s = Math.max(0, Math.round((nowMs - then) / 1000));
  if (s < 90) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function n(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function leadOfRanking(
  ranked: readonly RankedLead[],
  nowMs: number,
): { lead: string; why: string } | null {
  const top = ranked[0];
  if (!top || top.theme.is_sample) return null;
  const title = clipTitle(top.theme.title || "");
  if (!title) return null;

  const facts: string[] = [];
  const sev = typeof top.theme.severity === "number" ? top.theme.severity : null;
  if (sev !== null && sev >= 1) facts.push(`Severity ${Math.min(5, Math.round(sev))} of 5`);
  const when = ago(top.lastAt, nowMs);
  if (when) facts.push(`newest signal ${when}`);
  const freq = typeof top.theme.frequency === "number" ? top.theme.frequency : null;
  if (freq !== null && freq > 0) {
    facts.push(
      top.sources > 0
        ? `${n(freq, "signal", "signals")} from ${n(top.sources, "source", "sources")}`
        : n(freq, "signal", "signals"),
    );
  }
  const behind = ranked.length - 1;
  const depth =
    behind > 0
      ? `${n(behind, "more cluster", "more clusters")} behind it, ordered by how severe, how recent, and how new each one is.`
      : "Nothing else is open behind it.";
  const why = facts.length > 0 ? `${facts.join(", ")}. ${depth}` : depth;

  return { lead: `Start with “${title}”.`, why };
}

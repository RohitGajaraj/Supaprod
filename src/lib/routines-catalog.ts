/**
 * PC-08: the routines catalog. A code constant, not a table -- the platform
 * runs 29 background pg_cron jobs (verified live, 2026-07-10); this is the
 * curated, user-facing slice: what a workspace owner can actually reason
 * about and turn off. Never expose raw cron syntax to a user.
 *
 * cronSchedule is the REAL, live schedule for each underlying job (matched
 * against cron.job at build time); nextRunAt is computed from it, purely,
 * client-and-server-safe, no DB round trip needed for that half of "live
 * last/next."
 */

export type RoutineId =
  | "sense-sweep"
  | "signal-clustering"
  | "learnings-synthesis"
  | "outcome-check"
  | "digest"
  | "scout"
  | "competitor-watch"
  | "researcher-brief"
  | "steward";

export type RoutineDefinition = {
  id: RoutineId;
  name: string;
  whatItDoes: string;
  castOwner: string;
  cronSchedule: string;
  /** The underlying pg_cron job name, for the rare reader who wants it. */
  jobName: string;
};

export const ROUTINES_CATALOG: RoutineDefinition[] = [
  {
    id: "sense-sweep",
    name: "Overnight signal sweep",
    whatItDoes: "Reads your connected sources and tags what it finds so the next steps can use it.",
    castOwner: "Supaprod",
    cronSchedule: "*/5 * * * *",
    jobName: "sense-tick",
  },
  {
    id: "signal-clustering",
    name: "Signal clustering",
    whatItDoes: "Groups related signals into themes so a pattern reads as one thing, not twenty.",
    castOwner: "Supaprod",
    cronSchedule: "*/10 * * * *",
    jobName: "cluster-tick",
  },
  {
    id: "learnings-synthesis",
    name: "Learnings synthesis",
    whatItDoes: "Turns what happened into a durable learning your next decision can cite.",
    castOwner: "Historian",
    cronSchedule: "0 */2 * * *",
    jobName: "derive-tick",
  },
  {
    id: "outcome-check",
    name: "Outcome check",
    whatItDoes: "Checks whether a shipped decision's real-world outcome has landed yet.",
    castOwner: "Supaprod",
    cronSchedule: "0 * * * *",
    jobName: "outcome-tick",
  },
  {
    id: "digest",
    name: "Daily digest",
    whatItDoes: "Prepares the summary that lands in your inbox on the schedule you set.",
    castOwner: "Supaprod",
    cronSchedule: "0 * * * *",
    jobName: "digest-tick",
  },
  {
    id: "scout",
    name: "Market scout",
    whatItDoes: "Watches for new market and product signals worth your attention.",
    castOwner: "Scout",
    cronSchedule: "0 * * * *",
    jobName: "scout-tick",
  },
  {
    id: "competitor-watch",
    name: "Competitor watch",
    whatItDoes: "Checks in on named competitors weekly and flags what moved.",
    castOwner: "Competitor watcher",
    cronSchedule: "0 8 * * 1",
    jobName: "competitor-tick",
  },
  {
    id: "researcher-brief",
    name: "Researcher brief",
    whatItDoes: "Drafts a daily research brief from what the week's signals are pointing at.",
    castOwner: "Researcher",
    cronSchedule: "0 7 * * *",
    jobName: "researcher-tick",
  },
  {
    id: "steward",
    name: "Steward check",
    whatItDoes: "A daily health pass over the workspace: stale items, quiet loops, loose ends.",
    castOwner: "Supaprod",
    cronSchedule: "0 9 * * *",
    jobName: "steward-tick",
  },
];

/**
 * Pure cron -> next-run-at. Supports the plain forms this catalog actually
 * uses (*, N, star/N, N-M, comma lists) across minute/hour/day-of-month/
 * month/day-of-week. Not a general cron parser -- good enough for the 9
 * catalog schedules above, which is all this ever needs to read.
 */
export function nextRunAt(cronSchedule: string, from: Date = new Date()): Date {
  const [minute, hour, dom, month, dow] = cronSchedule.trim().split(/\s+/);
  const candidate = new Date(from.getTime());
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const matches = (field: string, value: number, max: number): boolean => {
    if (field === "*") return true;
    return field.split(",").some((part) => {
      if (part.includes("/")) {
        const [range, stepStr] = part.split("/");
        const step = Number(stepStr) || 1;
        const start = range === "*" ? 0 : Number(range);
        return value >= start && (value - start) % step === 0 && value <= max;
      }
      if (part.includes("-")) {
        const [lo, hi] = part.split("-").map(Number);
        return value >= lo && value <= hi;
      }
      return Number(part) === value;
    });
  };

  for (let i = 0; i < 60 * 24 * 8; i++) {
    const ok =
      matches(minute, candidate.getMinutes(), 59) &&
      matches(hour, candidate.getHours(), 23) &&
      matches(dom, candidate.getDate(), 31) &&
      matches(month, candidate.getMonth() + 1, 12) &&
      matches(dow, candidate.getDay(), 6);
    if (ok) return candidate;
    candidate.setMinutes(candidate.getMinutes() + 1);
  }
  return candidate;
}

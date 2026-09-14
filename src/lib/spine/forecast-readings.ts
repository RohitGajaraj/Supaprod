import { isStanding, type HandReading } from "./what-would-measure-this";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Parse an explicit ISO timestamp, rejecting dates that Date.parse normalizes. */
function instant(at: unknown): { seconds: number; fraction: string } | null {
  if (typeof at !== "string") return null;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|[+-](\d{2}):(\d{2}))$/i.exec(
      at,
    );
  if (!parts) return null;
  const [, year, month, day, hour, minute, second, fraction, offsetHour, offsetMinute] = parts;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > days[m - 1] ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    Number(offsetHour ?? 0) > 23 ||
    Number(offsetMinute ?? 0) > 59
  )
    return null;
  const parsed = Date.parse(at);
  // Date.parse normalizes offsets but truncates sub-millisecond precision.
  // Keep the normalized fractional digits so distinct instants stay distinct.
  return Number.isFinite(parsed)
    ? { seconds: Math.floor(parsed / 1000), fraction: (fraction ?? "").replace(/0+$/, "") }
    : null;
}

/**
 * Evidence belongs to a forecast only through reciprocal IDs. A unique clause
 * or matching prose is insufficient. Duplicate target IDs (even in history)
 * and multiple standing clauses claiming the decision leave ownership unclear.
 */
export function forecastReadings(
  contract: unknown,
  link: { decisionId: string | null; clauseId: string | null },
): { reading: HandReading | null; count: number } {
  const empty = { reading: null, count: 0 };
  if (!link || !nonempty(link.decisionId) || !nonempty(link.clauseId)) return empty;
  if (!record(contract) || !Array.isArray(contract.success_metrics)) return empty;
  const clauses = contract.success_metrics.filter(record);
  const targets = clauses.filter((clause) => clause.id === link.clauseId);
  const owners = clauses.filter(
    (clause) => isStanding(clause) && clause.measures_decision_id === link.decisionId,
  );
  if (targets.length !== 1 || owners.length !== 1 || targets[0] !== owners[0]) return empty;
  const clause = targets[0];
  if (!Array.isArray(clause.readings)) return empty;

  const seen = new Set<string>();
  let latest: HandReading | null = null;
  let latestInstant: { seconds: number; fraction: string } | null = null;
  for (const candidate of clause.readings) {
    if (
      !record(candidate) ||
      typeof candidate.value !== "number" ||
      !Number.isFinite(candidate.value) ||
      !nonempty(candidate.by)
    )
      continue;
    const at = instant(candidate.at);
    if (at === null) continue;
    const key = JSON.stringify([at.seconds, at.fraction, candidate.by, candidate.value]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (
      !latestInstant ||
      at.seconds > latestInstant.seconds ||
      (at.seconds === latestInstant.seconds && at.fraction > latestInstant.fraction)
    ) {
      latestInstant = at;
      latest = {
        value: candidate.value,
        at: candidate.at as string,
        by: candidate.by,
        ...(typeof candidate.note === "string" ? { note: candidate.note } : {}),
      };
    }
  }
  return { reading: latest, count: seen.size };
}

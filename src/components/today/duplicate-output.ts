/**
 * TWO TEAMMATES PRODUCED THE SAME THING, AND NOBODY NOTICED.
 *
 * `SPEC-AGENT-COMMS` §3 defines **claim** — *"I have this object"* — to stop
 * duplicate work before it starts, and §7 names the value: *"Two teammates never
 * do the same work twice. Amoeba's own value line: coordinated agents SPLIT
 * duplicate work rather than repeating it."*
 *
 * ── WHY DETECTION, WHEN THE SPEC ASKS FOR PREVENTION ──────────────────────
 * **`claim` has zero rows, ever.** Measured 2026-08-31, service-role:
 * `agent_messages` holds `handoff` 143, `kickoff` 14, `steer` 4 — three of the
 * seven types in the spec, and `claim` is not one of them. So a surface built on
 * claims would render nothing today and could not be proved against any row.
 *
 * **The duplication it exists to prevent is already in the record, and it is
 * total.** The only two real (non-sample) learnings this product has ever
 * recorded are the same learning:
 *
 *   data-analyst    2026-08-25 19:40:19  decision 663c7376  verdict `missed`
 *   insight-keeper  2026-08-25 19:40:45  decision 663c7376  verdict `missed`
 *
 * **Twenty-six seconds apart, same decision, same verdict, same summary,
 * neither knowing the other had.** Two of two — a 100% duplication rate across
 * the entire real corpus (F-158).
 *
 * So this module does the half that can be true today: **say it happened.**
 * Prevention needs `claim` rows and S0's model to be writing them; detection
 * needs only what is already stored. When claims exist, the same subject key
 * serves both, and the mark this produces is the one §8 assigns to S2.
 *
 * ── A ROW COMPARISON, NEVER A MODEL CALL ──────────────────────────────────
 * §3: *"the moment it needs a model call it is wrong."* Nothing here reasons,
 * scores similarity or clusters. Two rows share a subject or they do not.
 */

/** One produced artifact, in the shape `listLearnings` already returns. */
export interface OutputRow {
  id: string;
  /** `learnings.recorded_by_agent_slug`. Null means we cannot name a producer. */
  recordedBy: string | null;
  createdAt: string;
  /**
   * The subject's own id — `learnings.decision_id`.
   *
   * **NOT on the payload today**: `listLearnings`
   * (`outcome.functions.ts:2088`) selects the embedded
   * `decision:decisions(forecast_claim)` and not the raw column. One field is
   * asked for in `coordination/requests/S2/`. Optional here so the derivation
   * is already correct when it lands, rather than being rewritten around it.
   */
  subjectId?: string | null;
  /** `decision.forecast_claim`, the embedded fallback. See `subjectOf`. */
  subjectClaim?: string | null;
  verdict: string;
}

/** One subject that more than one teammate produced an answer for. */
export interface RepeatedOutput {
  /** The grouping key, prefixed so an id and a claim can never collide. */
  subject: string;
  /** Distinct producers, sorted. Always two or more. */
  agents: string[];
  /** The rows themselves, oldest first. */
  ids: string[];
  /** Whole seconds between the first and last. The F-158 case is 26. */
  secondsApart: number;
  /** True when every one of them reached the same verdict. */
  sameVerdict: boolean;
}

/**
 * The subject two rows must share, or null.
 *
 * ── THE ORDER IS THE HONESTY, AND THE THIRD OPTION IS DELIBERATELY ABSENT ──
 * 1. `decision_id` — the real foreign key. Unambiguous.
 * 2. `forecast_claim` — the DECISION'S own text, reached through the embed. Two
 *    learnings on one decision carry the identical string because it is the same
 *    row's field, so this is a key borrowed from the subject rather than a
 *    similarity judgement about the artifacts.
 * 3. **The summary is NOT used, and that is the point.** It is the artifact's
 *    own prose, and matching on it would make two genuinely separate findings
 *    that happen to be worded alike look like one — a mark firing where nothing
 *    is shared, which `collision.ts` names as the way this kind of surface dies.
 *    My own earlier note said title matching is *"a floor, and it GOES if a real
 *    subject relation lands"*. A real one exists here; the floor is not needed.
 *
 * **No subject, no group.** A row we cannot place is absent from the result, not
 * reported as unique — the same distinction `targetOf` draws one layer down.
 */
export function subjectOf(r: OutputRow): string | null {
  const id = typeof r.subjectId === "string" ? r.subjectId.trim() : "";
  if (id) return `id:${id}`;
  const claim = typeof r.subjectClaim === "string" ? r.subjectClaim.trim() : "";
  if (claim) return `claim:${claim}`;
  return null;
}

/**
 * Subjects more than one DISTINCT teammate produced an answer for.
 *
 * **Distinct by producer, so a teammate that recorded twice is one teammate.**
 * §3's rule for collision — *"a run never collides with itself"* — is the same
 * rule one object up: an agent repeating itself is a retry, which is a different
 * problem and must not be reported as two teammates duplicating each other.
 *
 * **Deliberately not windowed.** Two agents grading one decision a week apart is
 * still both of them doing it. The GAP is reported instead, so a reader can tell
 * the 26-second race from the fortnight-later repeat without the function
 * deciding for them which one counts.
 */
export function repeatedOutput(rows: readonly OutputRow[] | undefined): RepeatedOutput[] {
  const bySubject = new Map<string, OutputRow[]>();
  for (const r of rows ?? []) {
    if (!r.recordedBy) continue; // A duplicate nobody can be named for is not actionable.
    const subject = subjectOf(r);
    if (!subject) continue;
    const held = bySubject.get(subject);
    if (held) held.push(r);
    else bySubject.set(subject, [r]);
  }

  const out: RepeatedOutput[] = [];
  for (const [subject, group] of bySubject) {
    const agents = [...new Set(group.map((r) => r.recordedBy as string))].sort();
    if (agents.length < 2) continue;

    const timed = [...group].sort(
      (a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
    );
    const first = Date.parse(timed[0]!.createdAt);
    const last = Date.parse(timed[timed.length - 1]!.createdAt);
    /* An unreadable stamp cannot produce a gap. Reported as 0 rather than NaN,
       because the DUPLICATION is the finding and the gap is colour on it - and
       a NaN would reach the surface as "NaN seconds apart". */
    const gap =
      Number.isFinite(first) && Number.isFinite(last) ? Math.round((last - first) / 1000) : 0;

    out.push({
      subject,
      agents,
      ids: timed.map((r) => r.id),
      secondsApart: gap,
      sameVerdict: new Set(group.map((r) => r.verdict)).size === 1,
    });
  }

  /* Closest together first: two teammates 26 seconds apart is a race neither
     could have seen, which is the case `claim` prevents. A repeat a week later
     is somebody redoing settled work, which is a different conversation. */
  return out.sort((a, b) => a.secondsApart - b.secondsApart);
}

/**
 * One plain sentence, or null when there is nothing to say.
 *
 * **Null rather than a reassuring line**, because this reads from a capped list
 * and an absence here means "not in what we read", never "it did not happen".
 */
export function repeatedOutputLine(groups: readonly RepeatedOutput[]): string | null {
  if (groups.length === 0) return null;
  const worst = groups[0]!;
  const who = worst.agents.length === 2 ? "Two teammates" : `${worst.agents.length} teammates`;
  /* The gap is only spoken when it is short enough to be the interesting fact.
     "26 seconds apart" says neither could have seen the other; "9 days apart"
     would need a different sentence and this one does not pretend to it. */
  const near = worst.secondsApart <= 300 ? ` ${worst.secondsApart}s apart` : "";
  const rest = groups.length > 1 ? `, and ${groups.length - 1} more like it` : "";
  return `${who} answered the same thing${near}${rest}.`;
}

/**
 * WHAT THIS RUN GOT YOU, as rows a person can read in order and press.
 *
 * ── WHAT IT REPLACES ─────────────────────────────────────────────────────
 * The strip above the right pane printed, on the shipped run: *4 findings ·
 * 2 clusters · 2 decisions · 7 tasks · 4 specs · 13 prototypes · run · code
 * change · release · PR #5* and then *Verdict at Build: revise, 4 findings ·
 * 14 self-checks · 27 things compared · 12 did not hold · 15 retries · Horizon
 * check due Mon, Sep 21 · 42m 12s · 3,606 credits ($0.78)*. Every clause true,
 * and the whole a count dump: what was made, what was checked, what shipped
 * and what it is on the hook for all ran together in one grey line, with the
 * bill at the end, so the sentence a person repeats to a colleague ("it
 * shipped, the check said revise, we find out on the 21st") was nowhere.
 *
 * ── FIVE ROWS, IN THE ORDER A RUN EARNS THEM ────────────────────────────
 *   Made       what exists now, one chip per kind, pressable
 *   Checked    the verdict at Build: the change against the spec, by a seat
 *              that did not write it
 *   Shipped    where it went, when, the PR and the commit
 *   On the hook  the forecast recorded at Decide, and the date it is graded
 *   Verdict    Learn's answer, when it has one
 *
 * A row absent from the record is absent from the panel. The bill and the
 * clock are not here: the footer under both panes already carries them.
 *
 * Pure, so the row set can be tested against a stops fixture without a DOM.
 */
import type { StationArtifactView } from "@/lib/spine/track.functions";
import type { Tally } from "@/components/track/run-tally";
import { parseReview, verdictLine, hasVerdict } from "@/components/track/verdict-reading";
import { formatDeadlineDate } from "@/components/track/expiry-deadline";
import { relativeTime } from "@/lib/memory-view";
import type { StatusWord } from "@/components/meridian/StatusChip";

export type ProofChip = { id: string; label: string; mark: string };

export type ProofRow =
  | { kind: "made"; chips: ProofChip[]; pr: { number: number; url: string } | null }
  | {
      kind: "checked";
      artifactId: string;
      status: StatusWord;
      word: string;
      line: string;
    }
  | {
      kind: "shipped";
      artifactId: string;
      status: StatusWord;
      word: string;
      line: string;
      url: string | null;
    }
  | {
      kind: "hook";
      artifactId: string;
      claim: string;
      how: string | null;
      due: string | null;
    }
  | {
      kind: "verdict";
      artifactId: string;
      status: StatusWord;
      word: string;
      line: string | null;
    };

const MARK: Record<string, string> = {
  signal: "○",
  theme: "◎",
  prd: "▤",
  task: "▫",
  decision: "◇",
  prototype: "▧",
  changeset: "▩",
  mission: "▷",
  deployment: "▲",
  learning: "◉",
};

const REVIEW_TONE: Record<string, { status: StatusWord; word: string }> = {
  approve: { status: "pass", word: "Did what the spec said" },
  revise: { status: "hold", word: "Needs revision" },
  reject: { status: "fail", word: "Did not do what the spec said" },
};

const LEARN_TONE: Record<string, { status: StatusWord; word: string }> = {
  held: { status: "pass", word: "Held" },
  confirmed: { status: "pass", word: "Held" },
  missed: { status: "fail", word: "Missed" },
  refuted: { status: "fail", word: "Missed" },
  inconclusive: { status: "hold", word: "Cannot tell" },
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function items(stops: readonly StationArtifactView[], station: string, kind: string) {
  return stops
    .filter((s) => s.station === station)
    .flatMap((s) => s.items)
    .filter((i) => i.kind === kind && !i.missing)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function proofRows(input: {
  stops: readonly StationArtifactView[] | null;
  tally: Tally;
  nowMs: number;
}): ProofRow[] {
  const stops = input.stops ?? [];
  const rows: ProofRow[] = [];

  /* Made: the kinds, hidden when the run is a mission with nothing filed. The
     mission row is the run itself and a chip saying "run" tells nobody anything. */
  const chips: ProofChip[] = input.tally.made
    .filter((m) => m.kind !== "mission")
    .map((m) => ({ id: m.artifactId, label: m.label, mark: MARK[m.kind] ?? "" }));
  const pr = input.tally.pr?.url
    ? { number: input.tally.pr.number, url: input.tally.pr.url }
    : null;
  if (chips.length > 0 || pr) rows.push({ kind: "made", chips, pr });

  /* Checked: the newest changeset's review, when a verdict was actually reached. */
  const changeset = items(stops, "build", "changeset")[0] ?? items(stops, "ship", "changeset")[0];
  if (changeset) {
    const review = parseReview(changeset.fields.code_review);
    if (hasVerdict(review)) {
      const tone = REVIEW_TONE[String(review?.verdict ?? "")] ?? {
        status: "hold" as const,
        word: String(review?.verdict ?? "Checked"),
      };
      rows.push({
        kind: "checked",
        artifactId: changeset.artifactId,
        status: tone.status,
        word: tone.word,
        line: verdictLine(review) ?? "The change was checked against the spec.",
      });
    }
  }

  /* Shipped: the newest deployment that reached a URL or a status. */
  const deployment = items(stops, "ship", "deployment")[0];
  if (deployment) {
    const status = str(deployment.fields.status);
    const env = str(deployment.fields.environment);
    const at = str(deployment.fields.deployed_at);
    const sha = str(deployment.fields.commit_sha);
    const url = str(deployment.fields.deploy_url);
    const live = status === "success" || status === "promoted" || status === "live";
    const failed = status === "failed";
    const parts = [
      env ? `to ${env}` : null,
      at ? relativeTime(at, input.nowMs) : null,
      sha ? `commit ${sha.slice(0, 7)}` : null,
    ].filter((p): p is string => Boolean(p));
    rows.push({
      kind: "shipped",
      artifactId: deployment.artifactId,
      status: failed ? "fail" : live ? "pass" : "hold",
      word: failed ? "Did not go out" : live ? "Live" : (status ?? "Shipping"),
      line: parts.join(" · "),
      url,
    });
  }

  /* On the hook: the decision's forecast, the one thing nothing in the category records. */
  const decision = items(stops, "decide", "decision")[0];
  const claim = decision ? str(decision.fields.forecast_claim) : null;
  if (decision && claim) {
    const horizonRaw = str(decision.fields.forecast_horizon_date);
    const due = formatDeadlineDate(horizonRaw ? Date.parse(horizonRaw) : null);
    rows.push({
      kind: "hook",
      artifactId: decision.artifactId,
      claim,
      how: str(decision.fields.forecast_how_we_will_know),
      due,
    });
  }

  /* Verdict: Learn's answer, from the learning it filed or the decision's own resolution. */
  const learning = items(stops, "learn", "learning")[0];
  const resolution = decision ? str(decision.fields.forecast_resolution) : null;
  const verdictWord = learning ? str(learning.fields.verdict) : resolution;
  if (verdictWord && LEARN_TONE[verdictWord]) {
    const tone = LEARN_TONE[verdictWord];
    rows.push({
      kind: "verdict",
      artifactId: learning?.artifactId ?? (decision as NonNullable<typeof decision>).artifactId,
      status: tone.status,
      word: tone.word,
      line: learning
        ? str(learning.fields.summary)
        : decision
          ? str(decision.fields.forecast_resolution_rationale)
          : null,
    });
  }

  return rows;
}

/**
 * One ranked bet, as a list row.
 *
 * Ported off the retired system (2026-07-29). What changed, and why:
 *
 * KILL the card. A bordered, shadowed, hover-lifting card per bet put a
 *      bordered container inside a region that is already one, and twenty of
 *      them read as twenty subjects with nothing to look at first. The row is
 *      now the `Row` primitive: a divided line, no border, no shadow, no lift.
 * KILL the ICE anchor and the rank badge. A score is the ranking's own input;
 *      it belongs to the one bet in focus, where the sheet carries it. The
 *      rank survives as one token on the second line.
 * KILL the trace chip, the precedent paragraph, the verdict chip, the
 *      confidence chip, the two buttons, the overflow menu and the per-row
 *      Ask. A list row is one line plus a second line carrying DIFFERENT
 *      information; everything else is depth, and depth is one click away in
 *      the detail sheet, which already carries every one of those writes
 *      (draft spec, challenge, lineage, move to, delete, ask).
 * KEEP every prop, every handler name and every exported symbol. Other files
 *      construct this row and import these helpers; the contract is theirs.
 *
 * ATTRIBUTION. The row says who spoke. A bet carrying a Critic verdict wears
 * the Critic's mark and its second line says what the Critic concluded; a bet
 * nobody has reviewed says so, rather than going silent or borrowing a name it
 * was never given. The mark turns while a write on this bet is in flight, so
 * "busy" is a fact about the crew rather than a greyed-out button.
 */

import { memo } from "react";
import { Row } from "@/components/meridian/rows";
import { Num } from "@/components/meridian/surface-parts";

import { AgentMark } from "@/components/meridian/marks";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import type { VerdictWord } from "./format";
import type { Designation } from "./ranking";

/** The agent that red-teams a bet, named from the one catalog so this file
 * never hard-codes a display name the catalog can rename. */
const CHALLENGER = "critic";

export const OPPORTUNITY_STATUSES = [
  "backlog",
  "now",
  "next",
  "later",
  "shipped",
  "dropped",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

/** The six lane statuses, each mapped to a token tone and a sentence-case
 * label. Colour has jobs: the interface is monochrome, so four of the six are
 * neutral ink or a quiet mute, and only the two that carry an OUTCOME reach
 * for a colour - shipped is a pass, dropped is a fail. Shared by the row and
 * the detail sheet so a status reads the same wherever it appears.
 *
 * The four inks moved onto Meridian on 2026-08-18 with the mapping unchanged,
 * because the rule they encode was already the right one: `--sp-ink` is
 * `--mrd-ink`, `--sp-mute` is `--mrd-mute`, and pass and fail are the two
 * status hues this system permits an outcome to take. Nothing gained or lost a
 * colour in the move. */
export const STATUS_META: Record<OpportunityStatus, { color: string; label: string }> = {
  backlog: { color: "var(--mrd-mute)", label: "Backlog" },
  now: { color: "var(--mrd-ink)", label: "Now" },
  next: { color: "var(--mrd-ink)", label: "Next" },
  later: { color: "var(--mrd-mute)", label: "Later" },
  shipped: { color: "var(--mrd-pass)", label: "Shipped" },
  dropped: { color: "var(--mrd-fail)", label: "Dropped" },
};

/** A sentence-case label for a lane status, safe for an unknown value. */
export function statusLabel(status: string): string {
  return STATUS_META[status as OpportunityStatus]?.label ?? status;
}

/** The current lane, as a word. It was a bordered mono pill; a pill inside a
 * row is a card inside a card, and mono is for data rather than for labels.
 * Now it is the label itself, in its own tone. */
export function StatusPill({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as OpportunityStatus] ?? {
    color: "var(--mrd-mute)",
    label: status,
  };
  return (
    <span
      className={className}
      style={{
        fontSize: "12.5px",
        fontWeight: 500,
        color: meta.color,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {meta.label}
    </span>
  );
}

/**
 * The ink for each non-best designation, and it is the SAME ink for all four.
 *
 * ── WHY THE TWO HUES CAME OFF, 2026-08-18 ───────────────────────────────
 * This record used to paint "quick win" `--sp-pass` (green) and "needs
 * validation" `--sp-warn` (amber). A designation is a CATEGORY -- what kind of
 * bet this is -- and neither of those words reports an outcome: nothing has
 * shipped, nothing has failed, and nothing is waiting on a condition. Law 4
 * gives status the hue and identity the shape, and this was identity wearing
 * status, which is the defect that ledger records as found and removed three
 * separate times.
 *
 * It was also actively confusable on the surface that renders it. A queue row
 * carries a red-team ring, a `StatusPill` and this tag on one line, so a green
 * "quick win" three characters from a green "Shipped" reads as a result, and an
 * amber "needs validation" reads as the Critic asking for a revision. Two of
 * the four designations were quietly answering a question they do not know the
 * answer to.
 *
 * ── WHY NOT `--mrd-viz-1..4`, WHICH IS THE OTHER PERMITTED ANSWER ───────
 * The viz ramp is orange, blue, green, red. Painting four inline words with it
 * puts a green and a red back on the same line as pass and fail, so the
 * categorical encoding would be read as status again by anyone who did not
 * memorise the ramp. Viz earns its keep where a legend or an axis says what a
 * series is; a four-word vocabulary on a dense row does not have one. So the
 * category is carried by the WORD, which names itself, and the record survives
 * as the one place that decision is written down rather than repeated inline.
 *
 * KEPT AS A RECORD rather than deleted: `opportunity-row.test.tsx` asserts an
 * entry per designation, and a future encoding (a leading mark, not a tinted
 * word) belongs here rather than in four call sites.
 */
export const DESIGNATION_INK: Record<Exclude<NonNullable<Designation>, "best bet">, string> = {
  "needs validation": "var(--mrd-mute)",
  "quick win": "var(--mrd-mute)",
  "heavy lift": "var(--mrd-mute)",
  "watch this week": "var(--mrd-mute)",
};

/** The one-line meaning behind each non-best designation, so hovering the tag
 * tells a human or an agent what to do about the bet. */
export const DESIGNATION_MEANING: Record<Exclude<NonNullable<Designation>, "best bet">, string> = {
  "needs validation": "High appeal, thin evidence. Let the Critic weigh in before you commit.",
  "quick win": "Low effort for real impact. A fast, safe ship.",
  "heavy lift": "Large effort for the expected return. Consider slicing it smaller.",
  "watch this week": "Gaining evidence, not yet the top bet. Keep it in view.",
};

/** A quiet system designation for a non-best bet: the word itself, in its own
 * tone. The pill and its hairline are gone for the same reason the status
 * pill's are. `null` and "best bet" render nothing here. */
export function DesignationTag({
  designation,
  className,
}: {
  designation?: Designation;
  className?: string;
}) {
  if (!designation || designation === "best bet") return null;
  return (
    <span
      className={className}
      title={DESIGNATION_MEANING[designation]}
      style={{
        fontSize: "12.5px",
        fontWeight: 500,
        color: DESIGNATION_INK[designation],
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {designation}
    </span>
  );
}

/**
 * The one chosen thing. ranking.ts guarantees exactly one best bet in the
 * queue, so this is the single marked row in a monochrome list.
 *
 * ── ORCHID CAME OFF, 2026-08-18, AND IT WAS GENUINELY WRONG ─────────────
 * This wore `--sp-gate`, the orchid the whole system spends on ONE meaning: a
 * person is required, and a control is standing by that releases the thing.
 * "Best bet" is not that. It is the comparator's own arithmetic reporting
 * which row came first, on every render, whether or not anybody is waiting on
 * anything -- and it sits on a station whose Gate already spends orchid on the
 * question that IS asking for a person. Two orchids on one screen, one of them
 * attached to no control, is how the accent stops meaning anything.
 *
 * ── WHAT CARRIES IT INSTEAD ─────────────────────────────────────────────
 * Structure, which is what Law 4 asks for. Every other word on a queue row's
 * second line is `--mrd-mute` at 500; this one is full-contrast `--mrd-ink` at
 * 600. In a line that is otherwise entirely quiet, one word at full ink is the
 * loudest thing available without spending a hue, it survives greyscale exactly
 * as the red-team ring does, and it cannot be mistaken for a status because no
 * status in this system is neutral ink.
 *
 * The inline styles stay inline: `opportunity-row.test.tsx` reads
 * `span.style.flexShrink` and `span.style.whiteSpace` directly, and those two
 * are the reason this never wraps or gets squeezed inside a `Row`'s sub line.
 */
export function BestBetStamp({ className }: { className?: string }) {
  return (
    <span
      className={className}
      title="The single strongest bet in the queue right now"
      style={{
        fontSize: "12.5px",
        fontWeight: 600,
        color: "var(--mrd-ink)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      Best bet
    </span>
  );
}

/** Plain-words relative time. Mono is applied by the row's time slot. */
function ago(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export interface OpportunityRowProps {
  /** The ICE score. Read by the detail sheet, which is where a score belongs;
   * the row shows the rank the score produced, not the score. */
  ice: number;
  title: string;
  /** The caller's joined provenance line. The row's own second line is
   * assembled from the typed props instead, so it can never run on. */
  sub: string;
  verdict: VerdictWord;
  /** The system-derived bet designation (from ranking.ts). "best bet" renders
   * the one ember mark on the queue; the others render a quiet word; null
   * renders nothing. */
  designation?: Designation;
  /** Opens the Critic on this bet. Rendered by the detail sheet. */
  onChallenge: () => void;
  challengePending: boolean;
  /** OBS-10 write actions. Every one of them is rendered by the detail sheet,
   * which this row opens: a list row does not carry six controls. */
  onDraftSpec?: () => void;
  /** The spec draft is in flight for this row. */
  draftPending?: boolean;
  onLineage?: () => void;
  onDelete?: () => void;
  onSetStatus?: (status: OpportunityStatus) => void;
  /** A write on this bet is in flight: its mark turns until it settles. */
  actionsPending?: boolean;
  /** Click-to-open: the row is a button when this is passed, so Enter and
   * Space work without a hand-rolled key handler. */
  onOpen?: () => void;
  /** The current lane status, the tail of the second line. */
  status?: string;
  /** The real opportunity id. The trace chip it used to draw lives in the
   * detail sheet, where the full lineage is one click deeper. */
  id?: string;
  /** Last-change timestamp, shown as the row's time. */
  updatedAt?: string;
  /** The 1-based deterministic queue position (from ranking.ts). */
  rank?: number;
  /** PC-16: Supaprod's citation of the account's recorded precedent for this
   * bet. It is the record speaking, so it renders in the detail sheet's own
   * recess rather than as a second paragraph on a list row. */
  precedentNote?: string | null;
  /** RPT-08: the Critic's disclosed confidence (0-1), folded into the second
   * line's sentence rather than carried by a separate chip. Absent (not zero)
   * while PENDING, so the row never fabricates a number. */
  criticConfidence?: number | null;
}

/**
 * One ICE-ranked opportunity. The whole row is one `Row`: the mark says who
 * reviewed it, the lead is the title, the second line carries what the title
 * does not (the designation, the queue position, what the Critic concluded and
 * at what confidence, the lane), and the time is when it last moved. Nothing
 * wraps; clicking it opens the full record.
 *
 * Memoized: OpportunityQueue renders one per opportunity in the ranked queue.
 */
export const OpportunityRow = memo(function OpportunityRow({
  title,
  verdict,
  designation,
  actionsPending = false,
  onOpen,
  status,
  updatedAt,
  rank,
  criticConfidence,
}: OpportunityRowProps) {
  const reviewed = verdict !== "PENDING";
  const challengerName = agentDisplayName(CHALLENGER);
  return (
    <Row
      tight
      marks={
        <AgentMark
          slug={reviewed ? CHALLENGER : null}
          state={actionsPending ? "running" : reviewed ? "idle" : "quiet"}
          title={reviewed ? undefined : "Unattributed: nobody has reviewed this bet"}
        />
      }
      lead={title}
      sub={
        <>
          {designation === "best bet" ? (
            <>
              <BestBetStamp />
              {" · "}
            </>
          ) : null}
          {designation && designation !== "best bet" ? (
            <>
              <DesignationTag designation={designation} />
              {" · "}
            </>
          ) : null}
          {rank != null ? (
            <>
              <Num>#{rank}</Num>
              {" · "}
            </>
          ) : null}
          {reviewed ? (
            <>
              {challengerName} says {verdict.toLowerCase()}
              {criticConfidence != null ? (
                <>
                  {" at "}
                  <Num>{Math.round(criticConfidence * 100)}%</Num>
                </>
              ) : null}
            </>
          ) : (
            "not reviewed yet"
          )}
          {status ? (
            <>
              {" · "}
              <StatusPill status={status} />
            </>
          ) : null}
        </>
      }
      time={ago(updatedAt)}
      onClick={onOpen}
    />
  );
});

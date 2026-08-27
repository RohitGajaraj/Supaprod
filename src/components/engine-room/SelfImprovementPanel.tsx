// RPT-50 surface: makes the self-improvement engine VISIBLE in the Engine Room.
//
// Reads the shipped `getSelfImprovementProposals` server fn (Supaprod-on-Supaprod:
// its OWN failing eval suites, over-corrected agents, and losing playbooks) and
// renders the deterministic proposals it returns, already sorted high-severity
// first. Nothing here guesses or calls the AI chokepoint; every line traces to a
// real number over a real sample, and the caption says so plainly.
//
// ─────────────────────────────────────────────────────────────────────────
// 2026-08-15: PORTED TO MERIDIAN, and one real defect went with it.
//
// THE SELECTED MODE WAS DRAWN AS A HOVER. The three-segment mode control filled
// the chosen segment with `var(--mrd-lift)`, which is the ground a row takes when
// a pointer is merely passing over it. On a dark canvas that is a whisper: the
// panel could not tell you whether the engine was on Auto or Off from across a
// desk, on the one control that decides whether the product spends money on its
// own. Meridian has a token for exactly this and it is not the hover one —
// `--mrd-select` is 17% and deliberately unmistakable, because everything the
// next control does happens to whatever is selected. `--mrd-hover` is 4.5% and
// deliberately almost imperceptible. Using one for the other is a recurring bug
// in this codebase and this was a live instance of it.
//
// THE OTHER TWO CHANGES ARE NOT A RE-SKIN EITHER:
//
//   THE ELAPSED PULSE IS `LoadingState` NOW. This file had its own: a dot, a
//   mono label and a hand-rolled `setInterval` counting whole seconds. Meridian
//   ships that exact idea, ticking in tenths so it visibly moves, with the
//   label shimmering rather than pulsing (a pulse changes the whole label's
//   brightness and pulls the eye off the content beside it) and with the figure
//   in tabular mono so it does not jitter sideways. It also takes `startedAt`,
//   which the local one could not: reopening this panel on a call that has been
//   running for four minutes restarted the count at zero, which reported the
//   age of the component rather than the age of the work.
//
//   THE KIND AND EVIDENCE CHIPS ARE `RecordTag`. Same idea, one implementation:
//   a categorical chip is deliberately colourless, because a kind is not a
//   status and spending an accent on it makes the real status unreadable.

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert, Circle, Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { LoadingState } from "@/components/meridian/LoadingState";
import { RecordTag } from "@/components/meridian/RecordsTable";
import {
  getSelfImprovementProposals,
  enrichSelfImproveProposal,
  applySelfImproveFix,
  getSelfImproveSettings,
  setSelfImproveMode,
} from "@/lib/self-improve.functions";
import type { ProposalSeverity } from "@/lib/self-improve";
import { SELF_IMPROVE_MODES, type SelfImproveMode } from "@/lib/self-improve-governance";
import { PanelPending, ErrorRetry } from "./room-parts";
import { Eyebrow } from "@/components/meridian/surface-parts";

/**
 * Severity, and the one hue here is an OUTCOME rather than an alarm.
 *
 * A high flag is fired by a suite that is failing, an agent that has been
 * over-corrected, a playbook that is losing: each of those is a thing that did
 * not work, which is the only meaning red carries in this system. Medium and
 * low take no hue at all, because a middling signal is not an outcome that has
 * gone either way and amber would be actively wrong — amber means stopped and
 * NOT on you, and nothing here is stopped.
 *
 * The word rides beside the icon so the flag never reads by colour alone, and
 * the icon differs by shape so it survives greyscale twice over.
 */
const SEVERITY_META: Record<
  ProposalSeverity,
  { word: string; ink: string; Icon: typeof TriangleAlert }
> = {
  high: { word: "High", ink: "text-mrd-fail", Icon: TriangleAlert },
  medium: { word: "Medium", ink: "text-mrd-mute", Icon: Circle },
  low: { word: "Low", ink: "text-mrd-faint", Icon: Circle },
};

/**
 * RPT-50 AI rung (the LAYER over a flag): an on-demand, grounded "why + suggested
 * fix". The deterministic flag above decides the problem; this only explains one the
 * numbers already earned, grounded in the real records, clearly marked AI-composed.
 * Human-triggered so the AI call runs at most once per flag (cost-controlled).
 */
function ProposalEnricher({
  workspaceId,
  kind,
  subjectRef,
}: {
  workspaceId: string;
  kind: "eval" | "agent" | "playbook";
  subjectRef: string;
}) {
  const fEnrich = useServerFn(enrichSelfImproveProposal);
  const enrich = useMutation({
    mutationFn: () => fEnrich({ data: { workspaceId, kind, subjectRef } }),
  });
  const fApply = useServerFn(applySelfImproveFix);
  const apply = useMutation({
    mutationFn: () => fApply({ data: { workspaceId, kind, subjectRef } }),
  });
  const applied = apply.data?.applied ?? false;
  const data = enrich.data;

  if (!data) {
    if (enrich.isPending) {
      /* ONE TRUE LABEL, and this is the rule the file was written around.
       *
       * An earlier version cycled three invented steps on a timer with no
       * server event behind any of them, so "Recording it" appeared while
       * nothing had been recorded and then un-appeared as the modulo wrapped.
       * The whole claim of this product is that you can see what the agents are
       * actually doing; a fabricated step cycle is the exact screenshot a
       * skeptical reviewer needs to argue the opposite.
       *
       * The founder's rule still holds — never a grayed-out dead label, because
       * a still surface reads as a stalled one — so the motion stays and the
       * narration is replaced by the one thing here that is measurably true:
       * how long this has actually been going. */
      return (
        <div className="mt-mrd-4">
          <LoadingState label="Reading the records" />
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => enrich.mutate()}
        data-mrd=""
        className="mt-mrd-4 inline-flex items-center gap-mrd-3 rounded-mrd-ctl text-mrd-label text-mrd-mute transition-colors hover:text-mrd-ink"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        <Sparkles size={14} aria-hidden="true" />
        Explain and suggest a fix
      </button>
    );
  }

  return (
    /* A recess, not a second card. The standard caps a region at one bordered
       container, and this reads as part of the flag above it by sitting below
       the ground rather than on top of it. */
    <div className="mt-mrd-4 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
      <Eyebrow>Why this is happening</Eyebrow>
      <p className="mt-mrd-2 leading-mrd-prose text-mrd-prose text-mrd-body">{data.explanation}</p>
      {data.suggested_fix ? (
        <>
          <div className="mt-mrd-4">
            <Eyebrow>Suggested fix</Eyebrow>
          </div>
          <p className="mt-mrd-2 leading-mrd-prose text-mrd-prose text-mrd-body">
            {data.suggested_fix}
          </p>
        </>
      ) : null}

      {/* Transparency: this half IS AI-composed (unlike the flag), and it says
          how many real records it was grounded on. The count is mono because it
          is a count; the sentence around it is not. */}
      <p className="mt-mrd-4 text-mrd-data text-mrd-faint">
        AI-composed ·{" "}
        {data.grounded_on > 0 ? (
          <>
            grounded in <span className="font-mrd-mono tabular-nums">{data.grounded_on}</span>{" "}
            records
          </>
        ) : (
          "not enough records"
        )}
      </p>

      {/* RPT-50 rung 3 (increment 1): APPLY closes the loop. The fix becomes a
          governed, injection-screened, reversible house rule (live in every
          agent's prompt) and a recorded decision. Human-triggered here; the
          hands-off auto-apply mode is the control further up this panel. */}
      {data.suggested_fix ? (
        <div className="mt-mrd-4 border-t border-mrd-line-soft pt-mrd-4">
          {applied ? (
            <p className="text-mrd-label leading-mrd-prose text-mrd-pass">
              {/* The claim is narrowed to what applyFixCore GUARANTEES. Its own
                  comment calls the decision stamp best-effort, and a supabase
                  insert returns its error instead of throwing, so an ordinary
                  DB failure is swallowed with no signal here. The house rule IS
                  guaranteed — a failed insert returns applied:false, so this
                  branch only renders once the rule exists — and supersession
                  makes it reversible. Those two are what the sentence claims.
                  Green is correct: it reports an outcome that happened. */}
              Applied. Your agents now follow this as a house rule, and it is reversible.
            </p>
          ) : (
            <>
              {apply.isPending ? (
                <LoadingState label="Applying the fix" />
              ) : (
                <button
                  type="button"
                  onClick={() => apply.mutate()}
                  /* THE NEUTRAL PRIMARY, NOT THE ACCENT. Meridian spends
                     `--mrd-you` on a control that UNBLOCKS something waiting on
                     a person; nothing is blocked here, the fix is offered. The
                     sheen is what makes a filled control read as a raised
                     object rather than a coloured rectangle, and the label is
                     `--mrd-on-solid` because that is the only token that stays
                     light on the dark face in BOTH grounds. */
                  className="inline-flex h-8 items-center rounded-mrd-ctl bg-mrd-solid px-3 text-mrd-label font-medium text-mrd-on-solid transition-colors hover:bg-mrd-solid-hover"
                  style={{
                    boxShadow: "inset 0 1px 0 var(--mrd-sheen)",
                    transitionDuration: "var(--mrd-d-press)",
                  }}
                >
                  Apply this fix
                </button>
              )}
              {apply.data && !apply.data.applied && apply.data.reason ? (
                <p className="mt-mrd-3 text-mrd-small leading-mrd-snug text-mrd-mute">
                  {apply.data.reason}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * RPT-50 increment 2: the spend and autonomy control. The founder's requirement:
 * give the owner an explicit choice with the trade-offs shown, and nudge if the
 * engine is left off so long it dies. Three modes, each with its outcome AND its
 * con stated plainly (no dark pattern nudging toward the expensive one).
 */
const MODE_COPY: Record<SelfImproveMode, { label: string; outcome: string; con: string }> = {
  auto: {
    label: "Auto",
    outcome:
      "Supaprod enriches and applies fixes on its own, as flags fire. You only step in for the exceptions.",
    // Same narrowing as the Applied line above: screening and reversibility are
    // guaranteed by applyFixCore, the decision stamp is best-effort, so only the
    // first two are claimed.
    con: "Highest AI spend, and changes land before you look (each one is screened and reversible).",
  },
  scheduled: {
    label: "Scheduled",
    outcome:
      "On a regular pass, Supaprod explains open flags and readies a fix for your one-tap Apply.",
    con: "Bounded AI spend, but not real-time, and you still click Apply.",
  },
  off: {
    label: "Off",
    outcome: "Nothing runs on its own. You click Explain and Apply yourself.",
    con: "Zero AI spend, but the engine stops learning. Left off too long it goes stale, so we nudge you.",
  },
};

function SelfImproveModeControl({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const fGet = useServerFn(getSelfImproveSettings);
  const settings = useQuery({
    queryKey: ["self-improve-settings", workspaceId],
    queryFn: () => fGet({ data: { workspaceId } }),
  });
  const fSet = useServerFn(setSelfImproveMode);
  const setMode = useMutation({
    mutationFn: (mode: SelfImproveMode) => fSet({ data: { workspaceId, mode } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["self-improve-settings", workspaceId] }),
  });

  if (settings.isLoading || !settings.data) return null;

  // Optimistic: reflect the mode being switched to while the write is in flight.
  const current = setMode.isPending && setMode.variables ? setMode.variables : settings.data.mode;
  const copy = MODE_COPY[current];
  const nudge = settings.data.staleness;

  return (
    <div
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-5"
    >
      {nudge.stale && nudge.message ? (
        /* ORCHID, AND IT IS THE ONE PLACE ON THIS PANEL THAT EARNS IT. The
           engine has been off long enough to go stale, and the thing it is
           waiting for is a person: the control that fixes it is four inches
           below and touching it moves the thing. That is the whole definition
           of `--mrd-you`. A rule and text rather than a fill, because a filled
           accent block is a hero and this is a standing advisory. */
        <p className="mb-mrd-5 border-l-2 border-mrd-you pl-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body">
          {nudge.message}
        </p>
      ) : null}

      <div className="flex items-baseline justify-between gap-mrd-4">
        <Eyebrow>How it runs</Eyebrow>
        {settings.data.open_flag_count > 0 ? (
          <span className="font-mrd-mono shrink-0 text-mrd-data text-mrd-mute tabular-nums">
            {settings.data.open_flag_count} open
          </span>
        ) : null}
      </div>

      <div
        data-mrd=""
        role="radiogroup"
        aria-label="Self-improvement mode"
        /* `overflow-hidden` clips the segments to the group's radius, which is
           why every segment inside carries `mrd-focus-inset`: an outset ring
           here would be sheared off by this element and read as a broken
           half-drawn edge rather than as focus. */
        className="mt-mrd-4 inline-flex overflow-hidden rounded-mrd-ctl border border-mrd-edge"
      >
        {SELF_IMPROVE_MODES.map((m, idx) => {
          const selected = m === current;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={setMode.isPending}
              onClick={() => {
                if (m !== settings.data!.mode) setMode.mutate(m);
              }}
              /* A CHOSEN SEGMENT IS A SELECTION, AND `--mrd-select` IS THE STOP
                 FOR ONE. This used to fill with the hover ground, which is 4.5%
                 and designed to be barely perceptible under a pointer; a
                 selection is the opposite, because everything this panel does
                 next happens under whichever mode is lit. It also used to fill
                 ember, which put the product's accent on screen permanently for
                 whichever mode happened to be current, on a panel nobody is
                 being asked to touch. Ground and full-strength ink say "this
                 one" without spending the accent, and it survives greyscale. */
              className={`mrd-focus-inset px-4 py-1.5 text-mrd-label transition-colors disabled:cursor-wait ${
                idx === 0 ? "" : "border-l border-mrd-edge"
              } ${
                selected
                  ? "bg-mrd-select font-medium text-mrd-ink"
                  : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-ink text-mrd-body"
              }`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {MODE_COPY[m].label}
            </button>
          );
        })}
      </div>

      <p className="mt-mrd-4 max-w-[68ch] leading-mrd-prose text-mrd-prose text-mrd-body">
        {copy.outcome}
      </p>
      <p className="mt-mrd-2 max-w-[68ch] text-mrd-small leading-mrd-prose text-mrd-mute">
        Trade-off: {copy.con}
      </p>
    </div>
  );
}

export function SelfImprovementPanel({ workspaceId }: { workspaceId?: string } = {}) {
  const { activeWorkspace } = useWorkspace();
  const wsId = workspaceId ?? activeWorkspace?.id;
  const fProposals = useServerFn(getSelfImprovementProposals);
  const query = useQuery({
    queryKey: ["self-improve", wsId],
    queryFn: () => fProposals({ data: { workspaceId: wsId as string } }),
    enabled: !!wsId,
  });

  if (!wsId || query.isLoading) {
    return <PanelPending />;
  }
  if (query.isError) {
    return (
      <ErrorRetry
        message={`Self-improvement signals did not load. ${query.error instanceof Error ? query.error.message : "The read failed."}`}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const proposals = query.data?.proposals ?? [];

  return (
    <div data-mrd="" className="flex flex-col gap-mrd-5">
      <div>
        <Eyebrow>What Supaprod would improve about itself</Eyebrow>
        {/* The honesty caption, plain-spoken: these are rule-fired flags, not AI
            guesses. It stays true whether the list is full or empty. */}
        <p className="mt-mrd-3 max-w-[74ch] text-mrd-label leading-mrd-prose text-mrd-mute">
          Deterministic flags from Supaprod&rsquo;s own quality signals: failing eval suites,
          over-corrected agents, and losing playbooks. Each one fired on a real number over a real
          sample. Nothing here is an AI guess.
        </p>
      </div>

      {wsId ? <SelfImproveModeControl workspaceId={wsId} /> : null}

      {proposals.length === 0 ? (
        <div className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 leading-mrd-prose text-mrd-prose text-mrd-body">
          No quality issues flagged. Signals are healthy or still gathering data.
        </div>
      ) : (
        <div className="flex flex-col gap-mrd-4">
          {proposals.map((p) => {
            const meta = SEVERITY_META[p.severity];
            const { Icon } = meta;
            return (
              <article
                key={p.id}
                className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4"
              >
                <div className="flex items-start gap-mrd-4">
                  <Icon size={15} aria-hidden="true" className={`mt-0.5 shrink-0 ${meta.ink}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-mrd-4">
                      <h3 className="text-mrd-base font-medium text-mrd-ink">{p.title}</h3>
                      <span className={`shrink-0 text-mrd-data ${meta.ink}`}>{meta.word}</span>
                    </div>
                    <p className="mt-mrd-3 text-mrd-label leading-mrd-prose text-mrd-mute">
                      {p.detail}
                    </p>
                    <div className="mt-mrd-3 flex flex-wrap items-center gap-mrd-3">
                      <RecordTag label={p.kind} />
                      <RecordTag label={p.evidence} />
                    </div>
                    {wsId && p.subject_ref ? (
                      <ProposalEnricher
                        workspaceId={wsId}
                        kind={p.kind}
                        subjectRef={p.subject_ref}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

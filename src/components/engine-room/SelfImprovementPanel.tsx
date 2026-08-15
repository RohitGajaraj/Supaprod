// RPT-50 surface: makes the self-improvement engine VISIBLE in the Engine Room.
//
// Reads the shipped `getSelfImprovementProposals` server fn (Supaprod-on-Supaprod:
// its OWN failing eval suites, over-corrected agents, and losing playbooks) and
// renders the deterministic proposals it returns, already sorted high-severity
// first. Nothing here guesses or calls the AI chokepoint; every line traces to a
// real number over a real sample, and the caption says so plainly.
//
// Idiom: matches the sibling Quality-room panels (rounded-lg card on a hairline
// border, MonoLabel eyebrows, PanelPending on load, ErrorRetry on failure) and
// stays inside the existing destructive/muted tokens. High wears the destructive
// madder; medium and low stay on the muted grays. The severity word rides beside
// the icon so state is never color-only (the RoomCard grayscale rule).
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert, Circle, Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { MonoLabel, type MonoLabelTone } from "@/components/obsidian";
import { StepDot } from "@/components/supaprod/Primitives";
import {
  getSelfImprovementProposals,
  enrichSelfImproveProposal,
  applySelfImproveFix,
  getSelfImproveSettings,
  setSelfImproveMode,
} from "@/lib/self-improve.functions";
import type { ProposalSeverity } from "@/lib/self-improve";
import { SELF_IMPROVE_MODES, type SelfImproveMode } from "@/lib/self-improve-governance";
import { PanelPending, ErrorRetry } from "./RoomDetail";

/** Severity presentation, held to the destructive/muted palette (no loud hues):
 * high = the destructive madder + a warning triangle; medium/low = muted grays +
 * a plain circle. The word is shown too, so the flag never reads by color alone. */
const SEVERITY_META: Record<
  ProposalSeverity,
  { word: string; color: string; tone: MonoLabelTone; Icon: typeof TriangleAlert }
> = {
  high: { word: "HIGH", color: "var(--madder-bright)", tone: "madder", Icon: TriangleAlert },
  medium: { word: "MEDIUM", color: "var(--text-muted)", tone: "muted", Icon: Circle },
  low: { word: "LOW", color: "var(--text-faint)", tone: "faint", Icon: Circle },
};

function MonoChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="tabular-nums"
      style={{
        fontFamily: "var(--font-mono)",
        color: "var(--text-muted)",
        border: "1px solid var(--hairline)",
        borderRadius: 6,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/**
 * RPT-50: a LIVE, pulsing status line for the async AI steps (Explain / Apply).
 * Rule (founder): never a grayed-out dead label. While work runs in the background,
 * this cycles through the REAL steps it's doing (reading records -> composing;
 * screening -> writing the rule -> recording) beside a pulsing ember dot, so the
 * user always sees motion + what's happening and never assumes it stalled.
 */
function ActivePulse({ label }: { label: string }) {
  /* THIS USED TO INVENT THE AGENT'S STEPS, and on this product that is the one
   * unaffordable defect.
   *
   * It took a list of strings and cycled them on a 1500ms setInterval with NO
   * server event behind any of them. So "Recording it on the Trust Ledger"
   * appeared while nothing had been recorded, and then un-appeared as the
   * modulo wrapped back to the first message. The whole claim of this product
   * is that you can see what the agents are actually doing; a fabricated step
   * cycle is the exact screenshot a skeptical reviewer needs to argue the
   * opposite, and it would be a fair argument.
   *
   * It also wore `StepDot status="gate"`, which is the system's single reserved
   * blink. That blink belongs to the one thing actually asking a human for
   * something. A background task is not asking, so it takes `running`.
   *
   * THE FOUNDER'S RULE STILL HOLDS: never a grayed-out dead label, because a
   * still surface reads as a stalled one. So this is not simply deleted. It
   * keeps the motion and replaces the invented narration with the one thing
   * here that is measurably true: how long this has actually been going. An
   * honest elapsed second-count is better proof of life than a script, because
   * it cannot be right when the work is wrong. */
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--geist-space-2x)",
        marginTop: 12,
      }}
    >
      <StepDot status="running" />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {label}
        {seconds > 1 ? ` · ${seconds}s` : ""}
      </span>
    </span>
  );
}

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
      // One true label. The old three-step script claimed a sequence this call
      // does not report back, so it named work that may not have happened in
      // that order, or at all.
      return <ActivePulse label="Reading the records" />;
    }
    return (
      <button
        type="button"
        onClick={() => enrich.mutate()}
        className="loom-press outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <Sparkles size={16} aria-hidden="true" />
        Explain + suggest a fix
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-control)",
        background: "var(--surface-recessed)",
        border: "1px solid var(--hairline)",
      }}
    >
      <MonoLabel style={{ display: "block", marginBottom: 5 }}>Why this is happening</MonoLabel>
      <p style={{ color: "var(--text-body)", margin: 0, lineHeight: 1.55 }}>{data.explanation}</p>
      {data.suggested_fix ? (
        <>
          <MonoLabel style={{ display: "block", margin: "10px 0 5px" }}>Suggested fix</MonoLabel>
          <p style={{ color: "var(--text-body)", margin: 0, lineHeight: 1.55 }}>
            {data.suggested_fix}
          </p>
        </>
      ) : null}
      {/* Transparency: this half IS AI-composed (unlike the flag), and it says how many
          real records it was grounded on. */}
      <span
        style={{
          display: "inline-block",
          marginTop: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
        }}
      >
        AI-composed ·{" "}
        {data.grounded_on > 0 ? `grounded in ${data.grounded_on} records` : "not enough records"}
      </span>

      {/* RPT-50 rung 3 (increment 1): APPLY closes the loop. The fix becomes a
          governed, injection-screened, reversible house rule (live in every agent's
          prompt) + a receipted decision on the ledger. Human-triggered here (the
          Apply click is the action); the unattended auto-apply mode is the Routine
          toggle increment. */}
      {data.suggested_fix ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
          {applied ? (
            <p style={{ color: "var(--moss-bright)", margin: 0, lineHeight: 1.5 }}>
              {/* The ledger clause is gone rather than reworded. applyFixCore
                  (self-improve.functions.ts step 2) inserts the decision inside
                  a try/catch whose own comment calls it a "best-effort ledger
                  stamp", and a supabase insert returns its error instead of
                  throwing, so an ordinary DB failure is swallowed with no
                  signal here. The house rule IS guaranteed — a failed insert
                  returns applied:false, so this branch only renders once the
                  rule exists — and supersession makes it reversible. Those two
                  are what the sentence now claims. */}
              Applied. Your agents now follow this as a house rule, and it is reversible.
            </p>
          ) : (
            <>
              {apply.isPending ? (
                <ActivePulse label="Applying the fix" />
              ) : (
                <button
                  type="button"
                  onClick={() => apply.mutate()}
                  className="loom-press outline-none transition-colors hover:[color:var(--text-primary)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-body)",
                    background: "transparent",
                    border: "1px solid var(--hairline-strong)",
                    borderRadius: "var(--radius-control)",
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  Apply this fix
                </button>
              )}
              {apply.data && !apply.data.applied && apply.data.reason ? (
                <p style={{ color: "var(--text-subtle)", margin: "6px 0 0" }}>
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
 * RPT-50 increment 2: the spend + autonomy control. The founder's requirement --
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
    // guaranteed by applyFixCore, the ledger stamp is best-effort, so only the
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
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
      }}
    >
      {nudge.stale && nudge.message ? (
        <div
          style={{
            marginBottom: 12,
            padding: "9px 11px",
            borderRadius: "var(--radius-control)",
            background: "var(--ember-wash, var(--surface-recessed))",
            border: "1px solid var(--ember-line, var(--hairline-strong))",
            lineHeight: 1.5,
            color: "var(--ember-text)",
          }}
        >
          {nudge.message}
        </div>
      ) : null}

      <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
        <MonoLabel>How it runs</MonoLabel>
        {settings.data.open_flag_count > 0 ? (
          <MonoLabel tone="muted" style={{ flexShrink: 0 }}>
            {settings.data.open_flag_count} open
          </MonoLabel>
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label="Self-improvement mode"
        style={{
          display: "inline-flex",
          marginTop: 10,
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--radius-control)",
          overflow: "hidden",
        }}
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
              className="loom-press outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "6px 14px",
                borderLeft: idx === 0 ? "none" : "1px solid var(--hairline-strong)",
                /* A chosen segment is a SELECTION, not a call to act. It used to
                   fill ember, which put the accent on screen for whichever mode
                   happened to be current — permanently, on a panel nobody is
                   being asked to touch. A raised ground and full-strength text
                   say "this one" without spending the accent. */
                background: selected ? "var(--raised)" : "transparent",
                color: selected ? "var(--text-primary)" : "var(--text-subtle)",
                cursor: setMode.isPending ? "wait" : "pointer",
              }}
            >
              {MODE_COPY[m].label}
            </button>
          );
        })}
      </div>

      <p style={{ color: "var(--text-body)", margin: "12px 0 0", lineHeight: 1.55 }}>
        {copy.outcome}
      </p>
      <p style={{ color: "var(--text-subtle)", margin: "5px 0 0", lineHeight: 1.5 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <MonoLabel style={{ display: "block", marginBottom: 8 }}>
          What Supaprod would improve about itself
        </MonoLabel>
        {/* The honesty caption, plain-spoken: these are rule-fired flags, not AI
            guesses. It stays true whether the list is full or empty. */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Deterministic flags from Supaprod's own quality signals: failing eval suites,
          over-corrected agents, and losing playbooks. Each one fired on a real number over a real
          sample. Nothing here is an AI guess.
        </p>
      </div>

      {wsId ? <SelfImproveModeControl workspaceId={wsId} /> : null}

      {proposals.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "22px 20px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              color: "var(--text-subtle)",
              margin: 0,
            }}
          >
            No quality issues flagged. Signals are healthy or still gathering data.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {proposals.map((p) => {
            const meta = SEVERITY_META[p.severity];
            const { Icon } = meta;
            return (
              <article
                key={p.id}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px 18px",
                }}
              >
                <div className="flex items-start" style={{ gap: 12 }}>
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: meta.color, flexShrink: 0, marginTop: 2 }}
                  />
                  <div className="min-w-0" style={{ flex: 1 }}>
                    <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: 0,
                        }}
                      >
                        {p.title}
                      </h3>
                      <MonoLabel tone={meta.tone} style={{ flexShrink: 0 }}>
                        {meta.word}
                      </MonoLabel>
                    </div>
                    <p
                      style={{
                        color: "var(--text-subtle)",
                        marginTop: 8,
                        lineHeight: 1.55,
                      }}
                    >
                      {p.detail}
                    </p>
                    <div
                      className="flex items-center"
                      style={{ gap: "var(--geist-space-2x)", marginTop: 10, flexWrap: "wrap" }}
                    >
                      <MonoChip>{p.kind}</MonoChip>
                      <MonoChip>{p.evidence}</MonoChip>
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

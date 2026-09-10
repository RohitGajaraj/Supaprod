// RPT-47: the guided Strategic Brief formation flow.
//
// JNY-02 gave the brief structured, versioned storage (brief_items), watched
// assumptions, and chokepoint injection, but the only way to WRITE it was three
// copies of the same quiet edit-in-place form (Today's StrategicBriefCard, Brain's
// BriefPanel, the Settings free-text). This is the missing guided experience: a
// stepped walkthrough (vision -> ICP -> positioning -> top bets -> review) that
// prompts the operator through each strategic call, in sequence, with the reason
// each one matters, then shows the assembled brief.
//
// It reuses the SAME machinery, so it is honest and additive: every step writes
// through upsertBriefItem (versioning + singleton supersession + automatic
// watched-assumption extraction), and shares the ["brief-items"] query cache so
// the underlying cards update the moment the flow writes. No new storage, no new
// injection: an approved call reaches every agent's system prompt exactly as
// before (renderBriefItemsBlock in loop.server.ts).
//
// THE COLOUR LAYER IS MERIDIAN, ported 2026-08-22. The header used to end "Dark
// Tempo overlay", which is a retired system naming itself. 19 occurrences of the
// retired vocabulary are gone and the file carries none. There were no status
// colours in it at all, so the port is the neutral ramp and the edges: ink,
// mute, faint and edge.
//
// The one call that was not a table lookup is the overlay itself. It was
// `color-mix(in oklab, var(--mrd-sheet) 78%, black)`, which is opaque, and on the
// paper ground that composited to a flat mid grey that hid the page completely
// rather than dimming it. `--mrd-scrim` is the token Meridian built for this
// and it is measured in both grounds, so the dialog now dims what is behind it
// instead of deleting it.
//
// THE CONTROLS SPEAK MERIDIAN'S TIERS, 2026-08-23. Every Button here came from
// the Obsidian barrel `@/components/obsidian`, which the ratchet cannot see: its
// pattern matches a path with a segment AFTER /obsidian/, so a barrel import
// scores zero and eleven retired controls rendered as clean. Said out loud in
// the previous header revision and now fixed rather than confessed. Each control
// passed the answers/M10 test one at a time: Save and continue and Add bet write
// rows, so they are Actions, primary where the step's whole point is the write;
// Start, Review and Done open or close phases of work the flow performs, Actions
// on the default face like BriefPanel's "Walk them in order" beside which this
// flow is mounted; Back, Skip and Not now only move or dismiss, quiet face after
// CommitCeremony's Cancel; the top-right Close stays a plain button because a
// dismissal is not an action, per the tier test.
//
// `loom-press` on the Close button looks dead under data-mrd and is not:
// _authenticated.tsx hoists data-obsidian onto <html> for the whole signed-in
// tree (the portal theme fix), so the class still carries its 44px mobile touch
// target there. It stays until the app-wide retirement ruling lands; filed as
// requests/L0-004.

import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { Action } from "@/components/meridian/surface-parts";
import { toast } from "@/lib/notify";
import {
  listBriefItems,
  upsertBriefItem,
  type BriefItem,
  type BriefItemKind,
} from "@/lib/briefs.functions";

type Step = {
  kind: BriefItemKind;
  label: string;
  question: string;
  why: string;
  placeholder: string;
};

// The four strategic calls, in the order a founder actually forms them:
// where it is going, who it is for, how it is seen, what you are betting on.
const STEPS: readonly Step[] = [
  {
    kind: "vision",
    label: "Vision",
    question: "Where is this product going?",
    why: "The vision steers every agent's judgment on what to prioritize and what to ignore.",
    placeholder: "In one or two sentences, what change are you trying to create?",
  },
  {
    kind: "icp",
    label: "Target user (ICP)",
    question: "Who is this for?",
    why: "A sharp ICP lets the machine weigh signals from the right users heavier than noise from the wrong ones.",
    placeholder: "Describe the specific person or team this is for, and why they need it.",
  },
  {
    kind: "positioning",
    label: "Positioning",
    question: "How should the market see this?",
    why: "Positioning is the lens the Critic uses to judge whether a bet actually fits the strategy.",
    placeholder: "How is this different from the alternatives, in one paragraph?",
  },
  {
    kind: "top_bet",
    label: "Top bets",
    question: "What are you betting on right now?",
    why: "Each top bet becomes a watched assumption: if incoming signals ever contradict it, Supaprod flags it for review.",
    placeholder: "Name the bet and why now. One to three is plenty.",
  },
];

const INTRO = -1;
const REVIEW = STEPS.length; // 4

export function BriefFormationFlow({ onClose }: { onClose: () => void }) {
  /*
   * `aria-modal="true"` IS A CLAIM, AND IT WAS NOT TRUE.
   *
   * This is the only hand-rolled modal in the product that composes NOTHING:
   * measured 2026-09-10 against the six other surfaces carrying
   * `role="dialog"` outside Meridian, every one of which reaches for
   * `useFocusTrap`, `lib/overlay` or Meridian's own `Dialog`. This one had a
   * scrim, a fixed inset, its own Escape handler, and no trap.
   *
   * `aria-modal="true"` tells assistive technology that everything behind this
   * is inert. Without a trap that is a lie told to exactly the people who
   * cannot see it is a lie: a screen reader announces the page as blocked
   * while Tab walks straight out of the dialog into the surface underneath.
   * It is the product asserting a state the record does not hold, which is the
   * same rule that keeps status colour off a pending bet.
   *
   * The component mounts only while open, so the trap is unconditional. The
   * PORT to Meridian's `Dialog` is a separate packet and is named in the queue
   * rather than folded in here -- this makes the existing claim true, which is
   * the defect.
   */
  const trap = useFocusTrap(true);
  const qc = useQueryClient();
  const fList = useServerFn(listBriefItems);
  const fUpsert = useServerFn(upsertBriefItem);

  const { data: items } = useQuery({
    queryKey: ["brief-items"],
    queryFn: () => fList({ data: {} }),
  });

  const byKind = useMemo(() => {
    const m = new Map<BriefItemKind, BriefItem[]>();
    for (const it of items ?? []) m.set(it.kind, [...(m.get(it.kind) ?? []), it]);
    return m;
  }, [items]);

  const [phase, setPhase] = useState<number>(INTRO);
  const [draftBody, setDraftBody] = useState("");
  const [betTitle, setBetTitle] = useState("");

  const step = phase >= 0 && phase < STEPS.length ? STEPS[phase] : null;
  const singleton = step && step.kind !== "top_bet" ? (byKind.get(step.kind)?.[0] ?? null) : null;

  // On entering a singleton step, prefill the draft with its standing value so a
  // refine starts from what is already there rather than a blank box.
  useEffect(() => {
    if (step && step.kind !== "top_bet") setDraftBody(byKind.get(step.kind)?.[0]?.body ?? "");
    else setDraftBody("");
    setBetTitle("");
  }, [phase, step, byKind]);

  const save = useMutation({
    mutationFn: (v: { kind: BriefItemKind; title: string; body: string; supersedesId?: string }) =>
      fUpsert({ data: v }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["brief-items"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Close on Escape, for a focused overlay that never traps the operator.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function advance() {
    setPhase((p) => Math.min(REVIEW, p + 1));
  }

  async function saveSingletonAndAdvance() {
    if (!step) return;
    const body = draftBody.trim();
    // Only write when there is a real change; skipping a step must not churn a version.
    if (body && body !== (singleton?.body ?? "")) {
      await save.mutateAsync({ kind: step.kind, title: step.label, body });
    }
    advance();
  }

  async function addBet() {
    const title = betTitle.trim();
    const body = draftBody.trim();
    if (!title || !body) return;
    await save.mutateAsync({ kind: "top_bet", title, body });
    setBetTitle("");
    setDraftBody("");
  }

  const bets = byKind.get("top_bet") ?? [];
  const progressLabel = step ? `Step ${phase + 1} of ${STEPS.length}` : null;

  return (
    <div
      ref={trap}
      role="dialog"
      aria-modal="true"
      aria-label="Form your strategic brief"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "var(--mrd-scrim)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 20px 40px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--mrd-lift)",
          border: "1px solid var(--mrd-edge)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--mrd-shadow-float)",
          padding: "24px 26px 22px",
        }}
      >
        <div className="mb-mrd-2 flex items-center justify-between">
          <MonoLabel>{progressLabel ?? "Strategic brief"}</MonoLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              fontFamily: "var(--mrd-mono)",
              color: "var(--mrd-mute)",
              background: "transparent",
              border: "none",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {phase === INTRO ? (
          <div className="mt-mrd-4">
            <h2
              style={{
                fontWeight: 600,
                color: "var(--mrd-ink)",
                margin: "0 0 10px",
                lineHeight: 1.25,
              }}
            >
              Form your strategic brief
            </h2>
            <p
              style={{
                color: "var(--mrd-ink)",
                lineHeight: 1.55,
                margin: "0 0 8px",
              }}
            >
              Four calls steer the machine: where this is going, who it is for, how it should be
              seen, and what you are betting on. Each becomes a standing, versioned decision every
              agent reads on every task.
            </p>
            <p style={{ color: "var(--mrd-mute)", lineHeight: 1.55, margin: 0 }}>
              Each call also grows watched assumptions that Supaprod checks against incoming
              signals, so a strategy drifting out of date surfaces itself.
            </p>
            <div className="flex items-center gap-mrd-4" style={{ marginTop: 20 }}>
              {/* Opens the flow: the same job BriefPanel's "Walk them in order" does, default face. */}
              <Action onClick={advance}>Start</Action>
              <Action variant="quiet" onClick={onClose}>
                Not now
              </Action>
            </div>
          </div>
        ) : step && step.kind !== "top_bet" ? (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--mrd-ink)",
                margin: "0 0 6px",
                lineHeight: 1.3,
              }}
            >
              {step.question}
            </h2>
            <p
              style={{
                color: "var(--mrd-mute)",
                lineHeight: 1.5,
                margin: "0 0 14px",
              }}
            >
              {step.why}
            </p>
            <textarea
              className="input"
              autoFocus
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={4}
              placeholder={step.placeholder}
              /* THE STEP'S OWN QUESTION IS THE NAME. A placeholder is not a
                 label: it is gone the moment a character is typed, so a screen
                 reader arriving mid-edit heard an unnamed box. `step.question`
                 is already the words on screen above this. */
              aria-label={step.question}
              style={{ resize: "vertical", width: "100%" }}
            />
            {singleton ? (
              <div className="mt-mrd-3">
                <MonoLabel>Standing · v{singleton.version}</MonoLabel>
              </div>
            ) : null}
            <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
              {/* TIER: Action, quiet face. Blocked while the step's write is in
                  flight (C-03): Back abandons a versioned upsert mid-write and
                  leaves the user off the step that was saving. The harmless
                  control must not be the only one blocked. */}
              <Action
                variant="quiet"
                onClick={() => setPhase((p) => Math.max(INTRO, p - 1))}
                disabled={save.isPending}
              >
                Back
              </Action>
              <div className="flex items-center gap-mrd-4">
                {/* TIER: Action, quiet face. Moves only, so disabled rather than
                    busy: its handler is a synchronous setPhase and announcing
                    work would be false (answers/UL0-004 C-01). It still blocks
                    during the step's own save so a skip cannot race the write. */}
                <Action variant="quiet" onClick={advance} disabled={save.isPending}>
                  Skip
                </Action>
                {/* The step's whole point is the write: versioned upsert on click. */}
                <Action
                  variant="primary"
                  busy={save.isPending}
                  onClick={() => void saveSingletonAndAdvance()}
                >
                  Save and continue
                </Action>
              </div>
            </div>
          </div>
        ) : step && step.kind === "top_bet" ? (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--mrd-ink)",
                margin: "0 0 6px",
                lineHeight: 1.3,
              }}
            >
              {step.question}
            </h2>
            <p
              style={{
                color: "var(--mrd-mute)",
                lineHeight: 1.5,
                margin: "0 0 14px",
              }}
            >
              {step.why}
            </p>

            {bets.length > 0 ? (
              <div className="flex flex-col gap-mrd-4" style={{ marginBottom: 14 }}>
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    style={{
                      border: "1px solid var(--mrd-edge)",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 500,
                        color: "var(--mrd-ink)",
                        margin: 0,
                      }}
                    >
                      {bet.title}
                    </p>
                    {bet.body ? (
                      <p
                        style={{
                          color: "var(--mrd-ink)",
                          lineHeight: 1.5,
                          margin: "3px 0 0",
                        }}
                      >
                        {bet.body}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                className="input"
                value={betTitle}
                onChange={(e) => setBetTitle(e.target.value)}
                placeholder="Bet title"
                aria-label="Bet title"
              />
              <textarea
                className="input"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={2}
                placeholder="What is the bet, and why now?"
                aria-label="What is the bet, and why now?"
                style={{ resize: "vertical" }}
              />
              <div>
                <Action
                  busy={save.isPending}
                  disabled={!betTitle.trim() || !draftBody.trim()}
                  onClick={() => void addBet()}
                >
                  Add bet
                </Action>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
              {/* C-03: blocked during the step's own write, same as the first
                  Back. Abandoning a mid-upsert is the destructive direction. */}
              <Action
                variant="quiet"
                onClick={() => setPhase((p) => Math.max(INTRO, p - 1))}
                disabled={save.isPending}
              >
                Back
              </Action>
              <Action onClick={advance}>Review</Action>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--mrd-ink)",
                margin: "0 0 12px",
                lineHeight: 1.3,
              }}
            >
              Your brief
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {STEPS.map((s) => {
                if (s.kind === "top_bet") {
                  return (
                    <div key={s.kind}>
                      <MonoLabel>{s.label}</MonoLabel>
                      {bets.length > 0 ? (
                        <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
                          {bets.map((b) => (
                            <li key={b.id} style={{ color: "var(--mrd-ink)", lineHeight: 1.5 }}>
                              <strong style={{ fontWeight: 500 }}>{b.title}</strong>
                              {b.body ? `: ${b.body}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: "var(--mrd-faint)", margin: "4px 0 0" }}>None set.</p>
                      )}
                    </div>
                  );
                }
                const cur = byKind.get(s.kind)?.[0];
                return (
                  <div key={s.kind}>
                    <MonoLabel>{s.label}</MonoLabel>
                    <p
                      style={{
                        color: cur ? "var(--mrd-ink)" : "var(--mrd-faint)",
                        lineHeight: 1.5,
                        margin: "4px 0 0",
                      }}
                    >
                      {cur?.body ?? "None set."}
                    </p>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                color: "var(--mrd-mute)",
                lineHeight: 1.55,
                marginTop: 16,
                borderTop: "1px solid var(--mrd-edge)",
                paddingTop: 12,
              }}
            >
              Every agent now reads this brief on every task. Supaprod is extracting the watched
              assumptions behind each call; if an incoming signal ever contradicts one, it will
              surface as a "worth re-examining?" prompt rather than drifting silently.
            </p>
            <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
              {/* C-03: blocked during the step's own write, same as the first
                  Back. Abandoning a mid-upsert is the destructive direction. */}
              <Action
                variant="quiet"
                onClick={() => setPhase((p) => Math.max(INTRO, p - 1))}
                disabled={save.isPending}
              >
                Back
              </Action>
              <Action onClick={onClose}>Done</Action>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

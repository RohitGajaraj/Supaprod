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
// before (renderBriefItemsBlock in loop.server.ts). Dark Tempo overlay.

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button, MonoLabel } from "@/components/obsidian";
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
      role="dialog"
      aria-modal="true"
      aria-label="Form your strategic brief"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "color-mix(in oklab, var(--canvas) 78%, black)",
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
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-elevated)",
          padding: "24px 26px 22px",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <MonoLabel>{progressLabel ?? "Strategic brief"}</MonoLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
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
          <div style={{ marginTop: 10 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 10px",
                lineHeight: 1.25,
              }}
            >
              Form your strategic brief
            </h2>
            <p
              style={{
                color: "var(--text-body)",
                lineHeight: 1.55,
                margin: "0 0 8px",
              }}
            >
              Four calls steer the machine: where this is going, who it is for, how it should be
              seen, and what you are betting on. Each becomes a standing, versioned decision every
              agent reads on every task.
            </p>
            <p style={{ color: "var(--text-subtle)", lineHeight: 1.55, margin: 0 }}>
              Each call also grows watched assumptions that Supaprod checks against incoming
              signals, so a strategy drifting out of date surfaces itself.
            </p>
            <div className="flex items-center" style={{ gap: 10, marginTop: 20 }}>
              <Button variant="accent" onClick={advance}>
                Start
              </Button>
              <Button variant="link" size="sm" onClick={onClose}>
                Not now
              </Button>
            </div>
          </div>
        ) : step && step.kind !== "top_bet" ? (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 6px",
                lineHeight: 1.3,
              }}
            >
              {step.question}
            </h2>
            <p
              style={{
                color: "var(--text-subtle)",
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
              style={{ resize: "vertical", width: "100%" }}
            />
            {singleton ? (
              <div style={{ marginTop: 6 }}>
                <MonoLabel>Standing · v{singleton.version}</MonoLabel>
              </div>
            ) : null}
            <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
              <Button
                variant="link"
                size="sm"
                onClick={() => setPhase((p) => Math.max(INTRO, p - 1))}
              >
                Back
              </Button>
              <div className="flex items-center" style={{ gap: 10 }}>
                <Button variant="link" size="sm" onClick={advance} disabled={save.isPending}>
                  Skip
                </Button>
                <Button
                  variant="accent"
                  onClick={() => void saveSingletonAndAdvance()}
                  loading={save.isPending}
                >
                  Save and continue
                </Button>
              </div>
            </div>
          </div>
        ) : step && step.kind === "top_bet" ? (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 6px",
                lineHeight: 1.3,
              }}
            >
              {step.question}
            </h2>
            <p
              style={{
                color: "var(--text-subtle)",
                lineHeight: 1.5,
                margin: "0 0 14px",
              }}
            >
              {step.why}
            </p>

            {bets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    style={{
                      border: "1px solid var(--hairline)",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      {bet.title}
                    </p>
                    {bet.body ? (
                      <p
                        style={{
                          color: "var(--text-body)",
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
                style={{}}
              />
              <textarea
                className="input"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={2}
                placeholder="What is the bet, and why now?"
                style={{ resize: "vertical" }}
              />
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void addBet()}
                  loading={save.isPending}
                  disabled={!betTitle.trim() || !draftBody.trim()}
                >
                  Add bet
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
              <Button
                variant="link"
                size="sm"
                onClick={() => setPhase((p) => Math.max(INTRO, p - 1))}
              >
                Back
              </Button>
              <Button variant="accent" onClick={advance}>
                Review
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
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
                            <li key={b.id} style={{ color: "var(--text-body)", lineHeight: 1.5 }}>
                              <strong style={{ fontWeight: 500 }}>{b.title}</strong>
                              {b.body ? `: ${b.body}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: "var(--text-faint)", margin: "4px 0 0" }}>None set.</p>
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
                        color: cur ? "var(--text-body)" : "var(--text-faint)",
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
                color: "var(--text-subtle)",
                lineHeight: 1.55,
                marginTop: 16,
                borderTop: "1px solid var(--hairline)",
                paddingTop: 12,
              }}
            >
              Every agent now reads this brief on every task. Supaprod is extracting the watched
              assumptions behind each call; if an incoming signal ever contradicts one, it will
              surface as a "worth re-examining?" prompt rather than drifting silently.
            </p>
            <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
              <Button
                variant="link"
                size="sm"
                onClick={() => setPhase((p) => Math.max(INTRO, p - 1))}
              >
                Back
              </Button>
              <Button variant="accent" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

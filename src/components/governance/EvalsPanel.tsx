// Evals tab — ported 1:1 from design-reference/supaprod/loop.jsx (GovernScreen,
// tab "Evals"): a 2-col grid of bento .lift cards — mono suite name + case
// count on the top row, the serif 30 score with a trend mono label
// ("↑ improving" moss / "→ steady" ink-subtle, plus an honest "↓ falling"
// madder for real regressions), a right-aligned blue "runs · cases · config →"
// mono, and a 4px progress bar (moss at/above the suite's own pass gate, ember
// below — production's real threshold, not the reference's hardcoded 90).
// Drill contract (LOOM W2, the /govern fold): cards navigate to
// /engine-room?room=quality&view=suites&suite=<id> — the URL-driven
// EvalSuiteDetail renders in the room body. The panel's old internal
// state-driven SuiteDetail is retired; its functionality (run now,
// enable/disable, delete confirmed, case CRUD, run history with judge
// reasoning) lives in EvalSuiteDetail.
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/notify";
import { FlaskConical } from "lucide-react";
import {
  listEvalSuites,
  createEvalSuite,
  getEvalScoreTrends,
  getEvalCoverage,
} from "@/lib/evals.functions";
import { EmptyState, MonoLabel, VerdictChip } from "@/components/supaprod/Primitives";
// One source of truth for the canonical surface×prompt targets (shared with the EVAL-COVERAGE
// scorer), so the "new suite" picker and the coverage banner can never drift.
import { EVAL_COVERAGE_TARGETS as SURFACE_KEYS } from "@/lib/evals/coverage";

type SuiteRow = {
  id: string;
  name: string;
  description: string | null;
  surface: string;
  prompt_key: string;
  judge_model: string;
  pass_threshold: number;
  enabled: boolean;
  case_count: number;
  last_run: {
    status: string;
    avg_score: number | null;
    pass_count: number;
    fail_count: number;
    created_at: string;
  } | null;
};

export function EvalsPanel() {
  const navigate = useNavigate();
  const listFn = useServerFn(listEvalSuites);
  const trendsFn = useServerFn(getEvalScoreTrends);
  const suitesQ = useQuery({ queryKey: ["eval_suites"], queryFn: () => listFn() });
  const trendsQ = useQuery({ queryKey: ["eval_suite_trends"], queryFn: () => trendsFn() });
  const coverageFn = useServerFn(getEvalCoverage);
  const coverageQ = useQuery({ queryKey: ["eval_coverage"], queryFn: () => coverageFn() });
  const coverageSummary = coverageQ.data?.summary ?? "";
  const coverageTargets = coverageQ.data?.targets ?? [];
  const coverageFloor = coverageQ.data?.floor;

  const [createOpen, setCreateOpen] = useState(false);
  // One-click "guard this surface": an uncovered/stale coverage chip seeds the create-suite form
  // with that surface so the PM goes from "this surface has no guard" to a pre-targeted new suite in
  // one click. Cleared whenever the form closes so a later manual "New suite" opens unseeded.
  const [prefill, setPrefill] = useState<{ target: string; name: string } | null>(null);
  const openGuardFor = (t: { surface: string; key: string; label: string }) => {
    setPrefill({ target: `${t.surface}/${t.key}`, name: t.label });
    setCreateOpen(true);
  };

  const suites = (suitesQ.data ?? []) as SuiteRow[];
  const trends = trendsQ.data?.trends ?? {};

  const openSuite = (id: string) =>
    navigate({ to: "/engine-room", search: { room: "quality", view: "suites", suite: id } });

  if (suitesQ.error) {
    return (
      <div
        style={{
          padding: "var(--geist-gap)",
          backgroundColor: "var(--card)",
          border: "1px solid color-mix(in srgb, var(--madder) 40%, transparent)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <div className="mono-label" style={{ color: "var(--madder-bright)" }}>
          Couldn't load eval suites
        </div>
        <p style={{ color: "var(--text-body)", marginTop: 8 }}>
          {(suitesQ.error as Error).message}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => suitesQ.refetch()}
        >
          Retry · reloads suites
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-expanded={createOpen}
          onClick={() => {
            setPrefill(null); // a manual open is unseeded; only a gap chip pre-targets
            setCreateOpen((v) => !v);
          }}
        >
          New suite · targets a prompt
        </button>
      </div>

      {/* EVAL-COVERAGE: a calm, silent-when-fully-covered headline naming how many AI surfaces have
          no eval guard, then a per-surface chip map so the gap is actionable (covered chips stay
          quiet; only the gaps draw the eye). Degrades to silent on a query error; at full coverage
          the summary is "" and the whole block stays hidden. The chip map is the read-side of the
          same per-target report (no drift with the summary). */}
      {coverageSummary ? (
        <div style={{ marginBottom: 12 }}>
          <div
            className="mono-label tabular-nums"
            style={{ display: "flex", alignItems: "baseline", gap: "var(--geist-space-2x)", flexWrap: "wrap" }}
          >
            <span style={{ color: "var(--text-faint)" }}>Coverage</span>
            <span style={{ color: "var(--text-primary)" }}>{coverageSummary}</span>
          </div>
          {coverageTargets.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
                gap: 8,
                marginTop: 10,
                alignItems: "stretch",
              }}
            >
              {coverageTargets.map((t) => {
                // covered = success (moss, quiet); uncovered = alert (madder, solid); stale =
                // unproven, rendered NEUTRAL + dashed (not marigold) so it (a) keeps caution
                // tones reserved per the color-role contract and (b) is distinguishable from
                // uncovered without relying on hue (colorblind-safe). The word also rides aria-label
                // so state is announced, not color-only.
                const meta =
                  t.state === "covered"
                    ? {
                        word: "covered",
                        dot: "var(--moss)",
                        border: "color-mix(in oklab, var(--moss) 22%, transparent)",
                        borderStyle: "solid",
                        bg: "transparent",
                        text: "var(--text-subtle)",
                        glow: "none",
                      }
                    : t.state === "stale"
                      ? {
                          word: "unproven",
                          dot: "var(--text-faint)",
                          border: "color-mix(in oklab, var(--text-faint) 40%, transparent)",
                          borderStyle: "dashed",
                          bg: "transparent",
                          text: "var(--text-body)",
                          glow: "none",
                        }
                      : {
                          word: "no guard",
                          dot: "var(--tangerine)",
                          border: "color-mix(in oklab, var(--tangerine) 42%, transparent)",
                          borderStyle: "solid",
                          bg: "color-mix(in oklab, var(--tangerine) 10%, transparent)",
                          text: "var(--text-primary)",
                          glow: "0 0 7px color-mix(in oklab, var(--tangerine) 45%, transparent)",
                        };
                // Every chip opens the create-guard form pre-targeted at its surface; the OPEN
                // one is highlighted (ember ring + fill, the sanctioned selected-element accent)
                // so it is never ambiguous which tile you are acting on. State (covered / gap /
                // unproven) stays in the dot + tint.
                const targetId = `${t.surface}/${t.key}`;
                const selected = createOpen && prefill?.target === targetId;
                const chipStyle = {
                  display: "flex" as const,
                  flexDirection: "column" as const,
                  alignItems: "center" as const,
                  justifyContent: "flex-start" as const,
                  gap: 7,
                  minWidth: 0,
                  padding: "9px 6px",
                  borderRadius: 10,
                  border: `1px ${selected ? "solid" : meta.borderStyle} ${
                    selected ? "var(--ember)" : meta.border
                  }`,
                  background: selected
                    ? "color-mix(in oklab, var(--ember) 14%, transparent)"
                    : meta.bg,
                  boxShadow: selected
                    ? "inset 0 0 0 1px var(--ember), 0 0 12px color-mix(in oklab, var(--ember) 32%, transparent)"
                    : "none",
                  color: selected ? "var(--text-primary)" : meta.text,
                  font: "inherit",
                  textAlign: "center" as const,
                  cursor: "pointer" as const,
                  transition:
                    "border-color 160ms var(--ease), background 160ms var(--ease), box-shadow 160ms var(--ease)",
                };
                const labelStyle = {
                  lineHeight: 1.25,
                  letterSpacing: "0.01em",
                  whiteSpace: "normal" as const,
                  wordBreak: "break-word" as const,
                  color: selected ? "var(--text-primary)" : meta.text,
                };
                const dot = (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: meta.dot,
                      boxShadow: meta.glow,
                      flex: "none",
                    }}
                  />
                );
                return (
                  <button
                    key={targetId}
                    type="button"
                    aria-pressed={selected}
                    aria-label={
                      t.state === "covered"
                        ? `${t.label}: covered. Add another eval for this surface`
                        : `Create an eval guard for ${t.label} (${meta.word})`
                    }
                    title={
                      t.state === "covered"
                        ? `${t.label}: covered`
                        : `Create an eval guard for ${t.label}`
                    }
                    onClick={() => openGuardFor(t)}
                    style={chipStyle}
                  >
                    {dot}
                    <span style={labelStyle}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Coverage-floor deploy gate: silent unless a floor is configured (EVAL_COVERAGE_FLOOR_PCT /
          EVAL_COVERAGE_REQUIRED_SURFACES) AND not met. Dormant by default so it never nags. */}
      {coverageFloor?.configured && !coverageFloor.pass ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--geist-space-2x)",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {/* Short mono chrome label (uppercase reads fine), but the reason PROSE stays sentence
              case — mono-label would shout the authored sentences. */}
          <span className="mono-label" style={{ color: "var(--madder)" }}>
            Coverage floor not met
          </span>
          <span style={{ color: "var(--text-primary)" }}>
            {coverageFloor.reasons.join(" · ")}
          </span>
        </div>
      ) : null}

      {createOpen ? (
        <CreateSuiteForm
          // Re-key on the prefill so clicking a different gap chip while the form is already open
          // remounts it with the new surface seeded (useState seeds on mount only).
          key={prefill?.target ?? "manual"}
          initialTarget={prefill?.target}
          initialName={prefill?.name}
          onClose={() => {
            setCreateOpen(false);
            setPrefill(null);
          }}
          onCreated={(id) => {
            setCreateOpen(false);
            setPrefill(null);
            openSuite(id);
          }}
        />
      ) : null}

      {suitesQ.isLoading ? (
        <p
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.11em",
            color: "var(--text-subtle)",
            padding: "24px 0",
          }}
        >
          Reading the suites
        </p>
      ) : suites.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No eval suites yet"
          body="An eval suite is a regression test on a prompt: golden cases, an LLM judge, and a pass gate. Quality drops get caught before they ship."
          cta="New suite · targets a prompt"
          onCta={() => {
            setPrefill(null); // empty-state CTA is a manual open: keep it unseeded
            setCreateOpen(true);
          }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {suites.map((s) => {
            const score = s.last_run?.avg_score != null ? Math.round(s.last_run.avg_score) : null;
            const t = trends[s.id];
            const diff = t && t.previous != null ? t.latest - t.previous : null;
            return (
              <button
                key={s.id}
                type="button"
                className="hover:[background-color:var(--hover)] hover:[box-shadow:var(--shadow-raised)] active:scale-[0.98] cursor-pointer"
                onClick={() => openSuite(s.id)}
                style={{
                  textAlign: "left",
                  display: "block",
                  padding: "18px 20px",
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-elevated)",
                  transitionProperty: "background-color, box-shadow, transform",
                  transitionDuration: "var(--dur-press)",
                  transitionTimingFunction: "var(--ease)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <MonoLabel>{s.name}</MonoLabel>
                  <span className="mono-label" style={{ }}>
                    {s.case_count} cases
                    {!s.enabled ? (
                      <span style={{ color: "var(--text-subtle)" }}> · off</span>
                    ) : null}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "var(--geist-space-2x)", marginTop: 8 }}>
                  {score == null ? (
                    <span className="mono-label" style={{ color: "var(--text-faint)" }}>
                      not run yet
                    </span>
                  ) : (
                    <>
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: "var(--font-sans)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {score}
                      </span>
                      <VerdictChip tone={score >= s.pass_threshold ? "moss" : "madder"}>
                        {score >= s.pass_threshold ? "pass" : "fail"}
                      </VerdictChip>
                      {diff != null ? (
                        <span
                          className="mono-label"
                          style={{
                            color:
                              diff > 0.5
                                ? "var(--moss-bright)"
                                : diff < -0.5
                                  ? "var(--madder-bright)"
                                  : "var(--text-subtle)",
                          }}
                        >
                          {diff > 0.5 ? "↑ improving" : diff < -0.5 ? "↓ falling" : "→ steady"}
                        </span>
                      ) : null}
                    </>
                  )}
                  <span style={{ flex: 1 }}></span>
                  <span
                    className="mono-label"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    runs · cases · config →
                  </span>
                </div>
                {score != null ? (
                  <div
                    style={{
                      height: 4,
                      borderRadius: 99,
                      background: "var(--raised)",
                      overflow: "hidden",
                      marginTop: 10,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${score}%`,
                        // Outcome colors: moss = at/above the gate, madder =
                        // a real regression (ember means needs-a-human only).
                        background: score >= s.pass_threshold ? "var(--moss)" : "var(--madder)",
                      }}
                    ></div>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateSuiteForm({
  onClose,
  onCreated,
  initialTarget,
  initialName,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  /** Pre-selected "surface/key" when opened from a coverage gap chip (one-click guard). */
  initialTarget?: string;
  /** Pre-filled suite name when opened from a coverage gap chip. */
  initialName?: string;
}) {
  const qc = useQueryClient();
  const createFn = useServerFn(createEvalSuite);
  // Seed from a coverage gap chip when present; the picker only offers the canonical targets, so an
  // unknown initialTarget falls back to the default rather than an invalid surface/key.
  const seededTarget = SURFACE_KEYS.some((s) => `${s.surface}/${s.key}` === initialTarget)
    ? (initialTarget as string)
    : "chat/default";
  const [form, setForm] = useState({
    name: initialName ?? "",
    description: "",
    target: seededTarget,
    pass_threshold: 70,
  });
  const m = useMutation({
    mutationFn: async () => {
      const [surface, prompt_key] = form.target.split("/");
      return createFn({
        data: {
          name: form.name,
          description: form.description || null,
          surface,
          prompt_key,
          pass_threshold: form.pass_threshold,
        },
      });
    },
    onSuccess: (row: { id: string }) => {
      qc.invalidateQueries({ queryKey: ["eval_suites"] });
      toast.success("Suite created. Add cases to start evaluating.");
      onCreated(row.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="bento fade-up" style={{ padding: "14px 16px", marginBottom: 12 }}>
      <MonoLabel style={{ marginBottom: 10 }}>New eval suite</MonoLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ }}>
          <div className="mono-label" style={{ marginBottom: 4 }}>
            Name
          </div>
          <input
            className="input"
            value={form.name}
            placeholder="Chat tone regression"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label style={{ }}>
          <div className="mono-label" style={{ marginBottom: 4 }}>
            Target prompt
          </div>
          <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
            <SelectTrigger aria-label="Target prompt" style={{ borderRadius: 8, height: 35 }}>
              <SelectValue placeholder="Pick a surface" />
            </SelectTrigger>
            <SelectContent>
              {SURFACE_KEYS.map((s) => (
                <SelectItem key={`${s.surface}/${s.key}`} value={`${s.surface}/${s.key}`}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label style={{ }}>
          <div className="mono-label" style={{ marginBottom: 4 }}>
            Description
          </div>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label style={{ }}>
          <div className="mono-label" style={{ marginBottom: 4 }}>
            Pass gate (0 to 100)
          </div>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={form.pass_threshold}
            onChange={(e) => setForm({ ...form, pass_threshold: Number(e.target.value) })}
          />
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--geist-space-2x)", marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Dismiss
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!form.name || m.isPending}
          title={!form.name ? "Name the suite first" : undefined}
          onClick={() => m.mutate()}
        >
          {m.isPending ? "Creating…" : "Create suite · add cases next"}
        </button>
      </div>
    </div>
  );
}

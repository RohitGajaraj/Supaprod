// Guardrails tab — ported 1:1 from design-reference/supaprod/loop.jsx
// (GovernScreen tab "Guardrails"): the bento table — Guardrail 160px /
// Rule 1fr / Last fired 210px, name at weight 550, rule text-body, fired
// mono (marigold when fired, text-faint "never"). Production functionality
// kept: rule CRUD (row click opens the editor), enable switches (extra
// 40px column), seed built-ins, the dry-run test harness, and the recent
// hits log. "Last fired" derives from the real guardrail_hits log; rule prose
// derives from kind/action/applies_to. W4 Obsidian reskin: semantic tokens
// only (madder/marigold/moss/glacier, --text-*), a dark modal scrim, calm
// mono-caps loading, and mono-caps relative time; no functional or server change.
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { InjectionDefenseCard } from "./InjectionDefenseCard";
import {
  getGuardrailOverview,
  upsertGuardrailRule,
  deleteGuardrailRule,
  toggleGuardrailRule,
  seedBuiltInGuardrails,
  testGuardrailRule,
} from "@/lib/guardrails.functions";
import { EmptyState, MonoLabel } from "@/components/supaprod/Primitives";
import { relTimeCaps } from "@/components/discover/format";

type Kind = "regex" | "keyword" | "pii" | "injection" | "secret";
type Action = "block" | "warn" | "redact";
type Applies = "input" | "output" | "both";

type RuleForm = {
  id?: string;
  name: string;
  kind: Kind;
  pattern: string;
  action: Action;
  applies_to: Applies;
  enabled: boolean;
};

const GRID = "160px 1fr 210px 40px";
const HITS_GRID = "90px 150px 70px 70px 1fr";

const ACTION_PHRASE: Record<Action, string> = {
  block: "Blocks",
  warn: "Warns on",
  redact: "Redacts",
};
const KIND_PHRASE: Record<Kind, string> = {
  regex: "pattern matches",
  keyword: "keyword matches",
  pii: "PII matches",
  injection: "prompt-injection matches",
  secret: "secret matches",
};
const APPLIES_PHRASE: Record<Applies, string> = {
  both: "in input + output",
  input: "in input",
  output: "in output",
};

const ACTION_COLOR: Record<string, string> = {
  block: "var(--madder)",
  warn: "var(--marigold)",
  redact: "var(--text-body)",
};

function emptyRule(): RuleForm {
  return {
    name: "",
    kind: "keyword",
    pattern: "",
    action: "warn",
    applies_to: "both",
    enabled: true,
  };
}

export function GuardrailsPanel() {
  const confirm = useConfirm();
  const fOverview = useServerFn(getGuardrailOverview);
  const fUpsert = useServerFn(upsertGuardrailRule);
  const fDelete = useServerFn(deleteGuardrailRule);
  const fToggle = useServerFn(toggleGuardrailRule);
  const fSeed = useServerFn(seedBuiltInGuardrails);
  const fTest = useServerFn(testGuardrailRule);
  const qc = useQueryClient();

  const overview = useQuery({ queryKey: ["guardrails"], queryFn: () => fOverview() });

  const [editing, setEditing] = useState<RuleForm | null>(null);
  // Escape closes the editor, the innermost open layer here (checklist 9).
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{
    text: string;
    blocked: boolean;
    hits: { matched: string }[];
  } | null>(null);

  const upsert = useMutation({
    mutationFn: (r: RuleForm) => fUpsert({ data: r }),
    onSuccess: () => {
      toast.success("Rule saved. It applies on the next AI call.");
      setEditing(null);
      setTestResult(null);
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Rule deleted. It stops applying immediately.");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const tog = useMutation({
    mutationFn: (v: { id: string; enabled: boolean; name: string }) =>
      fToggle({ data: { id: v.id, enabled: v.enabled } }),
    onSuccess: (_d, v) => {
      toast.success(`${v.name} ${v.enabled ? "on" : "off"}.`);
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const seed = useMutation({
    mutationFn: () => fSeed(),
    onSuccess: (r) => {
      toast.success(
        r.inserted > 0
          ? `Seeded ${r.inserted} built-ins. Live on the next AI call.`
          : "Built-ins already present.",
      );
      qc.invalidateQueries({ queryKey: ["guardrails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: (r: RuleForm) =>
      fTest({
        data: { text: testText, side: r.applies_to === "output" ? "output" : "input", rule: r },
      }),
    onSuccess: (r) => setTestResult(r),
    onError: (e: Error) => toast.error(e.message),
  });

  if (overview.error) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label" style={{ color: "var(--madder)" }}>
          Couldn't load guardrails
        </div>
        <p style={{ fontSize: 13, color: "var(--text-body)", marginTop: 8 }}>
          {(overview.error as Error)?.message}
        </p>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => overview.refetch()}
        >
          Retry · reloads guardrails
        </button>
      </div>
    );
  }

  if (overview.isLoading) {
    return (
      <p
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor, 10.5px)",
          letterSpacing: "0.11em",
          color: "var(--text-subtle)",
          padding: "24px 0",
        }}
      >
        Reading the rules
      </p>
    );
  }

  const rules = overview.data?.rules ?? [];
  const hits = overview.data?.hits ?? [];

  // Last fired per rule, from the real hits log (hits arrive newest-first).
  const lastFired = new Map<string, string>();
  for (const h of hits) {
    if (!lastFired.has(h.rule_name)) lastFired.set(h.rule_name, h.created_at);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <MonoLabel icon={Shield}>{rules.length} rules</MonoLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={seed.isPending}
            onClick={() => seed.mutate()}
          >
            Seed built-ins · PII, secrets, injection
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(emptyRule())}>
            New rule · applies on the next call
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No guardrails yet"
          body="Seed the built-in set (PII redaction, secret blocking, prompt-injection flags) or write your own rule."
          cta="Seed built-ins · PII, secrets, injection"
          onCta={() => seed.mutate()}
        />
      ) : (
        <div className="bento" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="mono-label"
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 12,
              padding: "10px 18px",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <span>Guardrail</span>
            <span>Rule</span>
            <span>Last fired</span>
            <span></span>
          </div>
          {rules.map((g, i) => {
            const fired = lastFired.get(g.name) ?? null;
            const ruleText = `${ACTION_PHRASE[g.action as Action] ?? g.action} ${
              KIND_PHRASE[g.kind as Kind] ?? g.kind
            } ${APPLIES_PHRASE[g.applies_to as Applies] ?? g.applies_to}`;
            return (
              <div
                key={g.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID,
                  gap: 12,
                  padding: "13px 18px",
                  alignItems: "baseline",
                  borderBottom: i < rules.length - 1 ? "1px solid var(--hairline)" : "none",
                  fontSize: 13,
                  opacity: g.enabled ? 1 : 0.45,
                }}
              >
                <button
                  type="button"
                  className="hover:underline active:opacity-80"
                  onClick={() =>
                    setEditing({
                      id: g.id,
                      name: g.name,
                      kind: g.kind as Kind,
                      pattern: g.pattern,
                      action: g.action as Action,
                      applies_to: g.applies_to as Applies,
                      enabled: g.enabled,
                    })
                  }
                  style={{ fontWeight: 550, textAlign: "left", cursor: "pointer", minWidth: 0 }}
                  title="Edit · changes apply on the next call"
                >
                  {g.name}
                  {g.built_in ? (
                    <span
                      className="mono-label"
                      style={{ display: "block", fontSize: 8.5, color: "var(--text-faint)" }}
                    >
                      built-in
                    </span>
                  ) : null}
                </button>
                <span style={{ color: "var(--text-body)", minWidth: 0 }}>
                  {ruleText}
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-faint)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.pattern}
                  </span>
                </span>
                <span
                  className="mono-label"
                  style={{ color: fired ? "var(--marigold)" : "var(--text-faint)" }}
                >
                  {fired ? relTimeCaps(fired) : "never"}
                </span>
                <span style={{ alignSelf: "center" }}>
                  <button
                    role="switch"
                    aria-checked={g.enabled}
                    aria-label={`${g.name} guardrail`}
                    disabled={tog.isPending}
                    onClick={() => tog.mutate({ id: g.id, enabled: !g.enabled, name: g.name })}
                    style={{
                      width: 34,
                      height: 19,
                      borderRadius: 99,
                      background: g.enabled ? "var(--moss)" : "var(--raised)",
                      border: "1px solid var(--hairline)",
                      position: "relative",
                      flexShrink: 0,
                      transition: "background var(--dur-base)",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: g.enabled ? 16 : 2,
                        width: 13,
                        height: 13,
                        borderRadius: 99,
                        background: "var(--canvas)",
                        transition: "left var(--dur-base)",
                      }}
                    />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent fires — production hits log (no reference equivalent), quiet. */}
      <div className="bento" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
        <div
          className="mono-label"
          style={{
            display: "grid",
            gridTemplateColumns: HITS_GRID,
            gap: 12,
            padding: "10px 18px",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <span>When</span>
          <span>Rule</span>
          <span>Side</span>
          <span>Action</span>
          <span>Matched</span>
        </div>
        {hits.length === 0 ? (
          <div
            style={{
              fontSize: "var(--text-label-13)",
              color: "var(--text-faint)",
              padding: "20px 18px",
              textAlign: "center",
            }}
          >
            No guardrail activity yet.
          </div>
        ) : (
          hits.map((h, i) => (
            <div
              key={h.id}
              style={{
                display: "grid",
                gridTemplateColumns: HITS_GRID,
                gap: 12,
                padding: "11px 18px",
                alignItems: "baseline",
                borderBottom: i < hits.length - 1 ? "1px solid var(--hairline)" : "none",
                fontSize: "var(--text-label-13)",
              }}
            >
              <span className="mono-label tabular-nums">{relTimeCaps(h.created_at)}</span>
              <span
                style={{
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {h.rule_name}
              </span>
              <span className="mono-label">{h.side}</span>
              <span
                className="mono-label"
                style={{ color: ACTION_COLOR[h.action] ?? "var(--text-body)" }}
              >
                {h.action}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-body)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {h.matched}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Rule editor — production CRUD + dry-run test, restyled quiet-Ember. */}
      {editing ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "color-mix(in oklab, var(--canvas) 82%, transparent)",
          }}
          onClick={() => setEditing(null)}
        >
          <div
            className="bento fade-up"
            role="dialog"
            aria-modal="true"
            aria-label={editing.id ? "Edit guardrail rule" : "New guardrail rule"}
            style={{ width: "100%", maxWidth: 620, padding: 20, background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
              }}
            >
              <h2 className="font-display" style={{ fontSize: 19 }}>
                {editing.id ? "Edit rule" : "New rule"}
              </h2>
              <button
                type="button"
                className="mono-label cursor-pointer hover:underline active:opacity-80"
                style={{ color: "var(--text-faint)" }}
                onClick={() => setEditing(null)}
              >
                dismiss
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label className="mono-label" style={{ gridColumn: "span 2", display: "block" }}>
                Name
                <input
                  className="input"
                  autoFocus
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  style={{ marginTop: 5, fontSize: 13 }}
                />
              </label>
              <label className="mono-label" style={{ display: "block" }}>
                Kind
                <select
                  className="input"
                  value={editing.kind}
                  onChange={(e) => setEditing({ ...editing, kind: e.target.value as Kind })}
                  style={{ marginTop: 5, fontSize: 13 }}
                >
                  <option value="keyword">Keyword (literal substring)</option>
                  <option value="regex">Regex</option>
                  <option value="pii">PII (regex)</option>
                  <option value="injection">Injection (regex)</option>
                  <option value="secret">Secret (regex)</option>
                </select>
              </label>
              <label className="mono-label" style={{ display: "block" }}>
                Applies to
                <select
                  className="input"
                  value={editing.applies_to}
                  onChange={(e) =>
                    setEditing({ ...editing, applies_to: e.target.value as Applies })
                  }
                  style={{ marginTop: 5, fontSize: 13 }}
                >
                  <option value="both">Both</option>
                  <option value="input">Input only</option>
                  <option value="output">Output only</option>
                </select>
              </label>
              <label className="mono-label" style={{ gridColumn: "span 2", display: "block" }}>
                Pattern
                <textarea
                  className="input"
                  value={editing.pattern}
                  onChange={(e) => setEditing({ ...editing, pattern: e.target.value })}
                  rows={2}
                  style={{
                    marginTop: 5,
                    resize: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
              </label>
              <label className="mono-label" style={{ display: "block" }}>
                Action
                <select
                  className="input"
                  value={editing.action}
                  onChange={(e) => setEditing({ ...editing, action: e.target.value as Action })}
                  style={{ marginTop: 5, fontSize: 13 }}
                >
                  <option value="warn">Warn (log only)</option>
                  <option value="redact">Redact</option>
                  <option value="block">Block</option>
                </select>
              </label>
              <label
                className="mono-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  alignSelf: "end",
                  paddingBottom: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>

            <div
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: 8,
                padding: 12,
                marginTop: 12,
              }}
            >
              <div className="mono-label" style={{ marginBottom: 6 }}>
                Test · dry run, nothing is saved
              </div>
              <textarea
                className="input"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Paste sample text to test this rule against…"
                rows={2}
                style={{ resize: "none", fontFamily: "var(--font-mono)", fontSize: 12 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!testText.trim() || test.isPending}
                  title={!testText.trim() ? "Paste sample text to test first" : undefined}
                  onClick={() => test.mutate(editing)}
                >
                  {test.isPending ? (
                    <>
                      <span className="spinner" style={{ width: 11, height: 11 }} />
                      Testing…
                    </>
                  ) : (
                    "Run test · nothing is saved"
                  )}
                </button>
                {testResult ? (
                  <span
                    className="mono-label"
                    style={{ color: testResult.blocked ? "var(--madder)" : "var(--text-subtle)" }}
                  >
                    {testResult.hits.length} hit{testResult.hits.length === 1 ? "" : "s"} ·{" "}
                    {testResult.blocked ? "blocked" : "allowed"}
                  </span>
                ) : null}
              </div>
              {testResult && testResult.hits.length > 0 ? (
                <pre
                  className="scrollbar-thin"
                  style={{
                    marginTop: 8,
                    maxHeight: 120,
                    overflow: "auto",
                    background: "var(--surface-recessed)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 11,
                    lineHeight: 1.5,
                  }}
                >
                  {testResult.text}
                </pre>
              ) : null}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              {editing.id ? (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--madder)", marginRight: "auto" }}
                  disabled={del.isPending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Delete "${editing.name}"?`,
                      body: "The rule stops applying immediately.",
                      destructive: true,
                      confirmLabel: "Delete rule",
                    });
                    if (ok && editing.id) del.mutate(editing.id);
                  }}
                >
                  Delete · stops applying immediately
                </button>
              ) : null}
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                Dismiss
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!editing.name.trim() || !editing.pattern.trim() || upsert.isPending}
                title={
                  !editing.name.trim() || !editing.pattern.trim()
                    ? "A rule needs a name and a pattern"
                    : undefined
                }
                onClick={() => upsert.mutate(editing)}
              >
                Save · applies on the next call
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* FND-0.7-d: the weighted-evidence injection defense behind the regex rules. */}
      <InjectionDefenseCard />
    </div>
  );
}

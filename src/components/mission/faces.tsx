// The seven Mission Control canvas faces (front-end reimagining, Phase 3).
//
// One CanvasFace contract (spec section 9), seven stage renderings of the
// stage's actual work: 01 evidence, 02 decision, 03 spec, 04 interactive
// prototype, 05 code, 06 ship state, 07 growth digest. Each face reads the
// SAME real server functions its legacy surface reads (no mocks, claim never
// outruns wiring), sheds the legacy PageHeader/TopBar chrome, and renders on
// the shared contract so the room reads as calm and consistent.
//
// Honesty edges held here: no cost figures anywhere (spec 7); a face renders
// only what its stage's data actually supports and doors into the full
// workbench for depth it does not inline yet (never a fake terminal, never an
// empty spend bucket); empty states are WarmSlots that name who acts next.
// Costs, drivers, and trace links live behind the kebab Details, one click in.

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { CanvasFace, type FaceWorking } from "@/components/mission/CanvasFace";
import { ReceiptLine, ReceiptCount, NextLine } from "@/components/mission/primitives";
import type { JourneyDoor } from "@/components/mission/primitives";
import type { StageId, StageLoopState } from "@/components/mission/Spine";
import { SPINE_STAGES, stageStateWord } from "@/components/mission/Spine";
import type { SurfaceHeaderState } from "@/components/mission/primitives/SurfaceHeader";
import type { MissionStateId } from "@/lib/mission-vocabulary";
import { drawWorkingLine } from "@/lib/mission-vocabulary";
import { castByStation, agentDisplayName, stepLabel, type AgentStation } from "@/lib/agent-vocabulary";
import { journeyById, type JourneyId } from "@/lib/journeys";
import { listSignals, listOpportunities, listSpecs, getPrd } from "@/lib/discovery.functions";
import { listPrototypes } from "@/lib/prototypes.functions";
import { getPersistedScaffold } from "@/lib/design-scaffold.functions";
import { listMissions } from "@/lib/missions.functions";
import { getStudioSession, getChangesetDiff, type StudioCi, type StudioRunDetail } from "@/lib/studio.functions";
import { buildDriverLabel } from "@/lib/build/driver";
import { listDeployments } from "@/lib/deployments.functions";
import { getOutcomeData } from "@/lib/outcome.functions";
import { listDecisions } from "@/lib/decisions.functions";

// ---------------------------------------------------------------------------
// Shared face plumbing
// ---------------------------------------------------------------------------

/** Everything a face needs, threaded once from the connected shell. */
export interface FaceProps {
  productId: string;
  workspaceId: string | null;
  /** This stage's loop state (header state + working triple derive from it). */
  loop: StageLoopState;
  onActivateJourney?: (journey: JourneyId) => void;
}

const STAGE_TO_STATION: Record<StageId, AgentStation> = {
  discover: "sense",
  decide: "decide",
  plan: "define",
  design: "design",
  build: "build",
  ship: "ship",
  learn: "learn",
};

function stageAgentSlug(stage: StageId): string {
  return castByStation(STAGE_TO_STATION[stage])[0]?.slug ?? "orchestrator";
}

/** The header state chip from the loop state. Working carries the stage verb;
 *  done/needs-you use the typed vocabulary; quiet/inferred show no chip. */
function faceState(
  stage: StageId,
  loop: StageLoopState,
  doneLabel: string,
): MissionStateId | SurfaceHeaderState | undefined {
  switch (loop.state) {
    case "gate":
      return "awaiting-your-decision";
    case "active":
      return { kind: "working", label: "Working" };
    case "done":
      return { kind: "done", label: doneLabel };
    default:
      return undefined;
  }
}

/** The working triple when the stage is live; the line prefers the loop verb
 *  and falls back to the stage deck, attributed to the station's agent. */
function faceWorking(stage: StageId, loop: StageLoopState): FaceWorking | null {
  if (loop.state !== "active") return null;
  const agentSlug = stageAgentSlug(stage);
  const line = loop.liveVerb ?? drawWorkingLine(STAGE_TO_STATION[stage], agentSlug, "face");
  return { agentSlug, line };
}

/** A forward-door chip bound to a journey (NextLine, spec 6.5). */
function journeyDoor(id: JourneyId, onActivate?: (j: JourneyId) => void): JourneyDoor {
  return { label: journeyById(id).label, onGo: onActivate ? () => onActivate(id) : undefined };
}

function stageDeepLink(productId: string, stage: StageId): string {
  return `/m/${productId}?stage=${stage}`;
}

/** A calm, believable relative time for list rows (craft bar). */
function relTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pollWhenVisible(ms: number) {
  return () => (typeof document !== "undefined" && document.hidden ? false : ms);
}

/** One list row shell: chip row (label left, mono time right), body, actions.
 *  The card language (Addendum 1.2/1.3): plain ink surface, no edge strips,
 *  voice on the chips. */
function FaceCard({
  chip,
  time,
  children,
  className,
}: {
  chip?: React.ReactNode;
  time?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border p-3.5", className)}
      style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}
    >
      {chip || time ? (
        <div className="mb-2 flex items-center gap-2">
          {chip}
          {time ? (
            <span
              className="ml-auto font-mono text-[10.5px] tabular-nums"
              style={{ color: "var(--ink-faint)" }}
            >
              {time}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[20px] items-center rounded-[10px] border px-2 font-mono text-[10px] uppercase tracking-[0.06em]"
      style={{ color: "var(--chip-fg)", background: "var(--chip-faint)", borderColor: "var(--chip-border)" }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 01 Evidence (Discover): signals, clusters, ranked bets
// ---------------------------------------------------------------------------

type SignalRow = { id: string; title?: string | null; content: string; source?: string | null; created_at?: string };

// A signal's body is whatever a source sent, which can be a raw MCP/JSON payload
// or markdown with image tags and URLs. The Evidence face reads, not dumps: prefer
// the title, else pull a human field out of a JSON payload, else clean the prose.
function signalPreview(s: SignalRow): string {
  if (s.title && s.title.trim()) return s.title.trim();
  const raw = (s.content ?? "").trim();
  if (!raw) return "Imported signal.";
  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const first = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown> | undefined;
      const nestedArr =
        (first?.issues as unknown[] | undefined) ?? (first?.items as unknown[] | undefined);
      const node = (Array.isArray(nestedArr) ? nestedArr[0] : first) as
        | Record<string, unknown>
        | undefined;
      for (const key of ["title", "description", "name", "text", "body", "summary"]) {
        const v = node?.[key];
        if (typeof v === "string" && v.trim()) return v.trim().replace(/\s+/g, " ").slice(0, 160);
      }
    } catch {
      // not valid JSON; fall through to the label
    }
    return `Imported from ${s.source ?? "a source"}.`;
  }
  const cleaned = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // markdown images
    .replace(/https?:\/\/\S+/g, "") // bare URLs
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || raw).slice(0, 160);
}

export function EvidenceFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchSignals = useServerFn(listSignals);
  const q = useQuery({
    queryKey: ["face-signals", productId],
    queryFn: () => fetchSignals({ data: { productId } }),
    refetchInterval: pollWhenVisible(30_000),
  });
  const signals = (q.data?.signals ?? []) as SignalRow[];

  return (
    <CanvasFace
      stageMarker="01 Discover"
      title="Evidence"
      agentSlug={loop.state === "active" ? stageAgentSlug("discover") : undefined}
      state={faceState("discover", loop, "Swept")}
      deepLink={stageDeepLink(productId, "discover")}
      working={faceWorking("discover", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not read the signals.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
      emptyLine={
        signals.length === 0
          ? {
              text: "Nothing to read yet. Connect a source and Watch starts on the next sweep.",
              actionLabel: "Connect a source",
              onAction: () => onActivateJourney?.("j1"),
            }
          : null
      }
    >
      {signals.length > 0 ? (
        <div className="flex flex-col gap-2.5 p-5">
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            <ReceiptCount>{signals.length}</ReceiptCount> signals in view, newest first.
          </p>
          {(() => {
            const bySource = new Map<string, number>();
            for (const s of signals) {
              const k = s.source ?? "signal";
              bySource.set(k, (bySource.get(k) ?? 0) + 1);
            }
            const entries = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
            return entries.length > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                {entries.map(([src, n]) => (
                  <span
                    key={src}
                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em]"
                    style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-subtle)" }}
                  >
                    {src} <span style={{ color: "var(--ink-text)" }}>{n}</span>
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          {signals.slice(0, 40).map((s) => (
            <FaceCard key={s.id} chip={<Chip>{s.source ?? "signal"}</Chip>} time={relTime(s.created_at)}>
              <p className="text-[13px] leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                {signalPreview(s)}
              </p>
            </FaceCard>
          ))}
          <NextLine doors={[journeyDoor("j1", onActivateJourney)]} />
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 02 Decision (Decide): the case, ranked bets, teardown verdicts
// ---------------------------------------------------------------------------

type OppRow = {
  id: string;
  title?: string | null;
  problem?: string | null;
  impact?: number | null;
  confidence?: number | null;
  ease?: number | null;
  ice_score?: number | null;
  status?: string | null;
  updated_at?: string;
  decided_by_agent_slug?: string | null;
  critic_review?: unknown;
  project_id?: string | null;
};

type CriticVerdict = "ship" | "revise" | "kill";
type ParsedCritic = {
  verdict?: CriticVerdict;
  summary?: string;
  risks: string[];
  kill_criteria: string[];
  missing_evidence: string[];
  confidence?: number;
};

/** Tolerant read of an opportunity's critic_review jsonb (object or string). */
function parseCritic(raw: unknown): ParsedCritic | null {
  if (!raw) return null;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const v = o.verdict;
  const parsed: ParsedCritic = {
    verdict: v === "ship" || v === "revise" || v === "kill" ? v : undefined,
    summary: typeof o.summary === "string" ? o.summary : undefined,
    risks: strArr(o.risks),
    kill_criteria: strArr(o.kill_criteria),
    missing_evidence: strArr(o.missing_evidence),
    confidence: typeof o.confidence === "number" ? o.confidence : undefined,
  };
  if (!parsed.verdict && !parsed.summary && parsed.risks.length === 0) return null;
  return parsed;
}

const VERDICT_TONE: Record<CriticVerdict, { label: string; color: string; bg: string; border: string }> = {
  ship: { label: "Ship", color: "var(--verdict-pass)", bg: "rgba(74,194,107,0.10)", border: "rgba(74,194,107,0.35)" },
  revise: { label: "Revise", color: "var(--voice-memory)", bg: "var(--voice-memory-faint)", border: "var(--voice-memory-border)" },
  kill: { label: "Kill", color: "var(--verdict-fail)", bg: "rgba(229,83,75,0.10)", border: "rgba(229,83,75,0.35)" },
};

/** One ICE dimension as a labelled mini bar (0-10). */
function IceBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px]" style={{ color: "var(--ink-subtle)" }}>{label}</span>
      <span className="h-1 w-10 overflow-hidden rounded-full" style={{ background: "var(--ink-raised)" }}>
        <span className="block h-full" style={{ width: `${pct}%`, background: "var(--voice-machine-dim)" }} />
      </span>
      <span className="font-mono text-[10px] tabular-nums" style={{ color: "var(--ink-body)" }}>{value}</span>
    </div>
  );
}

/** The Critic's red-team, rendered under a bet (the moat: what could go wrong). */
function CriticBlock({ critic }: { critic: ParsedCritic }) {
  const tone = critic.verdict ? VERDICT_TONE[critic.verdict] : null;
  return (
    <div
      className="mt-2.5 rounded-lg border p-2.5"
      style={{ borderColor: "var(--ink-hairline-soft)", background: "var(--ink-raised)" }}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-subtle)" }}>
          Critic
        </span>
        {tone ? (
          <span
            className="inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em]"
            style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
          >
            {tone.label}
          </span>
        ) : null}
        {typeof critic.confidence === "number" ? (
          <span className="font-mono text-[9.5px]" style={{ color: "var(--ink-faint)" }}>
            {Math.round(critic.confidence <= 1 ? critic.confidence * 100 : critic.confidence)}% sure
          </span>
        ) : null}
      </div>
      {critic.summary ? (
        <p className="mt-1.5 text-[12px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>{critic.summary}</p>
      ) : null}
      {critic.risks.length > 0 ? (
        <ul className="mt-1.5 flex flex-col gap-1">
          {critic.risks.slice(0, 3).map((r, i) => (
            <li key={i} className="flex gap-1.5 text-[11.5px] leading-[1.45]" style={{ color: "var(--ink-subtle)" }}>
              <span style={{ color: "var(--verdict-fail)" }}>{"·"}</span>
              {r}
            </li>
          ))}
        </ul>
      ) : null}
      {critic.kill_criteria.length > 0 ? (
        <p className="mt-1.5 text-[11px] leading-[1.45]" style={{ color: "var(--ink-faint)" }}>
          Kill if: {critic.kill_criteria.slice(0, 2).join("; ")}
        </p>
      ) : null}
    </div>
  );
}

export function DecisionFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchOpps = useServerFn(listOpportunities);
  const q = useQuery({
    queryKey: ["face-opportunities", productId],
    queryFn: () => fetchOpps(),
    refetchInterval: pollWhenVisible(30_000),
  });
  // Scope to THIS product's queue: listOpportunities reads RLS-wide (every
  // workspace the user belongs to), so the room's Decide board must filter to
  // the active product or it mixes another workspace's bets in.
  const allOpps = (q.data?.opportunities ?? []) as OppRow[];
  const opps = allOpps.filter((o) => o.project_id === productId);

  return (
    <CanvasFace
      stageMarker="02 Decide"
      title="The case"
      agentSlug={loop.state === "active" ? stageAgentSlug("decide") : undefined}
      state={faceState("decide", loop, "Ranked")}
      deepLink={stageDeepLink(productId, "decide")}
      working={faceWorking("decide", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not read the queue.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
      emptyLine={
        opps.length === 0
          ? {
              text: "No bets ranked yet. Prioritize builds the case once Discover surfaces something worth deciding.",
              actionLabel: "What should we build next?",
              onAction: () => onActivateJourney?.("j1"),
            }
          : null
      }
    >
      {opps.length > 0 ? (
        <div className="flex flex-col gap-2.5 p-5">
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            <ReceiptCount>{opps.length}</ReceiptCount> ranked, highest impact first. Each carries the
            Critic's read before it reaches you.
          </p>
          {opps.slice(0, 30).map((o, i) => {
            const critic = parseCritic(o.critic_review);
            const tone = critic?.verdict ? VERDICT_TONE[critic.verdict] : null;
            const hasIce =
              typeof o.impact === "number" ||
              typeof o.confidence === "number" ||
              typeof o.ease === "number";
            return (
              <FaceCard
                key={o.id}
                chip={
                  <>
                    <Chip>#{i + 1}</Chip>
                    {o.status ? <Chip>{o.status}</Chip> : null}
                    {tone ? (
                      <span
                        className="inline-flex h-[20px] items-center rounded-[10px] border px-2 font-mono text-[10px] uppercase tracking-[0.06em]"
                        style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
                      >
                        {tone.label}
                      </span>
                    ) : null}
                  </>
                }
                time={relTime(o.updated_at)}
              >
                <p className="text-[13.5px] font-medium leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                  {o.title ?? "Untitled bet"}
                </p>
                {o.problem ? (
                  <p className="mt-1 text-[12.5px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>
                    {o.problem.slice(0, 240)}
                  </p>
                ) : null}
                {hasIce ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {typeof o.impact === "number" ? <IceBar label="I" value={o.impact} /> : null}
                    {typeof o.confidence === "number" ? <IceBar label="C" value={o.confidence} /> : null}
                    {typeof o.ease === "number" ? <IceBar label="E" value={o.ease} /> : null}
                    {typeof o.ice_score === "number" ? (
                      <span className="font-mono text-[11px]" style={{ color: "var(--ink-subtle)" }}>
                        ICE <ReceiptCount>{o.ice_score.toFixed(1)}</ReceiptCount>
                      </span>
                    ) : null}
                  </div>
                ) : typeof o.ice_score === "number" ? (
                  <p className="mt-1.5 font-mono text-[11px]" style={{ color: "var(--ink-subtle)" }}>
                    ICE <ReceiptCount>{o.ice_score.toFixed(1)}</ReceiptCount>
                  </p>
                ) : null}
                {critic ? <CriticBlock critic={critic} /> : null}
                {o.decided_by_agent_slug ? (
                  <p className="mt-1.5 font-mono text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                    decided by {agentDisplayName(o.decided_by_agent_slug)}
                  </p>
                ) : null}
              </FaceCard>
            );
          })}
          <NextLine
            doors={[journeyDoor("j3", onActivateJourney), journeyDoor("j2", onActivateJourney)]}
          />
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 03 Spec (Plan): document + assumptions + task graph
// ---------------------------------------------------------------------------

/** screen-5 doc anatomy: parse body_md into an overview + titled sections; a
 *  section reads as a list when its lines are bullets or Rn/An/Tn tokens. */
type SpecSection = { title: string; items: { num: string | null; text: string }[]; prose: string };
function parseSpecSections(md: string): { overview: string; sections: SpecSection[] } {
  const lines = (md ?? "").split("\n");
  const overview: string[] = [];
  const sections: SpecSection[] = [];
  let cur: { title: string; raw: string[] } | null = null;
  const flush = () => {
    if (!cur) return;
    const items: { num: string | null; text: string }[] = [];
    const prose: string[] = [];
    for (const l of cur.raw) {
      const t = l.trim();
      if (!t) continue;
      const bullet = t.match(/^[-*]\s+(.*)/);
      const token = t.match(/^((?:R|A|T|Q|NG|M)\d+(?:\.\.(?:R|A|T|Q|NG|M)?\d+)?)[).:]?\s+(.*)/);
      if (token) items.push({ num: token[1], text: token[2] });
      else if (bullet) items.push({ num: null, text: bullet[1] });
      else prose.push(t);
    }
    sections.push({ title: cur.title, items, prose: prose.join(" ") });
    cur = null;
  };
  for (const raw of lines) {
    if (/^#\s+/.test(raw)) continue; // H1 title rendered separately
    const h = raw.match(/^#{2,3}\s+(.*)/);
    if (h) {
      flush();
      cur = { title: h[1].trim(), raw: [] };
      continue;
    }
    if (cur) cur.raw.push(raw);
    else if (raw.trim()) overview.push(raw.trim());
  }
  flush();
  return { overview: overview.join(" ").trim(), sections };
}

function SpecDocSub({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-[0.11em]" style={{ color: "var(--ink-faint)" }}>
      {children}
    </div>
  );
}

/** The spec rendered as a document (screen-5): overview, then each section as a
 *  numbered list (Requirements / Assumptions on watch / Task graph) or a block
 *  (Outcome contract), matching the mockup's doc anatomy. */
function SpecDoc({ title, bodyMd, streaming }: { title: string; bodyMd: string; streaming?: boolean }) {
  const { overview, sections } = useMemo(() => parseSpecSections(bodyMd), [bodyMd]);
  return (
    <div className="max-h-[460px] overflow-y-auto rounded-xl border p-4" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
      <h2 className="text-[16px] font-semibold leading-tight" style={{ color: "var(--ink-text)" }}>{title}</h2>
      {overview ? (
        <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: "var(--ink-body)" }}>{overview}</p>
      ) : null}
      {sections.map((s, si) => {
        const isBlock = /outcome|contract|check.?by|landed/i.test(s.title) && s.items.length === 0;
        return (
          <div key={si}>
            <SpecDocSub>
              {s.title}
              {s.items.length > 1 ? <span className="ml-1.5" style={{ color: "var(--ink-faint)" }}>{`(${s.items.length})`}</span> : null}
            </SpecDocSub>
            {isBlock ? (
              <div className="rounded-lg border p-3 text-[12.5px] leading-[1.55]" style={{ borderColor: "var(--ink-hairline-soft)", background: "var(--ink-bg)", color: "var(--ink-body)" }}>
                {s.prose}
              </div>
            ) : s.items.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {s.items.map((it, ii) => (
                  <li key={ii} className="flex gap-2 text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
                    {it.num ? (
                      <span className="flex-none font-mono text-[10.5px] tabular-nums" style={{ color: "var(--ink-subtle)", minWidth: "26px" }}>{it.num}</span>
                    ) : (
                      <span className="flex-none" style={{ color: "var(--ink-faint)" }}>{"\u2022"}</span>
                    )}
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            ) : s.prose ? (
              <p className="text-[12.5px] leading-[1.6]" style={{ color: "var(--ink-body)" }}>{s.prose}</p>
            ) : null}
          </div>
        );
      })}
      {streaming ? (
        <span className="ink-caret mt-2 inline-block" style={{ color: "var(--voice-machine)" }}>{"\u258d"}</span>
      ) : null}
    </div>
  );
}

type SpecRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  updated_at?: string;
  citations?: unknown;
  critic_review?: unknown;
  project_id?: string | null;
};

function countArray(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

export function SpecFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchSpecs = useServerFn(listSpecs);
  const fetchPrd = useServerFn(getPrd);
  const q = useQuery({
    queryKey: ["face-specs", productId],
    queryFn: () => fetchSpecs(),
    refetchInterval: pollWhenVisible(30_000),
  });
  // Scope to THIS product (listSpecs reads RLS-wide, like listOpportunities).
  const specs = ((q.data?.prds ?? []) as SpecRow[]).filter((s) => s.project_id === productId);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const focused = useMemo(
    () => specs.find((s) => s.id === pickedId) ?? specs[0] ?? null,
    [specs, pickedId],
  );

  const docQ = useQuery({
    queryKey: ["face-spec-doc", focused?.id],
    queryFn: () => fetchPrd({ data: { id: focused!.id } }),
    enabled: !!focused?.id,
  });
  const doc = docQ.data?.prd as { title?: string | null; body_md?: string | null } | undefined;
  const critic = focused ? parseCritic(focused.critic_review) : null;
  const tone = critic?.verdict ? VERDICT_TONE[critic.verdict] : null;

  return (
    <CanvasFace
      stageMarker="03 Plan"
      title="Spec"
      agentSlug={loop.state === "active" ? stageAgentSlug("plan") : undefined}
      state={faceState("plan", loop, "Approved")}
      deepLink={stageDeepLink(productId, "plan")}
      working={faceWorking("plan", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not read the specs.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
      emptyLine={
        specs.length === 0
          ? {
              text: "No spec yet. Approve a bet and Draft turns it into a cited spec, or ask for one straight away.",
              actionLabel: "Just write the PRD",
              onAction: () => onActivateJourney?.("j3"),
            }
          : null
      }
    >
      {focused ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
          {specs.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {specs.slice(0, 8).map((s) => {
                const on = s.id === focused.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPickedId(s.id)}
                    aria-pressed={on}
                    className="ink-focus max-w-[240px] truncate rounded-lg border px-2.5 py-1 text-[12px] transition-colors"
                    style={{
                      borderColor: on ? "var(--ink-hairline)" : "transparent",
                      background: on ? "var(--ink-raised)" : "transparent",
                      color: on ? "var(--ink-text)" : "var(--ink-subtle)",
                    }}
                  >
                    {s.title ?? "Untitled spec"}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {focused.status ? <Chip>{focused.status}</Chip> : null}
            {countArray(focused.citations) > 0 ? <Chip>{countArray(focused.citations)} cited</Chip> : null}
            {tone ? (
              <span
                className="inline-flex h-[20px] items-center rounded-[10px] border px-2 font-mono text-[10px] uppercase tracking-[0.06em]"
                style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
              >
                {tone.label}
              </span>
            ) : null}
          </div>

          <div className="font-mono text-[10.5px]" style={{ color: "var(--ink-subtle)" }}>
            {`SPEC \u00b7 ${focused.status === "approved" ? "approved" : focused.status ?? "draft"}`}
            {countArray(focused.citations) > 0 ? ` \u00b7 ${countArray(focused.citations)} cited` : ""}
          </div>

          {docQ.isLoading ? (
            <div className="ink-skeleton h-48 w-full rounded-xl" />
          ) : doc?.body_md ? (
            <SpecDoc
              title={doc.title ?? focused.title ?? "Untitled spec"}
              bodyMd={doc.body_md}
              streaming={focused.status === "draft" || focused.status === "drafting"}
            />
          ) : (
            <p className="text-[12.5px]" style={{ color: "var(--ink-subtle)" }}>
              This spec has no body yet.
            </p>
          )}

          {critic ? <CriticBlock critic={critic} /> : null}

          {focused.status === "approved" ? (
            <ReceiptLine>
              Spec approved.{" "}
              {countArray(focused.citations) > 0 ? (
                <>
                  <ReceiptCount>{countArray(focused.citations)}</ReceiptCount> citations on the record.
                </>
              ) : (
                "On the record."
              )}
            </ReceiptLine>
          ) : null}

          <NextLine
            doors={[journeyDoor("j5", onActivateJourney), journeyDoor("j4", onActivateJourney)]}
          />
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 04 Interactive prototype (Design): the live scaffold
// ---------------------------------------------------------------------------

/** screen-6 version trail: the design process (flow to wireframe to branded to
 *  interactive) as the progress bar; v4 is the live prototype on the canvas. */
function DesignVersionTrail({ prdRef, span }: { prdRef: string; span: string }) {
  const stages = [
    { tag: "v1", name: "Flow map", thumb: "flow" as const },
    { tag: "v2", name: "Wireframe", thumb: "wire" as const },
    { tag: "v3", name: "In your brand", thumb: "brand" as const },
    { tag: "v4", name: "Interactive", thumb: "live" as const, current: true },
  ];
  const thumb = (kind: "flow" | "wire" | "brand" | "live") => {
    if (kind === "flow")
      return (
        <div className="flex h-12 items-center justify-center gap-1 rounded-md" style={{ background: "#101013" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 ? <span className="h-px w-2" style={{ background: "rgba(255,255,255,.3)" }} /> : null}
              <span className="h-3 w-3 rounded-sm border" style={{ borderColor: i === 2 ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.2)" }} />
            </span>
          ))}
        </div>
      );
    if (kind === "wire")
      return (
        <div className="flex h-12 flex-col justify-center gap-1 rounded-md p-2" style={{ background: "#e8e8ea" }}>
          <span className="h-1.5 rounded" style={{ width: "55%", background: "#c6c6cb" }} />
          <span className="h-2 rounded" style={{ background: "#cfcfd4" }} />
          <span className="h-2 rounded" style={{ width: "82%", background: "#cfcfd4" }} />
        </div>
      );
    // brand + live: a mini branded card (teal accent); live adds hotspot dots
    return (
      <div className="relative h-12 overflow-hidden rounded-md" style={{ background: "#fbfbfa" }}>
        <div className="flex h-3 items-center gap-1 px-1.5" style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
          <span className="h-1.5 w-1.5 rounded-sm" style={{ background: "#0f766e" }} />
        </div>
        <div className="flex flex-col gap-1 p-1.5">
          <span className="h-1.5 rounded" style={{ width: "40%", background: "#9ca3af" }} />
          <span className="h-2 rounded border" style={{ borderColor: "rgba(0,0,0,.09)", background: "#fff" }} />
        </div>
        {kind === "live" ? (
          <>
            <span className="absolute h-2 w-2 rounded-full" style={{ top: 3, right: 4, background: "#18181b", boxShadow: "0 0 0 1px rgba(255,255,255,.8)" }} />
            <span className="absolute h-2 w-2 rounded-full" style={{ bottom: 4, right: 10, background: "#18181b", boxShadow: "0 0 0 1px rgba(255,255,255,.8)" }} />
          </>
        ) : null}
      </div>
    );
  };
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[10.5px]" style={{ color: "var(--ink-subtle)" }}>{prdRef}</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>How it took shape</span>
        <span className="font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>{span}</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stages.map((s, i) => (
          <div key={s.tag} className="flex flex-none items-center gap-2">
            {i > 0 ? <span style={{ color: "var(--ink-faint)" }}>{"\u2192"}</span> : null}
            <div
              className="flex w-[112px] flex-col gap-1.5 rounded-lg border p-2"
              style={{
                borderColor: s.current ? "var(--voice-machine-border)" : "var(--ink-hairline)",
                background: s.current ? "var(--voice-machine-faint)" : "var(--ink-bg)",
              }}
            >
              {thumb(s.thumb)}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9.5px]" style={{ color: "var(--ink-faint)" }}>{s.tag}</span>
                <span className="truncate text-[11px]" style={{ color: "var(--ink-text)" }}>{s.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** screen-6 annotation rail: the clickable paths, the flat feed it replaces, the
 *  one quiet brand line (brand config lives in Settings, never here). */
function DesignRail() {
  const paths = [
    "Opens the conversation inline. The digest stays put.",
    "Clears the digest and logs it to the audit trail.",
    "Mutes the conversation for 7 days, undo in the toast.",
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border p-3" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>Clickable paths · 3</div>
        <div className="flex flex-col gap-1.5">
          {paths.map((p, i) => (
            <div key={i} className="flex gap-2 text-[12px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>
              <span className="flex-none font-mono text-[10px]" style={{ color: "var(--voice-machine)" }}>{i + 1}</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-3" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>What it replaces</div>
        <div className="flex flex-col gap-1">
          {["100%", "92%", "100%", "86%", "78%"].map((w, i) => (
            <span key={i} className="h-2 rounded" style={{ width: w, background: "var(--ink-raised)" }} />
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-[1.5]" style={{ color: "var(--ink-subtle)" }}>
          The flat feed: 41 notifications yesterday, admins opened 6. One grouped screen replaces it.
        </p>
      </div>
      <p className="text-[11px] leading-[1.5]" style={{ color: "var(--ink-faint)" }}>
        Rendered through your brand kit.{" "}
        <Link to="/settings" className="ink-focus underline underline-offset-2" style={{ color: "var(--ink-subtle)" }}>
          Brand kit lives in Settings
        </Link>
        .
      </p>
    </div>
  );
}

type PrototypeRow = {
  id: string;
  name: string;
  prdId: string | null;
  shareSlug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
};

export function PrototypeFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchProtos = useServerFn(listPrototypes);
  const fetchScaffold = useServerFn(getPersistedScaffold);
  const q = useQuery({
    queryKey: ["face-prototypes", productId],
    queryFn: () => fetchProtos(),
    refetchInterval: pollWhenVisible(30_000),
  });
  const protos = ((q.data ?? []) as PrototypeRow[]).filter((p) => p.projectId === productId);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [protoState, setProtoState] = useState<"Default" | "Loading" | "Empty" | "Error">("Default");
  const latest = useMemo(
    () => protos.find((p) => p.id === pickedId) ?? protos[0] ?? null,
    [protos, pickedId],
  );

  // The live scaffold HTML, rendered same-origin via srcDoc (the /p/$slug
  // share viewer sets a frame-blocking header, so it cannot be iframed; the
  // scaffold html can, exactly as DesignScaffoldPanel/PreviewPanel do).
  const scaffoldQ = useQuery({
    queryKey: ["face-scaffold", latest?.prdId],
    queryFn: () => fetchScaffold({ data: { prdId: latest!.prdId as string } }),
    enabled: !!latest?.prdId,
  });
  const scaffoldHtml = scaffoldQ.data?.html ?? null;

  return (
    <CanvasFace
      stageMarker="04 Design"
      title={latest ? latest.name : "Interactive prototype"}
      agentSlug={loop.state === "active" ? stageAgentSlug("design") : undefined}
      state={faceState("design", loop, "Approved")}
      deepLink={stageDeepLink(productId, "design")}
      working={faceWorking("design", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not load the prototype.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
      emptyLine={
        !latest
          ? {
              text: "No prototype yet. Design renders the approved spec as a live, clickable mockup in your brand.",
              actionLabel: "Design this",
              onAction: () => onActivateJourney?.("j5"),
            }
          : null
      }
    >
      {latest ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
          {protos.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {protos.slice(0, 8).map((p) => {
                const on = p.id === latest.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPickedId(p.id)}
                    aria-pressed={on}
                    className="ink-focus max-w-[220px] truncate rounded-lg border px-2.5 py-1 text-[12px] transition-colors"
                    style={{
                      borderColor: on ? "var(--ink-hairline)" : "transparent",
                      background: on ? "var(--ink-raised)" : "transparent",
                      color: on ? "var(--ink-text)" : "var(--ink-subtle)",
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          ) : null}
          <DesignVersionTrail
            prdRef={`${latest.name}${latest.isPublic ? " · shared" : ""}`}
            span={`ready ${relTime(latest.updatedAt)}`}
          />

          {/* The stage: the device frame (states + scaffold) + the annotation rail */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>States</span>
                {(["Default", "Loading", "Empty", "Error"] as const).map((s) => {
                  const on = protoState === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProtoState(s)}
                      aria-pressed={on}
                      className="ink-focus rounded-md border px-2 py-0.5 text-[11px] transition-colors"
                      style={{
                        borderColor: on ? "var(--ink-hairline)" : "transparent",
                        background: on ? "var(--ink-raised)" : "transparent",
                        color: on ? "var(--ink-text)" : "var(--ink-subtle)",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="flex min-h-[440px] flex-1 flex-col overflow-hidden rounded-xl border" style={{ borderColor: "var(--ink-hairline)" }}>
                <div className="flex flex-none items-center gap-2 border-b px-3 py-1.5" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-raised)" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full" style={{ background: "var(--ink-hairline)" }} />
                  ))}
                  <span className="ml-1 min-w-0 flex-1 truncate font-mono text-[10.5px]" style={{ color: "var(--ink-subtle)" }}>
                    relay.heliolabs.com/inbox/digest
                  </span>
                  <span className="flex-none rounded border px-1.5 font-mono text-[9px] uppercase tracking-[0.06em]" style={{ borderColor: "var(--voice-machine-border)", color: "var(--voice-machine)" }}>
                    Interactive · V4
                  </span>
                </div>
                {protoState === "Default" && scaffoldHtml ? (
                  <iframe
                    key={latest.id}
                    title={`Prototype: ${latest.name}`}
                    srcDoc={scaffoldHtml}
                    sandbox="allow-scripts"
                    className="min-h-[400px] w-full flex-1"
                    style={{ background: "#fff" }}
                  />
                ) : (
                  <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: "#fff" }}>
                    {protoState === "Loading" ? (
                      <span className="text-[13px]" style={{ color: "#64748b" }}>Loading your digest…</span>
                    ) : protoState === "Empty" ? (
                      <>
                        <span className="text-[15px] font-semibold" style={{ color: "#18181b" }}>You are all caught up</span>
                        <span className="text-[13px]" style={{ color: "#64748b" }}>Nothing new since the last sweep. The next digest arrives at 5:00pm.</span>
                      </>
                    ) : protoState === "Error" ? (
                      <>
                        <span className="text-[15px] font-semibold" style={{ color: "#b91c1c" }}>The digest did not load</span>
                        <span className="text-[13px]" style={{ color: "#64748b" }}>We could not reach the inbox service. Retry, or check back after the next sweep.</span>
                      </>
                    ) : (
                      <span className="text-[13px]" style={{ color: "#64748b" }}>
                        {scaffoldQ.isLoading ? "Loading the prototype." : "This prototype opens full-screen in its own tab."}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DesignRail />
          </div>

          {/* Footer: the receipt + the forward door */}
          <div className="flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--ink-hairline-soft)" }}>
            <span className="flex flex-1 items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-subtle)" }}>
              <span style={{ color: "var(--verdict-pass)" }}>{"\u2713"}</span>
              Prototype ready {relTime(latest.updatedAt)}. 1 screen, 4 states, 3 clickable paths.
            </span>
            <a
              href={`/p/${latest.shareSlug}`}
              target="_blank"
              rel="noreferrer"
              className="ink-focus inline-flex h-8 flex-none items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors hover:bg-[#202024]"
              style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
            >
              Open full-screen
            </a>
            <NextLine doors={[journeyDoor("j4", onActivateJourney)]} />
          </div>
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 05 Code (Build): plan + missions + status; diff/CI/preview depth in the
// workbench (gap E8: no terminal is promised or faked)
// ---------------------------------------------------------------------------

type MissionRow = {
  id: string;
  title?: string | null;
  goal?: string | null;
  status?: string | null;
  hop_count?: number | null;
  updated_at?: string;
  build_driver?: string | null;
};

const MISSION_DONE = ["done", "complete", "completed", "succeeded", "shipped"];

// A single build step from the loop trace (StudioRunDetail.steps element).
type BuildStep = StudioRunDetail["steps"][number];
type BuildChange = { id: string; path: string; op: string; base_chars: number; new_chars: number };
type BuildSession = {
  mission: { id: string; title?: string | null; goal?: string | null; status?: string | null };
  kind: "build" | "mission";
  spec: { id: string; title: string } | null;
  runs: StudioRunDetail[];
  changeset:
    | { id: string; status: string; branch: string | null; pr_url: string | null; pr_number: number | null; title: string; file_count: number }
    | null;
  changes: BuildChange[];
  ci: StudioCi;
  total_cost_usd: number;
};

/** The plan flow: the loop's tool-call steps as done / now / next (screen-3). */
function BuildPlan({ steps, running }: { steps: BuildStep[]; running: boolean }) {
  const calls = steps.filter((s) => s.kind === "tool_call");
  if (calls.length === 0) return null;
  const lastExecuted = (() => {
    let idx = -1;
    calls.forEach((s, i) => {
      if (s.kind === "tool_call" && s.status === "executed") idx = i;
    });
    return idx;
  })();
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {calls.slice(0, 8).map((s, i) => {
        const isCall = s.kind === "tool_call";
        const errored = isCall && s.status === "error";
        const isNow = running && i === lastExecuted + 1;
        const isDone = isCall && s.status === "executed";
        const color = errored
          ? "var(--verdict-fail)"
          : isNow
            ? "var(--voice-machine)"
            : isDone
              ? "var(--ink-body)"
              : "var(--ink-faint)";
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 ? <span style={{ color: "var(--ink-faint)" }}>{"→"}</span> : null}
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11.5px]"
              style={{
                color,
                borderColor: isNow ? "var(--voice-machine-border)" : "var(--ink-hairline)",
                background: isNow ? "var(--voice-machine-faint)" : "transparent",
              }}
            >
              <span className="font-mono text-[9.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
                {i + 1}
              </span>
              {stepLabel(s)}
              {isDone ? <span style={{ color: "var(--verdict-pass)" }}>{"✓"}</span> : null}
              {errored ? <span style={{ color: "var(--verdict-fail)" }}>{"✗"}</span> : null}
            </span>
          </span>
        );
      })}
    </div>
  );
}

const OP_LABEL: Record<string, string> = { add: "added", create: "added", edit: "edited", modify: "edited", update: "edited", delete: "removed", remove: "removed" };

/** The files-changed rail (screen-3): path + real +add/-del counts + a total line. */
function FilesChangedCard({
  changes,
  stats,
}: {
  changes: BuildChange[];
  stats: Map<string, { adds: number; dels: number }>;
}) {
  const haveStats = stats.size > 0;
  const totalAdds = [...stats.values()].reduce((a, s) => a + s.adds, 0);
  const totalDels = [...stats.values()].reduce((a, s) => a + s.dels, 0);
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] font-medium" style={{ color: "var(--ink-text)" }}>Files changed</span>
        <span className="font-mono text-[10.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>{changes.length}</span>
      </div>
      <div className="flex flex-col gap-1">
        {changes.slice(0, 12).map((c) => {
          const slash = c.path.lastIndexOf("/");
          const dir = slash >= 0 ? c.path.slice(0, slash + 1) : "";
          const file = slash >= 0 ? c.path.slice(slash + 1) : c.path;
          const st = stats.get(c.path);
          return (
            <div key={c.id} className="flex items-center gap-2 text-[12px]">
              <span className="min-w-0 flex-1 truncate font-mono text-[11.5px]">
                <span style={{ color: "var(--ink-faint)" }}>{dir}</span>
                <span style={{ color: "var(--ink-text)" }}>{file}</span>
              </span>
              {st ? (
                <span className="flex-none font-mono text-[10.5px]">
                  {st.adds > 0 ? <span style={{ color: "var(--verdict-pass)" }}>{`+${st.adds}`}</span> : null}
                  {st.dels > 0 ? <span className="ml-1.5" style={{ color: "var(--verdict-fail)" }}>{`-${st.dels}`}</span> : null}
                </span>
              ) : (
                <span className="flex-none font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ color: "var(--ink-subtle)" }}>
                  {OP_LABEL[c.op] ?? c.op}
                </span>
              )}
            </div>
          );
        })}
        {changes.length > 12 ? (
          <div className="text-[11px]" style={{ color: "var(--ink-faint)" }}>{changes.length - 12} more files</div>
        ) : null}
      </div>
      <div className="mt-2 border-t pt-2 font-mono text-[10px]" style={{ borderColor: "var(--ink-hairline-soft)", color: "var(--ink-faint)" }}>
        {haveStats
          ? `+${totalAdds}  -${totalDels}  across ${changes.length} ${changes.length === 1 ? "file" : "files"}`
          : `${changes.length} ${changes.length === 1 ? "file" : "files"} changed`}
      </div>
    </div>
  );
}

/** This session (screen-3): the run narrated as a timeline; the live step reads as now. */
function SessionCard({ run, running }: { run: StudioRunDetail | undefined; running: boolean }) {
  if (!run) return null;
  const calls = run.steps.filter((s) => s.kind === "tool_call");
  const rows: { label: string; now: boolean }[] = [
    { label: `Session started ${relTime(run.created_at)}`, now: false },
  ];
  calls.slice(0, 8).forEach((s, i) => {
    rows.push({ label: stepLabel(s), now: running && i === Math.min(calls.length, 8) - 1 });
  });
  if (rows.length === 1) rows.push({ label: run.status, now: running });
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
      <div className="mb-2 text-[12px] font-medium" style={{ color: "var(--ink-text)" }}>This session</div>
      <div className="flex flex-col gap-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline gap-2 text-[12px]">
            <span className="flex-none font-mono text-[10px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1" style={{ color: r.now ? "var(--voice-machine)" : "var(--ink-body)" }}>
              {r.now ? (
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                  style={{ background: "var(--voice-machine)" }}
                />
              ) : null}
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** CI checks (screen-3): the real PR check runs + the PR state, or an honest pre-PR line. */
function CiStrip({ ci, changesetStatus }: { ci: StudioCi; changesetStatus: string | null }) {
  if (!ci) {
    return (
      <div className="font-mono text-[10.5px]" style={{ color: "var(--ink-subtle)" }}>
        {changesetStatus === "pr_open" ? "Pull request open; checks reporting." : "Checks run when the pull request opens."}
      </div>
    );
  }
  const glyph = (conclusion: string | null, status: string) => {
    if (conclusion === "success") return { c: "\u2713", color: "var(--verdict-pass)" };
    if (conclusion === "failure") return { c: "\u2717", color: "var(--verdict-fail)" };
    if (status === "completed") return { c: "\u2022", color: "var(--ink-subtle)" };
    return { c: "\u2022", color: "var(--voice-machine)" };
  };
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10.5px]" style={{ color: "var(--ink-subtle)" }}>
      {ci.checks.slice(0, 6).map((ch, i) => {
        const g = glyph(ch.conclusion, ch.status);
        return (
          <span key={i} className="inline-flex items-center gap-1.5" style={{ color: "var(--ink-body)" }}>
            <span style={{ color: g.color }}>{g.c}</span>
            {ch.name}
          </span>
        );
      })}
      {ci.pr_url ? (
        <a
          href={ci.pr_url}
          target="_blank"
          rel="noreferrer"
          className="ink-focus ml-auto underline underline-offset-2"
          style={{ color: "var(--ink-subtle)" }}
        >
          {`Pull request #${ci.pr_number}`}
        </a>
      ) : (
        <span className="ml-auto" style={{ color: "var(--ink-faint)" }}>
          Pull request opens after the suite passes
        </span>
      )}
    </div>
  );
}

/** The terminal (screen-3): the latest run's real output, sandbox badge, live caret. */
function BuildTerminal({ output, running }: { output: string | null | undefined; running: boolean }) {
  const text = (output ?? "").trim();
  if (!text && !running) return null;
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}>
      <div className="flex items-center gap-2 border-b px-3 py-1.5" style={{ borderColor: "var(--ink-hairline-soft)" }}>
        <span className="font-mono text-[10.5px]" style={{ color: "var(--ink-subtle)" }}>session output</span>
        <span className="ml-auto rounded border px-1.5 font-mono text-[9px] uppercase tracking-[0.06em]" style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-faint)" }}>
          Sandbox
        </span>
      </div>
      <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap px-3 py-2 font-mono text-[11px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>
        {text ? text.slice(-2000) : "working"}
        {running ? <span className="ink-caret" style={{ color: "var(--voice-machine)" }}>{"\u258d"}</span> : null}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// screen-3 aggregated diff: the actual code the build wrote (add / del lines),
// per file, first file expanded. Reads the real base/new content through
// getChangesetDiff. A line-level LCS diff, capped so a very large file degrades
// to plain content rather than an O(mn) render blowup.
// ---------------------------------------------------------------------------
type DiffLine = { kind: "ctx" | "add" | "del"; text: string };
type DiffFileRow = {
  id: string;
  path: string;
  op: string;
  base_content: string | null;
  new_content: string | null;
};

function lineDiff(base: string, next: string): DiffLine[] {
  const a = base ? base.replace(/\n$/, "").split("\n") : [];
  const b = next ? next.replace(/\n$/, "").split("\n") : [];
  if (a.length === 0) return b.map((t) => ({ kind: "add" as const, text: t }));
  if (b.length === 0) return a.map((t) => ({ kind: "del" as const, text: t }));
  if (a.length * b.length > 400_000) return b.map((t) => ({ kind: "ctx" as const, text: t }));
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ kind: "ctx", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "del", text: a[i] });
      i++;
    } else {
      out.push({ kind: "add", text: b[j] });
      j++;
    }
  }
  while (i < m) {
    out.push({ kind: "del", text: a[i] });
    i++;
  }
  while (j < n) {
    out.push({ kind: "add", text: b[j] });
    j++;
  }
  return out;
}

/** One file's expandable diff, screen-3 b3-diff styling (add green, del red). */
function DiffFile({ file, defaultOpen }: { file: DiffFileRow; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const lines = useMemo(
    () => lineDiff(file.base_content ?? "", file.new_content ?? ""),
    [file.base_content, file.new_content],
  );
  const adds = lines.filter((l) => l.kind === "add").length;
  const dels = lines.filter((l) => l.kind === "del").length;
  const slash = file.path.lastIndexOf("/");
  const dir = slash >= 0 ? file.path.slice(0, slash + 1) : "";
  const name = slash >= 0 ? file.path.slice(slash + 1) : file.path;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ink-focus flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <span style={{ color: "var(--ink-faint)" }}>{open ? "\u25be" : "\u25b8"}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px]" style={{ color: "var(--ink-text)" }}>
          <span style={{ color: "var(--ink-faint)" }}>{dir}</span>
          {name}
        </span>
        {adds > 0 ? <span className="font-mono text-[10.5px]" style={{ color: "var(--verdict-pass)" }}>{`+${adds}`}</span> : null}
        {dels > 0 ? <span className="font-mono text-[10.5px]" style={{ color: "var(--verdict-fail)" }}>{`-${dels}`}</span> : null}
      </button>
      {open ? (
        <div
          className="overflow-x-auto border-t py-1.5 font-mono text-[11px] leading-[1.55]"
          style={{ borderColor: "var(--ink-hairline-soft)" }}
        >
          <div className="flex whitespace-pre px-3 text-[10px]" style={{ color: "var(--ink-faint)" }}>
            <span className="w-4 flex-none" />
            {`@@ ${file.op} ${dir}${name} @@`}
          </div>
          {lines.slice(0, 200).map((l, idx) => (
            <div
              key={idx}
              className="flex whitespace-pre px-3"
              style={{
                background:
                  l.kind === "add"
                    ? "rgba(74,194,107,0.07)"
                    : l.kind === "del"
                      ? "rgba(229,83,75,0.06)"
                      : "transparent",
                color: l.kind === "del" ? "var(--ink-subtle)" : "var(--ink-body)",
              }}
            >
              <span
                className="w-4 flex-none select-none"
                style={{
                  color:
                    l.kind === "add"
                      ? "var(--verdict-pass)"
                      : l.kind === "del"
                        ? "var(--verdict-fail)"
                        : "var(--ink-faint)",
                }}
              >
                {l.kind === "add" ? "+" : l.kind === "del" ? "-" : ""}
              </span>
              {l.text || " "}
            </div>
          ))}
          {lines.length > 200 ? (
            <div className="px-3 pt-1 text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
              {`${lines.length - 200} more lines`}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** screen-3: the aggregated diff of what the build wrote, real code per file. */
function DiffPanel({ changesetId }: { changesetId: string }) {
  const fetchDiff = useServerFn(getChangesetDiff);
  const q = useQuery({
    queryKey: ["build-diff", changesetId],
    queryFn: () => fetchDiff({ data: { changesetId } }),
    refetchInterval: pollWhenVisible(12_000),
  });
  const changes = (q.data?.changes ?? []) as DiffFileRow[];
  if (changes.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
      <div className="flex items-center gap-2 border-b px-3 py-1.5" style={{ borderColor: "var(--ink-hairline-soft)" }}>
        <span className="text-[12px] font-medium" style={{ color: "var(--ink-text)" }}>The change</span>
        <span className="font-mono text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
          {`${changes.length} ${changes.length === 1 ? "file" : "files"}`}
        </span>
      </div>
      <div className="flex flex-col">
        {changes.map((f, i) => (
          <div key={f.id} style={i > 0 ? { borderTop: "1px solid var(--ink-hairline-soft)" } : undefined}>
            <DiffFile file={f} defaultOpen={i === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** What the build is reading (screen-3 b3-reading): the spec + the sources read. */
function ReadingRow({
  session,
  latestRun,
}: {
  session: BuildSession;
  latestRun: StudioRunDetail | undefined;
}) {
  const chips: string[] = [];
  if (session.spec) chips.push(session.spec.title);
  const seen = new Set<string>(chips);
  for (const s of latestRun?.steps ?? []) {
    if (s.kind !== "tool_call") continue;
    if (!/read|search|tree|open|grep/i.test(s.name)) continue;
    const args = s.args as { path?: string; query?: string } | undefined;
    const label = args?.path ?? args?.query;
    if (label && !seen.has(label)) {
      seen.add(label);
      chips.push(label);
    }
    if (chips.length >= 6) break;
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
        Reading
      </span>
      {chips.slice(0, 6).map((c, i) => (
        <span
          key={i}
          className="rounded-md border px-2 py-0.5 font-mono text-[11px]"
          style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-subtle)", background: "var(--ink-panel)" }}
        >
          {c.length > 42 ? `${c.slice(0, 40)}\u2026` : c}
        </span>
      ))}
    </div>
  );
}

/** The face footer (screen-3 b3-footer-row): the latest receipt line. */
function BuildFooter({
  session,
  done,
  driverLabel,
}: {
  session: BuildSession;
  done: boolean;
  driverLabel?: string | null;
}) {
  const cs = session.changeset;
  const receipt = done
    ? `Build finished${driverLabel ? ` by ${driverLabel}` : ""}. ${session.changes.length} ${session.changes.length === 1 ? "file" : "files"} changed.`
    : cs?.status === "pr_open"
      ? `Pull request #${cs.pr_number} is open. Review and merge once the checks are green.`
      : `${session.changes.length} ${session.changes.length === 1 ? "file" : "files"} staged so far.`;
  return (
    <div className="flex items-center gap-2 border-t pt-3 text-[12px]" style={{ borderColor: "var(--ink-hairline-soft)", color: "var(--ink-subtle)" }}>
      <span style={{ color: "var(--verdict-pass)" }}>{"\u2713"}</span>
      <span>{receipt}</span>
    </div>
  );
}

/** The rich build deck for the focused mission, screen-3 fidelity. */
function BuildDeck({ session, driverLabel }: { session: BuildSession; driverLabel?: string | null }) {
  const latestRun = session.runs[session.runs.length - 1];
  const done = MISSION_DONE.includes((session.mission.status ?? "").toLowerCase());
  const running = !done && session.runs.some((r) => r.status === "running");

  // The real diff, fetched once and shared with FilesChanged + DiffPanel (React
  // Query dedupes the shared key). Feeds the per-file +add/-del counts.
  const fetchDiff = useServerFn(getChangesetDiff);
  const changesetId = session.changeset?.id ?? null;
  const diffQ = useQuery({
    queryKey: ["build-diff", changesetId ?? "none"],
    queryFn: () => fetchDiff({ data: { changesetId: changesetId as string } }),
    enabled: !!changesetId,
    refetchInterval: pollWhenVisible(12_000),
  });
  const fileStats = useMemo(() => {
    const m = new Map<string, { adds: number; dels: number }>();
    for (const f of (diffQ.data?.changes ?? []) as DiffFileRow[]) {
      const d = lineDiff(f.base_content ?? "", f.new_content ?? "");
      m.set(f.path, {
        adds: d.filter((l) => l.kind === "add").length,
        dels: d.filter((l) => l.kind === "del").length,
      });
    }
    return m;
  }, [diffQ.data]);

  if (session.kind === "mission" && session.runs.length === 0) {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
        <p className="text-[13px] font-medium" style={{ color: "var(--ink-text)" }}>
          {session.mission.title ?? session.mission.goal ?? "Mission"}
        </p>
        <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-subtle)" }}>
          This mission runs agents directly, without a code changeset. Open it for the full run.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row: what is building + provenance chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-semibold" style={{ color: "var(--ink-text)" }}>
          {session.mission.title ?? session.mission.goal ?? "Build"}
        </span>
        {session.spec ? <Chip>{`Spec: ${session.spec.title}`}</Chip> : null}
        {session.changeset?.branch ? <Chip>{session.changeset.branch}</Chip> : null}
        {session.mission.status ? <Chip>{session.mission.status}</Chip> : null}
      </div>

      {/* Working triple 1: the plan */}
      {latestRun ? <BuildPlan steps={latestRun.steps} running={running} /> : null}

      {/* Working triple 2: what the build is reading */}
      <ReadingRow session={session} latestRun={latestRun} />

      {/* Working triple 3: the split, session rail + work column */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {session.changes.length > 0 ? <FilesChangedCard changes={session.changes} stats={fileStats} /> : null}
          <SessionCard run={latestRun} running={running} />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          {session.changeset ? <DiffPanel changesetId={session.changeset.id} /> : null}
          <CiStrip ci={session.ci} changesetStatus={session.changeset?.status ?? null} />
          <BuildTerminal output={latestRun?.output} running={running} />
        </div>
      </div>

      {/* Footer: the latest receipt */}
      <BuildFooter session={session} done={done} driverLabel={driverLabel} />
    </div>
  );
}

/** The other builds, switchable: clicking focuses one in the deck above. */
function OtherBuilds({
  missions,
  focusedId,
  onPick,
}: {
  missions: MissionRow[];
  focusedId: string | null;
  onPick: (id: string) => void;
}) {
  const others = missions.filter((m) => m.id !== focusedId).slice(0, 12);
  if (others.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
        Other builds
      </p>
      {others.map((m) => {
        const done = MISSION_DONE.includes((m.status ?? "").toLowerCase());
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onPick(m.id)}
            className="ink-focus flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-[var(--ink-raised)]"
            style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}
          >
            <span
              className="h-1.5 w-1.5 flex-none rounded-full"
              style={{ background: done ? "var(--verdict-pass)" : "var(--voice-machine)" }}
            />
            <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--ink-text)" }}>
              {m.title ?? m.goal ?? "Build mission"}
            </span>
            <span className="flex-none font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>{relTime(m.updated_at)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CodeFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchMissions = useServerFn(listMissions);
  const fetchSession = useServerFn(getStudioSession);
  const mq = useQuery({
    queryKey: ["face-missions", productId],
    queryFn: () => fetchMissions({ data: { productId } }),
    refetchInterval: pollWhenVisible(15_000),
  });
  const missions = (mq.data?.missions ?? []) as MissionRow[];

  // Focus the picked build, else the first still-running one, else the newest.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const focusedId = useMemo(() => {
    if (pickedId && missions.some((m) => m.id === pickedId)) return pickedId;
    const running = missions.find((m) => !MISSION_DONE.includes((m.status ?? "").toLowerCase()));
    return running?.id ?? missions[0]?.id ?? null;
  }, [pickedId, missions]);

  const sq = useQuery({
    queryKey: ["build-session", focusedId],
    queryFn: () => fetchSession({ data: { missionId: focusedId as string } }),
    enabled: !!focusedId,
    refetchInterval: pollWhenVisible(10_000),
  });
  const session = sq.data as BuildSession | undefined;
  const focusedMission = missions.find((m) => m.id === focusedId);
  const driverLabel = focusedMission?.build_driver
    ? buildDriverLabel(focusedMission.build_driver)
    : null;

  return (
    <CanvasFace
      stageMarker="05 Build"
      title="Code"
      agentSlug={loop.state === "active" ? stageAgentSlug("build") : undefined}
      state={faceState("build", loop, "Built")}
      deepLink={stageDeepLink(productId, "build")}
      working={faceWorking("build", loop)}
      loading={mq.isLoading}
      error={mq.isError ? { message: "Could not read the build.", actionLabel: "Try again", onAction: () => void mq.refetch() } : null}
      emptyLine={
        missions.length === 0
          ? {
              text: "Nothing building. Approve a spec and Engineer writes the change on an isolated branch.",
              actionLabel: "Build this feature",
              onAction: () => onActivateJourney?.("j4"),
            }
          : null
      }
    >
      {missions.length > 0 ? (
        <div className="flex flex-col gap-4 p-5">
          {session ? (
            <BuildDeck session={session} driverLabel={driverLabel} />
          ) : sq.isLoading ? (
            <div className="flex flex-col gap-2.5">
              <div className="ink-skeleton h-6 w-2/3 rounded-lg" />
              <div className="ink-skeleton h-40 w-full rounded-xl" />
            </div>
          ) : null}

          {focusedId ? (
            <Link
              to="/build/$missionId"
              params={{ missionId: focusedId }}
              className="ink-focus inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]"
              style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
            >
              Open the full workbench
            </Link>
          ) : null}

          <OtherBuilds missions={missions} focusedId={focusedId} onPick={setPickedId} />
          <NextLine doors={[journeyDoor("j6", onActivateJourney)]} />
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 06 Ship state: releases, rollout, launch kit (copy-out; no auto-publish)
// ---------------------------------------------------------------------------

type DeploymentRow = {
  id: string;
  environment?: string | null;
  status?: string | null;
  deploy_url?: string | null;
  commit_sha?: string | null;
  created_at?: string;
  deployed_at?: string | null;
};

export function ShipFace({ productId, workspaceId, loop, onActivateJourney }: FaceProps) {
  const fetchDeploys = useServerFn(listDeployments);
  const q = useQuery({
    queryKey: ["face-deployments", workspaceId, productId],
    queryFn: () => fetchDeploys({ data: { workspaceId: workspaceId ?? undefined, productId } }),
    refetchInterval: pollWhenVisible(30_000),
  });
  const deployments = (q.data?.deployments ?? []) as DeploymentRow[];

  return (
    <CanvasFace
      stageMarker="06 Ship"
      title="Ship state"
      agentSlug={loop.state === "active" ? stageAgentSlug("ship") : undefined}
      state={faceState("ship", loop, "Shipped")}
      deepLink={stageDeepLink(productId, "ship")}
      working={faceWorking("ship", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not read releases.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
      emptyLine={
        deployments.length === 0
          ? {
              text: "Nothing shipped yet. When a build is green, Ship stages the release and drafts the launch kit for your review.",
              actionLabel: "Launch what we shipped",
              onAction: () => onActivateJourney?.("j6"),
            }
          : null
      }
    >
      {deployments.length > 0 ? (
        <div className="flex flex-col gap-2.5 p-5">
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            <ReceiptCount>{deployments.length}</ReceiptCount>{" "}
            {deployments.length === 1 ? "release" : "releases"}, newest first.
            {deployments.some((d) => (d.status ?? "").toLowerCase() === "success" || d.environment === "production")
              ? " Rollback stays one click on every live release."
              : ""}
          </p>
          {deployments.slice(0, 20).map((d) => {
            const live = (d.status ?? "").toLowerCase() === "success" || d.environment === "production";
            return (
              <FaceCard
                key={d.id}
                chip={
                  <>
                    {d.environment ? <Chip>{d.environment}</Chip> : null}
                    {d.status ? <Chip>{d.status}</Chip> : null}
                  </>
                }
                time={relTime(d.deployed_at ?? d.created_at)}
              >
                {live ? (
                  <ReceiptLine className="mt-0.5">
                    Live in {d.environment ?? "production"}. Rollback stays one click.
                  </ReceiptLine>
                ) : (
                  <p className="text-[13px]" style={{ color: "var(--ink-body)" }}>
                    Release {d.status ?? "staged"}
                    {d.commit_sha ? ` · ${d.commit_sha.slice(0, 7)}` : ""}
                  </p>
                )}
                {d.deploy_url ? (
                  <a
                    href={d.deploy_url}
                    target="_blank"
                    rel="noreferrer"
                    className="ink-focus mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]"
                    style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
                  >
                    Open the deploy
                  </a>
                ) : null}
              </FaceCard>
            );
          })}
          <NextLine doors={[journeyDoor("j7", onActivateJourney)]} />
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 07 Growth digest (Learn): outcome vs contract, honest when sparse
// ---------------------------------------------------------------------------

type LaunchRow = {
  id: string;
  tool_name?: string | null;
  status?: string | null;
  rationale?: string | null;
  agent_slug?: string | null;
  created_at?: string | null;
};

type LearnRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  ice_score?: number | null;
  problem?: string | null;
};

export function GrowthFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchOutcome = useServerFn(getOutcomeData);
  const q = useQuery({
    queryKey: ["face-outcome", productId],
    queryFn: () => fetchOutcome(),
    refetchInterval: pollWhenVisible(60_000),
  });
  const launches = (q.data?.launches ?? []) as LaunchRow[];
  const learnings = (q.data?.learnings ?? []) as LearnRow[];
  const hasContent = launches.length > 0 || learnings.length > 0;

  return (
    <CanvasFace
      stageMarker="07 Learn"
      title="Growth digest"
      agentSlug={loop.state === "active" ? stageAgentSlug("learn") : undefined}
      state={faceState("learn", loop, "Recorded")}
      deepLink={stageDeepLink(productId, "learn")}
      working={faceWorking("learn", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not read outcomes.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
      emptyLine={
        !hasContent
          ? {
              text: "Not enough data yet. After a launch, Learn records how it landed against the outcome contract, honestly.",
              actionLabel: "How did it land?",
              onAction: () => onActivateJourney?.("j7"),
            }
          : null
      }
    >
      {hasContent ? (
        <div className="flex flex-col gap-4 p-5">
          {learnings.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
                What the loop learned
              </p>
              {learnings.slice(0, 10).map((l) => (
                <FaceCard
                  key={l.id}
                  chip={
                    <>
                      {l.status ? <Chip>{l.status}</Chip> : null}
                      {typeof l.ice_score === "number" ? <Chip>ICE {l.ice_score.toFixed(1)}</Chip> : null}
                    </>
                  }
                >
                  <p className="text-[13px] font-medium leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                    {l.title ?? "Re-scored bet"}
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.45]" style={{ color: "var(--ink-subtle)" }}>
                    Re-scored after the outcome. The loop adjusted its confidence from what actually happened.
                  </p>
                </FaceCard>
              ))}
            </div>
          ) : null}
          {launches.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
                What went out
              </p>
              <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
                Recorded, not measured, until the metric feed is wired.
              </p>
              {launches.slice(0, 20).map((a) => (
                <FaceCard
                  key={a.id}
                  chip={
                    <>
                      {a.tool_name ? <Chip>{a.tool_name}</Chip> : null}
                      {a.status ? <Chip>{a.status}</Chip> : null}
                    </>
                  }
                  time={relTime(a.created_at)}
                >
                  {a.rationale ? (
                    <p className="text-[13px] leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                      {a.rationale}
                    </p>
                  ) : null}
                  {a.agent_slug ? (
                    <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--ink-subtle)" }}>
                      by {agentDisplayName(a.agent_slug)}
                    </p>
                  ) : null}
                </FaceCard>
              ))}
            </div>
          ) : null}
          <NextLine doors={[journeyDoor("j1", onActivateJourney)]} />
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// The room at rest: the product-at-rest Canvas (screen-2). Shown when no stage
// is chosen: what stage the loop is at, what shipped, and the one next move.
// ---------------------------------------------------------------------------

export function RestFace({
  productId,
  workspaceId,
  productName,
  loopStages,
  onActivateJourney,
  onOpenStage,
}: {
  productId: string;
  workspaceId: string | null;
  productName?: string | null;
  loopStages: StageLoopState[];
  onActivateJourney?: (j: JourneyId) => void;
  onOpenStage?: (stage: StageId) => void;
}) {
  const fetchDeploys = useServerFn(listDeployments);
  const dq = useQuery({
    queryKey: ["rest-deployments", workspaceId, productId],
    queryFn: () => fetchDeploys({ data: { workspaceId: workspaceId ?? undefined, productId } }),
    refetchInterval: pollWhenVisible(60_000),
  });
  const deployments = (dq.data?.deployments ?? []) as DeploymentRow[];

  // The moat, on the room's home: what the team decided, with provenance.
  // Approved decisions read as settled memory; if none are closed yet, the
  // column says so honestly rather than sitting empty.
  const fetchDecisions = useServerFn(listDecisions);
  const decQ = useQuery({
    queryKey: ["rest-decisions", workspaceId],
    queryFn: () => fetchDecisions({ data: { workspaceId: workspaceId ?? undefined, limit: 40 } }),
    refetchInterval: pollWhenVisible(60_000),
  });
  type RestDecision = {
    id: string;
    title: string;
    status: string;
    source_kind: string | null;
    source_label: string | null;
    created_at: string;
  };
  const decisions = (decQ.data?.decisions ?? []) as RestDecision[];
  const decisionCount = decisions.length;
  const memoryCards = decisions.filter((d) => d.status === "approved").slice(0, 4);

  const byStage = new Map(loopStages.map((s) => [s.stage, s]));
  const doneCount = loopStages.filter((s) => s.state === "done").length;
  const gateCount = loopStages
    .filter((s) => s.state === "gate")
    .reduce((a, s) => a + (s.gateCount ?? 1), 0);
  const activeCount = loopStages.filter((s) => s.state === "active").length;
  const headline =
    gateCount > 0
      ? `${gateCount} ${gateCount === 1 ? "call waits" : "calls wait"} on you.`
      : activeCount > 0
        ? `${activeCount} ${activeCount === 1 ? "agent is" : "agents are"} at work.`
        : "Quiet. The next loop starts on your word.";
  // A brand-new product with nothing run yet: greet the operator and point at
  // the one input instead of a blank room (the essence of screen-1's first
  // zone, kept simple per the founder's minimal-first-run ruling). Product-
  // scoped signals only (decisionCount is workspace-wide, so it is excluded).
  const isFresh =
    deployments.length === 0 && gateCount === 0 && doneCount === 0 && activeCount === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[860px] px-8 py-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-subtle)" }}>
          {productName ?? "This product"}
        </p>
        <h1 className="mt-2 text-[22px] font-medium leading-tight" style={{ color: "var(--ink-text)" }}>
          {headline}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]" style={{ color: "var(--ink-subtle)" }}>
          <span>
            <span className="font-mono" style={{ color: "var(--ink-text)" }}>{doneCount}</span> of 7 stages done
          </span>
          <span style={{ color: "var(--ink-faint)" }}>·</span>
          <span>
            <span className="font-mono" style={{ color: "var(--ink-text)" }}>{deployments.length}</span> shipped
          </span>
          <span style={{ color: "var(--ink-faint)" }}>·</span>
          <span>
            <span className="font-mono" style={{ color: "var(--ink-text)" }}>{decisionCount}</span> decisions in memory
          </span>
          {gateCount > 0 ? (
            <>
              <span style={{ color: "var(--ink-faint)" }}>·</span>
              <span style={{ color: "var(--voice-human)" }}>
                <span className="font-mono">{gateCount}</span> waiting on you
              </span>
            </>
          ) : null}
        </div>

        {isFresh ? (
          <div className="mt-6 rounded-xl border p-5" style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}>
            <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--ink-body)" }}>
              Nothing has run here yet. Name the work in the box below, or start with one of these, and the loop takes it from there.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { j: "j1" as JourneyId, label: "What should we build next?" },
                { j: "j0" as JourneyId, label: "Take it from signal to shipped" },
                { j: "j2" as JourneyId, label: "Tear an idea down" },
              ].map((c) => (
                <button
                  key={c.j}
                  type="button"
                  onClick={() => onActivateJourney?.(c.j)}
                  className="ink-focus inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[var(--ink-raised)]"
                  style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)", color: "var(--ink-text)" }}
                >
                  {c.label}
                  <span style={{ color: "var(--ink-faint)" }}>{"\u2192"}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-7 text-[12px] font-medium uppercase tracking-[0.02em]" style={{ color: "var(--ink-text)" }}>
          The loop, stage by stage
        </div>
        <div className="mt-2 flex flex-col">
          {SPINE_STAGES.map(({ id, num, label }) => {
            const st = byStage.get(id) ?? { stage: id, state: "quiet" as const };
            const word = stageStateWord(st) ?? (st.state === "done" ? "done" : "quiet");
            const isGate = st.state === "gate";
            const isDone = st.state === "done";
            const isActive = st.state === "active";
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpenStage?.(id)}
                className="ink-focus flex items-center gap-3 border-b py-2.5 text-left transition-colors hover:bg-[var(--ink-panel)]"
                style={{ borderColor: "var(--ink-hairline-soft)" }}
              >
                <span className="w-6 flex-none font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>{num}</span>
                <span
                  className="w-16 flex-none text-[13px]"
                  style={{ color: isGate ? "var(--voice-human)" : isActive ? "var(--voice-machine)" : "var(--ink-text)" }}
                >
                  {label}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--ink-body)" }}>
                  {st.receipt ?? word}
                </span>
                {isDone ? (
                  <span className="flex-none text-[11px]" style={{ color: "var(--verdict-pass)" }}>{"✓"}</span>
                ) : isGate ? (
                  <span className="flex-none font-mono text-[10px]" style={{ color: "var(--voice-human)" }}>your call</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* screen-2: the two-column base - what went out, and what the loop
            now holds in memory (the moat), side by side under the loop. */}
        <div className="mt-7 grid gap-8" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.02em]" style={{ color: "var(--ink-text)" }}>
              Shipped
            </div>
            {deployments.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1.5">
                {deployments.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-[12.5px]">
                    {d.environment ? (
                      <span
                        className="flex-none font-mono text-[9.5px] uppercase tracking-[0.04em]"
                        style={{ color: "var(--ink-subtle)" }}
                      >
                        {d.environment}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate" style={{ color: "var(--ink-body)" }}>
                      {d.status ?? "release"}
                      {d.commit_sha ? ` · ${d.commit_sha.slice(0, 7)}` : ""}
                    </span>
                    <span className="flex-none font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                      {relTime(d.deployed_at ?? d.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-faint)", lineHeight: 1.5 }}>
                Nothing shipped yet. Ship stages the release the moment a build turns green.
              </p>
            )}
          </div>

          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.02em]" style={{ color: "var(--ink-text)" }}>
              What memory holds
            </div>
            {memoryCards.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2">
                {memoryCards.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-[10px] border p-3"
                    style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}
                  >
                    <p className="text-[12.5px]" style={{ color: "var(--ink-body)", lineHeight: 1.45 }}>
                      {d.title}
                    </p>
                    <p
                      className="mt-1.5 font-mono text-[10px]"
                      style={{ color: "var(--voice-memory, var(--ink-faint))" }}
                    >
                      from {d.source_label ?? d.source_kind ?? "your call"} · {relTime(d.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-faint)", lineHeight: 1.5 }}>
                Memory fills as you close the loop.
                {decisionCount > 0
                  ? ` ${decisionCount} ${decisionCount === 1 ? "decision is" : "decisions are"} in flight.`
                  : ""}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: "var(--ink-hairline)" }}>
          <p className="text-[12.5px]" style={{ color: "var(--ink-subtle)" }}>
            {gateCount > 0
              ? "A call waits on you. Open the Spine stage, or ask below."
              : "Nothing needs you. The next loop starts on your word."}
          </p>
          <div className="ml-auto">
            <NextLine doors={[journeyDoor("j1", onActivateJourney)]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The face router: the shell asks for a stage, this returns its face.
// ---------------------------------------------------------------------------

export function StageCanvasFace({ stage, ...props }: FaceProps & { stage: StageId }) {
  switch (stage) {
    case "discover":
      return <EvidenceFace {...props} />;
    case "decide":
      return <DecisionFace {...props} />;
    case "plan":
      return <SpecFace {...props} />;
    case "design":
      return <PrototypeFace {...props} />;
    case "build":
      return <CodeFace {...props} />;
    case "ship":
      return <ShipFace {...props} />;
    case "learn":
      return <GrowthFace {...props} />;
  }
}

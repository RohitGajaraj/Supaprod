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

import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { CanvasFace, type FaceWorking } from "@/components/mission/CanvasFace";
import { ReceiptLine, ReceiptCount, NextLine } from "@/components/mission/primitives";
import type { JourneyDoor } from "@/components/mission/primitives";
import type { StageId, StageLoopState } from "@/components/mission/Spine";
import type { SurfaceHeaderState } from "@/components/mission/primitives/SurfaceHeader";
import type { MissionStateId } from "@/lib/mission-vocabulary";
import { drawWorkingLine } from "@/lib/mission-vocabulary";
import { castByStation, agentDisplayName, type AgentStation } from "@/lib/agent-vocabulary";
import { journeyById, type JourneyId } from "@/lib/journeys";
import { listSignals, listOpportunities, listSpecs } from "@/lib/discovery.functions";
import { listPrototypes } from "@/lib/prototypes.functions";
import { getPersistedScaffold } from "@/lib/design-scaffold.functions";
import { listMissions } from "@/lib/missions.functions";
import { listDeployments } from "@/lib/deployments.functions";
import { getOutcomeData } from "@/lib/outcome.functions";

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
          {signals.slice(0, 40).map((s) => (
            <FaceCard key={s.id} chip={<Chip>{s.source ?? "signal"}</Chip>} time={relTime(s.created_at)}>
              <p className="text-[13px] leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                {s.title || s.content.slice(0, 160)}
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
  ice_score?: number | null;
  status?: string | null;
  updated_at?: string;
  decided_by_agent_slug?: string | null;
  critic_review?: unknown;
};

export function DecisionFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchOpps = useServerFn(listOpportunities);
  const q = useQuery({
    queryKey: ["face-opportunities", productId],
    queryFn: () => fetchOpps(),
    refetchInterval: pollWhenVisible(30_000),
  });
  const opps = (q.data?.opportunities ?? []) as OppRow[];

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
            <ReceiptCount>{opps.length}</ReceiptCount> ranked, highest impact first.
          </p>
          {opps.slice(0, 30).map((o, i) => (
            <FaceCard
              key={o.id}
              chip={
                <>
                  <Chip>#{i + 1}</Chip>
                  {o.status ? <Chip>{o.status}</Chip> : null}
                </>
              }
              time={relTime(o.updated_at)}
            >
              <p className="text-[13.5px] font-medium leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                {o.title ?? "Untitled bet"}
              </p>
              {o.problem ? (
                <p className="mt-1 text-[12.5px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>
                  {o.problem.slice(0, 200)}
                </p>
              ) : null}
              {typeof o.ice_score === "number" ? (
                <p className="mt-1.5 font-mono text-[11px]" style={{ color: "var(--ink-subtle)" }}>
                  ICE <ReceiptCount>{o.ice_score.toFixed(1)}</ReceiptCount>
                  {o.decided_by_agent_slug ? ` · decided by ${agentDisplayName(o.decided_by_agent_slug)}` : ""}
                </p>
              ) : null}
            </FaceCard>
          ))}
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

type SpecRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  updated_at?: string;
  citations?: unknown;
  critic_review?: unknown;
};

function countArray(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

export function SpecFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchSpecs = useServerFn(listSpecs);
  const q = useQuery({
    queryKey: ["face-specs", productId],
    queryFn: () => fetchSpecs(),
    refetchInterval: pollWhenVisible(30_000),
  });
  const specs = (q.data?.prds ?? []) as SpecRow[];

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
      {specs.length > 0 ? (
        <div className="flex flex-col gap-2.5 p-5">
          {specs.slice(0, 30).map((s) => {
            const cites = countArray(s.citations);
            const approved = s.status === "approved";
            return (
              <FaceCard
                key={s.id}
                chip={
                  <>
                    {s.status ? <Chip>{s.status}</Chip> : null}
                    {cites > 0 ? <Chip>{cites} cited</Chip> : null}
                  </>
                }
                time={relTime(s.updated_at)}
              >
                <p className="text-[13.5px] font-medium leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                  {s.title ?? "Untitled spec"}
                </p>
                {approved ? (
                  <ReceiptLine className="mt-2">
                    Spec approved.{" "}
                    {cites > 0 ? (
                      <>
                        <ReceiptCount>{cites}</ReceiptCount> citations on the record.
                      </>
                    ) : (
                      "On the record."
                    )}
                  </ReceiptLine>
                ) : null}
                <NextLine
                  className="mt-2"
                  doors={[journeyDoor("j5", onActivateJourney), journeyDoor("j4", onActivateJourney)]}
                />
              </FaceCard>
            );
          })}
        </div>
      ) : null}
    </CanvasFace>
  );
}

// ---------------------------------------------------------------------------
// 04 Interactive prototype (Design): the live scaffold
// ---------------------------------------------------------------------------

type PrototypeRow = {
  id: string;
  name: string;
  prdId: string | null;
  shareSlug: string;
  isPublic: boolean;
  updatedAt: string;
};

export function PrototypeFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchProtos = useServerFn(listPrototypes);
  const fetchScaffold = useServerFn(getPersistedScaffold);
  const q = useQuery({
    queryKey: ["face-prototypes", productId],
    queryFn: () => fetchProtos(),
    refetchInterval: pollWhenVisible(30_000),
  });
  const protos = (q.data ?? []) as PrototypeRow[];
  const latest = protos[0] ?? null;

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
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            {scaffoldHtml
              ? "The live scaffold, exactly as it renders. Open it full-screen to click through it."
              : "The prototype is published. Open it full-screen to click through it."}
          </p>
          {scaffoldHtml ? (
            <div
              className="min-h-[420px] flex-1 overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--ink-hairline)", background: "#fff" }}
            >
              {/* srcDoc + scripts-only sandbox: null origin, no parent frame
                  access, no external network (the DesignScaffoldPanel idiom). */}
              <iframe
                key={latest.id}
                title={`Prototype: ${latest.name}`}
                srcDoc={scaffoldHtml}
                sandbox="allow-scripts"
                className="h-full min-h-[420px] w-full"
              />
            </div>
          ) : (
            <div
              className="rounded-xl border border-dashed px-6 py-10 text-center"
              style={{ borderColor: "var(--ink-hairline)" }}
            >
              <p className="text-[13px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
                {scaffoldQ.isLoading
                  ? "Loading the scaffold."
                  : "This prototype opens in its own tab."}
              </p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <a
              href={`/p/${latest.shareSlug}`}
              target="_blank"
              rel="noreferrer"
              className="ink-focus inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]"
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
};

const MISSION_DONE = ["done", "complete", "completed", "succeeded", "shipped"];

export function CodeFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchMissions = useServerFn(listMissions);
  const q = useQuery({
    queryKey: ["face-missions", productId],
    queryFn: () => fetchMissions(),
    refetchInterval: pollWhenVisible(15_000),
  });
  const missions = (q.data?.missions ?? []) as MissionRow[];

  return (
    <CanvasFace
      stageMarker="05 Build"
      title="Code"
      agentSlug={loop.state === "active" ? stageAgentSlug("build") : undefined}
      state={faceState("build", loop, "Built")}
      deepLink={stageDeepLink(productId, "build")}
      working={faceWorking("build", loop)}
      loading={q.isLoading}
      error={q.isError ? { message: "Could not read the build.", actionLabel: "Try again", onAction: () => void q.refetch() } : null}
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
        <div className="flex flex-col gap-2.5 p-5">
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            The diff, CI, and preview live in the build workbench, one click in.
          </p>
          {missions.slice(0, 20).map((m) => {
            const done = MISSION_DONE.includes((m.status ?? "").toLowerCase());
            return (
              <FaceCard
                key={m.id}
                chip={
                  <>
                    {m.status ? <Chip>{m.status}</Chip> : null}
                    {typeof m.hop_count === "number" ? <Chip>{m.hop_count} steps</Chip> : null}
                  </>
                }
                time={relTime(m.updated_at)}
              >
                <p className="text-[13.5px] font-medium leading-[1.5]" style={{ color: "var(--ink-text)" }}>
                  {m.title ?? m.goal ?? "Build mission"}
                </p>
                {done ? (
                  <ReceiptLine className="mt-2">Build finished. Open it to review the diff.</ReceiptLine>
                ) : null}
                <Link
                  to="/build/$missionId"
                  params={{ missionId: m.id }}
                  className="ink-focus mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]"
                  style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
                >
                  Open the build
                </Link>
              </FaceCard>
            );
          })}
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

export function GrowthFace({ productId, loop, onActivateJourney }: FaceProps) {
  const fetchOutcome = useServerFn(getOutcomeData);
  const q = useQuery({
    queryKey: ["face-outcome", productId],
    queryFn: () => fetchOutcome(),
    refetchInterval: pollWhenVisible(60_000),
  });
  const launches = (q.data?.launches ?? []) as LaunchRow[];

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
        launches.length === 0
          ? {
              text: "Not enough data yet. After a launch, Learn records how it landed against the outcome contract, honestly.",
              actionLabel: "How did it land?",
              onAction: () => onActivateJourney?.("j7"),
            }
          : null
      }
    >
      {launches.length > 0 ? (
        <div className="flex flex-col gap-2.5 p-5">
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            What went out, recorded, not measured, until the metric feed is wired.
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
          <NextLine doors={[journeyDoor("j1", onActivateJourney)]} />
        </div>
      ) : null}
    </CanvasFace>
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

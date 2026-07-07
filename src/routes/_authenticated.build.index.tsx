// Build · OBS-05: ported to the Obsidian v3 design system (the one cockpit).
// Mission rows (OBS-03 MissionRow anatomy) open a slide-over (?mission=) instead
// of navigating to the full-page /build/$missionId route (which stays as depth-3,
// reached from the slide-over's "Open full view" link). User-facing name is
// Build; internal identifiers intentionally stay studio.* (CLAUDE.md rename
// disclaimer). Functionality kept exactly: dispatch mutation, 5s session
// polling, PRD picker mechanics, ModelSwitcher, Enter dispatch.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type CSSProperties, type RefObject } from "react";
import { z } from "zod";
import { toast } from "@/lib/notify";
import { TopBar } from "@/components/cadence/TopBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { listPrds } from "@/lib/discovery.functions";
import {
  dispatchStudioSession,
  listStudioSessions,
  setStudioSessionArchived,
  deleteStudioSession,
  type StudioSessionListItem,
} from "@/lib/studio.functions";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import { BuildMissionRow } from "@/components/obsidian/BuildMissionRow";
import { MissionSlideOver } from "@/components/obsidian/MissionSlideOver";
import { FleetView } from "@/components/obsidian/FleetView";
import { DelegateBoard } from "@/components/obsidian/DelegateBoard";
import { ToastProvider, ToastHost } from "@/components/obsidian/toast";
import { LoopHealthBanner } from "@/components/cockpit/LoopHealthBanner";
import { MissionsCostGlance } from "@/components/cockpit/MissionsCostGlance";
import { ReliabilityGlance } from "@/components/cockpit/ReliabilityGlance";

export const Route = createFileRoute("/_authenticated/build/")({
  component: BuildPage,
  head: () => ({ meta: [{ title: "Build · Cadence" }] }),
  validateSearch: (search: Record<string, unknown>) =>
    z
      .object({
        mission: z.string().optional(),
        view: z.enum(["missions", "agent", "lane"]).optional(),
      })
      .parse(search),
  errorComponent: ({ error, reset }) => (
    <div
      style={{
        padding: "30px 44px 56px",
        maxWidth: "var(--container-work)",
        width: "100%",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          padding: 24,
          maxWidth: 560,
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--top-light), var(--shadow-ambient)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD BUILD
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          {(error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          onClick={reset}
          className="loom-press"
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads Build
        </button>
      </div>
    </div>
  ),
});

const MODE_PILL: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "12.5px",
  fontWeight: 500,
  padding: "5px 12px",
  borderRadius: "var(--radius-control)",
  border: "1px solid var(--hairline-strong)",
  cursor: "pointer",
};

/** §9: empty states whisper the moat — a faint, static constellation motif. */
function ConstellationMotif() {
  return (
    <svg
      aria-hidden="true"
      width="120"
      height="44"
      viewBox="0 0 120 44"
      style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }}
    >
      <g stroke="var(--glacier)" strokeWidth="0.6" opacity="0.5">
        <line x1="14" y1="30" x2="42" y2="12" />
        <line x1="42" y1="12" x2="70" y2="26" />
        <line x1="70" y1="26" x2="102" y2="14" />
        <line x1="42" y1="12" x2="88" y2="36" />
      </g>
      <g fill="var(--glacier)">
        <circle cx="14" cy="30" r="2" />
        <circle cx="42" cy="12" r="2.5" />
        <circle cx="70" cy="26" r="2" />
        <circle cx="102" cy="14" r="2" />
        <circle cx="88" cy="36" r="1.5" />
      </g>
    </svg>
  );
}

/** Loading skeleton matching the loaded list layout (§9: never bare text). */
function MissionListSkeleton() {
  return (
    <div aria-hidden="true">
      <div
        style={{
          height: 12,
          width: 88,
          borderRadius: 4,
          background: "var(--surface-raised)",
          marginBottom: 12,
          animation: "cadGlow 1.8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--top-light), var(--shadow-ambient)",
          padding: "6px 0",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 52,
              margin: "6px 16px",
              borderRadius: "var(--radius-control)",
              background: "var(--surface-raised)",
              animation: "cadGlow 1.8s ease-in-out infinite",
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Composer({ textareaRef }: { textareaRef: RefObject<HTMLTextAreaElement | null> }) {
  const navigate = useNavigate();
  const fDispatch = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const fStartMission = useServerFn(startOrchestratedMission);
  const fPrds = useServerFn(listPrds);

  // OBS-10: two entry points into the one true missions home. "Ship code"
  // dispatches Studio's code-gen loop (unchanged). "Run a goal" is the
  // orchestrator's goal-driven multi-agent DAG, ported from the retired
  // /missions composer so starting one is still reachable after the fold.
  const [mode, setMode] = useState<"ship" | "goal">("ship");
  const [prompt, setPrompt] = useState("");
  const [prdId, setPrdId] = useState<string | null>(null);
  const [model] = useState(DEFAULT_MODEL);
  const [goalTitle, setGoalTitle] = useState("");

  const prds = useQuery({ queryKey: ["prds"], queryFn: () => fPrds() });
  const approvedPrds = (
    (prds.data?.prds ?? []) as { id: string; title: string; status: string }[]
  ).filter((p) => p.status === "approved");
  const selectedPrd = approvedPrds.find((p) => p.id === prdId) ?? null;

  // W5b: the dispatch repo gate. Set when a ship dispatch cannot resolve a
  // repo; the dialog offers /sync or (with a spec picked) provision-a-starter
  // -repo + auto retry.
  const [repoGate, setRepoGate] = useState<{ reason: string | null } | null>(null);

  const dispatch = useMutation({
    mutationFn: () =>
      fDispatch({
        data: {
          prompt: prompt.trim() || undefined,
          prdId: prdId ?? undefined,
          model,
        },
      }),
    onSuccess: (r) => {
      toast.success("Build started");
      navigate({ to: "/build/$missionId", params: { missionId: r.missionId } });
    },
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else toast.error(e.message);
    },
  });
  const gatedDispatch = () =>
    gateDispatch({
      check: () => fCanDispatch({ data: { prdId: prdId ?? undefined } }),
      dispatch: () => dispatch.mutate(),
      openGate: (reason) => setRepoGate({ reason }),
    });

  const startMission = useMutation({
    mutationFn: () =>
      fStartMission({ data: { goal: prompt.trim(), title: goalTitle.trim() || undefined } }),
    onSuccess: (r) => {
      const queued = r.approvals_queued ?? 0;
      toast.success(
        queued === 0
          ? "Mission running."
          : queued === 1
            ? "Mission running · 1 approval waits for you."
            : `Mission running · ${queued} approvals wait for you.`,
      );
      navigate({ to: "/build/$missionId", params: { missionId: r.mission_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = mode === "ship" ? dispatch.isPending : startMission.isPending;
  const canStart =
    mode === "ship"
      ? (prompt.trim().length >= 4 || !!prdId) && !isPending
      : prompt.trim().length >= 4 && !isPending;
  const runStart = () => (mode === "ship" ? void gatedDispatch() : startMission.mutate());

  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-panel)",
        boxShadow: "var(--top-light), var(--shadow-ambient)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => setMode("ship")}
          className="loom-press"
          style={{
            ...MODE_PILL,
            color: mode === "ship" ? "var(--text-primary)" : "var(--text-subtle)",
            background: mode === "ship" ? "var(--surface-raised)" : "none",
          }}
        >
          Ship code
        </button>
        <button
          type="button"
          onClick={() => setMode("goal")}
          className="loom-press"
          style={{
            ...MODE_PILL,
            color: mode === "goal" ? "var(--text-primary)" : "var(--text-subtle)",
            background: mode === "goal" ? "var(--surface-raised)" : "none",
          }}
        >
          Run a goal
        </button>
      </div>
      {mode === "goal" && (
        <input
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
          placeholder="Mission title (optional)"
          maxLength={200}
          style={{
            background: "var(--surface-hover)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "8px 10px",
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        />
      )}
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canStart) {
            e.preventDefault();
            runStart();
          }
        }}
        rows={3}
        placeholder={
          mode === "ship"
            ? "Describe what to ship. Build plans against the connected repo."
            : "Describe the goal, e.g. 'Investigate top 3 churn signals this week, draft a PRD for the highest-impact fix, and queue the engineering plan.'"
        }
        style={{
          resize: "none",
          background: "var(--surface-hover)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-control)",
          padding: 10,
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {mode === "ship" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                style={{
                  maxWidth: 260,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "var(--text-subtle)",
                  background: "none",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)",
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {selectedPrd ? selectedPrd.title : "No spec"}
                </span>
                <span aria-hidden="true">↓</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{ maxHeight: 288, width: 288, overflowY: "auto" }}
            >
              <DropdownMenuItem onClick={() => setPrdId(null)}>No spec</DropdownMenuItem>
              {approvedPrds.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setPrdId(p.id)}>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {p.title}
                  </span>
                </DropdownMenuItem>
              ))}
              {approvedPrds.length === 0 && (
                // Not a dead end (audit D-42): the way to get an approved spec
                // is /plan, so say so and link there.
                <div style={{ padding: "6px 8px", fontSize: 12, color: "var(--text-subtle)" }}>
                  No approved specs yet.{" "}
                  <Link to="/plan" style={{ color: "var(--blossom)" }}>
                    Approve one in Plan →
                  </Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              color: "var(--text-subtle)",
            }}
          >
            The Chief of Staff breaks the goal into steps and sends each to the right specialist.
          </span>
        )}
        <button
          type="button"
          onClick={runStart}
          disabled={!canStart}
          className="loom-press"
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            fontWeight: 600,
            // Neutral, not ember: Start is the user's own initiating click, not a
            // needs-a-human gate. The restraint budget reserves ember for the ONE
            // gate CTA per screen (the slide-over's Approve), and Composer + a
            // gate can both be visible at once (adversarial review finding).
            color: "var(--text-primary)",
            background: "var(--surface-raised)",
            opacity: canStart ? 1 : 0.5,
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "8px 16px",
            cursor: canStart ? "pointer" : "default",
          }}
        >
          {isPending ? "Starting…" : "Start"}
        </button>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          letterSpacing: "0.1em",
          color: "var(--text-subtle)",
        }}
      >
        ⌘Enter to start · gates come back to you
      </div>
      <RepoGateDialog
        open={repoGate !== null}
        prdId={prdId}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => dispatch.mutate()}
      />
    </section>
  );
}

function BuildPage() {
  const fList = useServerFn(listStudioSessions);
  const fArchive = useServerFn(setStudioSessionArchived);
  const fDelete = useServerFn(deleteStudioSession);
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate({ from: "/build/" });
  const search = Route.useSearch();
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudioSessionListItem | null>(null);
  const sessions = useQuery({
    queryKey: ["studio-sessions", showArchived],
    queryFn: () => fList({ data: { includeArchived: showArchived } }),
    refetchInterval: 5000,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-sessions"] });
  const archive = useMutation({
    mutationFn: (v: { missionId: string; archived: boolean }) => fArchive({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.archived ? "Session archived" : "Session restored");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (missionId: string) => fDelete({ data: { missionId } }),
    onSuccess: () => {
      toast.success("Session deleted · what was decided stays in your Brain");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = sessions.data?.sessions ?? [];
  const isEmpty = !sessions.isLoading && !sessions.isError && rows.length === 0;

  // Functional form (not a plain object) so this doesn't clobber the `view`
  // param when opening/closing a mission from the "By Lane" tab (adversarial
  // review finding: navigate({ search: {...} }) discards all prior search
  // state instead of merging it).
  const openMission = (missionId: string) =>
    navigate({ search: (prev) => ({ ...prev, mission: missionId }) });
  const closeMission = () => navigate({ search: (prev) => ({ ...prev, mission: undefined }) });
  const viewMode = search.view ?? "missions";

  return (
    <ToastProvider>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Build"]} />
      <div
        data-screen-label="Build"
        className="cadRise"
        style={{
          padding: "30px 44px 56px",
          maxWidth: "var(--container-work)",
          width: "100%",
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Loom §2b glow field: the one ambient wash behind the hero. */}
        <div aria-hidden="true" className="loom-glow-field" />
        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "var(--text-hero)",
              fontWeight: 420,
              letterSpacing: "-0.015em",
              lineHeight: 1.12,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            <em style={{ color: "var(--ember-text)", fontStyle: "italic" }}>Build</em>
          </h1>
          {/* §6: the maker's mark — a static 24px thread under the surface title. */}
          <div
            aria-hidden="true"
            style={{
              width: 24,
              height: 1,
              background: "var(--thread-gradient)",
              opacity: 0.4,
              marginTop: 8,
            }}
          />
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            Validated work becomes shipped code. Approved specs come in · merged work moves on.
          </p>
          {/* OBS-10: fleet-wide glances, ported from the retired /missions page —
              genuinely about the whole agent mesh (code-gen + orchestrator goal-runs
              alike), not Build-specific, so they belong on Build's calm front now
              that it is the one true missions home. Each stays silent when healthy. */}
          <MissionsCostGlance />
          <ReliabilityGlance />
        </div>

        <LoopHealthBanner />

        <Composer textareaRef={textareaRef} />

        {/* OBS-10: Fleet and Delegate folded in as two orthogonal lenses on the
            same agent-mesh activity: by mission (default), by agent, by lane.
            Not merged into one view; each keeps its own model and layout. */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(
            [
              { id: "missions", label: "Missions" },
              { id: "agent", label: "By Agent" },
              { id: "lane", label: "By Lane" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, view: id === "missions" ? undefined : id }),
                })
              }
              className="loom-press"
              style={{
                ...MODE_PILL,
                color: viewMode === id ? "var(--text-primary)" : "var(--text-subtle)",
                background: viewMode === id ? "var(--surface-raised)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {viewMode === "missions" && (
          <>
            {sessions.isLoading ? (
              <MissionListSkeleton />
            ) : sessions.isError ? (
              <div
                style={{
                  padding: 24,
                  background: "var(--surface-card)",
                  borderRadius: "var(--radius-panel)",
                  boxShadow: "var(--top-light), var(--shadow-ambient)",
                }}
              >
                <div
                  style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}
                >
                  COULDN'T LOAD MISSIONS
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  {(sessions.error as Error)?.message?.slice(0, 160)}
                </p>
                <button
                  onClick={() => sessions.refetch()}
                  className="loom-press"
                  style={{
                    marginTop: 14,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--glacier)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Retry · reloads missions
                </button>
              </div>
            ) : isEmpty ? (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowArchived((v) => !v)}
                    className="loom-press"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      color: "var(--text-subtle)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {showArchived ? "Hide archived" : "Show archived"}
                  </button>
                </div>
                <div
                  style={{
                    padding: 32,
                    textAlign: "center",
                    background: "var(--surface-card)",
                    borderRadius: "var(--radius-panel)",
                    boxShadow: "var(--top-light), var(--shadow-ambient)",
                  }}
                >
                  <ConstellationMotif />
                  <p style={{ fontSize: 15, color: "var(--text-primary)", margin: 0 }}>
                    Nothing building yet
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                    Agents dispatch builds from approved specs, or describe the work above in plain
                    language. A first build usually starts within a minute.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      textareaRef.current?.focus();
                      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    style={{
                      marginTop: 14,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--glacier)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Describe the work · Build takes it from there
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Real heading (quality register: no h2 under the lone h1). */}
                  <h2
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      fontWeight: 500,
                      letterSpacing: "0.11em",
                      color: "var(--text-subtle)",
                      margin: 0,
                    }}
                  >
                    MISSIONS
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowArchived((v) => !v)}
                    className="loom-press"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      color: "var(--text-subtle)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {showArchived ? "Hide archived" : "Show archived"}
                  </button>
                </div>
                <div
                  style={{
                    background: "var(--surface-card)",
                    borderRadius: "var(--radius-panel)",
                    boxShadow: "var(--top-light), var(--shadow-ambient)",
                  }}
                >
                  {rows.map((s) => (
                    <BuildMissionRow
                      key={s.mission_id}
                      session={s}
                      onOpen={() => openMission(s.mission_id)}
                      onArchive={(archived) =>
                        archive.mutate({ missionId: s.mission_id, archived })
                      }
                      onDelete={() => setDeleteTarget(s)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === "agent" && <FleetView />}
        {viewMode === "lane" && <DelegateBoard onOpenMission={openMission} />}
      </div>

      <MissionSlideOver missionId={search.mission ?? null} onClose={closeMission} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this build session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the build's working log and any staged files for{" "}
              <strong>{deleteTarget?.title}</strong>. What was decided and learned stays in your
              Brain. To just tidy the list, Archive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && del.mutate(deleteTarget.mission_id)}
              disabled={del.isPending}
              style={{ background: "var(--madder)" }}
            >
              {del.isPending ? "Deleting…" : "Delete session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ToastHost />
    </ToastProvider>
  );
}

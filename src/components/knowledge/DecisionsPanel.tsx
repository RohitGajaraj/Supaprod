// Decisions — Brain tab 5. One list: Decision / Made by / When / Why. Row
// click drills to ?decision= on /knowledge, rendered by DecisionDetail. The
// shared vocabulary (ageOf / SOURCE_LABEL / hasSource) lives in
// decisions-shared.ts; SourceLink is exported from here — single source, no
// drift. Status is a rendered judgment -> VerdictChip (approved KEPT/moss ·
// rejected KILL/madder · pending PENDING/neutral, per the Obsidian verdict
// law: a chip appears only on a real outcome, never as decoration).
//
// OBS-08: ported to Obsidian presentation; every mutation/filter/dialog
// behavior below is unchanged from the pre-port panel.
import { useState } from "react";
import { PanelSkeleton } from "./PanelSkeleton";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import { useDebouncedValue } from "@/components/admin/admin-ui";
import {
  listDecisions,
  createDecision,
  type DecisionRow,
  type DecisionSource,
} from "@/lib/decisions.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { VerdictChip, type VerdictTone } from "@/components/obsidian/verdict";
import { ageOf, displayWho, SOURCE_LABEL } from "./decisions-shared";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";
import { traceRef } from "@/components/discover/format";

type SourceFilter = "all" | DecisionSource;
type StatusFilter = "all" | "pending" | "approved" | "rejected";

// Obsidian-specific tone map (decisions-shared.ts's STATUS_TONE stays the
// parchment mapping — DecisionDetail.tsx and other consumers still read it
// until OBS-10 folds them).
export const OBS_STATUS_TONE: Record<DecisionRow["status"], VerdictTone> = {
  approved: "KEPT",
  rejected: "KILL",
  pending: "PENDING",
};

export function SourceLink({
  d,
  className,
  style,
  onClick,
  children,
}: {
  d: DecisionRow;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  if (d.mission_id) {
    return (
      <Link
        to="/build/$missionId"
        params={{ missionId: d.mission_id }}
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  if (d.prd_id) {
    return (
      <Link
        to="/plan/spec/$id"
        params={{ id: d.prd_id }}
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  // Meeting-sourced decisions: the calendar tab left this surface (meetings
  // live on Today's PM Desk now), so there is no in-surface drill target.
  // Render no link rather than a circular one; the source label itself still
  // names the meeting. Re-point here once Today exposes a meeting deep link.
  return null;
}

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
  labelOf,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
}) {
  return (
    <div
      className="flex"
      style={{ gap: 2, border: "1px solid var(--hairline)", borderRadius: 8, padding: 2 }}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className="outline-none uppercase transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.08em",
            padding: "3px 10px",
            borderRadius: 6,
            background: value === o ? "var(--raised)" : "transparent",
            color: value === o ? "var(--text-primary)" : "var(--text-subtle)",
            border: "none",
          }}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the table shows the top few
// rows and expands on demand, so Brain never becomes a long wall. The server
// already caps at 100 (listDecisions); this is the UI-side half of that cap.
const VISIBLE_DECISIONS = 8;

export function DecisionsPanel() {
  const [source, setSource] = useState<SourceFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const qc = useQueryClient();
  const fList = useServerFn(listDecisions);
  const fCreate = useServerFn(createDecision);

  // Debounce search input so keystrokes don't fire a request per character.
  const debouncedQ = useDebouncedValue(q, 275);

  const listInput = {
    source: source === "all" ? undefined : source,
    status: status === "all" ? undefined : status,
    q: debouncedQ.trim() || undefined,
  };
  const decisions = useQuery({
    queryKey: ["decisions", listInput],
    queryFn: () => fList({ data: listInput }),
  });

  const create = useMutation({
    mutationFn: (data: { title: string; rationale?: string }) => fCreate({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      toast.success("Decision logged · Cadence reads it");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = decisions.data?.decisions ?? [];
  const GRID = "1fr 150px 90px 200px";

  return (
    <div>
      <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 12 }}>
        <FilterGroup
          options={["all", "meeting", "mission", "prd", "manual"] as const}
          value={source}
          onChange={setSource}
          labelOf={(s) => (s === "all" ? "All" : SOURCE_LABEL[s])}
        />
        <FilterGroup
          options={["all", "pending", "approved", "rejected"] as const}
          value={status}
          onChange={setStatus}
          labelOf={(s) => s}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search decision titles"
          placeholder="Search titles"
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            flex: 1,
            minWidth: 160,
            maxWidth: 240,
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 12,
            color: "var(--text-primary)",
          }}
        />
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Log decision
        </Button>
      </div>

      {decisions.isLoading ? (
        <PanelSkeleton />
      ) : decisions.isError ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "16px 18px",
          }}
        >
          <MonoLabel style={{ marginBottom: 8 }}>Decisions · failed to load</MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
            {(decisions.error as Error).message}
          </p>
          <Button variant="secondary" onClick={() => void decisions.refetch()}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid color-mix(in srgb, var(--moss) 30%, transparent)",
            borderRadius: "var(--radius-card)",
            padding: "28px 26px",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-body)", margin: "0 0 12px" }}>
            Decisions land here automatically when missions complete, specs are approved, or meeting
            transcripts are extracted. Or log one manually.
          </p>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Log decision
          </Button>
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 12,
              padding: "10px 18px",
              borderBottom: "1px solid var(--hairline)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              color: "var(--text-faint)",
              textTransform: "uppercase",
            }}
          >
            <span>Decision</span>
            <span>Made by</span>
            <span>When</span>
            <span>Why</span>
          </div>
          {(showAll ? rows : rows.slice(0, VISIBLE_DECISIONS)).map((d, i, shown) => (
            <button
              key={d.id}
              type="button"
              onClick={() =>
                navigate({ to: "/brain", search: { tab: "decisions", decision: d.id } })
              }
              className="w-full text-left outline-none transition-colors hover:[background-color:var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                padding: "13px 18px",
                alignItems: "baseline",
                borderBottom: i < shown.length - 1 ? "1px solid var(--hairline)" : "none",
                fontSize: 13,
                background: "transparent",
                border: "none",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                  <VerdictChip tone={OBS_STATUS_TONE[d.status]} />
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stripAutoPrefix(d.title)}
                  </span>
                  {isAutoTitle(d.title) ? <AutoChip /> : null}
                </span>
                {/* dim 17: the quiet, copyable-in-detail trace ref on the row. */}
                <span
                  style={{
                    display: "block",
                    marginTop: 5,
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-mono-floor)",
                    letterSpacing: "0.06em",
                    color: "var(--text-faint)",
                  }}
                >
                  DEC·{traceRef(d.id)}
                </span>
                {d.status === "pending" ? (
                  // LOOM QA R2 (one-home law, §9b): approvals have ONE
                  // actionable home — Today's queue. This row stays the
                  // record; deciding happens there.
                  <span className="flex" style={{ gap: 6, marginTop: 7 }}>
                    {/* span, not button: the row itself is a <button>, and a
                        nested button is invalid HTML (hydration warning). */}
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ to: "/today" });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          navigate({ to: "/today" });
                        }
                      }}
                      className="hover:underline"
                      style={{ fontSize: 11, color: "var(--link)", cursor: "pointer" }}
                    >
                      Decide on Today &rarr;
                    </span>
                  </span>
                ) : null}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                }}
              >
                {displayWho(d.decided_by_agent_slug)}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-floor)",
                  color: "var(--text-subtle)",
                }}
              >
                {ageOf(d.created_at)}
              </span>
              <span
                style={{
                  color: "var(--text-subtle)",
                  fontSize: 12.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.rationale ??
                  (d.source_label
                    ? `${SOURCE_LABEL[(d.source_kind ?? "manual") as DecisionSource]} · ${d.source_label}`
                    : "")}
              </span>
            </button>
          ))}
        </div>
      )}

      {rows.length > VISIBLE_DECISIONS ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
            marginTop: 10,
          }}
        >
          {showAll ? "Show fewer" : `Show ${rows.length - VISIBLE_DECISIONS} more`}
        </button>
      ) : null}

      <LogDecisionDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(t, r) => create.mutate({ title: t, rationale: r || undefined })}
        submitting={create.isPending}
      />
    </div>
  );
}

function LogDecisionDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (title: string, rationale: string) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setTitle("");
          setRationale("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontSize: 19, fontWeight: 460 }}>
            Log decision
          </DialogTitle>
          <DialogDescription style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>
            Capture a choice that should outlive this week. Cadence reads these.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginBottom: 4 }}>
              title
            </MonoLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What was decided?"
              maxLength={280}
              autoFocus
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                width: "100%",
                background: "var(--card)",
                border: "1px solid var(--hairline)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginBottom: 4 }}>
              rationale · optional
            </MonoLabel>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why this, and not the alternative."
              rows={4}
              maxLength={2000}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                width: "100%",
                resize: "vertical",
                minHeight: 84,
                background: "var(--card)",
                border: "1px solid var(--hairline)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={!title.trim() || submitting}
            onClick={() => onSubmit(title.trim(), rationale.trim())}
          >
            {submitting ? "Logging…" : "Log decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

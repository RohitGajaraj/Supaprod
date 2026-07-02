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
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import {
  listDecisions,
  createDecision,
  updateDecision,
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
        to="/missions/$missionId"
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
        to="/prds/$id"
        params={{ id: d.prd_id }}
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  if (d.meeting_id) {
    return (
      <Link
        to="/knowledge"
        search={{ tab: "calendar", meeting: d.meeting_id }}
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
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
          className="outline-none uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
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

export function DecisionsPanel() {
  const [source, setSource] = useState<SourceFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const qc = useQueryClient();
  const fList = useServerFn(listDecisions);
  const fCreate = useServerFn(createDecision);
  const fUpdate = useServerFn(updateDecision);

  const listInput = {
    source: source === "all" ? undefined : source,
    status: status === "all" ? undefined : status,
    q: q.trim() || undefined,
  };
  const decisions = useQuery({
    queryKey: ["decisions", listInput],
    queryFn: () => fList({ data: listInput }),
  });

  const create = useMutation({
    mutationFn: (data: { title: string; rationale?: string }) => fCreate({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      toast.success("Decision logged · the swarm reads it");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (data: { id: string; status: "approved" | "rejected" | "pending" }) =>
      fUpdate({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
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
          placeholder="Search titles"
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
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
        <div style={{ padding: "18px 2px" }}>
          <MonoLabel>LOADING</MonoLabel>
        </div>
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
            border: "1px solid rgba(127,191,142,0.3)",
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
              fontSize: 9,
              color: "var(--text-faint)",
              textTransform: "uppercase",
            }}
          >
            <span>Decision</span>
            <span>Made by</span>
            <span>When</span>
            <span>Why</span>
          </div>
          {rows.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() =>
                navigate({ to: "/knowledge", search: { tab: "decisions", decision: d.id } })
              }
              className="w-full text-left outline-none hover:[background-color:#141416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                padding: "13px 18px",
                alignItems: "baseline",
                borderBottom: i < rows.length - 1 ? "1px solid var(--hairline)" : "none",
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
                    {d.title}
                  </span>
                </span>
                {d.status === "pending" ? (
                  <span className="flex" style={{ gap: 6, marginTop: 7 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        update.mutate({ id: d.id, status: "approved" });
                      }}
                      className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      style={{
                        fontSize: 11,
                        color: "var(--moss)",
                        background: "transparent",
                        border: "1px solid rgba(127,191,142,0.35)",
                        borderRadius: 6,
                        padding: "3px 9px",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        update.mutate({ id: d.id, status: "rejected" });
                      }}
                      className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      style={{
                        fontSize: 11,
                        color: "var(--madder)",
                        background: "transparent",
                        border: "1px solid rgba(224,101,87,0.35)",
                        borderRadius: 6,
                        padding: "3px 9px",
                      }}
                    >
                      Send back
                    </button>
                  </span>
                ) : null}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: d.decided_by_agent_slug ? "var(--glacier)" : "var(--text-muted)",
                }}
              >
                {displayWho(d.decided_by_agent_slug)}
              </span>
              <span
                className="tabular-nums"
                style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-faint)" }}
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
            Capture a choice that should outlive this week. The swarm reads these.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <MonoLabel style={{ fontSize: 8.5, marginBottom: 4 }}>title</MonoLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What was decided?"
              maxLength={280}
              autoFocus
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
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
            <MonoLabel style={{ fontSize: 8.5, marginBottom: 4 }}>rationale · optional</MonoLabel>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why this, and not the alternative."
              rows={4}
              maxLength={2000}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
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

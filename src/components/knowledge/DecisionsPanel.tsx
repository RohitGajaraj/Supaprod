/**
 * Decisions. The ledger of calls, and the main list on Brain.
 *
 * Ported to the --sp-* system. The surface (routes/_authenticated.brain.tsx)
 * already titles the section with a Block and already answers "who is here and
 * why", so this file owns the INTERIOR only: what a row says, and what it
 * refuses to say.
 *
 * WHAT WENT, and why. The founder ruling this pass answers: "Why do we need so
 * bigger things to display? If a user wants to know, he will click deeper and
 * understand the context, rather than we showcase everything on the cards."
 *
 *   KILLED the four-column grid and its mono column header. A header row over
 *     eight rows is a second heading grammar inside a section the surface
 *     already titled, and the columns forced every value to a fixed width it
 *     did not want.
 *   KILLED the bordered card around the list. The surface puts this panel in a
 *     Block; a bordered box inside a region is a card in a card.
 *   KILLED the "Why" column. It was already truncated to one ellipsised line
 *     at 200px, which is not a rationale, it is the shape of one. The whole
 *     rationale is one click away in DecisionDetail.
 *   KILLED the per-row audit tag and the auto chip. Both were a THIRD line on
 *     a list row, and both live in DecisionDetail, which is the click.
 *   KILLED the per-row "Decide on Today" link (an interactive span nested in
 *     the row's own button, to dodge invalid DOM nesting). N links to one
 *     destination collapse into one line under the list.
 *   KILLED the two bordered filter pill groups. Two selects and a search field
 *     say the same thing with no chrome, and their default option is the
 *     label, so nothing is said twice.
 *
 * COLOUR. Green for a call that was kept, red for one that was dropped: those
 * are outcomes, and outcomes own those two. Pending stays MONOCHROME on
 * purpose. Ember marks the one thing waiting on you, and on Brain nothing is:
 * the one-home law puts deciding on Today, so the ember budget belongs there
 * and this surface is the record of it.
 *
 * ATTRIBUTION. Every row carries a mark and a name. An agent slug resolves
 * through the catalog; a null slug is the human (createDecision writes the
 * stage actor as "human" when no agent slug is given), so it reads as You and
 * wears the solid disc rather than a glyph.
 *
 * UNCHANGED: listDecisions / createDecision, the ["decisions", listInput] key,
 * the debounce, the ?decision= drill, VISIBLE_DECISIONS, and the SourceLink +
 * OBS_STATUS_TONE exports that DecisionDetail imports from here.
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
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
import type { VerdictTone } from "@/components/obsidian/verdict";
import {
  Actions,
  AgentMark,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Num,
  Row,
  Select,
  Textarea,
  YouMark,
} from "@/components/shell/primitives";
import { ageOf, displayWho, SOURCE_LABEL } from "./decisions-shared";
import { stripAutoPrefix } from "@/components/plan/format";

type SourceFilter = "all" | DecisionSource;
type StatusFilter = "all" | "pending" | "approved" | "rejected";

// Obsidian-specific tone map. DecisionDetail.tsx still renders a VerdictChip
// from it, so the export stays exactly as it was even though this panel no
// longer draws a chip.
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

/** The outcome, in plain words. Green and red carry outcomes; a call nobody
 *  has settled yet is not an outcome, so it stays monochrome. */
const OUTCOME: Record<DecisionRow["status"], { word: string; tone: string }> = {
  approved: { word: "Kept", tone: "sp-pass" },
  rejected: { word: "Dropped", tone: "sp-fail" },
  pending: { word: "Not settled", tone: "" },
};

/** Who acted, and what they actually did. A null slug is the human, and a
 *  pending row has nobody who decided it yet, so it must never read as though
 *  someone did. */
function whoLine(d: DecisionRow): string {
  const who = displayWho(d.decided_by_agent_slug);
  if (d.status === "pending") {
    return d.decided_by_agent_slug ? `${who} raised it` : `${who} logged it`;
  }
  return `${who} settled it`;
}

function initialsFrom(email: string | null, name: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the list shows the top few
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

  // You are an actor in this ledger, so you get a mark like every other actor.
  // Read once on mount, the same way the shell and the two other ported
  // surfaces read it.
  const [initials, setInitials] = useState("?");
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setInitials(
        initialsFrom(
          data.user?.email ?? null,
          (data.user?.user_metadata?.full_name as string | undefined) ?? null,
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, []);

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
      toast.success("Logged to the record.");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = decisions.data?.decisions ?? [];
  const shown = showAll ? rows : rows.slice(0, VISIBLE_DECISIONS);
  const waiting = rows.filter((d) => d.status === "pending").length;
  const filtered = source !== "all" || status !== "all" || debouncedQ.trim().length > 0;
  // Nothing on the record at all is a different fact from nothing matching a
  // filter, and it wants a different screen: no filter row over an empty
  // ledger, and the one door that starts it.
  const virgin = !decisions.isLoading && !decisions.isError && rows.length === 0 && !filtered;

  const clearFilters = () => {
    setSource("all");
    setStatus("all");
    setQ("");
  };

  return (
    <div>
      {virgin ? null : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--sp-space-2)",
            marginBottom: "var(--sp-space-3)",
          }}
        >
          <span style={{ flex: "none", width: 152 }}>
            <Select
              value={source}
              onChange={(e) => setSource(e.target.value as SourceFilter)}
              aria-label="Filter by where the call came from"
            >
              <option value="all">Any source</option>
              {(["meeting", "mission", "prd", "manual"] as const).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </Select>
          </span>
          <span style={{ flex: "none", width: 152 }}>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              aria-label="Filter by outcome"
            >
              <option value="all">Any outcome</option>
              <option value="pending">Not settled</option>
              <option value="approved">Kept</option>
              <option value="rejected">Dropped</option>
            </Select>
          </span>
          <span style={{ flex: "1 1 170px", minWidth: 150, maxWidth: 280 }}>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search decisions by title"
              placeholder="Search titles"
            />
          </span>
          <span style={{ marginLeft: "auto" }}>
            <Button onClick={() => setOpen(true)}>Log decision</Button>
          </span>
        </div>
      )}

      {decisions.isLoading ? null : decisions.isError ? (
        <Failed onRetry={() => void decisions.refetch()}>
          {(decisions.error as Error).message}
        </Failed>
      ) : rows.length === 0 ? (
        filtered ? (
          <Empty action={<Button onClick={clearFilters}>Clear the filter</Button>}>
            No call on the record matches that.
          </Empty>
        ) : (
          <Empty action={<Button onClick={() => setOpen(true)}>Log decision</Button>}>
            Calls land here on their own when a mission completes, a spec is approved, or a meeting
            transcript is read. Log one yourself when the call was made somewhere else.
          </Empty>
        )
      ) : (
        shown.map((d) => (
          <Row
            key={d.id}
            tight
            marks={
              d.decided_by_agent_slug ? (
                <AgentMark slug={d.decided_by_agent_slug} state="quiet" />
              ) : (
                <YouMark initials={initials} />
              )
            }
            lead={stripAutoPrefix(d.title)}
            // The second line is a DIFFERENT fact, never more of the first:
            // where the call stands, and who put it there.
            sub={
              <>
                <span className={OUTCOME[d.status].tone || undefined}>
                  {OUTCOME[d.status].word}
                </span>
                {" · "}
                {whoLine(d)}
              </>
            }
            time={ageOf(d.created_at)}
            onClick={() => navigate({ to: "/brain", search: { tab: "decisions", decision: d.id } })}
          />
        ))
      )}

      {rows.length > VISIBLE_DECISIONS || waiting > 0 ? (
        <Actions>
          {rows.length > VISIBLE_DECISIONS ? (
            <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? (
                "Show fewer"
              ) : (
                <>
                  Show <Num>{rows.length - VISIBLE_DECISIONS}</Num> more
                </>
              )}
            </Button>
          ) : null}
          {/* One-home law: a call is settled on Today, never twice. The list
              stays the record and sends you to the one place that decides. */}
          {waiting > 0 ? (
            <Button variant="ghost" onClick={() => navigate({ to: "/today" })}>
              Settle <Num>{waiting}</Num> on Today
            </Button>
          ) : null}
        </Actions>
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
          <DialogTitle>Log a decision</DialogTitle>
          {/* Different information from the title, not a restatement of it. */}
          <DialogDescription style={{ color: "var(--sp-mute)" }}>
            A call made outside the loop. The crew reads it before it acts again.
          </DialogDescription>
        </DialogHeader>
        <Field label="What was decided">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={280}
            autoFocus
          />
        </Field>
        <Field label="Why this, and not the alternative">
          <Textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </Field>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!title.trim() || submitting}
            onClick={() => onSubmit(title.trim(), rationale.trim())}
          >
            {submitting ? "Logging" : "Log decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

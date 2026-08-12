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
 * SECOND PASS, 2026-07-29. The founder opened a ported page, clicked something,
 * and the legacy design came back. Two defects here, both of them that shape:
 *
 *   KILLED the "Log a decision" DIALOG. A two-field composer over a list is a
 *     panel, not a single irreversible confirmation, so anti-slop ban 11 rules
 *     it out and primitives.tsx names the pane as deliberately absent. The
 *     composer is IN PLACE now, above the ledger it is about to write to, which
 *     is what admin/people and crew both do.
 *   KILLED the "Logged to the record." success toast. Writing a call into the
 *     ledger every agent reads before it acts is not a four-second fact
 *     (agents/FINAL-agent-presence.md R10). It leaves a Receipt carrying the
 *     real consequence, and a failed write leaves a failed receipt.
 *   KILLED the OBS_STATUS_TONE export and its VerdictTone import. The chip it
 *     fed is retired; the outcome is a WORD now, carried by sp-pass / sp-fail,
 *     and it lives once in decisions-shared.ts as OUTCOME_WORD so the list and
 *     the drill cannot drift.
 *
 * UNCHANGED: listDecisions / createDecision, the ["decisions", listInput] key,
 * the debounce, the ?decision= drill, VISIBLE_DECISIONS, and the SourceLink
 * export that DecisionDetail imports from here.
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/components/admin/admin-ui";
import {
  DECISION_SOURCES,
  listDecisions,
  createDecision,
  type DecisionRow,
  type DecisionSource,
} from "@/lib/decisions.functions";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Loading,
  Num,
  Receipt,
  Row,
  Select,
  Textarea,
  YouMark,
} from "@/components/shell/primitives";
import { ageOf, displayWho, OUTCOME_WORD, SOURCE_LABEL } from "./decisions-shared";
import { stripAutoPrefix } from "@/components/plan/format";

type SourceFilter = "all" | DecisionSource;
type StatusFilter = "all" | "pending" | "approved" | "rejected";

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

  // THE COMMIT. Session local on purpose: the durable record is the ledger
  // itself, one row below, and a second copy of it here would be a second
  // source of one truth.
  const [settled, setSettled] = useState<
    { id: string; verb: string; consequence: string; failed?: boolean; at: string }[]
  >([]);
  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        verb,
        consequence,
        failed,
        at: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      },
      ...prev,
    ]);

  const create = useMutation({
    mutationFn: (vars: {
      title: string;
      rationale?: string;
      forecast_claim?: string;
      forecast_how_we_will_know?: string;
      forecast_horizon_date?: string;
    }) => fCreate({ data: vars }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      // What it CAUSED, not that the click registered: a logged call is read by
      // every agent before it touches the same surface again.
      commit(
        "You made a call",
        `"${vars.title}" is on the record. The crew reads it before it acts on the same surface again.`,
      );
      setOpen(false);
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to make a call",
        `"${vars.title}" was not written. ${e.message || "The write failed."}`,
        true,
      ),
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
              {/*
                THE LIST COMES FROM THE SOURCE OF TRUTH, not a second hand-typed
                copy of it. This was `["meeting","mission","prd","manual"]`,
                which is the same stale four that SOURCE_LABEL held, so the 50
                decisions carrying roadmap / critic / retrospective /
                opportunity could not be filtered to at all — the option was
                never rendered. A hard-coded list here can only ever be right by
                someone remembering; deriving it means a new origin appears the
                moment it is added, or fails to compile.
              */}
              {DECISION_SOURCES.map((s) => (
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
            <Button
              aria-expanded={open}
              aria-controls="decisions-composer"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Close" : "Log decision"}
            </Button>
          </span>
        </div>
      )}

      {/* IN PLACE, never a dialog. It opens above the ledger it is about to
          write to, so the calls already on the record stay readable while you
          write the next one. */}
      {open ? (
        <LogDecision
          id="decisions-composer"
          onCancel={() => setOpen(false)}
          onSubmit={(v) =>
            create.mutate({
              title: v.title,
              rationale: v.rationale || undefined,
              forecast_claim: v.forecast?.claim,
              forecast_how_we_will_know: v.forecast?.howWeWillKnow,
              forecast_horizon_date: v.forecast?.horizonISO,
            })
          }
          submitting={create.isPending}
        />
      ) : null}

      {settled.map((s) => (
        <Receipt
          key={s.id}
          initials={initials}
          verb={s.verb}
          consequence={s.consequence}
          time={s.at}
          failed={s.failed}
        />
      ))}

      {/* A COLD LOAD PAINTED A FILTER ROW OVER NOTHING. This was `null`, and
          the surface mounts this panel inside a Block it has already drawn and
          titled, so the first visit to Brain's default tab showed a bordered
          region with a source filter, a status filter, a search box and a "Log
          decision" button standing over empty space. Every control implied
          there was a ledger under it. A read in flight is not an empty ledger,
          and Loading is the primitive that says which one this is. */}
      {decisions.isLoading ? (
        <Loading>Reading the calls on the record.</Loading>
      ) : decisions.isError ? (
        /* AND A FAILURE SAYS WHAT FAILED, 2026-08-11. The same argument one
           branch up, applied to the branch beside it: this printed the raw
           exception and nothing else, on the DEFAULT tab of this surface, so a
           reader arriving at Brain with the backend down saw a fetch-error
           string where the ledger goes and no sentence telling them the calls
           were still there. Every other failure arm on Brain leads with the
           claim it is refusing to make and then appends the message. */
        <Failed onRetry={() => void decisions.refetch()}>
          The calls did not load, so this is not a claim that none are on the record.{" "}
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
                <span className={OUTCOME_WORD[d.status].tone || undefined}>
                  {OUTCOME_WORD[d.status].word}
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
    </div>
  );
}

/** The composer, in place. Two fields, because a call is a sentence and a
 *  reason, and the reason is the half every later agent actually reads. */
function LogDecision({
  id,
  onCancel,
  onSubmit,
  submitting,
}: {
  id: string;
  onCancel: () => void;
  onSubmit: (v: {
    title: string;
    rationale: string;
    forecast?: { claim: string; howWeWillKnow: string; horizonISO: string };
  }) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");

  /**
   * FC-01: the forecast, and this is the only place a person can record one.
   *
   * WHY IT IS OPTIONAL AND STAYS OPTIONAL. The server refuses a partial
   * forecast, never an absent one, and that asymmetry is the whole design. Make
   * the field required and people type "it will go well" to get past it, which
   * is a forecast-shaped object that settles nothing and then poisons the
   * calibration record it feeds. An empty forecast is honest. A vacuous one is
   * worse than nothing.
   *
   * WHY IT IS ON THIS FORM RATHER THAN A LATER EDIT. Migration 20260810180000
   * says capture at the moment the decision is committed, and the immutability
   * trigger freezes all three the instant they are set. A forecast added
   * afterwards, once anything is known, is a retrospective wearing a timestamp.
   * This is the one moment we can be sure the outcome is not yet available.
   */
  const [claim, setClaim] = useState("");
  const [howWeWillKnow, setHowWeWillKnow] = useState("");
  const [horizon, setHorizon] = useState("");

  const filled = [claim.trim(), howWeWillKnow.trim(), horizon].filter(Boolean).length;
  // All three or none, checked here as well as on the server. The server is the
  // authority; this exists so the person is told before they lose the form.
  const partial = filled > 0 && filled < 3;

  // `min` is tomorrow rather than today, because a horizon expiring within the
  // day is not one anybody can still be wrong about, and the server refuses any
  // horizon at or before now.
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  return (
    <div id={id}>
      <Block
        title="Log a decision"
        // Different information from the title, not a restatement of it.
        sub="A call made outside the loop. The crew reads it before it acts again."
      >
        <Field label="What was decided" htmlFor="decision-title">
          <Input
            id="decision-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={280}
            autoFocus
          />
        </Field>
        <Field label="Why this, and not the alternative" htmlFor="decision-rationale">
          <Textarea
            id="decision-rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </Field>

        <Field label="What do you expect to happen (optional)" htmlFor="decision-forecast-claim">
          <Textarea
            id="decision-forecast-claim"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </Field>
        {/* Said once, above the two fields it governs, rather than repeated on
            each. The lock is the surprising part and the person should meet it
            before they type, not after they try to edit. */}
        <p className="text-[12px] text-zinc-400">
          Recorded before the outcome is known, and locked once saved. This is the part nobody can
          reconstruct afterwards.
        </p>
        <Field label="How will you know" htmlFor="decision-forecast-signal">
          <Input
            id="decision-forecast-signal"
            value={howWeWillKnow}
            onChange={(e) => setHowWeWillKnow(e.target.value)}
            maxLength={500}
          />
        </Field>
        <Field label="By when" htmlFor="decision-forecast-horizon">
          <Input
            id="decision-forecast-horizon"
            type="date"
            min={tomorrow}
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
          />
        </Field>
        {partial ? (
          <p role="alert" className="text-[12px] text-zinc-400">
            A forecast needs all three: what you expect, how you will know, and by when. Without the
            signal it cannot be settled, and without a date it never comes due.
          </p>
        ) : null}

        <Actions
          trailing={
            <Button variant="ghost" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="primary"
            disabled={!title.trim() || submitting || partial}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                rationale: rationale.trim(),
                forecast:
                  filled === 3
                    ? {
                        claim: claim.trim(),
                        howWeWillKnow: howWeWillKnow.trim(),
                        // The date control yields YYYY-MM-DD with no time. Read
                        // as the END of that day in the person's own timezone,
                        // which is what "by the 20th" means to whoever typed it.
                        // Taking midnight instead would silently shorten every
                        // horizon by a day.
                        horizonISO: new Date(`${horizon}T23:59:59`).toISOString(),
                      }
                    : undefined,
              })
            }
          >
            {submitting ? "Logging" : "Log decision"}
          </Button>
        </Actions>
      </Block>
    </div>
  );
}

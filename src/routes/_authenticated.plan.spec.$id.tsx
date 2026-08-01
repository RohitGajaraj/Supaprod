/**
 * The spec editor. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers. Pass
 * one ported it onto the primitives, which killed the second header and the
 * glass action bar and is kept. This pass decides what belongs on it at all,
 * because what pass one left was six tabs stacked on top of six always-on
 * blocks: the person on the Edit tab scrolled past their own document into
 * tasks, design readiness, a mockup, citations, provenance and an outcome
 * form. That is the pain point the founder named twice, on one page.
 *
 * 1. WHO IS HERE, AND WHY. A product lead with one spec open. They came to
 *    get its words right and hand it to the crew. Not to browse it, not to
 *    report on it: they leave when it is good enough to build.
 *
 * 2. THE ONE THING IT EXISTS FOR. To settle one spec and hand it off.
 *    Nowhere else in the product can you write this document's own words, and
 *    nowhere else does it become work.
 *
 * 3. KEEP / MOVE / KILL, on what pass one left standing:
 *    KEEP  the editable title, the textarea, the four assist actions, the six
 *          views, Save, Send to Build with its repo gate, Create GitHub issue,
 *          Capture as decision. Every one of these is where a decision about
 *          this spec is actually made.
 *    KEEP  the Critic's verdict and the rewind in the context column. That is
 *          the crew's record ON this spec, which is exactly what depth about
 *          the one thing in focus means.
 *    KEEP  Tasks and "why this spec exists" as the only two always-on blocks
 *          below the views. A spec exists to become work and to answer for
 *          itself; those are the two questions the document cannot answer.
 *    MOVE  the outcome form, the citations, the design-readiness checklist and
 *          the generated mockup OFF the always-on stack and INTO the view they
 *          belong to. Nothing sits below the tab body that is not scoped to
 *          it. The outcome joins the contract (what it promised, what got
 *          built, how it landed, in one place); citations join Preview (a
 *          document carries its own references); readiness joins Edit (advice
 *          about the words while you are writing them); the mockup joins Flow
 *          (what the spec implies, drawn).
 *    MOVE  the Linear push, a team <select> plus a Create issues button.
 *          DESTINATION: /sync, with the other workspace resource bindings.
 *          Choosing which external tracker a workspace exports to is a
 *          connection decision made once, not a control on a document.
 *          Going with it: listLinearTeams, createLinearIssuesFromTasks, the
 *          teamId state, and the last two uses of Field and Select here.
 *    KILL  <TaskGraphPanel>. "Build readiness: 40% complete, 3 ready, 2
 *          blocked" is build tracking, which /build/$missionId and Runs own
 *          completely, and the rows it summarised are one glance above it. It
 *          also drew a retired-system card (hairline, bg-card, mono-label,
 *          --rose) inside a Block, which is a card in a card.
 *    KILL  the three stacked nudges: <DecisionCurrencyBanner>,
 *          <PrecedentNudge>, <SharedPremiseNudge>. Three dismissible cards in
 *          the retired system (material-medium, VerdictChip, moss/madder/ember)
 *          sat between the actions and the views, and two of them answered the
 *          same question in different words: "decisions similar to this one"
 *          and "decisions built on the same premise as this one" is a
 *          distinction only the engineer who wrote them can feel. The record
 *          contradicting you is the most differentiated moment in the product
 *          and it now gets ONE region, in the Record recess, reading the same
 *          two server functions.
 *    KILL  <Who> around a task title. Who names the ACTOR in a row lead; a
 *          task title is not an actor. Pass-one misuse.
 *    KILL  every toast on this surface. Eight of them, including "Build
 *          session dispatched" (a mechanism word) and "Saved". A save now
 *          stamps the time in the status line, where the last-saved fact
 *          already lives; everything consequential writes a receipt.
 *
 * 4. ONE CLICK AWAY. The six views ARE the depth: nothing below the tab body
 *    is unscoped any more. Task rows are one line plus a different second
 *    fact and never wrap. A source signal is one line and opens in Discover.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is asking for a breakdown and
 *    watching the Planner's mark run, then reading back the tasks it wrote
 *    with your own spec's words in them. The confusion this page used to
 *    invite was scrolling for the document and finding a form about how the
 *    thing you have not written yet turned out.
 *
 * 6. WHERE THE CREW IS, AND WHAT IT PROVES. Remove the agents and this page
 *    changes visibly. The Planner's mark sits on the Tasks block and RUNS
 *    while it decomposes the spec (generateTaskGraph is the Planner by its own
 *    system prompt). The Critic's mark and verdict sit in the context column
 *    with the rewind that undoes what the crew wrote. Every consequential act
 *    leaves a receipt saying what it caused. What is deliberately NOT claimed:
 *    the four assist actions run one model call and are not a named agent, so
 *    they say "the crew" and no mark; prds carry no author column
 *    (FINAL-agent-presence C9) so the spec gets no byline rather than a
 *    guessed one; and Send to Build draws no arrow, because success navigates
 *    to the run and failure never pretends otherwise.
 *
 * THE COMMIT (R10). This surface dispatches: it opens issues, records
 * decisions, and hands the spec to Build. Those used to vanish into toasts. A
 * toast confirms that your click registered; a receipt renders what it
 * CAUSED. A failed write still writes a receipt and goes honest in the same
 * beat. No arrow is drawn anywhere here: the Planner has already finished when
 * its receipt is written, and Send to Build navigates you to the work itself,
 * so an arrow would point at nothing.
 *
 * THE EDITOR ITSELF IS UNTOUCHED. Every server call, mutation, query key,
 * route param and search param behind the document is the same:
 * getPrd/savePrd/prdAssist, the GitHub issue, Send to Build with its repo
 * gate, Capture as decision, the task-graph planner, the six tab values behind
 * `?tab=`, provenance, citations, and the outcome card.
 *
 * Internal identifiers (prd_id, getPrd, ["prd", id]) intentionally stay: the
 * user-facing word is "spec", the schema word stays prd (CLAUDE.md
 * rename-disclaimer pattern).
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  getPrd,
  savePrd,
  prdAssist,
  createGithubIssueForPrd,
  generateTaskGraph,
  type CriticReview,
  type OutcomeContract,
} from "@/lib/discovery.functions";
import { getProvenance } from "@/lib/lineage.functions";
import { getDecisionCurrency } from "@/lib/decision-currency.functions";
import { getDecisionPrecedent } from "@/lib/decision-precedent.functions";
import { CriticBadge } from "@/components/governance/CriticBadge";
import { RewindButton } from "@/components/prds/RewindButton";
import { CitationsCard, type Citation } from "@/components/product/CitationsCard";
import { OutcomeCard, type OutcomePrd } from "@/components/product/OutcomeCard";
import { OutcomeContractPanel } from "@/components/product/OutcomeContractPanel";
import { IntentVsBuiltReceipt } from "@/components/product/IntentVsBuiltReceipt";
import { SpecProjectionsPanel } from "@/components/product/SpecProjectionsPanel";
import { FlowDiagram } from "@/components/product/FlowDiagram";
import { LaunchPlanPanel } from "@/components/product/LaunchPlanPanel";
import { listTasks } from "@/lib/tasks.functions";
import { DesignReadinessPanel } from "@/components/product/DesignReadinessPanel";
import { DesignScaffoldPanel } from "@/components/product/DesignScaffoldPanel";
import { dispatchStudioSession } from "@/lib/studio.functions";
import { createDecision } from "@/lib/decisions.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Num,
  PageHead,
  Receipt,
  Record as RecordRecess,
  Row,
  Surface,
} from "@/components/shell/primitives";

const MODE_TABS = ["contract", "projections", "edit", "preview", "flow", "launch"] as const;
type ModeTab = (typeof MODE_TABS)[number];

/** Sentence case, plain words. The all-caps labels were shouting, and
 *  "PROJECTIONS" named a mechanism rather than the thing you get. */
const MODE_DISPLAY: { id: ModeTab; label: string; hint?: string }[] = [
  {
    id: "contract",
    label: "Contract",
    hint: "What this spec promises, what got built against it, and how it landed",
  },
  {
    id: "projections",
    label: "Documents",
    hint: "The PRD, the FRD, the status note and the one-pager, written fresh from the contract",
  },
  { id: "edit", label: "Edit", hint: "The words, and what they still have to say before design" },
  { id: "preview", label: "Preview", hint: "The spec as it reads, with what it cites" },
  { id: "flow", label: "Flow", hint: "The steps this spec implies, and the screen drawn from it" },
  {
    id: "launch",
    label: "Launch",
    hint: "Positioning, the checklist, and the window the outcome gets checked in",
  },
];

const ASSIST_ACTIONS = ["rewrite", "expand", "shorten", "critique"] as const;
const ASSIST_LABEL: Record<(typeof ASSIST_ACTIONS)[number], string> = {
  rewrite: "Rewrite",
  expand: "Expand",
  shorten: "Shorten",
  critique: "Critique",
};

/** Rendered markdown. There is no prose primitive, so the document's own
 *  ladder is written here once against the type scale rather than per call. */
const PREVIEW_COMPONENTS = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1
      style={{
        fontSize: "var(--sp-text-gate)",
        fontWeight: "var(--sp-weight-strong)",
        letterSpacing: "var(--sp-track-gate)",
        lineHeight: "var(--sp-leading-gate)",
        color: "var(--sp-ink)",
        margin: "0 0 14px",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2
      style={{
        fontSize: "var(--sp-text-body)",
        fontWeight: "var(--sp-weight-strong)",
        color: "var(--sp-ink)",
        margin: "26px 0 8px",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3
      style={{
        fontSize: "var(--sp-text-prose)",
        fontWeight: "var(--sp-weight-medium)",
        color: "var(--sp-ink)",
        margin: "20px 0 6px",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => <p style={{ margin: "0 0 12px" }}>{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul style={{ margin: "0 0 12px", paddingLeft: 20, listStyle: "disc" }}>{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol style={{ margin: "0 0 12px", paddingLeft: 20, listStyle: "decimal" }}>{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li style={{ margin: "0 0 5px" }}>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong style={{ color: "var(--sp-ink)", fontWeight: "var(--sp-weight-strong)" }}>
      {children}
    </strong>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code
      style={{
        fontFamily: "var(--sp-font-mono)",
        fontSize: "var(--sp-text-data)",
        background: "var(--sp-sink)",
        borderRadius: "var(--sp-radius-xs)",
        padding: "1px 5px",
      }}
    >
      {children}
    </code>
  ),
};

export const Route = createFileRoute("/_authenticated/plan/spec/$id")({
  // Optional so existing links/navigates work without search; CNV-04 lands
  // a freshly agent-authored spec straight on the Contract tab.
  validateSearch: (search: Record<string, unknown>): { tab?: ModeTab } => {
    const t = search.tab;
    return {
      tab: (MODE_TABS as readonly string[]).includes(t as string) ? (t as ModeTab) : undefined,
    };
  },
  component: SpecEditorPage,
  head: () => ({ meta: [{ title: "Spec · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <PageHead
        title="The spec did not load."
        sub={(error as Error)?.message ?? "No reason was reported."}
      />
      <Block>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Block>
    </Surface>
  ),
});

function SpecEditorPage() {
  /**
   * THE SPINE STAYS ON SCREEN INSIDE A DETAIL RECORD.
   *
   * Founder ruling 2026-08-01: "whenever we click any items in lines, pages,
   * sub items within those seven strip items... the strip should be constant
   * across all those items... so that the user also knows what it is and where
   * it is."
   *
   * A spec is Plan's detail record: you reach it by clicking a row on /plan, or
   * by keeping a bet on /decide. Until now the strip published on the seven
   * station surfaces and on runs, and nowhere else, so opening a spec dropped
   * you off the spine entirely. Nothing on screen said which of the seven
   * stations you were standing in, and the way back was the browser button.
   *
   * `define` is the station a spec belongs to, so the chip for Plan is lit
   * while you edit one, and the other six remain one click away at workspace
   * scope. This is the same one shared query every other spine surface reads
   * (use-spine-strip.ts), so it costs a cache read rather than a request.
   */
  useSpineStrip("define");
  const { id } = useParams({ from: "/_authenticated/plan/spec/$id" });
  const initialTab = Route.useSearch().tab;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fGet = useServerFn(getPrd);
  const mSave = useServerFn(savePrd);
  const mAssist = useServerFn(prdAssist);
  const mDispatchStudio = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const mCreateIssue = useServerFn(createGithubIssueForPrd);
  const mCaptureDecision = useServerFn(createDecision);
  const prdQ = useQuery({ queryKey: ["prd", id], queryFn: () => fGet({ data: { id } }) });

  // THE COMMIT (agents/FINAL-agent-presence.md R10). Every consequential act on
  // this surface used to end in a toast. A toast confirms that your click
  // registered; a receipt renders what your click CAUSED. Session-local on
  // purpose: the durable records are the decision, the issue and the run, and
  // duplicating them here would be a second source of the same truth.
  const [receipts, setReceipts] = useState<
    { key: number; verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);
  const receiptSeq = useRef(0);
  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const commit = (verb: string, consequence: string, failed?: boolean) => {
    receiptSeq.current += 1;
    setReceipts((r) =>
      [{ key: receiptSeq.current, verb, consequence, at: stamp(), failed }, ...r].slice(0, 6),
    );
  };

  // O1 (provenance): "why is this spec being built?": walk the lineage graph up
  // to the root source signals the spec ultimately rests on.
  const fProvenance = useServerFn(getProvenance);
  const provQ = useQuery({
    queryKey: ["provenance", "prd", id],
    queryFn: () => fProvenance({ data: { kind: "prd", id } }),
  });

  // The record speaking, in ONE region instead of three dismissible cards. Same
  // two server functions the retired nudges read; the third (shared premise)
  // answered the same question as the second in different words and is gone.
  const fCurrency = useServerFn(getDecisionCurrency);
  const fPrecedent = useServerFn(getDecisionPrecedent);
  const currencyQ = useQuery({
    queryKey: ["decision-currency", "prd", id],
    queryFn: () => fCurrency({ data: { kind: "prd" as const, id } }),
    staleTime: 60_000,
  });
  const precedentQ = useQuery({
    queryKey: ["decision-precedent", "prd", id],
    queryFn: () => fPrecedent({ data: { kind: "prd" as const, id } }),
    staleTime: 60_000,
  });

  const fTasks = useServerFn(listTasks);
  // Scoped under the "tasks" prefix (so every existing ["tasks"] invalidation
  // still hits it) but no longer colliding with other surfaces' global
  // ["tasks"] cache entry (audit D-14).
  const tasksQ = useQuery({ queryKey: ["tasks", "spec", id], queryFn: () => fTasks() });

  const prdTasks = (tasksQ.data?.tasks ?? []).filter(
    (t: { prd_id: string | null }) => t.prd_id === id,
  );

  // H1, the Planner: it decomposes the spec into a dependency-ordered task
  // graph, and it says so in its own system prompt, so naming it here is
  // attribution rather than decoration.
  const fGenTasks = useServerFn(generateTaskGraph);
  const genTasks = useMutation({
    mutationFn: () => fGenTasks({ data: { prd_id: id } }),
    onSuccess: (r: { count: number; graph: boolean }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      // No arrow on this receipt: the Planner has already finished by the time
      // it is written, so an arrow would point at nobody.
      commit(
        "You asked for a breakdown",
        `The Planner wrote ${r.count} task${r.count === 1 ? "" : "s"} from this spec${r.graph ? "" : ". Their order settles on the next sync"}.`,
      );
    },
    onError: (e: Error) => commit("Nothing was broken down", e.message, true),
  });

  // W5b: the dispatch repo gate. Set when Send to Build cannot resolve a
  // repo; the dialog offers /sync or provision-a-starter-repo + auto retry.
  const [repoGate, setRepoGate] = useState<{ reason: string | null } | null>(null);

  const sendToStudio = useMutation({
    mutationFn: () => mDispatchStudio({ data: { prdId: id } }),
    // Success writes no receipt because it navigates: the run itself is what
    // the click caused, rendered in full, and a line saying so would be gone
    // before it could be read.
    onSuccess: (r) => navigate({ to: "/build/$missionId", params: { missionId: r.missionId } }),
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else commit("Nothing was sent", e.message, true);
    },
  });
  const sendToBuild = () =>
    gateDispatch({
      check: () => fCanDispatch({ data: { prdId: id } }),
      dispatch: () => sendToStudio.mutate(),
      openGate: (reason) => setRepoGate({ reason }),
    });

  const createIssue = useMutation({
    mutationFn: () => mCreateIssue({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["prd", id] });
      commit(
        r.cached ? "It was already open" : "You opened the issue",
        `#${r.number} is on the repo. Send to Build can run now.`,
      );
    },
    onError: (e: Error) => commit("No issue was opened", e.message, true),
  });

  const captureDecision = useMutation({
    mutationFn: () =>
      mCaptureDecision({
        data: {
          title: `Spec decision: ${(title || prdQ.data?.prd?.title || "Untitled spec").slice(0, 220)}`,
          rationale: (body || prdQ.data?.prd?.body_md || "").slice(0, 500) || undefined,
          status: "approved",
          prd_id: id,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      // No arrow: nothing picks a recorded decision up. So the line says what
      // changed instead, which is the rule for a receipt with no handoff.
      commit(
        "You put it on the record",
        "This call is now a decision the crew can cite back to you.",
      );
    },
    onError: (e: Error) => commit("Nothing was recorded", e.message, true),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeTab>(initialTab ?? "contract");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prdQ.data?.prd) {
      setTitle(prdQ.data.prd.title);
      setBody(prdQ.data.prd.body_md);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prdQ.data?.prd?.id]);

  const save = useMutation({
    mutationFn: () => mSave({ data: { id, title, body_md: body } }),
    // A save is a keystroke, not a judgment, so it gets no receipt: it stamps
    // the time into the status line that already carries the last-saved fact.
    // A FAILED save does get one, because a write that did not happen must
    // never wear the shape of one that did.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prds"] });
      setSavedAt(stamp());
    },
    onError: (e: Error) => commit("Your edits are not saved", e.message, true),
  });

  // The retired action bar was sticky and blurred, which is the glass ban. The
  // keycap on Save replaces what stickiness bought on a long document, and it
  // is bound for real: a keycap that does nothing is a lie.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (!save.isPending) save.mutate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const assist = useMutation({
    mutationFn: (action: "rewrite" | "expand" | "critique" | "shorten") => {
      const ta = taRef.current;
      const sel =
        ta && ta.selectionStart !== ta.selectionEnd
          ? body.slice(ta.selectionStart, ta.selectionEnd)
          : body;
      if (!sel.trim()) throw new Error("Select some text first (or have content to work on)");
      return mAssist({ data: { action, selection: sel, context: body.slice(0, 4000) } });
    },
    onSuccess: (r) => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart,
        end = ta.selectionEnd;
      const next =
        start !== end ? body.slice(0, start) + r.text + body.slice(end) : body + "\n\n" + r.text;
      // The rewritten text lands in the editor in front of you. That IS the
      // confirmation, so there is nothing left for a toast to say.
      setBody(next);
    },
    onError: (e: Error) => commit("The rewrite did not land", e.message, true),
  });

  // State one of four: reading. A fact, not a spinner and not a fake skeleton.
  if (prdQ.isLoading) {
    return (
      <Surface>
        <PageHead title="Reading the spec." />
      </Surface>
    );
  }

  // Error and not-found are DIFFERENT states: a failed fetch never wears the
  // not-found instruction's clothes. getPrd's `.single()` throws PGRST116
  // ("multiple (or no) rows") when the id is missing or RLS-hidden, so that one
  // error shape IS the not-found case; everything else stays a real error.
  const specMissing =
    prdQ.isError &&
    /multiple \(or no\) rows|cannot coerce.*single/i.test((prdQ.error as Error)?.message ?? "");

  if (prdQ.isError && !specMissing) {
    return (
      <Surface>
        <PageHead
          title="The spec did not load."
          sub={(prdQ.error as Error)?.message ?? "No reason was reported."}
        />
        <Block>
          <Button variant="primary" onClick={() => prdQ.refetch()}>
            Try again
          </Button>
        </Block>
      </Surface>
    );
  }

  if (specMissing || !prdQ.data?.prd) {
    return (
      <Surface>
        <PageHead
          title="No spec here."
          sub="It was deleted, or it belongs to a workspace you are not in."
        />
        <Block>
          <Empty>Every live spec is listed on Plan.</Empty>
          <Actions>
            <Button variant="primary" onClick={() => navigate({ to: "/plan" })}>
              Go to Plan
            </Button>
          </Actions>
        </Block>
      </Surface>
    );
  }

  const prd = prdQ.data.prd;
  const issueMatch = prd.github_issue_url ? prd.github_issue_url.match(/\/issues\/(\d+)/) : null;
  const hasSnapshot = Boolean((prd as { snapshot_before?: unknown }).snapshot_before);
  const citations = (prd as { citations?: Citation[] | null }).citations ?? null;
  const signals = provQ.data?.source_signals ?? [];
  const signalCount = provQ.data?.signal_count ?? 0;

  const orderedTasks = [...prdTasks].sort(
    (a: { seq?: number | null }, b: { seq?: number | null }) => (a.seq ?? 999) - (b.seq ?? 999),
  );

  // The record either contradicts you or it confirms you, and it gets ONE
  // region. A stale decision outranks a precedent, because acting on ground
  // that has already moved is the more expensive mistake.
  const currency = currencyQ.data ?? null;
  const precedent = precedentQ.data ?? [];
  const recordSays = currency
    ? currency.superseded
      ? `A later decision replaced this one${currency.governingTitle ? `, "${currency.governingTitle}"` : ""}. Work from that, not from here.`
      : "A later outcome contradicted this. What it promises is no longer safe ground."
    : precedent.length > 0
      ? "You have reasoned this way before. This is how it landed."
      : null;
  const LANDED: Record<string, string> = {
    validated: "it worked",
    missed: "it missed",
    mixed: "mixed result",
  };

  return (
    <>
      <Surface
        wide
        context={
          <>
            <div className="sp-ctx-head">Linked work</div>
            <div className="sp-ctx-body">
              <Num>{prdTasks.length}</Num> {prdTasks.length === 1 ? "task" : "tasks"} on this spec.{" "}
              {issueMatch ? (
                <a
                  href={prd.github_issue_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit" }}
                >
                  Issue #{issueMatch[1]}
                </a>
              ) : (
                "No GitHub issue yet."
              )}
            </div>

            {/* Attribution, not a label. "Review" named the mechanism and hid
                the worker; the Critic red-teams this spec and its verdict is
                its own, so it signs it. */}
            <div className="sp-ctx-head">What the Critic says</div>
            <div className="sp-ctx-row">
              <AgentMark slug="critic" state="quiet" />
              <span>
                <CriticBadge
                  review={(prd as { critic_review?: CriticReview | null }).critic_review ?? null}
                  target={{ kind: "prd", id }}
                  invalidateKey={["prd", id]}
                />
              </span>
            </div>

            {hasSnapshot ? (
              <>
                <div className="sp-ctx-head">Before the crew touched it</div>
                <div className="sp-ctx-body">
                  <RewindButton prdId={id} hasSnapshot={true} />
                </div>
              </>
            ) : null}
          </>
        }
      >
        {/* The title is the h1 and it is editable in every view, the way it
            always was. There is no editable-title primitive, so it wears the
            title class and keeps a resting rule to say it can be typed in. */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Spec title"
          className="sp-title"
          style={{
            width: "100%",
            maxWidth: "56ch",
            background: "none",
            border: 0,
            borderBottom: "1px solid var(--sp-line-soft)",
            borderRadius: 0,
            outline: "none",
            padding: "0 0 6px",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--sp-mute)")}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--sp-line-soft)")}
        />
        {/* Two facts, never the same one twice: what state it is in, and when
            its words last changed. A save stamps the second one rather than
            firing a toast that says a thing this line already says. */}
        <div className="sp-subtitle">
          {prd.status} · saved <Num>{savedAt ?? new Date(prd.updated_at).toLocaleDateString()}</Num>
        </div>

        <Actions>
          <Button
            variant="primary"
            shortcut="⌘S"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving" : "Save"}
          </Button>
          {prd.github_issue_url ? (
            <Button
              disabled={sendToStudio.isPending}
              onClick={() => void sendToBuild()}
              title="Plan, stage and open a pull request for this issue"
            >
              {sendToStudio.isPending ? "Sending" : "Send to Build"}
            </Button>
          ) : (
            <Button
              disabled={createIssue.isPending}
              onClick={() => createIssue.mutate()}
              title="Send to Build opens once the issue exists"
            >
              {createIssue.isPending ? "Creating" : "Create GitHub issue"}
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={captureDecision.isPending}
            onClick={() => captureDecision.mutate()}
            title="Put this on the record as a decision"
          >
            {captureDecision.isPending ? "Recording" : "Capture as decision"}
          </Button>
        </Actions>

        {/* THE COMMIT (R10). What you did here, and what it caused. It appears
            only once you have acted, and a failed write lands in the same
            place wearing its failure rather than a success shape. */}
        {receipts.length > 0 ? (
          <Block title="What you did here">
            {receipts.map((r) => (
              <Receipt
                key={r.key}
                verb={r.verb}
                consequence={r.consequence}
                time={r.at}
                failed={r.failed}
              />
            ))}
          </Block>
        ) : null}

        {/* The record, in one region. It speaks before you commit or it stays
            silent; it never introduces itself. */}
        {recordSays ? (
          <Block>
            <RecordRecess
              evidence={
                precedent.length > 0 ? (
                  <>
                    <Num>{precedent.length}</Num> past{" "}
                    {precedent.length === 1 ? "decision" : "decisions"} on this ground
                  </>
                ) : undefined
              }
            >
              {recordSays}
            </RecordRecess>
            {precedent.slice(0, 3).map((p) => (
              <Row
                key={p.id}
                tight
                lead={p.title?.trim() || p.summary}
                sub={`${LANDED[p.verdict] ?? p.verdict}${p.governing ? " · and it has since been overtaken" : ""}`}
              />
            ))}
          </Block>
        ) : null}

        <div
          className="sp-tabs"
          role="tablist"
          aria-label="Spec views"
          // Left/Right move between tabs (roving focus), unchanged.
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const idx = MODE_DISPLAY.findIndex((t) => t.id === mode);
            const delta = e.key === "ArrowRight" ? 1 : -1;
            const next = MODE_DISPLAY[(idx + delta + MODE_DISPLAY.length) % MODE_DISPLAY.length];
            setMode(next.id);
            e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab-id="${next.id}"]`)?.focus();
          }}
        >
          {MODE_DISPLAY.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={mode === m.id}
              tabIndex={mode === m.id ? 0 : -1}
              data-tab-id={m.id}
              title={m.hint}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "edit" ? (
          <>
            <Block
              // Work in motion, while it happens rather than after: the sub
              // says what is running the moment it starts. No mark, because
              // the four assist actions are one model call and not a named
              // agent, and a mark here would claim a worker that is not there.
              sub={
                assist.isPending
                  ? "The crew is rewriting your selection."
                  : "The crew rewrites what you select. Select nothing and it works on the whole spec."
              }
            >
              {/* The Textarea primitive does not forward a ref and the assist
                  mutation needs the selection, so this is the primitive's class
                  on a raw control rather than a second control. */}
              <textarea
                ref={taRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                aria-label="Spec body, markdown"
                spellCheck={false}
                rows={26}
                className="sp-textarea"
                style={{ fontFamily: "var(--sp-font-mono)" }}
              />
              <Actions>
                {ASSIST_ACTIONS.map((a) => (
                  <Button
                    key={a}
                    variant="ghost"
                    disabled={assist.isPending}
                    onClick={() => assist.mutate(a)}
                  >
                    {ASSIST_LABEL[a]}
                  </Button>
                ))}
              </Actions>
            </Block>
            {/* MOVED here from the always-on stack. It names what this spec
                still has to say before design can start, which is advice about
                the words you are typing and belongs beside them. It goes quiet
                on a blank spec, so it draws no Block of its own. */}
            <DesignReadinessPanel body={body} />
          </>
        ) : mode === "preview" ? (
          <>
            <Block>
              {body.trim() ? (
                <article
                  style={{
                    maxWidth: "72ch",
                    fontSize: "var(--sp-text-body)",
                    lineHeight: "var(--sp-leading-body)",
                    color: "var(--sp-body)",
                  }}
                >
                  <ReactMarkdown components={PREVIEW_COMPONENTS}>{body}</ReactMarkdown>
                </article>
              ) : (
                <Empty>Nothing is written yet. Switch to Edit and start it.</Empty>
              )}
            </Block>
            {/* MOVED here from the always-on stack. A document carries its own
                references; they were floating three blocks below it. */}
            {citations && citations.length > 0 ? (
              <Block>
                <CitationsCard citations={citations} />
              </Block>
            ) : null}
          </>
        ) : mode === "contract" ? (
          <>
            <Block>
              <OutcomeContractPanel
                prdId={id}
                specTitle={prd.title}
                bodyMd={body}
                contract={(prd as { contract?: OutcomeContract | null }).contract}
                invalidateKey={["prd", id]}
              />
            </Block>
            {/* RPT-44: the honest intent-vs-built receipt lives beside the contract. */}
            <Block>
              <IntentVsBuiltReceipt prdId={id} />
            </Block>
            {/* MOVED here from the bottom of the page. What it promised, what
                got built, and how it landed are one subject, and they were
                three screens apart with an editor between them. */}
            <Block>
              <OutcomeCard prd={prd as unknown as OutcomePrd} invalidateKey={["prd", id]} />
            </Block>
          </>
        ) : mode === "projections" ? (
          <Block>
            <SpecProjectionsPanel
              title={prd.title}
              status={prd.status}
              updatedAt={prd.updated_at}
              contract={(prd as { contract?: OutcomeContract | null }).contract}
              bodyMd={body}
              citations={(citations ?? []).map((c) => ({
                label: c.title?.trim() || c.source_kind,
              }))}
            />
          </Block>
        ) : mode === "flow" ? (
          <>
            <Block>
              <FlowDiagram prdId={id} />
            </Block>
            {/* MOVED here from the always-on stack. The steps this spec implies
                and the screen the crew drew from it answer the same question,
                which is what this spec looks like when it exists. It goes
                silent on its own, so it draws no Block. */}
            <DesignScaffoldPanel prdId={id} specBody={body} />
          </>
        ) : (
          <Block>
            <LaunchPlanPanel prdId={id} />
          </Block>
        )}

        {/* WHERE THE CREW IS. generateTaskGraph is the Planner by its own
            system prompt, so the mark is attribution, and it RUNS while the
            work runs and stops the moment it does. Remove the agents from this
            product and this block loses both its mark and its only action. */}
        <Block
          title="The work this implies"
          sub={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <AgentMark slug="sprint-planner" state={genTasks.isPending ? "running" : "quiet"} />
              {genTasks.isPending
                ? "The Planner is breaking the spec down."
                : "The Planner breaks a settled spec into work you could sequence."}
            </span>
          }
          more={genTasks.isPending ? "Working" : "Break it into tasks"}
          onMore={() => {
            if (!genTasks.isPending) genTasks.mutate();
          }}
        >
          {tasksQ.isLoading ? null : orderedTasks.length === 0 ? (
            <Empty>
              No tasks yet. Break the spec into tasks when it is settled enough to build.
            </Empty>
          ) : (
            orderedTasks.map(
              (t: {
                id: string;
                seq?: number | null;
                title: string;
                detail?: string | null;
                estimate_hours?: number | null;
                assignee_kind?: string;
                risk?: string | null;
                depends_on?: unknown;
              }) => (
                <Row
                  key={t.id}
                  tight
                  marks={t.seq != null ? <Num>{t.seq}</Num> : null}
                  lead={t.title}
                  sub={
                    <>
                      {t.assignee_kind === "human" ? "you" : "the crew"}
                      {t.detail ? ` · ${t.detail}` : ""}
                      {Array.isArray(t.depends_on) && t.depends_on.length > 0 ? (
                        <>
                          {" · after "}
                          <Num>{(t.depends_on as number[]).map((n) => `#${n}`).join(", ")}</Num>
                        </>
                      ) : null}
                      {t.risk ? (
                        <>
                          {" · "}
                          <span className="sp-warn" title={t.risk}>
                            at risk
                          </span>
                        </>
                      ) : null}
                    </>
                  }
                  time={t.estimate_hours ? `${t.estimate_hours}h` : null}
                />
              ),
            )
          )}
        </Block>

        {/* O1 provenance. The one remaining always-on block, and it earns it:
            it is the only thing on the page that answers for the spec rather
            than describing it, and no view owns that question. The Record
            recess it used to draw is gone from here, because the recess is the
            one lit surface in the product and this page spends it above, on
            the record contradicting you. */}
        <Block
          title="Why this spec exists"
          sub={
            signalCount > 0 ? (
              <>
                It was not invented here. It traces back through <Num>{provQ.data!.node_count}</Num>{" "}
                {provQ.data!.node_count === 1 ? "step" : "steps"} to <Num>{signalCount}</Num>{" "}
                {signalCount === 1 ? "thing" : "things"} people actually said
                {provQ.data!.truncated ? ", and the chain continues past these" : ""}.
              </>
            ) : undefined
          }
        >
          {provQ.isLoading ? null : provQ.isError ? (
            <Failed onRetry={() => provQ.refetch()}>The chain did not come back.</Failed>
          ) : signalCount === 0 ? (
            <Empty>
              Nothing upstream. This one was written directly rather than raised by something a
              customer said.
            </Empty>
          ) : (
            // Five, not eight. Depth is a click away, and Discover owns the
            // full chain.
            signals.slice(0, 5).map((s) => (
              <Row
                key={s.id}
                tight
                lead={(s.title ?? s.content ?? "signal").slice(0, 120)}
                sub={s.source ?? "signal"}
                onClick={() =>
                  // Carries the signal id so Discover can focus it (the old
                  // link dropped it, audit D-14).
                  navigate({
                    to: "/discover",
                    search: { tab: "signals", focus: s.id } as never,
                  })
                }
              />
            ))
          )}
        </Block>
      </Surface>

      <RepoGateDialog
        open={repoGate !== null}
        prdId={id}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => sendToStudio.mutate()}
      />
    </>
  );
}

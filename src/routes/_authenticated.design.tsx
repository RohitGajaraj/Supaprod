/**
 * Design. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md, all seven).
 *
 * WHY THIS PASS EXISTS. An audit of the 01..07 spine by the server functions
 * each surface actually calls found Design the thinnest stage in the product:
 * four calls, so you could settle a brand rule and toggle a share link, and
 * that was the entire stage. Meanwhile `generateDesignScaffold` existed,
 * `prd_scaffolds` held real HTML, `getDesignGate`/`decideDesignGate` existed
 * and gated every dispatch in the product, and this surface called none of it.
 * `publishPrototypeFromPrd` had no caller ANYWHERE, so the prototype list here
 * listed rows nothing in the product could create. The previous header claimed
 * the publish control had MOVED to the spec page. It had not; it was deleted.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO. A product lead whose
 *    crew has drawn a screen. They came to look at it and say what happens to
 *    it next.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE. To judge a drawn
 *    screen: see it running, learn what letting it through costs, and let it
 *    through or send it back. Nowhere else in the product can you do that. The
 *    spec page can, for exactly one spec, under a tab called "flow"; a person
 *    holding a design review has no idea that is where the drawings live, and
 *    the block message the dispatch throws sends them there by name. This is
 *    the stage view: every drawing in the workspace, and the gate on each.
 *
 * 3. KEEP / MOVE / KILL.
 *    KEEP the brand-rule Gate. Nothing binds into a drawing until it is
 *         settled, so it is still the first call when one is waiting, and it
 *         is still the biggest thing on the page.
 *    KEEP the rule's provenance and "behind this one" in the context column.
 *    KILL the workspace-wide prototype list. `/artifacts` already lists every
 *         prototype, with rename, delete and lineage, one click away, so this
 *         was a duplicate of a better surface (question 3's own test). The
 *         share machinery is not lost, it moved to the drawing it belongs to:
 *         a link is a fact ABOUT one drawn screen, not a category of thing.
 *    KILL the "Prototypes" empty state that told you to go and publish from a
 *         spec page. The control it pointed at did not exist.
 *    ADD  the drawings, the gate on each, the fidelity spectrum, the
 *         consequence panel, the Critic and the publish action. All of it was
 *         already built. None of it had a reader here.
 *    ADD  (2026-08-02) the ROUTE, on the row and on the spec in focus. Plan now
 *         asks whether a spec passes through Design or goes straight to Build,
 *         and writes the answer to the spec's stage record. That decision is
 *         ABOUT this station, so this station shows it: an undrawn spec that
 *         somebody deliberately sent past reads "Design skipped on purpose"
 *         rather than "nothing drawn yet", which are opposite facts. `?focus=`
 *         lands a handoff from Plan on the right spec instead of on the list.
 *
 * 4. WHAT IS ONE CLICK AWAY. The brand ledger with its import, paste and
 *    defaults machinery stays in Settings. Every prototype ever made stays on
 *    /artifacts. The spec's own text stays on /plan, and (2026-08-06) it is
 *    genuinely one click from the spec in focus: "Open the spec" in the focus
 *    Block head. It used to be zero clicks available, because the only
 *    navigation to /plan/spec/$id on this surface sat inside the too-thin empty
 *    state -- reachable only for a spec nobody could draw from. What the spec
 *    PROMISED does not stay on /plan any more: the standing acceptance criteria
 *    are drawn beside the verdict, because that is the standard the call is
 *    being made against. A row in the list is two lines; the drawing, its blast
 *    radius, its links and the Critic's findings belong to the ONE spec in focus
 *    and are drawn only for it.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is the consequence panel the
 *    instant before you approve: a mockup with no blast radius is a drawing,
 *    and one that says it holds a spec out of Build and was made before two
 *    rules that are now in force is a decision. The confusion this surface
 *    could invite is two things asking at once, so there is exactly one Gate,
 *    the pending rule owns it, and the drawing's own verdict sits WITH the
 *    drawing because the drawing is the evidence for it.
 *
 * 6. WHERE THE CREW IS. Design draws every screen in the list and the row
 *    carries its mark; the mark runs while a redraw runs and stops when it
 *    stops. The Critic is a second, differently-marked worker you can call on
 *    the drawing, and its findings can be turned into standing rules the crew
 *    then follows. Remove the agents and this surface has nothing in it: no
 *    drawings, no findings, no rules, and a gate over an empty frame.
 *
 * 7. RECOGNITION. The identity on this surface is the AGENT (Design draws,
 *    Critic reviews) and the ARTIFACT (a spec, its drawing, its links), and
 *    both are marked. Scanning path: the Gate wins when a rule is waiting,
 *    because it is a 19px question against 14px rows; otherwise the eye lands
 *    on the drawing, which is a 460px lit rectangle in a monochrome page and
 *    is the only thing on the surface that could win. The emptiest REALISTIC
 *    state is a first-month workspace: a couple of specs, one drawing that got
 *    prepped speculatively, no brand rules, no lineage. Every panel here has a
 *    sentence for that state and none of them says "no results". Internal
 *    words a stranger would not survive are all translated at the edge:
 *    `prd` reads "spec", `mission` reads "run", `prototype` reads "shared
 *    link", `design_gate_status` never appears, and the fidelities say what
 *    question they answer rather than assuming the reader knows.
 *
 * HONESTY. Nothing on this surface is inferred. The blast radius is read out
 * of `artifact_lineage` and a failed read says "not known" rather than
 * "nothing", the same distinction run-stages.functions.ts draws between "no
 * link from this run back to a signal" and "no signals". A drawing whose
 * fidelity was never recorded says so instead of being called a mockup.
 */

import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  decideDesignMemory,
  importDesignMemoryFromText,
  listDesignMemory,
  recordDesignScaffoldFeedback,
  type DesignMemoryRow,
} from "@/lib/design-memory.functions";
import {
  DESIGN_FIDELITIES,
  decideDesignGate,
  getDesignWorkItem,
  getScaffoldProvenance,
  listDesignWork,
  redrawDesignScaffold,
  runScaffoldDesignCritic,
  toggleDesignStage,
  type DesignFidelity,
  type DesignWorkRow,
} from "@/lib/design-scaffold.functions";
import { publishPrototypeFromPrd, togglePrototypeShare } from "@/lib/prototypes.functions";
import { isModalOpen } from "@/lib/overlay";
import type { DesignCriticFinding } from "@/lib/ai/design-critic";
import { CATEGORY_LABEL, SOURCE_LABEL } from "@/components/knowledge/design-memory-shared";
import { Consequence, DrawingStage, Findings } from "@/components/design/drawing";
import {
  FIDELITY_QUESTION,
  FIDELITY_WORD,
  GATE_WORD,
  fidelityWord,
  ruleTextFor,
} from "@/components/design/vocabulary";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Choices,
  CtxBody,
  CtxHead,
  Door,
  Empty,
  Failed,
  Gate,
  Line,
  Loading,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
  Switch,
  Value,
  Who,
} from "@/components/shell/primitives";
import { AgentPulse } from "@/components/shell/AgentPulse";
import { useSpineStrip } from "@/components/shell/use-spine-strip";

/** One fetch, unfiltered: this surface needs the pending queue and the
 *  in-force count, and both come off the same list. */
const ALL_RULES = { category: undefined, status: undefined };

/** The agent that draws, and the agent that reviews what was drawn. Both are
 *  the design and decide stations' own cast entries, not labels invented here. */
const DRAWS = "ux-architect";
const REVIEWS = "critic";

function shareUrl(slug: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`;
}

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** A receipt renders NEXT TO the control that caused it. This page is taller
 *  than a screen once a drawing is open, so one fixed receipt region would put
 *  half of them off screen, which is a receipt nobody reads. `at` is the only
 *  placement rule: writes made at the page level render under the Gate, writes
 *  made on the drawing render under the drawing's own actions. */
type Trace = {
  id: number;
  at: "page" | "focus";
  /**
   * WHICH SPEC A FOCUS RECEIPT IS ABOUT. Null on page writes, which are about
   * the workspace and not about any one spec.
   *
   * A receipt is a sentence about one write -- "It is private. Switch it on
   * below to hand out /p/x9f2", "This spec can reach Build" -- and the focus
   * region below redraws for whichever row you click next. Untagged, the
   * receipt stays put while its subject changes underneath it, so a sentence
   * written about the spec you just approved is then read as a fact about the
   * spec now on screen. Four receipts are kept, so it survives three more
   * writes before it falls off the end.
   */
  prdId: string | null;
  verb: string;
  consequence: React.ReactNode;
  failed?: boolean;
};

/** The row's SECOND line carries one different fact, and which fact that is
 *  depends on the row. A drawing made before rules that are now in force is
 *  the exception worth surfacing in a list; everything else describes itself. */
function rowSub(r: DesignWorkRow, gateOn: boolean): string {
  if (!r.drawing) {
    // A SKIP IS A DECISION AND SAYS SO. Without this line an undrawn spec that
    // somebody deliberately sent past Design is indistinguishable from one
    // nobody has got to yet, and those are opposite facts: the first is settled
    // and the second is waiting on the crew.
    if (r.route?.route === "direct") {
      return `Design skipped on purpose · ${new Date(r.route.at).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })}`;
    }
    return gateOn && r.gateStatus === "approved"
      ? "Nothing drawn. The gate is already approved"
      : r.route?.route === "design"
        ? "Handed here to be drawn"
        : "Nothing drawn yet";
  }
  if (r.rulesSince > 0) {
    return `Drawn before ${r.rulesSince} ${r.rulesSince === 1 ? "rule" : "rules"} now in force`;
  }
  const shape = `${r.drawing.screenCount} ${r.drawing.screenCount === 1 ? "screen" : "screens"}`;
  const facts = [fidelityWord(r.drawing.fidelity), shape];
  // The gate word is only a fact while there IS a gate.
  if (gateOn) facts.push(GATE_WORD[r.gateStatus]);
  return facts.join(" · ");
}

/**
 * WHAT OF YOURS SHAPED THIS DRAWING.
 *
 * FOUNDER ASK 2026-08-01: on Design a person should see "what it is replacing
 * if it is already one, and if it is a new one". `Consequence` above already
 * answers the replacing half. This is the other one, and it was missing
 * entirely: the design language has been injected into every generation since
 * DSN-01, and the drawing arrived with no way to tell whether any of it came
 * from the workspace's own decisions or all of it from the model.
 *
 * THE LINE IT WILL NOT CROSS. It never says a particular element came from a
 * particular rule. What was HANDED OVER is recorded fact; what the model then
 * honoured in a given button is not knowable from here, and asserting it would
 * be the same fabrication as a similarity score printed as a percentage. So the
 * strong claim is the negative one, which is fully provable and the more useful
 * warning anyway: drawn with none of your rules means all of it is invention.
 *
 * Self-contained rather than lifted into the parent's query set, so a
 * provenance read that fails can never take the drawing down with it.
 */
function Grounding({ prdId }: { prdId: string }) {
  const navigate = useNavigate();
  const fProvenance = useServerFn(getScaffoldProvenance);
  const q = useQuery({
    queryKey: ["scaffold-provenance", prdId],
    queryFn: () => fProvenance({ data: { prdId } }),
  });

  /**
   * A NAMED RULE OPENS. Every rule that shaped the drawing was printed as
   * plain text, so the surface would tell you your screen was built on
   * "Buttons state the consequence" and leave you to go and find out what that
   * rule actually says. The brand ledger in Settings is where a rule is read,
   * edited and retired, and this file's own answer 4 already puts it there.
   *
   * THE LIMIT, RECORDED RATHER THAN FAKED: Settings validates `?section=`,
   * `?tab=`, `?connector=` and `?checkout=` and nothing else, so there is no
   * per-rule address to link to. The door lands on the ledger that holds the
   * rule, not on the rule. Every name is its own control anyway, because the
   * one that is retired is the one you came to look at and a single link at the
   * end of the sentence would not say which.
   */
  const openLedger = () =>
    void navigate({ to: "/settings", search: { section: "brand" } as never });
  const ruleDoors = (rules: { id: string; title: string }[]) =>
    rules.map((g, i) => (
      <React.Fragment key={g.id}>
        {i > 0 ? ", " : null}
        <Door onClick={openLedger} title="Open this rule in the brand ledger">
          {g.title}
        </Door>
      </React.Fragment>
    ));

  // Silence beats a wrong sentence here. An unread provenance is not the same
  // fact as an ungrounded drawing, so a failed read says nothing at all.
  if (q.isLoading || q.isError || !q.data) return null;

  const { groundedIn, ungrounded, staleCount } = q.data;

  if (ungrounded) {
    return (
      <Line
        label="Drawn without your design language"
        sub="No standing rule was in force when this was made, so every choice in it is the model's own. Approving rules in Design memory changes what the next drawing inherits."
      />
    );
  }

  const current = groundedIn.length - staleCount;
  return (
    <Line
      label={`Built on ${groundedIn.length} of your ${groundedIn.length === 1 ? "rule" : "rules"}`}
      sub={
        staleCount > 0 ? (
          <>
            {current} still stand. {staleCount} {staleCount === 1 ? "has" : "have"} been replaced
            since, so this drawing is behind your design language:{" "}
            {ruleDoors(groundedIn.filter((g) => g.retired))}.
          </>
        ) : (
          <>{ruleDoors(groundedIn)}. Everything else in the drawing is the model's own.</>
        )
      }
    />
  );
}

function Design() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("design");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const fetchRules = useServerFn(listDesignMemory);
  const decide = useServerFn(decideDesignMemory);
  const draftRule = useServerFn(importDesignMemoryFromText);
  const fetchWork = useServerFn(listDesignWork);
  const fetchItem = useServerFn(getDesignWorkItem);
  const redraw = useServerFn(redrawDesignScaffold);
  const decideGate = useServerFn(decideDesignGate);
  const recordTaste = useServerFn(recordDesignScaffoldFeedback);
  const askCritic = useServerFn(runScaffoldDesignCritic);
  const flipStage = useServerFn(toggleDesignStage);
  const publish = useServerFn(publishPrototypeFromPrd);
  const share = useServerFn(togglePrototypeShare);

  const rules = useQuery({
    queryKey: ["design-memory", ALL_RULES],
    queryFn: () => fetchRules({ data: ALL_RULES }),
  });
  const work = useQuery({ queryKey: ["design-work"], queryFn: () => fetchWork() });

  const entries = rules.data?.items ?? [];
  const waiting = entries.filter((r) => r.status === "pending");
  const inForce = entries.filter((r) => r.status === "approved").length;
  const call: DesignMemoryRow | null = waiting[0] ?? null;

  const items = work.data?.items ?? [];
  // `prds.design_gate_status` defaults to 'pending' for every spec ever
  // written, so it only MEANS "waiting on you" while the workspace's gate is
  // on. With the gate off nothing is waiting, and saying otherwise would be
  // the surface inventing a queue out of a column default.
  const gateOn = Boolean(work.data?.stageEnabled);
  const drawnAndWaiting = gateOn
    ? items.filter((i) => i.drawing && i.gateStatus === "pending")
    : [];

  // Derived, never an effect: the surface opens on the thing you came to judge,
  // and a click just overrides it. An effect would fight the query on refetch.
  const [picked, setPicked] = React.useState<string | null>(null);
  // The spec a handoff sent you here to look at, when one did. It ranks below a
  // click (you are looking at something else now) and above the list's default.
  const sent = Route.useSearch().focus ?? null;
  // A pick that is no longer in the list falls back rather than opening a
  // detail view of something that is gone.
  const inList = (id: string | null) => Boolean(id && items.some((i) => i.prdId === id));
  const focusId = (inList(picked) ? picked : inList(sent) ? sent : items[0]?.prdId) ?? null;

  const item = useQuery({
    queryKey: ["design-work-item", focusId],
    queryFn: () => fetchItem({ data: { prdId: focusId as string } }),
    enabled: !!focusId,
  });
  const focus = item.data ?? null;

  /**
   * WHICH SPEC A WRITE WAS ABOUT, TAKEN AT THE CLICK AND NOT AT THE ANSWER.
   *
   * react-query calls onSuccess and onError with the closures from the most
   * recent render, not from the render the click happened in, so `focus` read
   * inside a handler is whichever spec you are LOOKING at when the server
   * answers. Press "Ask the Critic", click a second row while it runs, and the
   * handler reads the second spec. `onMutate` is the one callback react-query
   * takes at mutate() time, so what it returns as context is the spec that was
   * actually acted on; every review and receipt below is stamped from it and
   * nothing downstream has to re-derive it.
   */
  const actedOn = (): { prdId: string | null } => ({ prdId: focusId });

  // Receipts, not toasts (anti-slop.md §5). A write renders what it CAUSED.
  const [trace, setTrace] = React.useState<Trace[]>([]);
  const nextId = React.useRef(1);
  const note = React.useCallback(
    (
      at: Trace["at"],
      prdId: string | null,
      verb: string,
      consequence: React.ReactNode,
      failed = false,
    ) => {
      setTrace((t) =>
        [{ id: nextId.current++, at, prdId, verb, consequence, failed }, ...t].slice(0, 4),
      );
    },
    [],
  );
  const pageTrace = trace.filter((t) => t.at === "page").slice(0, 2);
  // A focus receipt is drawn only under the spec it was written about. Not
  // cleared on a change of focus: the receipt for the other spec is still true
  // and comes back with it, which is the same read-tagged rule the review uses.
  const focusTrace = trace.filter((t) => t.at === "focus" && t.prdId === focusId).slice(0, 2);

  /**
   * THE CRITIC'S FINDINGS BELONG TO ONE DRAWING, AND CARRY ITS ID.
   *
   * They were held as a bare list and never reset, and `setPicked` changes
   * which drawing is on screen without touching them. So the second spec you
   * clicked rendered the FIRST one's findings under "What the Critic found",
   * and "Make it a rule" posted the first spec's issue text into a permanent
   * workspace brand rule while the receipt landed under the second. The mirror
   * case is as bad: a spec nobody has ever reviewed inherited "The Critic found
   * nothing against your rules or the accessibility floors", a clean bill of
   * health for a review that never ran.
   *
   * TAGGED, NOT RESET. A reset is a line somebody has to remember to write on
   * the next code path that moves focus, and there are already two (`setPicked`
   * and the `?focus=` handoff) plus the fallback when a pick leaves the list. A
   * read that checks the id cannot be forgotten, because forgetting it means
   * rendering nothing rather than rendering the wrong spec's findings.
   *
   * The other spec's review is kept rather than dropped, so clicking back shows
   * the review you already paid a model call for.
   *
   * ONE SLOT PER SPEC, NOT ONE SLOT. A single `{prdId, findings}` slot made the
   * sentence above true only for a READ: it could not render the wrong spec's
   * findings, but any write evicted whatever spec was in the slot, so redrawing
   * spec A threw away a live review being held for spec B -- the very loss this
   * comment claims to prevent, reintroduced by the redraw path's own emptying
   * write. A map keyed by spec cannot have that shape of bug: a write about one
   * spec touches one key.
   *
   * THREE STATES PER KEY, and the difference between two of them is the whole
   * reason this is a map and not a list. ABSENT means this session has no
   * opinion, so the ruling on the record shows. NULL means this session EMPTIED
   * it -- the drawing was redrawn, so the ruling the record still holds is about
   * markup that no longer exists, and this suppresses the rehydrated one until
   * the refetch lands. An array is a live review from this session, and it wins,
   * because it is newer than the read.
   */
  const [reviews, setReviews] = React.useState<Record<string, DesignCriticFinding[] | null>>({});
  /**
   * THE RULING CAN SURVIVE THE PAGE, so this session's state is no longer the
   * only place findings live. `runScaffoldDesignCritic` writes them to the
   * record and `getDesignWorkItem` hands back the ones that are about the
   * drawing currently on screen, so clicking a second spec and clicking back
   * shows the review you already paid for instead of an empty panel and a
   * second bill. A live review still wins: it is newer than the read.
   *
   * "CAN", AND NOT "DOES", UNTIL ONE MIGRATION IS APPLIED. The ruling is filed
   * on `prd_scaffolds.critic_review`, added by the migration dated
   * 20260806170000. Until that runs the write fails, `persisted` comes back
   * false, and the receipt below says so in the person's own words -- so this
   * map is the only place the findings live and the panel below still shows
   * them. Nothing here needs to change when the column arrives.
   */
  // `in`, not truthiness: null is a value here and means "emptied", which is a
  // different answer from "this session never said anything about this spec".
  const localFindings: DesignCriticFinding[] | null | undefined =
    focusId !== null && focusId in reviews ? reviews[focusId] : undefined;
  const findings =
    localFindings !== undefined ? localFindings : (focus?.criticReview?.findings ?? null);

  /** Same rule, same reason: which finding is mid-draft is a fact about ONE
   *  spec's review, and it disables every "Make it a rule" button while it is
   *  set. Untagged, drafting a rule out of one spec's findings greys out the
   *  buttons on another spec's. */
  const [ruling, setRuling] = React.useState<{ prdId: string; issue: string } | null>(null);
  const pendingIssue = ruling && ruling.prdId === focusId ? ruling.issue : null;

  /**
   * A DRAFT TAKES DOWN THE MARK IT PUT UP, NOT WHATEVER IS PENDING NOW.
   *
   * Tagging the mark by spec is what made a second draft reachable, and the
   * order that reaches it is the opposite of the obvious one. Drafting first
   * and reviewing second is blocked: `busy` counts `makeRule.isPending` and
   * "Ask the Critic" is `disabled={busy}`, so no second spec can be reviewed
   * while a draft is out, and with no review there `findings` is null and no
   * "Make it a rule" button is drawn at all. Reviewing first is what gets
   * through, on an asymmetry: `Findings` (src/components/design/drawing.tsx)
   * gates its buttons on `pendingIssue` alone and never on `busy`, so a review
   * running on another spec does not disable them. With a review already in
   * hand for one spec, start the Critic on a second, click back to the first
   * while that review is still out and draft there; when the second's review
   * lands, click it and draft there too, because the mark is tagged to the
   * first and `pendingIssue` is null on the second. Two are in flight at once.
   * Clearing unconditionally means whichever answers first blanks the other's
   * "Drafting", re-enabling its button while its request is still out, and a
   * second click inserts the same pending brand rule twice.
   *
   * Matched on the spec AND the finding, because the slot holds one draft: a
   * later draft overwrites an earlier one's mark, and only the draft whose mark
   * is still showing may take it down. Every draft that sets the mark also
   * clears it on success and on failure, so this cannot leave a button stuck.
   * What it does not do is show two "Drafting" labels at once; the newest draft
   * is the one the surface names.
   */
  const clearRuling = (prdId: string | null, issue: string) =>
    setRuling((prev) => (prev && prev.prdId === prdId && prev.issue === issue ? null : prev));

  const refreshWork = () => {
    void qc.invalidateQueries({ queryKey: ["design-work"] });
    void qc.invalidateQueries({ queryKey: ["design-work-item"] });
  };

  const settle = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      if (!call) throw new Error("Nothing to settle.");
      await decide({ data: { id: call.id, decision } });
      return decision;
    },
    onSuccess: (decision) => {
      // The real blast radius of settling a rule, counted from what is on the
      // surface: a rule that comes into force now post-dates every drawing
      // already made, so none of them follow it.
      const drawn = items.filter((i) => i.drawing).length;
      note(
        "page",
        null,
        decision === "approve" ? "You approved a brand rule" : "You declined a brand rule",
        decision === "approve" ? (
          drawn > 0 ? (
            <>
              Every drawing from now on follows it. The <Num>{drawn}</Num> already drawn do not.
            </>
          ) : (
            "Every drawing from now on follows it."
          )
        ) : (
          "It binds nothing. The crew will not follow it."
        ),
      );
      void qc.invalidateQueries({ queryKey: ["design-memory"] });
      refreshWork();
    },
    onError: (e: Error) => note("page", null, "Your call did not save", e.message, true),
  });

  /**
   * THE SAME TWO KEYS THE OTHER GATES USE, and this station had neither.
   *
   * A keyboard audit of every binding in the product found /design and /crew
   * running gate QUEUES with no keys bound and none drawn. Both say the next
   * one takes this one's place, both are built on the same `Gate` primitive as
   * Today, and Today has had `a` and `d` since it shipped. So a person who
   * learned the keyboard on the front door arrived here and it stopped working,
   * with nothing on screen to say why. That is worse than never having had it:
   * an inconsistent keyboard teaches people not to trust the keyboard.
   *
   * `a` and `d`, not letters chosen for this file. The audit's other finding was
   * that decline changes letter on every station -- `d` on Today, `r` on
   * Approvals, `x` on Decide -- so a new binding that invented a third letter
   * would be adding to the problem while appearing to fix one. These two are the
   * pair the front door already teaches.
   *
   * The guard is copied verbatim from today.tsx rather than rewritten, down to
   * the SELECT in the tag test: the one surface that wrote its own variant
   * (/approvals) is the one where Cmd+R declined an approval.
   */
  React.useEffect(() => {
    if (!call || settle.isPending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      /**
       * AND NOT WHILE SOMETHING IS OPEN OVER THIS SURFACE.
       *
       * The sharpest case is the shortcut sheet itself: press `?`, read the row
       * that says "a -- Approves the call in front of you", press `a`, and the
       * call behind the scrim is settled. The sheet documents the key and then
       * leaves it armed. `BoardPanel` has the identical shape and opens on an
       * ordinary rail click.
       *
       * The field guards above cannot help: both overlays are made of BUTTONs
       * and a scrim, so focus is never in an INPUT, TEXTAREA or SELECT. The
       * chord handler has stood down under this exact selector for hours; the
       * gates never learned to.
       */
      if (isModalOpen()) return;

      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "a") settle.mutate("approve");
      else if (e.key === "d") settle.mutate("reject");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, settle]);

  const drawAt = useMutation({
    mutationFn: (fidelity: DesignFidelity) => {
      if (!focus) throw new Error("Nothing is in focus.");
      return redraw({ data: { prdId: focus.prdId, fidelity } });
    },
    onMutate: actedOn,
    onSuccess: (res, _fidelity, ctx) => {
      const prdId = ctx?.prdId ?? null;
      // The drawing the Critic read has just been replaced, so its findings go
      // with it -- but only for the spec that was redrawn. A redraw of one spec
      // never said anything about what the Critic found in another, and the
      // blanket clear this replaces threw away a review you had paid for. It is
      // ONE KEY that changes here, which is what makes that sentence true: while
      // the state was a single slot this write still evicted whatever other
      // spec's live review was sitting in it.
      //
      // EMPTIED, not cleared, and that is now the difference between the two.
      // The record still holds the old ruling for the moment it takes the
      // refetch to land -- the server drops it by comparing the markup the
      // ruling was taken against with the markup now on the row, which a redraw
      // has just replaced -- and a plain clear would fall through to it and
      // render the previous drawing's findings under the new drawing.
      if (prdId) setReviews((prev) => ({ ...prev, [prdId]: null }));
      note(
        "focus",
        prdId,
        `Design drew a ${FIDELITY_WORD[res.fidelity].toLowerCase()}`,
        <>
          <Num>{res.screenCount}</Num> screens, <Num>{res.controlCount}</Num> controls. The drawing
          before it is gone.
        </>,
      );
      refreshWork();
    },
    onError: (e: Error, _fidelity, ctx) =>
      note("focus", ctx?.prdId ?? null, "Nothing was drawn", e.message, true),
  });

  const verdict = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      if (!focus) throw new Error("Nothing is in focus.");
      const res = await decideGate({ data: { prdId: focus.prdId, decision } });
      // The same pairing the spec page makes: one judgment, and the taste loop
      // learns from it. Never allowed to fail the verdict.
      try {
        await recordTaste({
          data: {
            prdId: focus.prdId,
            specExcerpt: focus.specExcerpt || focus.title,
            approved: decision === "approve",
          },
        });
      } catch {
        /* the verdict already landed; the learning is best effort */
      }
      return res;
    },
    onMutate: actedOn,
    onSuccess: (res, _decision, ctx) => {
      note(
        "focus",
        ctx?.prdId ?? null,
        res.status === "approved" ? "You approved the design" : "You sent the design back",
        res.status === "approved"
          ? "This spec can reach Build."
          : "The gate stays shut. It needs another drawing.",
        // Draw a handoff only where something real picks the work up. Nothing
        // in this product auto-dispatches on a design approval, so there is no
        // arrow here rather than an arrow to nowhere.
      );
      refreshWork();
    },
    onError: (e: Error, _decision, ctx) =>
      note("focus", ctx?.prdId ?? null, "The verdict did not save", e.message, true),
  });

  /** The gate off means there is no gate to move, so the verdict has nowhere to
   *  land except the taste loop. Saying "Approve the design" when nothing is
   *  being approved would claim a capability the wiring does not have (R12), so
   *  the words change with what the click actually does. */
  const taste = useMutation({
    mutationFn: (approved: boolean) => {
      if (!focus) throw new Error("Nothing is in focus.");
      return recordTaste({
        data: {
          prdId: focus.prdId,
          specExcerpt: focus.specExcerpt || focus.title,
          approved,
        },
      });
    },
    onMutate: actedOn,
    onSuccess: (res, approved, ctx) => {
      note(
        "focus",
        ctx?.prdId ?? null,
        approved ? "You called it a good fit" : "You called it a poor fit",
        res.learned > 0 ? (
          <>
            <Num>{res.learned}</Num> brand rules drafted from it, waiting at the top of this page.
          </>
        ) : (
          "Nothing concrete enough to become a rule came out of it."
        ),
      );
      void qc.invalidateQueries({ queryKey: ["design-memory"] });
    },
    onError: (e: Error, _approved, ctx) =>
      note("focus", ctx?.prdId ?? null, "Nothing was recorded", e.message, true),
  });

  const critic = useMutation({
    mutationFn: () => {
      if (!focus?.drawing) throw new Error("Nothing is drawn.");
      // The validator caps the payload at 60000. Slicing here means a long
      // document gets reviewed on its first 60000 characters rather than
      // failing the request outright.
      return askCritic({ data: { prdId: focus.prdId, html: focus.drawing.html.slice(0, 60000) } });
    },
    onMutate: actedOn,
    onSuccess: (res, _v, ctx) => {
      const prdId = ctx?.prdId ?? null;
      if (!res.review) {
        // A review that produced nothing clears only its OWN spec's live
        // findings, and drops back to whatever the record holds rather than
        // emptying it: a failed call is not evidence against a ruling already
        // filed about this same drawing. DELETING the key is what drops back --
        // setting it to null would be this session claiming the drawing has no
        // ruling, which is the opposite thing to say after a call that failed.
        setReviews((prev) => {
          if (!prdId || !(prdId in prev)) return prev;
          const next = { ...prev };
          delete next[prdId];
          return next;
        });
        note(
          "focus",
          prdId,
          "The Critic could not review it",
          "Nothing was written down. Try again.",
          true,
        );
        return;
      }
      if (prdId) {
        const landed = res.review.findings;
        setReviews((prev) => ({ ...prev, [prdId]: landed }));
      }
      // WHETHER IT WAS FILED IS PART OF WHAT HAPPENED. A review that could not
      // reach the record is still a real review, and a person who is about to
      // click away is the one who most needs to know it will not be there when
      // they come back.
      const kept = res.persisted
        ? "It is on the record, so it will be here when you come back."
        : "It could not be saved, so it goes when you leave this page.";
      note(
        "focus",
        prdId,
        "The Critic reviewed the drawing",
        res.review.findings.length === 0 ? (
          `It found nothing against your rules or the accessibility floors. ${kept}`
        ) : (
          <>
            <Num>{res.review.findings.length}</Num> findings, below. {kept}
          </>
        ),
      );
    },
    onError: (e: Error, _v, ctx) =>
      note("focus", ctx?.prdId ?? null, "The Critic could not review it", e.message, true),
  });

  const makeRule = useMutation({
    /* THE SPEC THAT TAUGHT IT TRAVELS WITH IT. The prdId was already in hand --
       onMutate below captures it for the receipt -- and was not being sent, so a
       rule learned from one drawing's review was filed with its origin reading
       "pasted", as though a human typed it, and nothing could answer which
       drawing on which spec produced it. Sent, the server files it as learned
       and writes the prd --taught--> design_memory edge.

       Read here rather than from ctx because mutationFn is handed no context;
       it and onMutate run from the SAME render's closure at mutate() time, so
       the id this sends and the id the receipt is stamped with cannot differ. */
    mutationFn: (f: DesignCriticFinding) =>
      draftRule({ data: { text: ruleTextFor(f), prdId: focusId ?? undefined } }),
    /* Which finding is mid-draft is written HERE rather than inside mutationFn,
       so the issue text and the spec id it belongs to are taken in the same
       callback at the same instant and cannot disagree. */
    onMutate: (f: DesignCriticFinding) => {
      const acted = actedOn();
      if (acted.prdId) setRuling({ prdId: acted.prdId, issue: f.issue });
      return acted;
    },
    onSuccess: (res, f, ctx) => {
      clearRuling(ctx?.prdId ?? null, f.issue);
      note(
        "focus",
        ctx?.prdId ?? null,
        "You turned a finding into a rule",
        res.inserted > 0 ? (
          <>
            <Num>{res.inserted}</Num> drafted. They are waiting at the top of this page.
          </>
        ) : (
          "Nothing concrete enough to stand as a rule came out of it. Nothing was added."
        ),
      );
      void qc.invalidateQueries({ queryKey: ["design-memory"] });
    },
    onError: (e: Error, f, ctx) => {
      clearRuling(ctx?.prdId ?? null, f.issue);
      note("focus", ctx?.prdId ?? null, "No rule was drafted", e.message, true);
    },
  });

  const hand = useMutation({
    mutationFn: () => {
      if (!focus) throw new Error("Nothing is in focus.");
      return publish({ data: { prdId: focus.prdId } });
    },
    onMutate: actedOn,
    onSuccess: (p, _v, ctx) => {
      note(
        "focus",
        ctx?.prdId ?? null,
        "You made a link for this drawing",
        <>
          It is private. Switch it on below to hand out <Num>/p/{p.shareSlug}</Num>.
        </>,
      );
      refreshWork();
    },
    onError: (e: Error, _v, ctx) =>
      note("focus", ctx?.prdId ?? null, "No link was made", e.message, true),
  });

  const flipShare = useMutation({
    mutationFn: (v: { id: string; isPublic: boolean; slug: string }) =>
      share({ data: { id: v.id, isPublic: v.isPublic } }),
    onMutate: actedOn,
    onSuccess: (_r, v, ctx) => {
      note(
        "focus",
        ctx?.prdId ?? null,
        v.isPublic ? "You opened a link" : "You closed a link",
        v.isPublic ? (
          <>
            Anyone with <Num>/p/{v.slug}</Num> can open the drawing.
          </>
        ) : (
          "The address stops working. Nobody outside can open it."
        ),
      );
      refreshWork();
    },
    onError: (e: Error, _v, ctx) =>
      note("focus", ctx?.prdId ?? null, "The link did not change", e.message, true),
  });

  const stage = useMutation({
    mutationFn: (enabled: boolean) => flipStage({ data: { enabled } }),
    onSuccess: (res) => {
      note(
        "page",
        null,
        res.enabled ? "You turned the design gate on" : "You turned the design gate off",
        res.enabled
          ? "A spec now needs an approved design before it can reach Build."
          : "A spec can now reach Build without a design being approved.",
      );
      refreshWork();
    },
    onError: (e: Error) => note("page", null, "The gate setting did not change", e.message, true),
  });

  const openBrandRules = () =>
    void navigate({ to: "/settings", search: { section: "brand" } as never });

  const busy =
    drawAt.isPending ||
    verdict.isPending ||
    taste.isPending ||
    critic.isPending ||
    hand.isPending ||
    makeRule.isPending;

  // The headline says what needs YOU, and it tells the truth about which queue
  // is asking. Standing counts are standing facts and live in the context column.
  const headline =
    rules.isLoading || work.isLoading
      ? "Design"
      : waiting.length > 0
        ? waiting.length === 1
          ? "One brand rule needs you."
          : `${waiting.length} brand rules need you.`
        : drawnAndWaiting.length === 1
          ? "One drawn screen is waiting on your call."
          : drawnAndWaiting.length > 1
            ? `${drawnAndWaiting.length} drawn screens are waiting on your call.`
            : "Nothing needs you.";

  const dayOne = rules.isSuccess && entries.length === 0 && work.isSuccess && items.length === 0;

  const hasContext =
    !!call || (rules.isSuccess && entries.length > 0) || Boolean(work.data?.isOwner);

  const context = (
    <>
      {call ? (
        <>
          <CtxHead>Where this rule came from</CtxHead>
          <CtxBody>
            {CATEGORY_LABEL[call.category]} · {SOURCE_LABEL[call.source_kind]} ·{" "}
            <Num>
              {new Date(call.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </Num>
          </CtxBody>
        </>
      ) : null}

      {waiting.length > 1 ? (
        <>
          <CtxHead>Behind this one</CtxHead>
          <CtxBody>
            <Num>{waiting.length - 1}</Num> more waiting. They keep their order until this one is
            settled.
          </CtxBody>
        </>
      ) : null}

      {rules.isSuccess && entries.length > 0 ? (
        <>
          <CtxHead>The rules themselves</CtxHead>
          <CtxBody>
            <Num>{inForce}</Num> in force. Add, review or retire them in Settings.
          </CtxBody>
          <div className="sp-acts">
            <Button variant="ghost" onClick={openBrandRules}>
              Open brand rules
            </Button>
          </div>
        </>
      ) : null}

      {/* A boundary, not a decision: policy is set in advance and does not
          block. Owner only, because only the owner can write it. */}
      {work.data?.isOwner ? (
        <>
          <CtxHead>The gate itself</CtxHead>
          <Line
            label="Design gates Build"
            sub={
              work.data.stageEnabled
                ? "A spec waits here until you approve its design."
                : "Specs reach Build without passing through here."
            }
          >
            <Switch
              label="Require an approved design before a spec reaches Build"
              checked={work.data.stageEnabled}
              disabled={stage.isPending}
              onChange={(next) => stage.mutate(next)}
            />
          </Line>
        </>
      ) : null}
    </>
  );

  return (
    <Surface context={hasContext ? context : undefined}>
      <PageHead
        title={headline}
        sub={call ? "Nothing binds into a drawing until you settle it." : undefined}
      />

      {/* ONE Gate. The pending rule owns it because nothing the crew draws is
          on settled ground until it is answered. A drawing's own verdict is
          not here: it sits with the drawing, which is its evidence. */}
      {rules.isError ? (
        <Gate question="The brand rules did not load.">
          <Button variant="primary" onClick={() => void rules.refetch()}>
            Try again
          </Button>
        </Gate>
      ) : call ? (
        <Gate
          /* Keyed on its subject so a change of subject REMOUNTS the Gate and it
             plays its entrance. Updated in place, the biggest element on the
             station swaps its question and its buttons with no motion. */
          key={call.id}
          question={call.title}
          lines={[
            <span key="what">{call.content}</span>,
            ...(call.rationale ? [<span key="why">{call.rationale}</span>] : []),
          ]}
        >
          {/* The keycaps are drawn because the keys are bound above. `shortcut`
              renders a <kbd> and binds nothing on its own, which is how this
              product ended up with a Settings gear promising a key that fires
              nothing -- so the prop is never passed without the effect. */}
          <Button
            variant="primary"
            shortcut="a"
            disabled={settle.isPending}
            onClick={() => settle.mutate("approve")}
          >
            Approve
          </Button>
          <Button shortcut="d" disabled={settle.isPending} onClick={() => settle.mutate("reject")}>
            Decline
          </Button>
        </Gate>
      ) : dayOne ? (
        <Gate
          question="The crew has no brand rules and nothing to draw."
          lines={[
            <span key="w">
              Give it your design language and it draws in your product's voice. Without one it
              draws from generic defaults.
            </span>,
          ]}
        >
          <Button variant="primary" onClick={openBrandRules}>
            Add design language
          </Button>
          <Button onClick={() => void navigate({ to: "/plan" })}>Open specs</Button>
        </Gate>
      ) : null}

      {pageTrace.map((t) => (
        <Receipt
          key={t.id}
          verb={t.verb}
          consequence={t.consequence}
          failed={t.failed}
          time="now"
        />
      ))}

      <Block
        title="Screens the crew drew"
        sub={
          // A DRAWING AGENT IS GENUINELY RUNNING HERE, so this is the indicator
          // rather than a static mark with a full stop after it. `redrawDesignScaffold`
          // reaches `buildDesignScaffoldHtml`, which calls the chokepoint, so
          // `working` is honest. The detail names the two facts the click chose
          // and the surface already holds: which fidelity, and which spec.
          drawAt.isPending ? (
            <AgentPulse
              label="Design is drawing a screen"
              seed={DRAWS}
              compact
              detail={
                <>
                  {drawAt.variables ? FIDELITY_WORD[drawAt.variables].toLowerCase() : "drawing"}
                  {focus?.title ? ` of ${focus.title}` : null}
                </>
              }
            />
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <AgentMark slug={DRAWS} state="quiet" />
              Design renders a spec as a screen, in your brand.
            </span>
          )
        }
      >
        {work.isLoading ? (
          <Loading>Reading the drawings.</Loading>
        ) : work.isError ? (
          <Failed onRetry={() => void work.refetch()}>
            Could not read the drawings. {(work.error as Error).message}
          </Failed>
        ) : items.length === 0 ? (
          <Empty
            action={<Button onClick={() => void navigate({ to: "/plan" })}>Open specs</Button>}
          >
            Nothing to look at. A spec gets a screen drawn from it once it says enough for Design to
            read, and every drawing in this workspace lands here.
          </Empty>
        ) : (
          items.map((r) => (
            <Row
              key={r.prdId}
              tight
              focused={focusId === r.prdId}
              marks={
                <AgentMark
                  slug={DRAWS}
                  // Exactly one mark may blink, and only when it is genuinely
                  // the first call. A pending rule outranks it and takes the
                  // Gate, so nothing blinks underneath it.
                  state={
                    !gateOn || !r.drawing || r.gateStatus !== "pending"
                      ? "quiet"
                      : waiting.length === 0 && drawnAndWaiting[0]?.prdId === r.prdId
                        ? "gate"
                        : "waiting"
                  }
                />
              }
              lead={<Who>{r.title}</Who>}
              sub={rowSub(r, gateOn)}
              time={ago(r.drawing?.drawnAt ?? r.gateDecidedAt)}
              onClick={() => setPicked(r.prdId)}
            />
          ))
        )}
      </Block>

      {focusId ? (
        /* THE SPEC IS ONE CLICK AWAY, and until now it was zero clicks
           available. The only /plan/spec/$id navigation on this surface sat
           inside the too-thin empty state, reachable only for a spec with under
           40 characters of body -- so at the exact moment the surface asks
           "Approve the design" or "Send it back", the promise it is being
           judged against could not be opened at all. This file's own header,
           under "WHAT IS ONE CLICK AWAY", already said the spec's text stays on
           /plan; the door is what makes that sentence true.

           In the Block head rather than beside the verdict buttons: it is a way
           OUT of this station, and mixing it into the action bar would put a
           navigation among two calls and invite a person to press it thinking
           it settles something. */
        <Block
          title={focus?.title ?? "The screen in focus"}
          more={focus ? "Open the spec" : undefined}
          onMore={
            focus
              ? () => void navigate({ to: "/plan/spec/$id", params: { id: focus.prdId } })
              : undefined
          }
        >
          {item.isLoading ? (
            <Loading>Opening it.</Loading>
          ) : item.isError ? (
            <Failed onRetry={() => void item.refetch()}>
              Could not open it. {(item.error as Error).message}
            </Failed>
          ) : !focus ? (
            <Empty>That spec is no longer readable from this workspace.</Empty>
          ) : (
            <>
              {focus.drawing ? (
                <DrawingStage html={focus.drawing.html} title={focus.title} />
              ) : focus.specTooThin ? (
                <Empty
                  action={
                    <Button
                      onClick={() =>
                        void navigate({
                          to: "/plan/spec/$id",
                          params: { id: focus.prdId },
                        })
                      }
                    >
                      Write the spec
                    </Button>
                  }
                >
                  Design has nothing to read. This spec is still shorter than a paragraph, and a
                  screen drawn from it would be invention rather than a reading of your intent.
                </Empty>
              ) : (
                <Empty>
                  Nothing is drawn for this spec yet. Pick how finished you want it and Design draws
                  it from the spec's own words.
                </Empty>
              )}

              {/* THE SPECTRUM. Three real generations, not three labels: each
                  changes the prompt AND the stylesheet the document ships
                  with, and the stored drawing carries which one it is.
                  A drawing made before the fidelity was recorded selects
                  NOTHING, because calling it a mockup would be a guess. */}
              {!focus.specTooThin ? (
                <Line
                  label="How finished"
                  sub={
                    focus.drawing
                      ? "Drawing again replaces this one. Only the latest is kept."
                      : "Picking one draws it now, from the spec's own words."
                  }
                >
                  <Choices<DesignFidelity | "">
                    label="How finished the drawing should be"
                    value={focus.drawing?.fidelity ?? ""}
                    options={DESIGN_FIDELITIES.map((f) => ({
                      id: f,
                      label: FIDELITY_WORD[f],
                      title: FIDELITY_QUESTION[f],
                      disabled: drawAt.isPending,
                    }))}
                    onPick={(f) => {
                      if (f) drawAt.mutate(f);
                    }}
                  />
                </Line>
              ) : null}

              {/* Drawn or not. With nothing drawn, "what it replaces" drops out
                  but "what it holds up" is the most important fact on the page:
                  an undecided gate blocks this spec's dispatch whether or not
                  anyone has drawn the screen it is waiting on. */}
              <Consequence
                consequence={focus.consequence}
                redrawn={focus.drawing?.redrawn ?? false}
                hasDrawing={!!focus.drawing}
                gateStatus={focus.gateStatus}
                stageEnabled={focus.stageEnabled}
              />

              {focus.drawing ? <Grounding prdId={focus.prdId} /> : null}

              {/* THE ROUTE, WHERE THE DESIGN STATION CAN SEE IT. Somebody
                  decided on Plan whether this spec passes through here, and
                  that decision was invisible to the station it was made about.
                  Read from the spec's own stage record, never inferred from the
                  absence of a drawing. */}
              {focus.route ? (
                <Line
                  label={
                    focus.route.route === "direct"
                      ? "This spec was sent past Design"
                      : "This spec was handed here"
                  }
                  sub={
                    focus.route.route === "direct"
                      ? `Someone chose to build it without a screen on ${new Date(
                          focus.route.at,
                        ).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}. Drawing one now puts it back in front of the gate.`
                      : `Routed here on ${new Date(focus.route.at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })} to be drawn before Build.`
                  }
                />
              ) : null}

              {/* WHAT THE DRAWING WAS DRAWN AGAINST.

                  The Outcome Contract is the most structured promise the spec
                  makes, and this station judged screens without ever showing
                  it: a person was asked to approve a drawing against criteria
                  they had to remember or open a second tab to read. The same
                  criteria now reach the generator and the Critic server-side,
                  so this panel is the human's copy of the standard those two
                  were held to.

                  Absent for a spec with no compiled contract, which is most of
                  them today. An empty "what it promised" panel would claim a
                  promise nobody wrote. */}
              {focus.contract ? (
                <Line
                  label="What the spec promised"
                  sub={
                    <>
                      {focus.contract.intent ? <>{focus.contract.intent} </> : null}
                      {focus.contract.successMetrics.length > 0 ? (
                        <>Must be true: {focus.contract.successMetrics.join("; ")}. </>
                      ) : null}
                      {focus.contract.nonGoals.length > 0 ? (
                        <>Out of scope: {focus.contract.nonGoals.join("; ")}.</>
                      ) : null}
                    </>
                  }
                />
              ) : null}

              <Actions
                trailing={
                  focus.drawing ? (
                    <Button variant="ghost" disabled={busy} onClick={() => hand.mutate()}>
                      Make a link
                    </Button>
                  ) : undefined
                }
              >
                {focus.stageEnabled ? (
                  <>
                    <Button
                      variant="primary"
                      disabled={busy || focus.gateStatus === "approved"}
                      onClick={() => verdict.mutate("approve")}
                    >
                      {focus.gateStatus === "approved" ? "Approved" : "Approve the design"}
                    </Button>
                    <Button disabled={busy} onClick={() => verdict.mutate("reject")}>
                      Send it back
                    </Button>
                  </>
                ) : focus.drawing ? (
                  <>
                    <Button variant="primary" disabled={busy} onClick={() => taste.mutate(true)}>
                      Good fit
                    </Button>
                    <Button disabled={busy} onClick={() => taste.mutate(false)}>
                      Not a fit
                    </Button>
                  </>
                ) : null}
                {focus.drawing ? (
                  <Button disabled={busy} onClick={() => critic.mutate()}>
                    {critic.isPending ? "The Critic is reading" : "Ask the Critic"}
                  </Button>
                ) : null}
              </Actions>

              {/* THE INDICATOR SITS WITH THE WORK, not only with its result.
                  "What the Critic found" carries a pulse too, but that Block
                  only exists once there ARE findings, so on a first review the
                  only sign of life would have been a greyed-out button. The
                  first review is the one where a person has no idea whether
                  anything is happening, so it is the one that most needs this. */}
              {critic.isPending || drawAt.isPending ? (
                <AgentPulse
                  label={critic.isPending ? "The Critic is reviewing" : "Design is drawing"}
                  seed={critic.isPending ? REVIEWS : DRAWS}
                  detail={
                    critic.isPending ? (
                      <>
                        {focus.title} · against {inForce} {inForce === 1 ? "rule" : "rules"} in
                        force
                      </>
                    ) : (
                      <>
                        {drawAt.variables
                          ? FIDELITY_WORD[drawAt.variables].toLowerCase()
                          : "screen"}{" "}
                        of {focus.title}
                      </>
                    )
                  }
                />
              ) : null}

              {focusTrace.map((t) => (
                <Receipt
                  key={t.id}
                  verb={t.verb}
                  consequence={t.consequence}
                  failed={t.failed}
                  time="now"
                />
              ))}

              {findings && findings.length === 0 ? (
                <Empty>
                  The Critic found nothing against your rules or the accessibility floors.
                </Empty>
              ) : null}
            </>
          )}
        </Block>
      ) : null}

      {/* Its own region, not a Block nested in a Block: the section rule is a
          rule between sections and never appears inside one. Same for the
          links below. WHAT YOU CAN DO ABOUT IT, in place: a finding you cannot
          act on is a complaint. */}
      {focus && findings && findings.length > 0 ? (
        <Block
          title="What the Critic found"
          sub={
            // `runScaffoldDesignCritic` routes through the critic lens, which
            // calls the chokepoint. The detail says what it is reading the
            // drawing AGAINST, because that is the fact a person actually wants
            // while they wait: a review against nine rules in force means
            // something, a review against none is worth knowing before the
            // verdict arrives rather than after.
            critic.isPending ? (
              <AgentPulse
                label="The Critic is reviewing the drawing"
                seed={REVIEWS}
                compact
                detail={
                  <>
                    {focus?.title ?? "the drawing"} · against {inForce}{" "}
                    {inForce === 1 ? "rule" : "rules"} in force
                  </>
                }
              />
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <AgentMark slug={REVIEWS} state="quiet" />
                Making one a rule stops the crew repeating it.
              </span>
            )
          }
        >
          <Findings
            findings={findings}
            pendingIssue={pendingIssue}
            onMakeRule={(f) => makeRule.mutate(f)}
          />
        </Block>
      ) : null}

      {focus && focus.consequence.shares.length > 0 ? (
        <Block title="Links to this drawing">
          {focus.consequence.shares.map((s) => (
            <Line
              key={s.id}
              label={s.name}
              /* THE ADDRESS IS AN ADDRESS. A published link rendered as dead
                 text, next to a Copy button, so the only way to find out what
                 you had just published to the world was to copy it and paste it
                 somewhere else. It opens what a visitor sees, in a new tab
                 rather than in place: /p/$slug is a public page outside this
                 shell, so navigating there would take the whole app away and
                 leave the browser's back button as the only way home.

                 Only when it is actually public. A private link has no address
                 that works, and drawing a door onto a page that would refuse
                 the visitor is the promise this pass exists to stop making. */
              sub={
                s.isPublic ? (
                  <Door
                    title="Open what a visitor sees"
                    onClick={() => window.open(shareUrl(s.slug), "_blank", "noopener,noreferrer")}
                  >
                    {shareUrl(s.slug)}
                  </Door>
                ) : (
                  "Nobody outside can open it"
                )
              }
            >
              {s.isPublic ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard?.writeText(shareUrl(s.slug));
                    note(
                      "focus",
                      focus.prdId,
                      "You copied a link",
                      `${shareUrl(s.slug)} is on your clipboard.`,
                    );
                  }}
                >
                  Copy
                </Button>
              ) : (
                <Value>Private</Value>
              )}
              <Switch
                label={`Let anyone with the link open ${s.name}`}
                checked={s.isPublic}
                disabled={flipShare.isPending}
                onChange={(next) => flipShare.mutate({ id: s.id, isPublic: next, slug: s.slug })}
              />
            </Line>
          ))}
        </Block>
      ) : null}
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/design")({
  /**
   * `?focus=<specId>` opens on one spec.
   *
   * Added with the Plan route picker: "Hand it to Design" is a handoff, and a
   * handoff that lands you on a list of forty drawings and leaves you to find
   * the one you just sent is a dead end wearing a navigation's clothes.
   * Optional, so every existing link into /design behaves exactly as before,
   * and a stale id falls back to the list's own first pick rather than opening
   * a detail view of nothing.
   */
  validateSearch: (search: Record<string, unknown>): { focus?: string } => ({
    focus: typeof search.focus === "string" && search.focus ? search.focus : undefined,
  }),
  component: Design,
  head: () => ({ meta: [{ title: "Design · Supaprod" }] }),
  /**
   * A HEADLINE IS NOT A RECOVERY. This shipped as a title and a subtitle
   * telling the reader to reload, with nothing to press: the one screen in the
   * product where a person is already stuck, and the instruction was "go and
   * operate your browser". Discover's own error state has had a button since it
   * was written, and Decide's is the shape copied here, so the three route
   * failures in this station now answer the same way.
   *
   * `Failed`, not `Empty`: a crash is "we could not find out", never "nothing
   * here", and those are different facts a person acts on differently. A full
   * reload rather than `reset`, because the render already threw once and
   * re-running it against the same cache usually throws again.
   */
  errorComponent: ({ error }) => {
    console.error("[Design] route crashed:", error);
    return (
      <Surface>
        <PageHead
          title="Design did not load."
          sub="Every drawing, rule and link is safe on the record."
        />
        <Failed onRetry={() => window.location.reload()} retryLabel="Reload">
          The surface crashed while rendering.
        </Failed>
      </Surface>
    );
  },
});

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
 *    ADD  (2026-08-14) THE LIST BECAME A GRID. This was the clearest dense-data
 *         hole in the product: every drawing in the workspace, uncapped,
 *         unsearchable and with nothing to narrow it by, on the surface that
 *         reads the longest list in the spine. Four things landed with it, and
 *         each of them is in `DrawingsTable`: chips that narrow and carry their
 *         own counts, a cap that prints both real numbers instead of stopping
 *         quietly, columns that can be compared and sorted where a two-line row
 *         could only be read, and a finder for the person who already knows the
 *         name. Nothing the row said was dropped.
 *    ADD  (2026-08-14) THE THIRD FACT. This surface had two shapes for three
 *         different things: nothing exists yet, the read failed, and a
 *         precondition is missing. The third was drawn in the first one's
 *         clothes, so a spec too thin for Design to read looked like a drawing
 *         the crew had not got to. It is now `NeedsSetup`, which is the one
 *         state that is allowed to carry the act that unblocks it. The list's
 *         own empty state stays an empty state, and the note under it says why.
 *    ADD  (2026-08-06) the ROUTE AS A WRITE, not only as a reading. This surface
 *         could DISPLAY "Design skipped on purpose" and could not record it: the
 *         only per-spec caller of `chooseDesignRoute` was the spec page, and the
 *         only escape here was the owner-only workspace switch, which is every
 *         spec or none. A spec with nothing drawn now carries "Record that this
 *         needs no screen" in its Actions. The stations are the full path, not
 *         the only path, and a station that cannot record its own skip is a
 *         station insisting it is mandatory.
 *
 * 4. WHAT IS ONE CLICK AWAY. The brand rules with their import, paste and
 *    defaults machinery stay in Settings. Every prototype ever made stays on
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
 * 6. WHERE THE CREW IS. Design draws every screen in the list and every row
 *    carries its mark. The mark states which of them is asking rather than
 *    which is moving: nothing in the grid animates for a redraw, because the
 *    three indicators this surface already carries are all bound to that same
 *    mutation and a fourth would be the same fact said louder. The Critic is a
 *    second, differently-marked worker you can call on the drawing, and its
 *    findings can be turned into standing rules the crew then follows. Remove
 *    the agents and this surface has nothing in it: no drawings, no findings,
 *    no rules, and a gate over an empty frame.
 *
 * 7. RECOGNITION. The identity on this surface is the AGENT (Design draws,
 *    Critic reviews) and the ARTIFACT (a spec, its drawing, its links), and
 *    both are marked. Scanning path: the Gate wins when a rule is waiting,
 *    because it is a 19px question against a grid of 12.5px cells; otherwise
 *    the eye lands on the drawing, which is a 460px lit rectangle in a
 *    monochrome page and is the only thing on the surface that could win. In
 *    the grid itself the only colour is on the specs waiting for a call, so
 *    what needs a person is one sweep rather than a read. The emptiest
 *    REALISTIC state is a first-month workspace: a couple of specs, one drawing
 *    that got prepped speculatively, no brand rules, no lineage. Every panel
 *    here has a sentence for that state and none of them says "no results". The
 *    grid adds the one state a list of that kind is allowed to say, and it is
 *    not that sentence: a chip that excluded every row says the rows exist and
 *    hands back the way to see them. Internal words a stranger would not
 *    survive are all translated at the edge: `prd` reads "spec", `mission`
 *    reads "run", `prototype` reads "shared link", `design_gate_status` never
 *    appears, `design_memory` never appears, and the fidelities say what
 *    question they answer rather than assuming the reader knows.
 *
 * HONESTY. Nothing on this surface is inferred. The blast radius is read out
 * of `artifact_lineage` and a failed read says "not known" rather than
 * "nothing", the same distinction run-stages.functions.ts draws between "no
 * link from this run back to a signal" and "no signals". A drawing whose
 * fidelity was never recorded says so instead of being called a mockup.
 */

import * as React from "react";
import { failureLine, reasonLine } from "@/lib/error-copy";
import { Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Approve,
  Door,
  NothingYet,
  Num,
  PageHeading,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
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
  chooseDesignRoute,
  decideDesignGate,
  getDesignWorkItem,
  getScaffoldProvenance,
  listDesignWork,
  redrawDesignScaffold,
  runScaffoldDesignCritic,
  toggleDesignStage,
  type DesignFidelity,
} from "@/lib/design-scaffold.functions";
import { publishPrototypeFromPrd, togglePrototypeShare } from "@/lib/prototypes.functions";
// The dispatch chain, imported exactly where the spec page imports it from. An
// approved drawing had no forward verb on this station; see the send mounted
// beside skipDesign below.
import { dispatchStudioSession } from "@/lib/studio.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import { isModalOpen } from "@/lib/overlay";
import type { DesignCriticFinding } from "@/lib/ai/design-critic";
import { CATEGORY_LABEL, SOURCE_LABEL } from "@/components/knowledge/design-memory-shared";
import { Consequence, DrawingStage, Findings } from "@/components/design/drawing";
import { DrawingsTable } from "@/components/design/DrawingsTable";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { FIDELITY_QUESTION, FIDELITY_WORD, ruleTextFor } from "@/components/design/vocabulary";
import { Surface } from "@/components/meridian/Surface";
import { Choices } from "@/components/meridian/forms";
import { Gate } from "@/components/meridian/Gate";
import { CtxBody, CtxHead } from "@/components/meridian/ContextColumn";
import { Receipt } from "@/components/meridian/Receipt";
import { AgentMark } from "@/components/meridian/marks";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import { CrewWorking } from "@/components/shell/CrewWorking";
import { useSpineStrip } from "@/components/shell/use-spine-strip";

/** One fetch, unfiltered: this surface needs the pending queue and the
 *  in-force count, and both come off the same list. */
const ALL_RULES = { category: undefined, status: undefined };

/**
 * The agent that draws, and the agent that reviews what was drawn. Both are
 * cast entries from `agent-vocabulary.ts`, not labels invented here.
 *
 * REVIEWS WAS `"critic"` UNTIL 2026-08-18, AND THAT WAS AN IDENTITY ERROR
 * RATHER THAN A COPY ONE, which is why it survived: the comment that stood
 * here defended it, saying these were "the design and decide stations' own
 * cast entries" as though borrowing Decide's reviewer were the intent.
 *
 * `critic` is Decide's **Challenge**: station `decide`, glyph `shield-alert`,
 * "Red-teams the decision before you commit." This station's reviewer is
 * `design-critic`, **Critique**: station `design`, glyph `scan-eye`, "Reads the
 * design against the standing system before it is built" -- which is exactly
 * what `runScaffoldDesignCritic` does, and it says so in its own
 * `surfaceRef`, `design-critic:scaffold:<prdId>`.
 *
 * Under Law 4 the glyph IS the identity, so the surface was drawing another
 * station's agent doing this station's work, in that station's hue. The one
 * comment nearby that looked like a justification -- "routes through the critic
 * lens" -- is about the AI lens at the chokepoint, not about who is working.
 *
 * `design-critic` appeared as a slug in exactly one place in the repo before
 * this change, `src/lib/spine/driver.ts`, and no surface had ever rendered it.
 */
const DRAWS = "ux-architect";
const REVIEWS = "design-critic";

function shareUrl(slug: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`;
}

/* Relative time moved to `DrawingsTable` with the rows it described. It was
   only ever the list's own clock, and the panels below state their dates in
   full because a date somebody will quote belongs in words, not in "3d". */

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

/* THE ROW'S ONE EXTRA FACT BECAME COLUMNS, 2026-08-14.
 *
 * `rowSub` packed six different facts into one line and chose between them:
 * where the spec stands, how finished the drawing is, how many screens it
 * holds, whether it is behind rules that came into force after it, and when any
 * of that last happened. A person scanning forty of those reads a paragraph per
 * row and can compare none of it, which is what a list does instead of a grid.
 *
 * Every one of those facts survives in `DrawingsTable`, each in a column that
 * can be sorted and counted. The one thing lost on the row is the exact date of
 * a skip, which is now the cell's title and is stated in full in the panel
 * below, where the decision it belongs to is. */

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
   * rule actually says. The brand rules in Settings are where a rule is read,
   * edited and retired, and this file's own answer 4 already puts them there.
   *
   * THE LIMIT, RECORDED RATHER THAN FAKED: Settings validates `?section=`,
   * `?tab=`, `?connector=` and `?checkout=` and nothing else, so there is no
   * per-rule address to link to.
   *
   * SO THE NAMES STOPPED BEING DOORS, 2026-08-14. The paragraph above used to
   * end by defending one control per name, on the grounds that the retired rule
   * is the one you came to look at and a single link would not say which. That
   * argument was wrong in the only way that matters: four names on one line
   * were four doors to the SAME address, so pressing the one you wanted and
   * pressing any other did exactly the same thing. An affordance is a promise,
   * and four of them promising to open four different rules while opening one
   * list is a promise the data cannot keep. The names are stated as the facts
   * they are, and the ONE address there really is carries the one control. The
   * retired ones are still named separately in their own sentence, which is
   * what that argument was actually asking for.
   */
  const openBrandRules = () =>
    void navigate({ to: "/settings", search: { section: "brand" } as never });
  const ruleNames = (rules: { id: string; title: string }[]) =>
    rules.map((g, i) => (
      <React.Fragment key={g.id}>
        {i > 0 ? ", " : null}
        {g.title}
      </React.Fragment>
    ));
  const rulesDoor = (
    <Door onClick={openBrandRules} title="Read and retire these in Brand settings">
      Open brand rules
    </Door>
  );

  // Silence beats a wrong sentence here. An unread provenance is not the same
  // fact as an ungrounded drawing, so a failed read says nothing at all.
  //
  // `read: false` IS THAT SAME FAILURE, arriving as a resolved answer instead of
  // a rejected promise. supabase-js resolves a refused read, so the three reads
  // behind this panel used to come back looking exactly like "no rules bound
  // in", and the strong negative below -- every choice in this drawing is the
  // model's own -- was printed at a teammate whose read was simply scoped out.
  // The server now names that case; this is the one condition that honours it.
  if (q.isLoading || q.isError || !q.data || !q.data.read) return null;

  const { groundedIn, ungrounded, staleCount } = q.data;

  if (ungrounded) {
    return (
      /* THE SENTENCE NAMED A DATABASE TABLE AT A PERSON. It read "Approving
         rules in Design memory changes what the next drawing inherits", and
         `design_memory` is the table these rows are stored in. Nobody standing
         here has seen that word anywhere else in the product: the rules are
         called brand rules on this page, in the context column beside it and in
         Settings, so the one place that named the machinery was the one place
         telling a person what to do next. */
      <Line
        label="Drawn without your design language"
        sub={
          <>
            No standing rule was in force when this was made, so every choice in it is the
            model&apos;s own. Approve a brand rule and every drawing after it is built on it.{" "}
            {rulesDoor}
          </>
        }
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
            {ruleNames(groundedIn.filter((g) => g.retired))}. {rulesDoor}
          </>
        ) : (
          <>
            {ruleNames(groundedIn)}. Everything else in the drawing is the model&apos;s own.{" "}
            {rulesDoor}
          </>
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
  const chooseRoute = useServerFn(chooseDesignRoute);
  const publish = useServerFn(publishPrototypeFromPrd);
  const share = useServerFn(togglePrototypeShare);
  const dispatchBuild = useServerFn(dispatchStudioSession);
  const checkRepo = useServerFn(canDispatchToRepo);

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
  /**
   * A HANDOFF THAT LANDED SOMEWHERE ELSE SAYS SO.
   *
   * The fallback above is right -- a stale id must not open a detail view of
   * nothing -- but it was silent, so "Hand it to Design" on a spec this list
   * does not carry opened whatever happened to be first and looked exactly like
   * a handoff that worked. The reader then judges a drawing believing it belongs
   * to the spec they were sent to.
   *
   * Only while nothing has been clicked: once a person picks a row they have
   * chosen what they are looking at, and the notice has done its work.
   */
  const handoffMissed = Boolean(sent && !inList(sent) && !picked && work.isSuccess);

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
   * THE RULING SURVIVES THE PAGE, so this session's state is no longer the
   * only place findings live. `runScaffoldDesignCritic` writes them to the
   * record and `getDesignWorkItem` hands back the ones that are about the
   * drawing currently on screen, so clicking a second spec and clicking back
   * shows the review you already paid for instead of an empty panel and a
   * second bill. A live review still wins: it is newer than the read.
   *
   * "SURVIVES" AND NOT "CAN SURVIVE": the column it is filed on,
   * `prd_scaffolds.critic_review`, was added by the migration dated
   * 20260806170000 AND THAT MIGRATION IS APPLIED (checked against production
   * 2026-08-06). This comment said "until one migration is applied" while it
   * already had been, which is the one kind of sentence this file must not
   * carry.
   *
   * THE MAP IS STILL THE FALLBACK AND STILL EARNS ITS KEEP. If the write is
   * refused -- RLS, or a database this build is pointed at that has not had the
   * migration -- `persisted` comes back false, the receipt below says so in the
   * person's own words, and these findings are then the only copy there is. That
   * path is unchanged and untested by the column's arrival, which is why it
   * stays.
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
        // BOTH SENTENCES NAME A DRAWING, and both are now only reachable from a
        // spec that has one: the verdict pair below is drawn under
        // `focus.drawing` rather than under the stage flag. While it was the
        // stage flag, "It needs another drawing" was a receipt about a spec that
        // never had a first one.
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

  /**
   * THE STATION RECORDS ITS OWN SKIP. It could not, and that was the gap under
   * everything else on this bar.
   *
   * The seven stations are the full path, not the only path: a code-level change
   * needs no screen, design often lives outside the product as prototypes and
   * wireframes, and plan straight to build is a real route. This surface already
   * DISPLAYED that answer in two places -- "Design skipped on purpose" on the
   * row and "This spec was sent past Design" in focus -- while having no way to
   * write it. The only escape here was the owner-only workspace switch, which is
   * every spec or none, so a person who wanted to say "not this one" had to
   * change the policy for all of them or leave the row sitting in a queue
   * forever.
   *
   * IT INHERITS THE ONE RULE THAT MATTERS RATHER THAN RESTATING IT.
   * `chooseDesignRoute` refuses "direct" when a drawing exists and its gate is
   * unapproved, using the same imported `designGateBlocksDispatch` both dispatch
   * paths enforce. So this surface offers no second opinion about when a skip is
   * allowed: the button is drawn only for a spec with nothing drawn, and if the
   * server disagrees its refusal is the receipt.
   */
  const skipDesign = useMutation({
    mutationFn: () => {
      if (!focus) throw new Error("Nothing is in focus.");
      return chooseRoute({ data: { prdId: focus.prdId, route: "direct" } });
    },
    onMutate: actedOn,
    onSuccess: (_res, _v, ctx) => {
      note(
        "focus",
        ctx?.prdId ?? null,
        "You recorded that this spec needs no screen",
        "The skip is on this spec's record and Build reads the spec as it stands. Drawing one later puts it back in front of the gate.",
      );
      // The spec page reads the same decision under its own key, so it must not
      // keep showing "nobody has chosen" after this one lands.
      void qc.invalidateQueries({ queryKey: ["spec-design-route"] });
      refreshWork();
    },
    onError: (e: Error, _v, ctx) =>
      note("focus", ctx?.prdId ?? null, "The skip was not recorded", e.message, true),
  });

  /**
   * THE FORWARD VERB AFTER AN APPROVAL. Once a drawing's gate reads approved,
   * this bar's only remaining gate action was "Send it back"; the way forward
   * lived one station away on the spec page. This is that page's send, mounted
   * unchanged: `canDispatchToRepo` first, the repo gate dialog when the
   * workspace has no repo to build in, then `dispatchStudioSession`. Success
   * navigates to the run and so writes nothing here, the same rule the spec
   * page states over its own send; any other failure lands as a focus receipt.
   */
  const [repoGate, setRepoGate] = React.useState<{ reason: string | null } | null>(null);
  const [checkingRepo, setCheckingRepo] = React.useState(false);
  const sendToStudio = useMutation({
    mutationFn: () => {
      if (!focus) throw new Error("Nothing is in focus.");
      return dispatchBuild({ data: { prdId: focus.prdId } });
    },
    onMutate: actedOn,
    onSuccess: (r) => {
      void navigate({ to: "/runs/$missionId", params: { missionId: r.missionId } });
    },
    onError: (e: Error, _v, ctx) => {
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else note("focus", ctx?.prdId ?? null, "Nothing was sent", e.message, true);
    },
  });
  const sendToBuild = async () => {
    if (!focus) return;
    setCheckingRepo(true);
    try {
      await gateDispatch({
        check: () => checkRepo({ data: { prdId: focus.prdId } }),
        dispatch: () => sendToStudio.mutate(),
        openGate: (reason) => setRepoGate({ reason }),
      });
    } finally {
      setCheckingRepo(false);
    }
  };

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
    skipDesign.isPending ||
    makeRule.isPending;

  // The headline says what needs YOU, and it tells the truth about which queue
  // is asking. Standing counts are standing facts and live in the context column.
  //
  // A FAILED READ FALLS BACK TO THE STATION'S NAME, and it is the half of the
  // throw that the list alone does not cover. `listDesignWork` now throws
  // rather than returning its empty shape, which puts `Failed` and its Try
  // again in the list below; but both queues here are counted off `?? []`, so
  // an errored read still counted zero and this line still finished at
  // "Nothing needs you." -- the exact sentence the throw exists to stop. Zero
  // from a read that did not land is not zero, so the headline says only what
  // it can stand behind and the reason sits under it.
  const headline =
    rules.isLoading || work.isLoading || rules.isError || work.isError
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
          {/* `.sp-acts` was the retired layer's own row, and it carried its
              margin. Meridian's `Actions` deliberately sets none -- "the ten
              call sites that relied on it now say `mt-mrd-4` themselves, which
              is where a composition decision belongs" -- so the space is stated
              here rather than baked into the row. */}
          <Actions className="mt-mrd-4">
            <Action variant="quiet" onClick={openBrandRules}>
              Open brand rules
            </Action>
          </Actions>
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
            {/* `busy` AS WELL AS `disabled`, which the retired `Switch` could
                not say. It is dead here for exactly one reason -- a write is in
                flight -- and Meridian's `Toggle` splits the two so the cursor
                and `aria-busy` follow the wait rather than the ban. Its own
                header records the defect that split them: the Engine Room's
                copy painted `cursor-wait` on any disabled switch, promising a
                person who was simply not allowed to move it that it was about
                to finish something. */}
            <Toggle
              label="Require an approved design before a spec reaches Build"
              checked={work.data.stageEnabled}
              disabled={stage.isPending}
              busy={stage.isPending}
              onChange={(next) => stage.mutate(next)}
            />
          </Line>
        </>
      ) : null}
    </>
  );

  return (
    <>
      <Surface context={hasContext ? context : undefined}>
        {/* THE RHYTHM BETWEEN REGIONS IS STATED HERE, and it used to be baked
          into the region itself. `.sp-block` carried `margin-top: 36px`, a
          28px `padding-top` and a hairline `border-top`, so every section on
          every surface got its separation from the component. Meridian's
          `Region` is a bare `<section>` with no outer space at all, which is
          the correct shape -- a region does not decide what it sits next to --
          and it means the column has to say the gap once, here.

          `gap-mrd-7` (40px), which is what Crew, Approvals and Brain already
          use for the same job, so the five stations being ported alongside
          this one do not each pick a different number. Two things change and
          they are recorded rather than hidden: the section separation goes
          from 36+28px to 40px, and the hairline between sections goes. Both
          are the ported product's own answer, not this station's. */}
        <div className="flex flex-col gap-mrd-7">
          {/* THE AUTONOMOUS PATH, VISIBLE, AND IT IS THE ONE THING THIS STATION
          WAS MISSING. Renders nothing unless a mission row in this workspace
          is running, so it costs no space when the crew is idle and cannot
          show a step that did not happen.

          WHY IT IS NOT A FOURTH INDICATOR SAYING WHAT THREE ALREADY SAY. This
          surface has three `AgentPulse` mounts and they are good ones -- the
          drawing block's sub, the pulse under the focus Actions, and the
          Critic block's sub. All three are gated on `drawAt.isPending` or
          `critic.isPending`, which is react-query mutation state in THIS tab,
          so between them they report exactly one thing: a run the reader
          started here, a moment ago, and still has the tab open for. Nothing
          on Design could report a run a mission is walking through this
          station, one dispatched from Ask, or one still going after a reload.
          That is a different fact, not a louder version of the same one.

          AND IT CANNOT DOUBLE THEM. `redrawDesignScaffold` and
          `runScaffoldDesignCritic` write no mission row at all, so the three
          pulses and this line are structurally incapable of reporting the same
          piece of work -- which is what surface-discipline §7 asks before a
          second live indicator is allowed on a surface.

          Above the headline, as on Decide, Build and Ship. See
          use-live-agents.ts. */}
          <CrewWorking station="design" />
          <PageHeading
            title={headline}
            sub={call ? "Nothing binds into a drawing until you settle it." : undefined}
          />

          {/* ONE Gate. The pending rule owns it because nothing the crew draws is
          on settled ground until it is answered. A drawing's own verdict is
          not here: it sits with the drawing, which is its evidence.

          AND IT SAYS SO WHILE IT READS. This region had four branches and none
          of them was the wait, so between the request and the answer the
          biggest element on the station was absent and the headline, which
          falls back to the station's name for exactly this moment, was the only
          thing on screen. A person who arrives on a workspace with a rule
          pending sees "Design" over a horizontal rule and reads it as "nothing
          is waiting", which is the sentence the fallback exists to avoid
          saying. A plain quiet line, not a working indicator: this is us
          reading a table, and dressing an ordinary read as an agent at work is
          the invented status this system refuses everywhere else. */}
          {rules.isLoading ? (
            <Reading>Reading the brand rules.</Reading>
          ) : rules.isError ? (
            /* A FAILED READ MAY NOT WEAR THE GATE ANY MORE, and the port is what
           made that sayable. The retired `Gate` was an unlabelled panel, so
           standing a failed read in it cost nothing but the shape. Meridian's
           `Gate` opens with an orchid "Waiting on you", which is the one thing
           that token is allowed to mean -- and nobody is waiting on anybody
           here, a read did not land. Wearing it would tell a person a decision
           of theirs is outstanding and hand them a Try again to make it with.

           `ReadFailed` and not `ReadFailedLine`: this sits where the biggest
           element on the station would be, with no region around it to draw the
           box, which is the exact split those two are for. It keeps the
           prominence, keeps the retry, and says in red what actually happened.
           This is also the one branch in this station that changes component
           family rather than name, so it is written down here. */
            <ReadFailed onRetry={() => void rules.refetch()} error={rules.error}>
              The brand rules did not load.
            </ReadFailed>
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
              {/* `Approve`, THE ONE COMPONENT THAT SPENDS ORCHID ON A CONTROL, and
              this is the case it was written for: nothing the crew draws is on
              settled ground until this rule is answered, so the click releases
              work that is genuinely held. Decline is an `Action`: it settles
              the same queue and unblocks nothing, and two orchid buttons side
              by side would say the accent marks "a decision" rather than "a
              person is required to unblock this". */}
              <Approve
                shortcut="a"
                busy={settle.isPending}
                onClick={() => settle.mutate("approve")}
              >
                Approve
              </Approve>
              <Action shortcut="d" busy={settle.isPending} onClick={() => settle.mutate("reject")}>
                Decline
              </Action>
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
              {/* NEITHER OF THESE IS AN `Approve`, and day one is the case that
              makes the distinction easy to get wrong. Nothing is currently
              held: there are no rules, no drawings and no gate to release.
              Both controls go somewhere else so a person can begin. The Gate's
              own orchid eyebrow already carries the true half -- only a person
              can give the crew a design language -- and orchid on a control
              would promise that pressing it settles something here. */}
              <Action variant="primary" onClick={openBrandRules}>
                Add design language
              </Action>
              <Action onClick={() => void navigate({ to: "/plan" })}>Open specs</Action>
            </Gate>
          ) : null}

          {/* WRAPPED AS ONE CHILD, because the column above sets a 40px gap between
          its children and receipts are a STACK: each one draws its own top
          hairline with `first:border-t-0`, so spaced 40px apart they read as
          four unrelated statements instead of one trail. */}
          {pageTrace.length > 0 ? (
            <div>
              {pageTrace.map((t) => (
                <Receipt
                  key={t.id}
                  verb={t.verb}
                  consequence={t.consequence}
                  failed={t.failed}
                  time="now"
                />
              ))}
            </div>
          ) : null}

          <Region
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
              <Reading>Reading the drawings.</Reading>
            ) : work.isError ? (
              /* The LINE half of the pair. The region above already draws the
             heading this failure belongs to, and Meridian caps a region at one
             bordered box, so a second box here would be a frame around a
             sentence. Same shape the retired `Failed` rendered: the fact in
             red, the way out beside it. */
              <ReadFailedLine onRetry={() => void work.refetch()} error={work.error}>
                {reasonLine("Could not read the drawings.", work.error)}
              </ReadFailedLine>
            ) : items.length === 0 ? (
              /* STILL AN EMPTY STATE, AND DELIBERATELY NOT A MISSING PRECONDITION.
             The obvious upgrade here is the state that says this station cannot
             ask its question yet, and the data cannot support it. `listDesignWork`
             returns the same empty shape for three different facts: a workspace
             with no specs, a workspace whose every spec has nothing drawn and an
             already approved gate (the list drops exactly those, because there
             is nothing there to look at and nothing to decide), and a reader who
             is in no workspace at all, which it answers with `empty` before it
             reads anything. Naming any one of them would be a guess two thirds
             of the time, so the sentence stays the one that is true in all
             three. The discriminator it would need is in the report for the
             engineering lane.

             CORRECTED 2026-08-14: this note used to name the second fact as "a
             workspace whose every spec is drawn and settled". That is not what
             the server drops. `items` keeps every row where `drawings.has(id)`,
             so a drawn and settled spec stays on this surface; the row that
             falls out is the undrawn one whose gate is already approved. A
             comment that misreports the filter it is defending is the one kind
             of sentence this file must not carry. */
              /* `NothingYet` and not `NothingHere`: the bare half, because this
             sits under a `Region` heading and the retired `Empty` it replaces
             drew no box either (`.sp-empty` is padding and muted prose, no
             border, no ground). Swapping in the bordered half would invent a
             panel this state has never had. */
              <NothingYet
                action={<Action onClick={() => void navigate({ to: "/plan" })}>Open specs</Action>}
              >
                Nothing to look at. A spec gets a screen drawn from it once it says enough for
                Design to read, and every drawing in this workspace lands here.
              </NothingYet>
            ) : (
              /* THE ONE SURFACE IN THE SPINE THAT NEVER CAPPED. Decide, Plan, Ship
             and Build all cap their lists; this one printed every drawing the
             server would give it, unsorted past the server's own ranking, with
             nothing to narrow it by and no way to find one by name. It is also
             the longest list in the product: `listDesignWork` returns up to
             forty specs against the eighty one production carries, so a person
             here scrolls and hopes.

             The grid, the chips and the finder all live in DrawingsTable, and
             every fact the two-line row carried is still on the screen. What
             the row could not do is compare: forty rows of prose is forty
             sentences to read, and the same forty in columns is one sweep.

             NO ROW BLINKS, and the blink is gone rather than moved. It was
             carried by the agent mark, whose "gate" and "waiting" states both
             resolve to `--sp-gate`, the ember this system banned on 2026-08-14.
             So the one row asking wore orange beside the orchid the standing
             column already gives it: one fact, two accents, one of them a
             colour that must not exist here.

             It could have been redrawn in orchid and it should not be. The grid
             sorts the judgeable rows to the top and names the state in the
             accent, so a blink would be the third telling of something the
             reader has already been shown twice, and this station's own rule is
             that a second live indicator has to earn its place against what is
             already on screen. It cannot. */
              <DrawingsTable
                rows={items}
                gateOn={gateOn}
                focusId={focusId}
                drawnBy={DRAWS}
                onPick={setPicked}
              />
            )}

            {/* Named, not shrugged at. The door is the same one the focus Block
            carries, pointed at the spec that could not be opened here.

            TWO SENTENCES BECAUSE THERE ARE TWO CASES. With an empty list there
            is no focus Block below at all, and the notice would otherwise send
            the reader to compare against something that is not on the page.

            AND THE DOOR IS A DOOR AGAIN. It was drawn as `Failed`'s retry, so
            the one control under "the spec you were handed is not in this list"
            said "Open the spec" in the position, the shape and the wording of
            Try again. Nothing is retried by it: it leaves the station. A retry
            that navigates teaches a person that pressing Try again might take
            the page away, which is the one thing that control must never do.
            The sentence keeps `Failed`, because this is a handoff that did not
            arrive and it is not an empty list. */}
            {handoffMissed ? (
              <>
                <ReadFailedLine>
                  {focusId
                    ? "The spec you were handed is not in this list, so what is open below is a different one."
                    : "The spec you were handed is not in this list, and nothing else is either."}
                </ReadFailedLine>
                {/* The margin is stated at the call site now. Meridian's `Actions`
                sets no outer space on purpose, and this row previously sat
                hard against the sentence above it. */}
                <Actions className="mt-mrd-4">
                  <Action
                    onClick={() =>
                      void navigate({ to: "/plan/spec/$id", params: { id: sent as string } })
                    }
                  >
                    Open the spec
                  </Action>
                </Actions>
              </>
            ) : null}
          </Region>

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
            /* `goTo`, WHICH IS THE WHOLE REASON THAT PROP HAS A NAME. Region splits
           the retired `more`/`onMore` three ways and picking wrong lies to
           assistive tech: `toggle` emits `aria-expanded` and would announce
           that this button reveals more of the region, `act` announces work
           starting and would have a person expect a model run. This one leaves
           the station for a named destination -- the spec on /plan -- so it is
           navigation, and navigation is what `goTo` is. */
            <Region
              title={focus?.title ?? "The screen in focus"}
              goTo={focus ? "Open the spec" : undefined}
              onGoTo={
                focus
                  ? () => void navigate({ to: "/plan/spec/$id", params: { id: focus.prdId } })
                  : undefined
              }
            >
              {item.isLoading ? (
                <Reading>Opening it.</Reading>
              ) : item.isError ? (
                <ReadFailedLine onRetry={() => void item.refetch()} error={item.error}>
                  {reasonLine("Could not open it.", item.error)}
                </ReadFailedLine>
              ) : !focus ? (
                <NothingYet>That spec is no longer readable from this workspace.</NothingYet>
              ) : (
                <>
                  {focus.drawing ? (
                    <DrawingStage html={focus.drawing.html} title={focus.title} />
                  ) : focus.specTooThin ? (
                    /* THE THIRD FACT, AND IT WAS WEARING THE SECOND ONE'S CLOTHES.
                   This surface has three different things to say and had two
                   shapes to say them in: nothing exists yet, the read failed,
                   and THIS ONE, where the station cannot ask its question at
                   all. A spec under a paragraph is not an empty drawing slot
                   waiting on the crew; it is a precondition nobody has met, and
                   the one act that changes it is a person writing more spec.
                   Drawn as `Empty` it read as "the crew has not got to this
                   yet", which sends someone away to wait for a drawing that
                   will never be made.
                   The distinction is not cosmetic: the fidelity spectrum below
                   is withheld for exactly this row, so the panel offered no way
                   forward and no reason for its absence.
                   NO ACCENT ON IT, and that is `NeedsSetup`'s own rule rather
                   than a choice made here. Writing a spec is a setup act, not a
                   call that unblocks a gate, and orchid on it would send a
                   person hunting for a decision that is not on this screen. */
                    <NeedsSetup
                      kind="upstream"
                      title="Design has nothing to read yet"
                      /* The body has to END on the precondition, because
                     `NeedsSetup` prints `thenWhat` after the fixed words "Once
                     it is,". With the default title overridden there is nothing
                     else on the panel for "it" to point at, and a dangling
                     "Once it is" in the one state whose whole job is to name
                     the missing thing is the state failing at its own job. */
                      body="This spec is still shorter than a paragraph. A screen drawn from it would be invention rather than a reading of your intent, so Design waits until the spec is long enough to read."
                      thenWhat="Design draws the screen from the spec's own words, and the call on it is made on this panel."
                      action={
                        <Action
                          onClick={() =>
                            void navigate({
                              to: "/plan/spec/$id",
                              params: { id: focus.prdId },
                            })
                          }
                        >
                          Write the spec
                        </Action>
                      }
                    />
                  ) : (
                    /*
                     * A SKIP IS NOT AN ABSENCE, AND THIS PANEL SAID IT WAS.
                     *
                     * One line for every undrawn spec read "Nothing is drawn for
                     * this spec yet", including specs somebody had DELIBERATELY
                     * sent past Design. Seventy-seven lines below, the same panel
                     * says "This spec was sent past Design" and names the day it
                     * was chosen. So the surface told you a thing was unfinished
                     * directly above telling you it was decided.
                     *
                     * That is the founder's own standing ruling, and this is its
                     * FOURTH sighting: three surfaces were corrected for reading
                     * `design_gate_status`'s NOT NULL DEFAULT 'pending' as
                     * evidence and calling a deliberate skip unfinished. All three
                     * now say the same words. `DrawingsTable.standing()` says them
                     * too. This panel was the one place left.
                     *
                     * The offer to draw one STAYS in both branches, and is honest
                     * in both: the Line below already explains that drawing one
                     * puts the spec back in front of the gate. Choosing to skip is
                     * not a door closing.
                     */
                    <NothingYet>
                      {focus.route?.route === "direct"
                        ? "Skipped on purpose. Nothing is drawn here because somebody decided this one did not need a screen. Draw one anyway and it goes back in front of the gate."
                        : "Nothing is drawn for this spec yet. Pick how finished you want it and Design draws it from the spec's own words."}
                    </NothingYet>
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
                      {/* `mode="one"` IS STATED NOW RATHER THAN DEFAULTED, and the
                      difference is the ARIA rather than the paint. The retired
                      component let `mode` fall through to "one" silently;
                      Meridian requires it, because the two modes are different
                      controls to a screen reader -- "one" is a radiogroup with
                      a single tab stop and arrow keys, "any" is a row of
                      independent toggles. Three fidelities are mutually
                      exclusive, so this is a radiogroup, and now it says so. */}
                      <Choices<DesignFidelity | "">
                        mode="one"
                        label="How finished the drawing should be"
                        value={focus.drawing?.fidelity ?? ""}
                        options={DESIGN_FIDELITIES.map((f) => ({
                          id: f,
                          label: FIDELITY_WORD[f],
                          title: FIDELITY_QUESTION[f],
                          disabled: drawAt.isPending,
                        }))}
                        /* The guard stays. No option carries "", so a pick can only
                       ever be a real fidelity; the empty string exists so a
                       drawing whose fidelity was never recorded selects
                       nothing rather than being called a mockup. */
                        onChange={(f) => {
                          if (f) drawAt.mutate(f);
                        }}
                      />
                    </Line>
                  ) : null}

                  {/* Drawn or not. With nothing drawn, "what it replaces" drops out
                  and "what it holds up" answers with the fact that used to be
                  stated backwards here: an undecided gate holds up NOTHING while
                  no screen is drawn. A gate judges a drawing and does not gate
                  the absence of one (src/lib/build/design-gate.ts), and the
                  claim this comment used to make -- that the gate blocks whether
                  or not anyone has drawn the screen -- is the reading that made
                  every spec in every workspace look blocked by two column
                  defaults meeting. */}
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
                          : `Routed here on ${new Date(focus.route.at).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )} to be drawn before Build.`
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

                  {/* A SETTLED VERDICT IS A FACT, AND IT USED TO BE A DEAD BUTTON.
                  The primary control read "Approved" and was disabled once the
                  gate was approved: a status wearing a control's clothes, in
                  the one position on the panel a person looks for the thing to
                  press. It also spent the bar's only primary slot on something
                  that could not be pressed, so the call that WAS still live,
                  sending it back, sat there looking secondary.

                  The verdict and its day now read as the sentence they are, and
                  the bar below carries only what still does something. The date
                  is new here: `gateDecidedAt` has been on this record all along
                  and no panel ever printed it, so "approved" carried no
                  when. */}
                  {/* WHO SETTLED IT IS NOT A FACT THIS PANEL HOLDS.
                  These two lines said "You approved this design". `decideDesignGate`
                  has no owner or role check, so any member of the workspace can
                  settle the gate, and `getDesignScaffold` returns `gateStatus` and
                  `gateDecidedAt` and no decider at all. So when a teammate settled
                  it, every other person on the workspace was told they had done it
                  themselves. This file's own header says nothing on this surface is
                  inferred, and that was the newest sentence on the panel.

                  The decider IS on the record, in `prds.design_decided_by`, and Ship
                  already reads it. Until this query carries it too, the sentence
                  drops the actor rather than guessing one. Naming the person is the
                  better line and it is a data change, not a copy change. */}
                  {focus.drawing && focus.stageEnabled && focus.gateStatus !== "pending" ? (
                    <Line
                      label={
                        focus.gateStatus === "approved"
                          ? "This design was approved"
                          : "This design was sent back"
                      }
                      sub={
                        <>
                          {focus.gateDecidedAt
                            ? `Settled on ${new Date(focus.gateDecidedAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}. `
                            : "The record does not carry the day it was settled. "}
                          {focus.gateStatus === "approved"
                            ? "Sending it back shuts the gate again."
                            : "The gate stays shut until a drawing is approved."}
                        </>
                      }
                    />
                  ) : null}

                  <Actions
                    className="mt-mrd-4"
                    trailing={
                      focus.drawing ? (
                        <Action variant="quiet" busy={busy} onClick={() => hand.mutate()}>
                          Make a link
                        </Action>
                      ) : undefined
                    }
                  >
                    {/* THE VERDICT PAIR NEEDS A DRAWING, AND IT USED TO NEED ONLY
                    THE STAGE. Gated on `focus.stageEnabled` alone, "Approve the
                    design" and "Send it back" rendered for a spec with nothing
                    drawn, and both wrote a taste learning: the extractor was
                    handed "The human APPROVED the resulting mockup as a good fit
                    for this workspace" with only the spec text behind it, and
                    the send-back receipt read "It needs another drawing" about a
                    spec that never had one. `design_stage_enabled` is NOT NULL
                    DEFAULT true and the panel opens on the first row, so in a
                    workspace of specs and no drawings that pair was the DEFAULT
                    state of this bar. The taste loop's whole subject is a
                    mockup, so no mockup means no verdict to record.

                    WHAT REPLACES IT is the decision that spec actually faces:
                    whether it needs a screen at all. That is a stronger control
                    than the one it replaces, because it writes a fact instead of
                    inventing one. */}
                    {focus.drawing ? (
                      focus.stageEnabled ? (
                        <>
                          {/* THE FORWARD VERB AFTER AN APPROVAL, and it leads the
                          bar because once the gate reads approved it is the only
                          control here that moves this spec anywhere. See
                          `sendToBuild` above for the chain behind the click. */}
                          {focus.gateStatus === "approved" ? (
                            <Action
                              variant="primary"
                              busy={checkingRepo || sendToStudio.isPending}
                              onClick={() => void sendToBuild()}
                              title="Hand the spec to Build and open the run"
                            >
                              {checkingRepo || sendToStudio.isPending
                                ? "Sending"
                                : "Send it to Build"}
                            </Action>
                          ) : null}
                          {/* Approve is drawn only while approving would do
                          something. Pressing it on an approved gate wrote the
                          same status back and taught the taste loop a second
                          time from one judgment, which is why it was disabled
                          rather than repeated; a control nobody can press is
                          not the answer to a control that should not be
                          there. */}
                          {/* `Approve`, AND THE STAGE FLAG IS WHAT EARNS IT. With
                          the gate on, `designGateBlocksDispatch` holds this
                          spec out of Build until this click; that is the
                          literal definition Meridian gives the orchid control,
                          "the work is stopped until it is pressed". Send it
                          back settles the same gate and releases nothing, so
                          it is an `Action`. */}
                          {focus.gateStatus === "approved" ? null : (
                            <Approve busy={busy} onClick={() => verdict.mutate("approve")}>
                              Approve the design
                            </Approve>
                          )}
                          <Action busy={busy} onClick={() => verdict.mutate("reject")}>
                            Send it back
                          </Action>
                        </>
                      ) : (
                        <>
                          {/* NEITHER OF THESE IS AN `Approve`, and the comment above
                          this bar already argued why in words: with the gate off
                          there is no gate to move, so the verdict has nowhere to
                          land except the taste loop. These record an opinion.
                          Orchid on them would claim the click releases a spec
                          into Build, which is the exact capability the wiring
                          does not have here. `primary` is Meridian's neutral
                          filled face, so "Good fit" keeps its weight in the bar
                          without borrowing the gate's meaning. */}
                          <Action variant="primary" busy={busy} onClick={() => taste.mutate(true)}>
                            Good fit
                          </Action>
                          <Action busy={busy} onClick={() => taste.mutate(false)}>
                            Not a fit
                          </Action>
                        </>
                      )
                    ) : focus.route?.route === "direct" ? null : (
                      /* Already recorded direct renders nothing rather than a second
                      button: the skip is on the record, the Line above says so
                      and says how to undo it, and re-pressing would be a click
                      the trail cannot tell from a decision. */
                      /* AN `Action`, DELIBERATELY, AND THIS IS THE ONE THAT MATTERS
                      MOST ON THIS STATION. Plan straight to Build, skipping
                      Design, is a first-class route rather than an escape
                      hatch, and this control records that a spec takes it. It
                      is not an `Approve`: with nothing drawn the gate holds
                      nothing up -- the consequence panel three lines above says
                      exactly that -- so there is no block for this click to
                      release. Dressing it in the gate's orchid would frame a
                      deliberate skip as a stuck row being freed, which is the
                      opposite of what it records. */
                      <Action busy={busy} onClick={() => skipDesign.mutate()}>
                        Record that this needs no screen
                      </Action>
                    )}
                    {focus.drawing ? (
                      <Action busy={busy} onClick={() => critic.mutate()}>
                        {critic.isPending ? "The Critic is reading" : "Ask the Critic"}
                      </Action>
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
                  {/* No wrapper here, unlike the page trace above: a `Region`'s
                  children stack in a plain div with no gap, so the receipts
                  are already adjacent and their own top hairlines do the
                  separating. */}

                  {findings && findings.length === 0 ? (
                    <NothingYet>
                      The Critic found nothing against your rules or the accessibility floors.
                    </NothingYet>
                  ) : null}
                </>
              )}
            </Region>
          ) : null}

          {/* Its own region, not a Block nested in a Block: the section rule is a
          rule between sections and never appears inside one. Same for the
          links below. WHAT YOU CAN DO ABOUT IT, in place: a finding you cannot
          act on is a complaint. */}
          {focus && findings && findings.length > 0 ? (
            /* NO `act` ON THIS HEAD, AND THAT IS A DECISION RATHER THAN AN
           OVERSIGHT. `Region.act` is built for a model dispatch fired from a
           region heading, and this station has one -- "Ask the Critic". It
           cannot live here. This region only exists once there ARE findings,
           so on a first review the control would not be drawn at all, which is
           the exact defect the pulse below the Actions bar was added to fix:
           "the first review is the one where a person has no idea whether
           anything is happening, so it is the one that most needs this." The
           dispatch stays in the focus panel's Actions bar, where it is
           reachable before there is anything to read. */
            <Region
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
            </Region>
          ) : null}

          {focus && focus.consequence.shares.length > 0 ? (
            /* THE TITLE USED TO BE THE CLAIM, AND THE CLAIM WAS FALSE AFTER ONE
           REDRAW. "Links to this drawing" filed every link under the screen
           above it, while a link is a SNAPSHOT: its markup is written once, into
           `prototype_files`, and a redraw overwrites `prd_scaffolds.html` and
           touches nothing else. So the person who redrew was shown a live door
           labelled "Open what a visitor sees" onto the drawing they had just
           replaced.

           WHAT IS FIXED HERE IS THE LABEL, NOT THE STALENESS. The server now
           stamps each link's stored markup against the drawing on screen and
           this says, per link, which of the two it is. What is still missing is
           the refresh: no path in this repo updates `prototype_files`, so the
           person who redrew cannot update an address they already handed out.
           "Make a link" inserts a SECOND link rather than refreshing the first,
           and delete lives on /artifacts. That write belongs to
           src/lib/prototypes.functions.ts, beside the insert that created the
           row. */
            <Region
              title="Links made from this spec"
              sub="A link is a snapshot of the markup at the moment it was made. Redrawing the screen does not change what a link already handed out shows."
            >
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
                    <>
                      {s.isPublic ? (
                        <Door
                          title="Open what a visitor sees"
                          onClick={() =>
                            window.open(shareUrl(s.slug), "_blank", "noopener,noreferrer")
                          }
                        >
                          {shareUrl(s.slug)}
                        </Door>
                      ) : (
                        "Nobody outside can open it"
                      )}
                      {/* Read from the markup itself, never from a timestamp: both
                      `prototypes.updated_at` and `prd_scaffolds.updated_at` move
                      for reasons that have nothing to do with what is served.
                      Silent when there is no drawing above to compare against,
                      because there is then no question to answer. */}
                      {/* THE STALE LINK IS RAISED, NOT TINTED. It carried
                      `tone="warn"`, which resolves to `--sp-warn`, a gold. This
                      product has no warning colour and no token for one: a hue
                      here would have to sit between "a person is required" and
                      "it failed" and it is neither, and gold is the one hue the
                      system is most careful to keep off a screen. What the
                      sentence needs is emphasis, so it takes the top of the ink
                      ramp and a heavier weight, which is legible in greyscale
                      and does not claim a meaning the palette reserves. */}
                      {!focus.drawing ? null : s.matchesDrawing === true ? (
                        " · This is the drawing above"
                      ) : s.matchesDrawing === false ? (
                        <>
                          {" · "}
                          <Value>
                            <span className="font-medium text-mrd-ink">
                              Serves an earlier drawing, not the one above
                            </span>
                          </Value>
                        </>
                      ) : (
                        " · Could not read which drawing it serves"
                      )}
                    </>
                  }
                >
                  {s.isPublic ? (
                    <Action
                      variant="quiet"
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
                    </Action>
                  ) : (
                    /* NO TONE, AND MERIDIAN'S `Value` HAS NO `you` TO REACH FOR
                   ANYWAY. "Private" is a state of the link, not an outcome and
                   not something waiting on anybody, so it stays on the quiet
                   default. */
                    <Value>Private</Value>
                  )}
                  <Toggle
                    label={`Let anyone with the link open ${s.name}`}
                    checked={s.isPublic}
                    disabled={flipShare.isPending}
                    busy={flipShare.isPending}
                    onChange={(next) =>
                      flipShare.mutate({ id: s.id, isPublic: next, slug: s.slug })
                    }
                  />
                </Line>
              ))}
            </Region>
          ) : null}
        </div>
      </Surface>
      {/* Mounted outside the surface, the way the spec page mounts it, so an
      open dialog is not a child of the region whose write opened it. Only the
      dispatch can open this gate on this station, so there is no act to
      distinguish and the retry re-runs the send. */}
      <RepoGateDialog
        open={repoGate !== null}
        prdId={focusId}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => sendToStudio.mutate()}
        act="dispatch"
      />
    </>
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
        <div className="flex flex-col gap-mrd-7">
          <PageHeading
            title="Design did not load."
            sub="Every drawing, rule and link is safe on the record."
          />
          {/* `ReadFailedLine` AND NOT THE BOXED HALF, WHICH IS THE ONE PLACE
              THIS PORT DEPARTS FROM THE OBVIOUS READING OF THE PAIR. Meridian
              says the bordered `ReadFailed` is for a failure with no region
              around it, and there is none here. But `ReadFailed` prints its own
              reassurance -- "Nothing has been changed and nothing has been
              lost" -- one line under a `sub` that already says "Every drawing,
              rule and link is safe on the record". That is the same sentence
              twice, which is the hard ban on label, sublabel and helper all
              saying one thing, and it would be introduced BY the port rather
              than inherited. The line half renders exactly what the retired
              `Failed` rendered here: the fact in red, the way out beside it. */}
          <ReadFailedLine onRetry={() => window.location.reload()} retryLabel="Reload">
            The surface crashed while rendering.
          </ReadFailedLine>
        </div>
      </Surface>
    );
  },
});

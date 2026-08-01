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
 *
 * 4. WHAT IS ONE CLICK AWAY. The brand ledger with its import, paste and
 *    defaults machinery stays in Settings. Every prototype ever made stays on
 *    /artifacts. The spec's own text stays on /plan. A row in the list is two
 *    lines; the drawing, its blast radius, its links and the Critic's findings
 *    belong to the ONE spec in focus and are drawn only for it.
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
  verb: string;
  consequence: React.ReactNode;
  failed?: boolean;
};

/** The row's SECOND line carries one different fact, and which fact that is
 *  depends on the row. A drawing made before rules that are now in force is
 *  the exception worth surfacing in a list; everything else describes itself. */
function rowSub(r: DesignWorkRow, gateOn: boolean): string {
  if (!r.drawing) {
    return gateOn && r.gateStatus === "approved"
      ? "Nothing drawn. The gate is already approved"
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
  const fProvenance = useServerFn(getScaffoldProvenance);
  const q = useQuery({
    queryKey: ["scaffold-provenance", prdId],
    queryFn: () => fProvenance({ data: { prdId } }),
  });

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
        staleCount > 0
          ? `${current} still stand. ${staleCount} ${staleCount === 1 ? "has" : "have"} been replaced since, so this drawing is behind your design language: ${groundedIn
              .filter((g) => g.retired)
              .map((g) => g.title)
              .join(", ")}.`
          : `${groundedIn.map((g) => g.title).join(", ")}. Everything else in the drawing is the model's own.`
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
  // A pick that is no longer in the list falls back rather than opening a
  // detail view of something that is gone.
  const focusId =
    (picked && items.some((i) => i.prdId === picked) ? picked : items[0]?.prdId) ?? null;

  const item = useQuery({
    queryKey: ["design-work-item", focusId],
    queryFn: () => fetchItem({ data: { prdId: focusId as string } }),
    enabled: !!focusId,
  });
  const focus = item.data ?? null;

  // Receipts, not toasts (anti-slop.md §5). A write renders what it CAUSED.
  const [trace, setTrace] = React.useState<Trace[]>([]);
  const nextId = React.useRef(1);
  const note = React.useCallback(
    (at: Trace["at"], verb: string, consequence: React.ReactNode, failed = false) => {
      setTrace((t) => [{ id: nextId.current++, at, verb, consequence, failed }, ...t].slice(0, 4));
    },
    [],
  );
  const pageTrace = trace.filter((t) => t.at === "page").slice(0, 2);
  const focusTrace = trace.filter((t) => t.at === "focus").slice(0, 2);

  const [findings, setFindings] = React.useState<DesignCriticFinding[] | null>(null);
  const [ruling, setRuling] = React.useState<string | null>(null);

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
    onError: (e: Error) => note("page", "Your call did not save", e.message, true),
  });

  const drawAt = useMutation({
    mutationFn: (fidelity: DesignFidelity) => {
      if (!focus) throw new Error("Nothing is in focus.");
      return redraw({ data: { prdId: focus.prdId, fidelity } });
    },
    onSuccess: (res) => {
      setFindings(null);
      note(
        "focus",
        `Design drew a ${FIDELITY_WORD[res.fidelity].toLowerCase()}`,
        <>
          <Num>{res.screenCount}</Num> screens, <Num>{res.controlCount}</Num> controls. The drawing
          before it is gone.
        </>,
      );
      refreshWork();
    },
    onError: (e: Error) => note("focus", "Nothing was drawn", e.message, true),
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
    onSuccess: (res) => {
      note(
        "focus",
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
    onError: (e: Error) => note("focus", "The verdict did not save", e.message, true),
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
    onSuccess: (res, approved) => {
      note(
        "focus",
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
    onError: (e: Error) => note("focus", "Nothing was recorded", e.message, true),
  });

  const critic = useMutation({
    mutationFn: () => {
      if (!focus?.drawing) throw new Error("Nothing is drawn.");
      // The validator caps the payload at 60000. Slicing here means a long
      // document gets reviewed on its first 60000 characters rather than
      // failing the request outright.
      return askCritic({ data: { prdId: focus.prdId, html: focus.drawing.html.slice(0, 60000) } });
    },
    onSuccess: (res) => {
      if (!res.review) {
        setFindings(null);
        note(
          "focus",
          "The Critic could not review it",
          "Nothing was written down. Try again.",
          true,
        );
        return;
      }
      setFindings(res.review.findings);
      note(
        "focus",
        "The Critic reviewed the drawing",
        res.review.findings.length === 0 ? (
          "It found nothing against your rules or the accessibility floors."
        ) : (
          <>
            <Num>{res.review.findings.length}</Num> findings, below.
          </>
        ),
      );
    },
    onError: (e: Error) => note("focus", "The Critic could not review it", e.message, true),
  });

  const makeRule = useMutation({
    mutationFn: async (f: DesignCriticFinding) => {
      setRuling(f.issue);
      return draftRule({ data: { text: ruleTextFor(f) } });
    },
    onSuccess: (res) => {
      setRuling(null);
      note(
        "focus",
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
    onError: (e: Error) => {
      setRuling(null);
      note("focus", "No rule was drafted", e.message, true);
    },
  });

  const hand = useMutation({
    mutationFn: () => {
      if (!focus) throw new Error("Nothing is in focus.");
      return publish({ data: { prdId: focus.prdId } });
    },
    onSuccess: (p) => {
      note(
        "focus",
        "You made a link for this drawing",
        <>
          It is private. Switch it on below to hand out <Num>/p/{p.shareSlug}</Num>.
        </>,
      );
      refreshWork();
    },
    onError: (e: Error) => note("focus", "No link was made", e.message, true),
  });

  const flipShare = useMutation({
    mutationFn: (v: { id: string; isPublic: boolean; slug: string }) =>
      share({ data: { id: v.id, isPublic: v.isPublic } }),
    onSuccess: (_r, v) => {
      note(
        "focus",
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
    onError: (e: Error) => note("focus", "The link did not change", e.message, true),
  });

  const stage = useMutation({
    mutationFn: (enabled: boolean) => flipStage({ data: { enabled } }),
    onSuccess: (res) => {
      note(
        "page",
        res.enabled ? "You turned the design gate on" : "You turned the design gate off",
        res.enabled
          ? "A spec now needs an approved design before it can reach Build."
          : "A spec can now reach Build without a design being approved.",
      );
      refreshWork();
    },
    onError: (e: Error) => note("page", "The gate setting did not change", e.message, true),
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
      ? "Reading the record."
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
          <div className="sp-ctx-head">Where this rule came from</div>
          <div className="sp-ctx-body">
            {CATEGORY_LABEL[call.category]} · {SOURCE_LABEL[call.source_kind]} ·{" "}
            <Num>
              {new Date(call.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </Num>
          </div>
        </>
      ) : null}

      {waiting.length > 1 ? (
        <>
          <div className="sp-ctx-head">Behind this one</div>
          <div className="sp-ctx-body">
            <Num>{waiting.length - 1}</Num> more waiting. They keep their order until this one is
            settled.
          </div>
        </>
      ) : null}

      {rules.isSuccess && entries.length > 0 ? (
        <>
          <div className="sp-ctx-head">The rules themselves</div>
          <div className="sp-ctx-body">
            <Num>{inForce}</Num> in force. Add, review or retire them in Settings.
          </div>
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
          <div className="sp-ctx-head">The gate itself</div>
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
          question={call.title}
          lines={[
            <span key="what">{call.content}</span>,
            ...(call.rationale ? [<span key="why">{call.rationale}</span>] : []),
          ]}
        >
          <Button
            variant="primary"
            disabled={settle.isPending}
            onClick={() => settle.mutate("approve")}
          >
            Approve
          </Button>
          <Button disabled={settle.isPending} onClick={() => settle.mutate("reject")}>
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <AgentMark slug={DRAWS} state={drawAt.isPending ? "running" : "quiet"} />
            {drawAt.isPending
              ? "Design is drawing."
              : "Design renders a spec as a screen, in your brand."}
          </span>
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
        <Block title={focus?.title ?? "The screen in focus"}>
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <AgentMark slug={REVIEWS} state={critic.isPending ? "running" : "quiet"} />
              Making one a rule stops the crew repeating it.
            </span>
          }
        >
          <Findings
            findings={findings}
            pendingIssue={ruling}
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
              sub={s.isPublic ? shareUrl(s.slug) : "Nobody outside can open it"}
            >
              {s.isPublic ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard?.writeText(shareUrl(s.slug));
                    note("focus", "You copied a link", `${shareUrl(s.slug)} is on your clipboard.`);
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
  component: Design,
  head: () => ({ meta: [{ title: "Design · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Design] route crashed:", error);
    return (
      <Surface>
        <PageHead title="Design did not load." sub="Reload the page. Nothing here is lost." />
      </Surface>
    );
  },
});

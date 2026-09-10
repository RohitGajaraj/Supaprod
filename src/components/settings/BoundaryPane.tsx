/**
 * THE BOUNDARY, TEAM'S OWN PANE. Moved out of the settings route whole on
 * 2026-09-09 (fifth review), not rebuilt: every panel, every prop and every
 * word below is what Settings > Autonomy rendered, so nothing a person could
 * change there became unreachable in the move.
 *
 * WHY IT LEFT SETTINGS. Team is the rail row that owns who works here and what
 * they may do; Settings owns the account, the workspace and the plumbing. This
 * pane answers the first question, so a copy of it under Settings gave one
 * question two doors that wrote the same rows, and nothing on either said so.
 * `/team?tab=boundary` is the one address now, and the retired settings ids
 * redirect to it (`OFF_PAGE_SECTIONS`, settings-sections.ts).
 */
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { Action, Actions, PageHeading } from "@/components/meridian/surface-parts";
import { Surface } from "@/components/meridian/Surface";
import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";
import { BoundaryControls } from "@/components/governance/BoundaryControls";
import { BudgetsPanel } from "@/components/governance/BudgetsPanel";
import { ControlsPanel } from "@/components/governance/ControlsPanel";
import { GuardrailsPanel } from "@/components/governance/GuardrailsPanel";
import { HouseRulesPanel } from "@/components/governance/HouseRulesPanel";
import { RoutinesPanel } from "@/components/engine-room/rooms/RoutinesPanel";
import { WILL_ASK_BEFORE_IT_SHIPS } from "@/components/track/footer-mode";
import { getBoundary } from "@/lib/governance.functions";
import { useWorkspace } from "@/hooks/use-workspace";

/**
 * THE ONE SCREEN THAT ANSWERS "what can these agents do without asking me".
 *
 * Extracted from the settings route so it can hold a branch of its own. It
 * mounts five panels, each with its own read, and when the session dies they
 * ALL fail -- so the pane was drawing the same sentence five times over, which
 * is the wall U-043 removed from Guardrails and U-052 from Brain arriving here
 * by a third route.
 *
 * A DEAD SESSION IS A PAGE-LEVEL FACT. If it ended, none of the five reads can
 * succeed until the reader signs in, so five panels saying so separately tell
 * them nothing the first one did. It reads the SAME `["boundary", workspaceId]`
 * key BoundaryControls uses, so this costs no request and cannot disagree with
 * the panel it is standing in front of.
 *
 * Scoped to the ended session and nothing else: a genuine mixture, where the
 * boundary reads and the guardrails do not, still gets per-panel honesty --
 * there the panels disagree and which half is real is exactly what the reader
 * needs.
 */
export function BoundaryPane({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const fBoundary = useServerFn(getBoundary);
  const b = useQuery({
    queryKey: ["boundary", activeWorkspaceId],
    queryFn: () => fBoundary(),
  });
  /*
   * IT CARRIES ITS OWN CHASSIS NOW, 2026-09-09. Under Settings the surrounding
   * pane supplied the column and the rhythm, and leaving is what the settings
   * index is for. As Team's own tab it takes over the URL, so it draws the
   * same `Surface` + `gap-mrd-7` column every other Team surface draws and
   * ends with the same way back the methods panel and a member's page do. A
   * tab that takes over the URL and offers no way out is a dead end.
   */
  const back = <Action onClick={onBack}>Back to the crew</Action>;
  if (endedSessionFor(b.error)) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <SessionEnded title="What they may do without asking" error={b.error}>
            Nothing about what your agents may do has changed while you were away.
          </SessionEnded>
          <Actions>{back}</Actions>
        </div>
      </Surface>
    );
  }
  return (
    <Surface>
      <div className="flex flex-col gap-mrd-7">
        {/*
         * THE BOUNDARY NOW LIVES WHERE ITS NAME IS, 2026-08-27.
         *
         * This pane used to render ControlsPanel alone and its own comment
         * said the quiet part out loud: "the boundary has one home and this
         * is not it". So the settings section titled for what agents may do
         * did not contain the controls that decide what agents may do.
         * Those are updateToolMode, setWorkspaceAutonomyPolicy and
         * setWorkspaceSpendPolicy, and all three live in BoundaryControls,
         * which was only reachable at /engine-room?room=safety.
         *
         * A person asking the single question an enterprise buyer asks
         * ("what can these agents do without asking me?") arrived at a page
         * named for that question, read a description of the answer, and
         * had to leave to change it. That is the defect the founder called
         * out, and it is the reason 13,299 lines across four routes felt
         * like it did not do its job.
         *
         * AND THE FOLD LANDED, 2026-09-09. The comment here used to say
         * "MOUNTED, NOT MOVED ... when the ruling lands the fold is a
         * redirect rather than a build", pointing at S3's request to make
         * Settings the boundary's final home. P-79 then folded the engine
         * room into Team instead, and this interim outlived it by a week.
         * The destination is Team now, the settings ids redirect here, and
         * BoundaryControls is still unchanged at its Engine Room address so
         * nothing that reached it before stopped working.
         *
         * ORDER IS THE READING ORDER, and it is deliberate: what they may
         * do, then what runs on a schedule, then the switch that stops all
         * of it. The stop is last because it is the thing you reach for
         * when the first two are wrong, not the thing you set first.
         */}
        <PageHeading
          title="What they may do without asking"
          /*
           * THE LAST SENTENCE IS THE ONE HALF OF THE FOOTER'S OWN MANDATE LINE
           * THAT HOLDS NO MATTER WHAT THE PANE ABOVE SAYS (P-17). "Working on
           * its own" is a run-in-progress fact this page has no single run to
           * report; "It will ask before it ships" is R-27, a platform floor
           * true whatever the arc, whatever the ceiling, whatever the kill
           * switch says -- so it is imported from footer-mode.ts rather than
           * retyped, and this page is the one honest place to say it before
           * any run is even open.
           */
          sub={`Every tool, the ceiling on a run, what routes itself, and the switch that stops all of it. ${WILL_ASK_BEFORE_IT_SHIPS}`}
        />
        {/* BoundaryControls owns the kill switch now (S0 ruling A-006
                section 2): one editor, and it is the panel that edits every
                other boundary. ControlsPanel below keeps a readout. */}
        {/* The pane's own PageHeading is above; this panel's data-derived posture
          sentence ("Your crew does N of M things without asking") renders at
          region level rather than as a second page title. */}
        <BoundaryControls headingShownElsewhere />
        {/* Directly after the boundary, because a ceiling is the boundary
          expressed in money. U-062 said this and put it three regions later,
          behind ControlsPanel, so the page carried "The ceiling" and "What you
          will not spend past" separated by the stop switch and the
          auto-pipelines. All the limits read together now. */}
        <BudgetsPanel controlsOnly />
        <ControlsPanel controlsOnly onOpenQueue={() => navigate({ to: "/inbox" })} />
        {/*
         * THE REST OF WHAT "ALLOWED" MEANS, mounted 2026-08-27 so the fold
         * S0 ruled in A-006 can remove a DOOR without removing a
         * CAPABILITY.
         *
         * The Safety room has six views and this page held two of them. A
         * redirect on top of that would have dropped the guardrail rules,
         * the house rules and the background jobs -- which is the one thing
         * the ruling forbids, and the quick version of this change.
         *
         * They belong here on their own merit rather than as fold luggage.
         * The founder's question is "what can these agents do without
         * asking me", and the honest answer has four parts: what they may
         * DO (the boundary above), what they may SAY (guardrails), the
         * standing rules they answer to (house rules), and what runs while
         * nobody is watching (routines). Reading order follows that
         * sentence.
         *
         * MOUNTED, NOT MOVED, and still true on 2026-09-09: each also
         * renders at its Engine Room address, which Team's Spend and limits
         * tab reaches. That leaves the same panels drawn under two of
         * Team's own paths - a real residue, and a smaller one than the two
         * rail doors this fold closed. It is the Engine Room's room set to
         * settle, not this pane's.
         *
         * Incidents, the sixth view, is deliberately NOT here: it is a log
         * of what already happened, and this page is what is allowed to
         * happen next. It belongs under the record.
         */}
        {/* HOW MUCH THEY MAY SPEND WITHOUT ASKING, which is the same question as
          which tools they may use without asking. Phase 2 of the fold S0 ruled
          in A-006: the ceilings come across, while the log of what those
          ceilings have already SAID stays with the record in the Engine Room.
          Placed directly after the boundary because a ceiling is the boundary
          expressed in money. */}
        <GuardrailsPanel controlsOnly />
        <HouseRulesPanel />
        <RoutinesPanel />
        <Actions>{back}</Actions>
      </div>
    </Surface>
  );
}

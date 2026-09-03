import * as React from "react";
import { AskPane } from "@/components/ask/AskPane";
import { useAsk } from "@/lib/ask-context";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { useLiveAgents, type LiveAgents } from "@/hooks/use-live-agents";
import { ago } from "@/components/runs/run-state";

/**
 * THE FRONT DOOR, STANDING OPEN.
 *
 * FOUNDER'S ASK, and it is the one this whole surface exists to answer:
 * *"Today the platform still feels like a traditional application with multiple
 * screens, deep navigation and fragmented surfaces... explore how prompting can
 * become the primary interaction while agents orchestrate everything behind the
 * scenes."*
 *
 * WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT. It is `AskPane`, unchanged,
 * with a collapsed row underneath it that is always there. It is NOT a second
 * conversational surface, and building one would have been the ratchet
 * regression in its purest form: a new front door with a new visual language,
 * competing with a composed surface that already has one. AskPane is already
 * mounted on every authenticated route and already owns Cmd+K. What it lacked
 * was PRESENCE. A door you have to know a keyboard shortcut to find is not the
 * primary interaction, however good it is once you are through it.
 *
 * So the interaction change lands ON ITS OWN, with no new capability attached.
 * Ask and Hand it over behave exactly as they did an hour ago, Cmd+K is
 * untouched, and Escape still closes. The only new fact on screen is that the
 * product now visibly invites you to say what you want, from everywhere.
 *
 * WHY A ROW AND NOT A BUTTON. A button says "there is a chat in here". A row
 * that looks like the thing you type into says "type here", and the difference
 * is the entire point: it has to read as the primary way to work rather than as
 * a support affordance parked in a corner.
 *
 * IT NEVER COVERS THE WORK. `.sp-work` carries a matching `padding-bottom`, so
 * the last row of a station is always reachable above the dock. Anything that
 * floats over content and cannot be dismissed is a worse sin than the one this
 * fixes.
 *
 * WHAT IT SAYS WHEN THE CREW IS BUSY. It borrows `useLiveAgents`, the same read
 * the stations use, so the collapsed row can report a genuinely running agent
 * rather than sitting silent while the product works. Nothing is fabricated:
 * with nothing running it shows the invitation and nothing else.
 */
/**
 * `pane` IS A TESTING SEAM AND NOTHING ELSE, and it exists because the
 * alternative broke another suite.
 *
 * GlobalComposer's tests are about WHICH DOOR renders on which route. They do
 * not want the pane's whole graph -- its workspace read, its threads read, its
 * stream -- so they replaced it with `mock.module("@/components/ask/AskPane")`.
 * That swap is PROCESS-WIDE: whenever that file loaded before AskPane's own
 * suite, AskPane's tests imported the stub and its conversation-switcher
 * assertions ran against a bare div. Three of four full-suite runs were clean
 * and the fourth failed three tests, in a file that does not import the file
 * that failed.
 *
 * A default prop is the whole fix. The app never passes it, so production is
 * byte-identical; a test passes its own stub and leaves the module registry
 * untouched, so nothing it does can reach another file.
 *
 * `liveAgents` IS THE SAME SEAM, FOR THE SAME REASON (P-18b). `useLiveAgents`
 * itself reaches `listMissions` and `listMovingTracks` two modules deep, and
 * `a-module-mock-is-process-wide.test.ts` already tracks `@/lib/missions.
 * functions` as mocked by AskPane's own suite -- a second file mocking it
 * would be the exact collision that test exists to catch. Injecting the
 * hook's RESULT, not its dependencies, means a test never has to touch
 * `mock.module` for either lower module at all.
 */
export function AskDock({
  pane: Pane = AskPane,
  liveAgents = useLiveAgents,
}: {
  pane?: React.ComponentType;
  liveAgents?: () => LiveAgents;
} = {}) {
  const ask = useAsk();
  const { working, lastDone } = liveAgents();

  // The pane owns the screen while it is open; the dock stands down so there is
  // never a second input for the same conversation.
  if (ask.isOpen) return <Pane />;

  const lead = working[0];
  const others = working.length - 1;
  const workTitle = lead ? lead.title : (lastDone?.title ?? null);

  return (
    <>
      {/* Still mounted, still self-hiding. Keeping it here rather than in the
          branch above means opening and closing never remounts the pane, so a
          conversation survives a collapse. */}
      <Pane />
      <div className="sp-dock" data-testid="ask-dock">
        <button
          type="button"
          className="sp-dock-row"
          onClick={ask.summon}
          // The accessible name is the invitation, not the mechanism. A screen
          // reader hears what it is for, the same as a sighted reader.
          aria-label="Ask Supaprod about your work"
        >
          <span className="sp-dock-mark" aria-hidden="true">
            <SupaprodMark size={17} />
          </span>
          {/*
           * R-24's INTERIM, WHICH HAS BEEN RULED AND UNBUILT SINCE 2026-08-25.
           * The ruling, verbatim: "AskDock must stop saying 'What should we
           * build?' while it opens a chat. That copy promises the loop and
           * delivers a conversation."
           *
           * F-04 is the measurement behind it: this box files a MISSION, and
           * the run workbench cannot see a mission. So the most-seen invitation
           * in the product asked the question the whole loop is named for, and
           * what came back was a conversation. The ruling assigned it to lane 0
           * under the three-lane model; SURFACE-MAP:174 puts components/ask in
           * this lane now, so it is mine and it is late.
           *
           * "Ask about your work" is the pane's own register -- its placeholder
           * is `Ask about ${scopeLabel}` -- so the row now promises exactly
           * what opens. It understates rather than overstates: "Hand it over"
           * is still one click inside, and a door you find is better than a
           * door you were promised and did not get.
           *
           * WHEN QUEUE ITEM 16 LANDS and a dispatch creates a track, this copy
           * can go back to naming the loop, because the loop will be what it
           * opens. Not before.
           */}
          <span className="sp-dock-prompt">Ask about your work</span>
          {/* THE MOST-SEEN LIVE-AGENT LINE IN THE PRODUCT SAID THE LEAST.
              The dock renders on every authenticated route, so this string is
              on screen more than any other agent indicator, and it read
              "native is working" -- a name and a state. `lead.title` was
              already on the same object, unused, and `lead.subGoal` joined it
              this session. A capability with no door does not exist.

              THE TITLE, NOT THE SENTENCE. `subGoal` is a model-written
              imperative sentence with a median of 110 characters; this row is
              one line beside a prompt and a shortcut, and a sentence here
              would either wrap the dock or be clipped to a fragment. The
              sentence has its own two-line home in `CrewWorking`. What belongs
              on one line is the noun: what is being worked on.

              THE VERB IS FRONT-LOADED ON PURPOSE. Only the title truncates, so
              the line degrades to "native is working on Implement the health
              en..." -- still a true sentence about a running agent. Had the
              title come first it would degrade to a fragment with no state in
              it at all. The "N more" count sits outside the truncating span so
              a long title can never eat it. */}
          {/*
           * P-18b (A-QUEUE.md). THE DOCK NOW READS THE SAME CROSS-CHECKED
           * SOURCE THE BAR DOES.
           *
           * At 06:45 IST the bar read "Nothing running" while this line read
           * "Review is working" -- two readers, one fact, two claims.
           * `useLiveAgents` now filters `working` through the same
           * `genuinelyWorkingMissions`/`listMovingTracks` cross-check
           * `AppFrame.tsx`'s own live line already runs, so `lead` here can no
           * longer name a mission whose status went stale independently of
           * the run it describes.
           *
           * PAST TENSE WHEN NOTHING IS MOVING, NOT SILENCE. A row that only
           * ever speaks in the present tense goes quiet the moment work
           * pauses, which reads as "nothing has ever happened here" rather
           * than "nothing is happening right now" -- the same distinction the
           * bar's own `lastDone` fallback exists for.
           */}
          {/*
           * ONE OCCURRENCE OF EACH CLASS IN SOURCE, ON PURPOSE. Two branches
           * that both need `sp-dock-live`/`sp-dock-live-work` could have been
           * written as two literal spans each, but the Meridian ratchet
           * (`class:sp-`) counts literal string occurrences, not unique
           * class names -- the same class written twice still reads as new
           * debt. `workTitle` is resolved once, above, so the JSX below
           * writes each class name exactly one time regardless of which
           * branch is live.
           */}
          {lead || lastDone ? (
            <span className="sp-dock-live">
              {lead ? (
                <>
                  {lead.name} is working
                  {workTitle ? " on " : ""}
                </>
              ) : null}
              {workTitle ? <span className="sp-dock-live-work">{workTitle}</span> : null}
              {lead
                ? others > 0
                  ? ` · ${others} more`
                  : ""
                : ` finished${ago(lastDone!.completedAt) ? ` ${ago(lastDone!.completedAt)} ago` : ""}`}
            </span>
          ) : null}
          <kbd className="sp-dock-key" aria-hidden="true">
            ⌘K
          </kbd>
        </button>
      </div>
    </>
  );
}

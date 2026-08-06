import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { getFocusNext, type FocusInsight } from "@/lib/brain/insights.functions";
import { Block, Button, Num, Row } from "@/components/shell/primitives";

/**
 * THE COMPANY BRAIN, ON THE FRONT DOOR, FOR THE FIRST TIME.
 *
 * WHAT WAS FOUND. `getFocusNext` ranks the workspace's live themes by severity
 * times recency times novelty-against-what-the-brain-already-knows, writes one
 * recommendation with its evidence and a recommended action, and caches it for
 * thirty minutes. It has existed and worked for weeks. It had ZERO React
 * callers. So did `getPushedInsights`, and so did `markInsightActioned`. The
 * only reference to any of them anywhere in `src/` was a comment saying Today
 * reads them back, in a directory that was deleted in 2d0f6262 and never
 * rebuilt.
 *
 * "LIVE THEMES", NOT "EVERY THEME", WHICH IS WHAT THIS PARAGRAPH USED TO SAY.
 * It was true when it was written and has not been since: `getFocusNext` reads
 * the default workspace only, drops themes in a settled status, drops
 * `is_sample` themes (added so the front door could not demonstrate the moat
 * claim with seeded evidence), and takes the newest 60 before ranking. The
 * shape of the ranking below is unaffected; the scope of the input is not the
 * whole table.
 *
 * WHY THAT IS THE MOST EXPENSIVE THING IN THE PRODUCT. README and CLAUDE.md
 * both name layer 03, the company brain, as the ONLY layer defensible alone:
 * a settled outcome re-ranks the next call, and that compounding is what no
 * vendor can copy. Every other layer -- reading signals, drafting a spec,
 * opening a PR -- a frontier model can absorb next quarter. The compounding was
 * being computed nightly, written to `insights`, and rendered on no surface. A
 * moat nobody can see is a moat that does not sell, and a person who used this
 * for a month would have seen nothing on the front door that a person on day
 * one did not.
 *
 * IT LEADS, AND THE ORDER IS THE ARGUMENT. This sits ABOVE the gate. The gate
 * is what is waiting on you; this is what the product thinks you should do
 * next and why. Layer 01 is "the director tells you what to build", and a
 * director that speaks only after you have cleared your inbox is not directing.
 *
 * IT SAYS WHY, NOT JUST WHAT. The evidence fields are rendered, not summarised:
 * severity, how recently it was heard, and how new it is against what the brain
 * already holds. That last number IS layer 03 -- novelty is scored against
 * `agent_memory`, so a theme the company has already learned about ranks lower
 * than one it has not. Printing it is the difference between a ranked list and
 * a recommendation you can argue with.
 *
 * IT IS SILENT WHEN IT HAS NOTHING. `getFocusNext` returns null below
 * MIN_SCORE, which is a deliberate calm gate rather than an error, so a quiet
 * workspace renders nothing at all here rather than an empty box explaining
 * that there is no recommendation. The product does not claim work it has not
 * done, and that includes claiming to have thought about something.
 */
export function FocusNext() {
  const navigate = useNavigate();
  const fFocus = useServerFn(getFocusNext);

  const focus = useQuery<FocusInsight | null>({
    queryKey: ["brain", "focus-next"],
    queryFn: () => fFocus(),
    // The server already dedups to one derivation per theme per day and reuses
    // anything computed in the last thirty minutes, so a short client stale
    // time here would only re-ask a question that has already been answered.
    staleTime: 5 * 60 * 1000,
  });

  // NO LOADING BRANCH, and that is the one place this deliberately differs from
  // the rest of the surface. This block is an addition to a page that already
  // has its own answer; a skeleton above the gate would push the thing a person
  // came for down the screen while they watched. It arrives when it arrives.
  if (focus.isLoading || focus.isError || !focus.data) return null;

  const f = focus.data;
  const e = f.evidence;

  return (
    <Block
      title="What the brain would work on next"
      /**
       * THE SUBTITLE SAID WHAT THE PRODUCT SELLS, NOT WHAT THE CODE DOES.
       *
       * It read "Ranked against every outcome this workspace has already
       * settled." `getFocusNext` reads no outcome data of any kind: it queries
       * the `themes` table alone and ranks on `scoreTheme(severity,
       * confidence, created_at, last_signal_at, novelty)`. It never touches
       * `learnings`, `prds.outcome` or `agent_memory`. So a person who settled
       * five outcomes in their first week opened Today and got a
       * recommendation byte-for-byte identical to the one they would have got
       * having settled none -- under a sentence saying those five were what
       * produced it. Front door, above the gate, headline claim.
       *
       * REPLACED, NOT DELETED. The three terms below ARE worth stating: they
       * are the same three the evidence line prints, so the heading names the
       * axes and the row names the values, and a reader can argue with the
       * recommendation on its own terms. The docblock above already described
       * the ranking correctly; only this line lied.
       *
       * ONE PRECISION THE SENTENCE DOES NOT CARRY, so it is written here
       * instead of being implied. `novelty` IS scored against `agent_memory`,
       * which is the layer-03 term and the reason it is named here at all --
       * but it is stamped once at cluster time (src/lib/ai/cluster.server.ts:252
       * -- the PATH matters and this used to be written bare as
       * `cluster.server.ts:252`, which sends a reader to `src/lib/brain/`, the
       * directory the very next paragraph cites for `score.ts`. There is no
       * cluster.server.ts there) and no sweep recomputes it, so it is what the
       * brain held when the cluster formed rather than a live read.
       * Making the original sentence TRUE is a different piece of work, and it
       * is one of two changes: `getFocusNext` grows a settled-outcome term, or
       * an outcome memory landing re-derives `themes.novelty`. Neither happens
       * today.
       *
       * THE SENTENCE NAMES THREE TERMS AND THE SCORE HAS FOUR. Written down
       * rather than left for the next reader to find, and it under-claims by
       * one term rather than over-claiming by any. `scoreTheme`
       * (lib/brain/score.ts:54) multiplies magnitude -- severity AND
       * `themes.confidence`, which swings it by up to 1.67x -- by recency, by
       * corroboration and by novelty. Confidence is a real input and is
       * deliberately unnamed: a numeric confidence on an auto-generated
       * cluster is kept off the product by founder ruling
       * (DiscoverSurface.tsx:24-28, "a percentage invites an argument about
       * the percentage"), and naming an axis whose value the reader is never
       * shown is that same trade run backwards. The three that ARE named are
       * exactly the three the row below prints. Corroboration is unnamed for a
       * different reason: `getFocusNext` neither names `frequency` in its
       * `themes` select nor passes it into `scoreTheme` (both inside
       * `getFocusNext` in src/lib/brain/insights.functions.ts -- cited by
       * symbol, not line, because that file is under concurrent edit and a
       * stale line number here would be the very defect this paragraph is
       * correcting), so `t.frequency ?? 1` pins that term at exactly 0.45 +
       * 0.55 * log1p(1)/log1p(10) = 0.609 for every theme and it reorders
       * nothing -- which is itself worth someone's attention, since that term
       * exists precisely to stop a one-signal item topping a queue.
       */
      sub="Ranked on severity, how recently it was heard, and how new it is against what the brain already holds."
    >
      <Row
        lead={f.headline}
        sub={
          <>
            {f.detail}
            {/* THE WHY, IN THE NUMBERS THAT PRODUCED IT. Not a confidence
                percentage, which is a summary of a judgement nobody can check.
                These are the three inputs to the ranking, so a person can
                disagree with the recommendation on its own terms. */}
            <div style={{ marginTop: 6 }}>
              Severity <Num>{e.severity}</Num> of 5 · last heard{" "}
              {(() => {
                // `Num` is the figure primitive: mono, tabular, tuned for
                // digits. Handing it "2d ago" set three words in it and the
                // phrase came out spaced like a measurement. The number goes
                // in, the words stay out.
                const t = formatHours(e.recencyHours);
                return t.n === null ? (
                  t.rest
                ) : (
                  <>
                    <Num>{t.n}</Num>
                    {t.rest}
                  </>
                );
              })()}
              {e.novelty !== null ? (
                <>
                  {" "}
                  · <Num>{Math.round(e.novelty * 100)}%</Num> new against what the brain already
                  holds
                </>
              ) : null}
            </div>
          </>
        }
        /* THE ACTION IS THE AGENT'S GOAL, VERBATIM, because the recommendation
           already contains one and inventing a second verb here would let the
           button and the reasoning drift. Absent when the brain proposed no
           action: a door to nowhere is worse than no door. */
        action={
          f.recommendedAction ? (
            <Button
              variant="primary"
              onClick={() =>
                navigate({
                  to: "/discover",
                  /**
                   * `focus`, NOT `theme`. Discover's `validateSearch` returns
                   * `{ tab, focus }` and the router DISCARDS anything else, so
                   * `theme` never survived the navigation and the button landed
                   * on whichever cluster happened to rank first -- with nothing
                   * saying why, which is the exact defect that route's own header
                   * comment describes being fixed once already.
                   *
                   * `focus` is deliberately untyped beyond string there, and the
                   * surface resolves either a signal id or a theme id, which its
                   * comment says in as many words.
                   */
                  search: f.themeId ? ({ focus: f.themeId } as never) : undefined,
                })
              }
              title={f.recommendedAction.goal}
            >
              Take it to Discover
            </Button>
          ) : null
        }
      />
    </Block>
  );
}

/**
 * Hours as a person says them, split so the FIGURE and the WORDS can be set
 * differently. `recencyHours` is a float off the ranking maths, and "last heard
 * 0.4 hours ago" is a number pretending to be a sentence.
 *
 * `n` is null where the phrase has no figure in it -- "yesterday" is the whole
 * answer, and "1 yesterday" would be worse than either half.
 */
function formatHours(hours: number): { n: number | null; rest: string } {
  if (!Number.isFinite(hours) || hours < 0) return { n: null, rest: "recently" };
  if (hours < 1) return { n: null, rest: "under an hour ago" };
  if (hours < 24) return { n: Math.round(hours), rest: "h ago" };
  const days = Math.round(hours / 24);
  return days === 1 ? { n: null, rest: "yesterday" } : { n: days, rest: "d ago" };
}

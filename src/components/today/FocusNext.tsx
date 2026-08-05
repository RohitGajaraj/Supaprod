import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { getFocusNext, type FocusInsight } from "@/lib/brain/insights.functions";
import { Block, Button, Num, Row } from "@/components/shell/primitives";

/**
 * THE COMPANY BRAIN, ON THE FRONT DOOR, FOR THE FIRST TIME.
 *
 * WHAT WAS FOUND. `getFocusNext` ranks every theme in the workspace by severity
 * times recency times novelty-against-what-the-brain-already-knows, writes one
 * recommendation with its evidence and a recommended action, and caches it for
 * thirty minutes. It has existed and worked for weeks. It had ZERO React
 * callers. So did `getPushedInsights`, and so did `markInsightActioned`. The
 * only reference to any of them anywhere in `src/` was a comment saying Today
 * reads them back, in a directory that was deleted in 2d0f6262 and never
 * rebuilt.
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
      sub="Ranked against every outcome this workspace has already settled."
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
                  search: f.themeId ? ({ theme: f.themeId } as never) : undefined,
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

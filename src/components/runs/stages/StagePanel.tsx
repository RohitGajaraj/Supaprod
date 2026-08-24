/**
 * The six non-Build stages of one run, as this run experienced them.
 *
 * REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md). The prototype draws
 * the run screen but not these panels: it draws the STRIP, seven chips of one
 * line each, and the founder's ruling made the chips a segmented control. What
 * a chip swaps to was a placeholder, one line of fact plus a link, six times
 * over. The bar it is held to is his: "It should not be half done, half baked
 * cookie ... If Discover, Discover needs to be properly good."
 *
 * ------------------------------------------------------------------ *
 * a. WHO IS STANDING HERE. The same product lead who is two minutes into a
 *    run and has just clicked a chip, because one stage of this run is the
 *    part they do not already know. They came to find out what happened at
 *    that stage ON THIS RUN. Not to browse the library behind it.
 *
 * b. THE ONE THING THIS EXISTS FOR. To read one stage of one run without
 *    leaving the run. The cross-run surfaces (/discover, /decide,
 *    /plan/spec/$id, /learn) answer "everything we ever decided". Nothing else
 *    in the product answers "what did Discover do for THIS run", because
 *    nothing else walks the lineage backwards from a mission.
 *
 * c. KEEP / MOVE / KILL, on what was here:
 *    KEEP  the door, one per panel, and only where the record has a home to
 *          open. On a panel with content it is the header link; on an empty
 *          one it is the empty state's own action, because an empty state that
 *          names who acts next and gives you no way to act is half honest.
 *    KEEP  `fact.note` on the STRIP and only there. A panel that restated its
 *          own chip would be saying one thing twice (hard ban 10).
 *    KILL  the shared closing sentence, "Nothing was recorded against X for
 *          this run, which is not the same as nothing having happened". It was
 *          the same words under all six chips. One sentence reused six times
 *          is a placeholder wearing a paragraph's clothes. Each stage now says
 *          what is missing in its own terms, and the three different SHAPES of
 *          absence get three different sentences (see the honesty rule below).
 *    KILL  the AgentMark every panel drew off `fact.state`. It attributed all
 *          six stages to the build agent, because the build agent is the only
 *          one this screen knows about. Attribution now comes from a column
 *          that names an actor, or it is absent.
 *    KILL  the second heading. `Block title` is the stage name and the strip
 *          already carries the number; a panel does not need a title bar of
 *          its own inside a screen that has one.
 *    MOVE  nothing. There was nothing here yet to move.
 *
 * d. ONE CLICK AWAY, not on the panel: every other signal on the theme and
 *    each one's full text (/discover), the decision's full record and its
 *    citations (/decide), the spec body, its contract and its launch plan
 *    (/plan/spec/$id), the rendered scaffold (the spec's own design tab), the
 *    diff, the check logs and the deployment (the pull request), every
 *    learning recorded against the spec (/learn). A panel carries at most
 *    three items of any list and says how many there are.
 *
 * e. DELIGHT / CONFUSION. The moment: the run explains its own origin. You
 *    clicked 01 on a run about a checkout redirect and the customer messages
 *    that started it are right there, in their own words, with their sources.
 *    Nobody assembles that by hand, and no other product on this list can.
 *    What would confuse, and it is the exact failure this set exists to
 *    prevent: a panel that reads as FINISHED because it is quiet. So absence
 *    is written out in words, and the shapes of absence are never collapsed
 *    into one.
 *
 * f. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Attribution is drawn ONLY
 *    from a column that names an actor: `decisions.decided_by_agent_slug`,
 *    `learnings.recorded_by_agent_slug`, `opportunities.roadmap_last_agent_slug`
 *    and `stage_events.actor`. Where the only stored author is a user id
 *    (`prd_flows.generated_by`, `prd_scaffolds.generated_by`) nobody is named
 *    as an agent, because naming the station's cast member there would be
 *    inventing a fact to satisfy this question.
 *
 *    THE TEST: remove every agent and five of these six panels go EMPTY, not
 *    plainer. No opportunity would be scored, no alternative would be
 *    red-teamed, no flow graph would be extracted from a spec, no scaffold
 *    would be drawn before anyone asked, no outcome would be measured against
 *    the score the bet carried before it. Ship is the sixth, and it keeps its
 *    pull request, which is honest: nothing merges itself, and a human is
 *    supposed to be standing there.
 *
 * THE HONESTY RULE, WHICH IS NOT NEGOTIABLE. A stage with no row behind it
 * says so. It never borrows a neighbour's fact, never counts what it did not
 * read, and never renders as finished because the run moved past it.
 * `getRunStages` keeps the shapes of absence apart and they survive here:
 *
 *   - no evidence at all         nothing links this run back to that stage.
 *   - `signalCount === null`     the opportunity carries no theme, so nothing
 *                                was counted. NOT "no signals".
 *   - `signalCount === 0`        the theme is real and holds none. This one IS
 *                                "no signals".
 *   - `checks === null`          no check result has ever been read for this
 *                                pull request. Not passed, not failed.
 *   - `deployments === []`       read, and nothing has deployed.
 *
 * COLOUR, RESTATED FOR MERIDIAN 2026-08-15. Monochrome throughout. Green and
 * red appear only on `Stat` where the value IS an outcome (a check verdict, a
 * deployment status, a learning's verdict). Orchid appears exactly once in the
 * whole set: the design gate that is genuinely waiting on the person reading it.
 *
 * WHAT THE PORT CHANGED, beyond the tokens. The legacy `Value` carried a `warn`
 * tone painting `--sp-warn`, and this system has no warn colour: the only thing
 * amber may say is "stopped, and NOT on you". Every caller of that tone here was
 * in fact saying exactly that — a check that has not reported, a deploy still in
 * flight, a verdict nobody has recorded — so the tone is `hold` now and the
 * meaning is narrower and true rather than a catch-all. The `live` tone also
 * moved off green: "still running" and "it worked" were the same colour, so a
 * deploy in flight read as a deploy that had succeeded. It is azure, which is
 * the system's word for a machine still working.
 *
 * ONE FILE'S WORTH OF PARTS MOVED, NOT REDRAWN. Every primitive this panel used
 * came from `src/components/shell/primitives.tsx`, which is the `--sp-*` layer
 * meridian.css calls life support. They are the same shapes in
 * `components/runs/run-parts.tsx`, which is also what the run detail, the runs
 * index, the grid and the board now draw from — so this panel cannot drift from
 * the page it is embedded in.
 */

import { useNavigate } from "@tanstack/react-router";

import { STAGE_LABEL } from "@/components/shell/run-strip";
import { agentDisplayName, type AgentStation } from "@/lib/agent-vocabulary";
import type {
  DecideEvidence,
  DesignEvidence,
  DiscoverEvidence,
  LearnEvidence,
  PlanEvidence,
  RunStageFact,
  ShipEvidence,
  StageActor,
  StageEvidence,
} from "@/lib/run-stages.functions";
import {
  Button,
  Cards,
  Fact,
  PersonMark,
  Recess,
  RunCard,
  RunMark,
  RunRow,
  Stat,
} from "@/components/runs/run-parts";
import {
  Door,
  Figure,
  NothingYet,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

/* ------------------------------------------------------------------ *
 * Formatting. Local on purpose, the same reason the run surface keeps
 * its own: nothing here reaches into another surface's folder, so a
 * parallel port cannot break this one.
 * ------------------------------------------------------------------ */

/** Plain-words relative time. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "4h ago", or NOTHING when the stored timestamp is unusable. Every sentence
 *  in this file that ends in "ago" goes through here, because an unguarded
 *  interpolation of `ago()` prints the words "null ago" onto the panel, which
 *  is a surface telling a person something the record never said. */
function since(iso: string | null | undefined): string | null {
  const a = ago(iso);
  if (!a) return null;
  return a === "now" ? "just now" : `${a} ago`;
}

/** An unknown enum value is rendered verbatim rather than mapped to a guess.
 *  A status word this file has never seen is still a fact the record holds. */
function say(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "not recorded";
  return map[value] ?? value.replace(/_/g, " ");
}

const DECISION_STATUS: Record<string, string> = {
  standing: "still standing",
  approved: "approved",
  rejected: "sent back",
  pending: "not settled yet",
};

const VERDICT: Record<string, string> = {
  validated: "it worked",
  missed: "it did not work",
  mixed: "the signal was mixed",
};

const CHANGESET_STATUS: Record<string, string> = {
  draft: "not opened yet",
  ready: "staged, not opened yet",
  pr_open: "open",
  merged: "merged",
  abandoned: "abandoned",
};

const SPEC_STATUS: Record<string, string> = {
  draft: "a draft",
  review: "in review",
  approved: "approved",
  building: "being built",
  shipped: "shipped",
};

const GATE_STATUS: Record<string, string> = {
  pending: "waiting on your call",
  approved: "you approved it",
  rejected: "you sent it back",
};

const FLOW_KIND: Record<string, string> = {
  decision: "a fork",
  state: "a state",
};

/** Who moved something, in one phrase, from whatever the record stored.
 *  "human" is you, "system" is the schedule, anything else is a crew slug. */
function actorName(actor: string): string {
  if (actor === "human") return "you";
  if (actor === "system") return "the schedule";
  return agentDisplayName(actor);
}

/** The mark for a `stage_events.actor`. A human gets your disc, an agent gets
 *  its own, and "system" gets nothing: a cron is machinery, and machinery
 *  stays behind the Engine Room door. */
function ActorMark({ actor, initials }: { actor: string; initials: string }) {
  if (actor === "human") return <PersonMark initials={initials} />;
  if (actor === "system") return null;
  return <RunMark slug={actor} state="done" />;
}

/** The last transition the record holds for this artifact, as one row. */
function MovedRow({ moved, initials }: { moved: StageActor; initials: string }) {
  return (
    <RunRow
      tight
      mark={<ActorMark actor={moved.actor} initials={initials} />}
      lead={`${actorName(moved.actor)} moved it to ${moved.to.replace(/_/g, " ")}`}
      sub={moved.from ? `it was ${moved.from.replace(/_/g, " ")} before` : "it started there"}
      time={ago(moved.at)}
    />
  );
}

/* ------------------------------------------------------------------ *
 * 01 Discover: what was noticed that started this
 * ------------------------------------------------------------------ */

function Discover({
  e,
  initials,
  onOpen,
}: {
  e: DiscoverEvidence;
  initials: string;
  onOpen: () => void;
}) {
  return (
    <Region
      title={STAGE_LABEL.sense}
      sub={e.problem ?? e.hypothesis}
      goTo="Open Discover"
      onGoTo={onOpen}
    >
      <RunRow
        mark={e.lastAgentSlug ? <RunMark slug={e.lastAgentSlug} state="done" /> : undefined}
        lead={e.title}
        sub={
          e.lastAgentSlug
            ? `${agentDisplayName(e.lastAgentSlug)} last moved it · ${e.status}`
            : e.targetUser
              ? `for ${e.targetUser}`
              : e.status
        }
      />

      {e.iceScore != null ? (
        <Fact label="Scored">
          <Stat>
            <Figure>{e.iceScore}</Figure> from impact <Figure>{e.impact}</Figure>, confidence{" "}
            <Figure>{e.confidence}</Figure>, ease <Figure>{e.ease}</Figure>
          </Stat>
        </Fact>
      ) : null}

      {/* The three shapes of "no signals", kept apart. The middle one is the
          distinction the whole file exists to protect: an opportunity with no
          theme was never counted, and saying "0 signals" there would be a
          measurement nobody took. */}
      {e.signalCount == null ? (
        <Fact label="Signals behind it" sub="signals and opportunities meet on a theme">
          <Stat>none counted, nothing links it to a theme</Stat>
        </Fact>
      ) : e.signalCount === 0 ? (
        <Fact label="Signals behind it" sub={e.theme ? `on ${e.theme.title}` : undefined}>
          <Stat>its theme holds none yet</Stat>
        </Fact>
      ) : (
        <Fact label="Signals behind it" sub={e.theme ? `on ${e.theme.title}` : undefined}>
          <Stat>
            <Figure>{e.signalCount}</Figure> {e.signalCount === 1 ? "signal" : "signals"}
          </Stat>
        </Fact>
      )}

      {e.signals.map((s) => (
        <RunRow
          key={s.id}
          tight
          lead={s.excerpt || s.title || "a signal"}
          sub={s.source}
          time={ago(s.at)}
        />
      ))}

      {e.signalCount != null && e.signalCount > e.signals.length ? (
        <Fact label="The rest">
          <Stat>
            <Figure>{e.signalCount - e.signals.length}</Figure> more, on Discover
          </Stat>
        </Fact>
      ) : null}

      {e.moved ? <MovedRow moved={e.moved} initials={initials} /> : null}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 02 Decide: the call, and what was considered instead
 * ------------------------------------------------------------------ */

function Decide({
  e,
  initials,
  onOpen,
}: {
  e: DecideEvidence;
  initials: string;
  onOpen: () => void;
}) {
  const who = e.decidedByAgentSlug ? agentDisplayName(e.decidedByAgentSlug) : "you";
  return (
    <Region title={STAGE_LABEL.decide} sub={e.title} goTo="Open Decide" onGoTo={onOpen}>
      {/* The recess, earned. This is the record genuinely speaking: the
          sentence someone wrote about WHY, which is the answer you come back
          for months later and the only thing here that is a claim rather than
          a statistic. Drawn only when a rationale exists, never as a frame
          around an empty middle. */}
      {e.rationale ? (
        <Recess
          evidence={
            e.citedByCount > 0 ? (
              <>
                cited <Figure>{e.citedByCount}</Figure> {e.citedByCount === 1 ? "time" : "times"}{" "}
                since
              </>
            ) : undefined
          }
        >
          {e.rationale}
        </Recess>
      ) : null}

      {/* Attribution, with the mark, and stated ONCE. It is not repeated inside
          the recess above: the recess carries what the record SAID and what
          backs it, and who said it is a different fact belonging to a row. */}
      <RunRow
        mark={
          e.decidedByAgentSlug ? (
            <RunMark slug={e.decidedByAgentSlug} state="done" />
          ) : (
            <PersonMark initials={initials} />
          )
        }
        lead={`${who} made the call`}
        sub={e.rationale ? "the reasoning is above, verbatim" : "no reasoning was written down"}
        time={ago(e.at)}
      />

      <Fact label="Where it stands">
        <Stat>{say(DECISION_STATUS, e.status)}</Stat>
      </Fact>

      {e.alternatives.length > 0 ? (
        <>
          <Fact label="Considered instead">
            <Stat>
              <Figure>{e.alternatives.length}</Figure>{" "}
              {e.alternatives.length === 1 ? "option" : "options"}
            </Stat>
          </Fact>
          {e.alternatives.map((a, i) => (
            <RunRow
              key={`${a.title}-${i}`}
              tight
              lead={a.title}
              sub={a.reason ?? "no reason was recorded"}
            />
          ))}
        </>
      ) : (
        <Fact label="Considered instead" sub="a call with no alternatives on it was not compared">
          <Stat>the record lists none</Stat>
        </Fact>
      )}

      {e.viaMission ? (
        <Fact label="Where it hangs">
          <Stat>on this run, not on a spec</Stat>
        </Fact>
      ) : null}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 03 Plan: the spec, and its flow
 * ------------------------------------------------------------------ */

function Plan({ e, initials, onOpen }: { e: PlanEvidence; initials: string; onOpen: () => void }) {
  return (
    <Region title={STAGE_LABEL.define} sub={e.title} goTo="Open the spec" onGoTo={onOpen}>
      <Fact label="Where it stands">
        <Stat>{say(SPEC_STATUS, e.status)}</Stat>
      </Fact>

      {e.flow ? (
        <>
          <Fact
            label="The flow"
            sub={
              since(e.flow.updatedAt)
                ? `drawn ${since(e.flow.updatedAt)} from the spec's own words`
                : "drawn from the spec's own words"
            }
          >
            <Stat>
              <Figure>{e.flow.stepCount}</Figure> {e.flow.stepCount === 1 ? "step" : "steps"},{" "}
              <Figure>{e.flow.edgeCount}</Figure> {e.flow.edgeCount === 1 ? "link" : "links"}
            </Stat>
          </Fact>
          {/* A flow is scanned across, not read down: ten steps in a column is
              ten rows of scrolling and the founder named scrolling twice. */}
          <Cards>
            {e.flow.steps.map((s, i) => (
              <RunCard
                key={s.id}
                lead={
                  <>
                    <Figure>{i + 1}</Figure> {s.label}
                  </>
                }
                sub={FLOW_KIND[s.kind]}
              />
            ))}
          </Cards>
          {e.flow.stepCount > e.flow.steps.length ? (
            <Fact label="The rest">
              <Stat>
                <Figure>{e.flow.stepCount - e.flow.steps.length}</Figure> more, on the spec
              </Stat>
            </Fact>
          ) : null}
        </>
      ) : (
        <Fact label="The flow" sub="the spec's steps and forks, as a graph">
          <Stat>never drawn on this spec</Stat>
        </Fact>
      )}

      {e.moved ? <MovedRow moved={e.moved} initials={initials} /> : null}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 04 Design: what was drawn, and whether it waits on a human
 * ------------------------------------------------------------------ */

function Design({
  e,
  initials,
  onOpen,
}: {
  e: DesignEvidence;
  initials: string;
  onOpen: () => void;
}) {
  const waiting = e.gateStatus === "pending";
  return (
    <Region
      title={STAGE_LABEL.design}
      sub={
        e.scaffold
          ? e.scaffold.source === "speculative"
            ? "It was drawn while you read the spec, before anyone asked."
            : "It was drawn on request."
          : undefined
      }
      goTo="Open the spec"
      onGoTo={onOpen}
    >
      {/* THE ONE ORCHID IN THE WHOLE SET, and only when a human really is the
          thing standing between this drawing and the build. `PersonMark mine`
          is the accent, and it is spent here because this is the definition of
          the case it exists for: the moment is yours, and touching it moves it. */}
      {waiting ? (
        <RunRow
          mark={<PersonMark initials={initials} mine />}
          lead="Waiting on your call"
          sub="nothing builds from this drawing until you decide"
        />
      ) : null}

      {e.scaffold ? (
        <>
          {e.scaffold.screens.length > 0 ? (
            <>
              <Fact
                label="What it drew"
                sub={
                  since(e.scaffold.updatedAt) ? `updated ${since(e.scaffold.updatedAt)}` : undefined
                }
              >
                <Stat>
                  <Figure>{e.scaffold.screenCount}</Figure>{" "}
                  {e.scaffold.screenCount === 1 ? "surface" : "surfaces"},{" "}
                  <Figure>{e.scaffold.controlCount}</Figure>{" "}
                  {e.scaffold.controlCount === 1 ? "control" : "controls"}
                </Stat>
              </Fact>
              <Cards>
                {e.scaffold.screens.map((s, i) => (
                  <RunCard key={`${s}-${i}`} lead={s} />
                ))}
              </Cards>
              {e.scaffold.screenCount > e.scaffold.screens.length ? (
                <Fact label="The rest">
                  <Stat>
                    <Figure>{e.scaffold.screenCount - e.scaffold.screens.length}</Figure> more, on
                    the spec
                  </Stat>
                </Fact>
              ) : null}
            </>
          ) : (
            <Fact
              label="What it drew"
              sub={
                since(e.scaffold.updatedAt) ? `updated ${since(e.scaffold.updatedAt)}` : undefined
              }
            >
              <Stat>
                a scaffold with no headings in it, <Figure>{e.scaffold.controlCount}</Figure>{" "}
                {e.scaffold.controlCount === 1 ? "control" : "controls"}
              </Stat>
            </Fact>
          )}
        </>
      ) : (
        <Fact label="What it drew" sub="a scaffold is drawn from the spec's flow">
          <Stat>nothing was drawn for this spec</Stat>
        </Fact>
      )}

      {waiting ? null : (
        <Fact label="Your call" sub={since(e.gateDecidedAt) ?? undefined}>
          <Stat>
            {e.gateStatus ? say(GATE_STATUS, e.gateStatus) : "no design call was recorded"}
          </Stat>
        </Fact>
      )}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 06 Ship: the pull request, the checks, and production
 * ------------------------------------------------------------------ */

function checkTone(overall: string): "pass" | "fail" | "hold" | "quiet" {
  if (overall === "success") return "pass";
  if (overall === "failure") return "fail";
  if (overall === "pending") return "hold";
  return "quiet";
}

function deployTone(status: string): "pass" | "fail" | "hold" | "quiet" {
  if (status === "success") return "pass";
  if (status === "failure" || status === "error") return "fail";
  if (status === "pending" || status === "in_progress" || status === "queued") return "hold";
  return "quiet";
}

function Ship({ e, onOpen }: { e: ShipEvidence; onOpen: () => void }) {
  const production = e.deployments.filter((d) => d.environment === "production");
  const liveOne = production.find((d) => d.status === "success") ?? null;
  const shipWords = liveOne
    ? "It is live in production."
    : e.status === "merged"
      ? "Merged, and nothing has promoted it yet."
      : null;

  return (
    <Region
      title={STAGE_LABEL.ship}
      // The external PR keeps the heading door; /ship is the deployment's own
      // in-app address (graph-doors.ts), so it rides beside it.
      goTo={e.prUrl ? "Open the pull request" : undefined}
      onGoTo={() => window.open(e.prUrl as string, "_blank", "noopener,noreferrer")}
      sub={
        <>
          {shipWords ? `${shipWords} ` : null}
          <Door onClick={onOpen}>Open what shipped</Door>
        </>
      }
    >
      <Fact label="Pull request" sub={e.repo || undefined}>
        <Stat>
          {e.prNumber != null ? (
            <>
              <Figure>#{e.prNumber}</Figure>, {say(CHANGESET_STATUS, e.status)}
            </>
          ) : (
            say(CHANGESET_STATUS, e.status)
          )}
        </Stat>
      </Fact>

      {/* Null is not zero and it is not green. No snapshot has been read for
          this pull request, and saying anything else would be a verdict
          nobody reached. */}
      {e.checks == null ? (
        <Fact label="Checks" sub="the repo's own CI, read through the connection">
          <Stat>no result has been read for this pull request</Stat>
        </Fact>
      ) : (
        <Fact label="Checks" sub={since(e.checks.at) ? `read ${since(e.checks.at)}` : undefined}>
          <Stat tone={checkTone(e.checks.overall)}>
            {e.checks.total === 0 ? (
              "none are configured on this repo"
            ) : e.checks.overall === "success" ? (
              <>
                all <Figure>{e.checks.total}</Figure> passed
              </>
            ) : e.checks.overall === "pending" ? (
              <>
                <Figure>{e.checks.running}</Figure> still running of{" "}
                <Figure>{e.checks.total}</Figure>
              </>
            ) : (
              <>
                <Figure>{e.checks.passed}</Figure> of <Figure>{e.checks.total}</Figure> passed
              </>
            )}
          </Stat>
        </Fact>
      )}

      {e.checks?.notGreen.map((name, i) => (
        <RunRow key={`${name}-${i}`} tight lead={name} sub="did not pass" />
      ))}

      {e.deployments.length === 0 ? (
        <Fact label="Deployed" sub="a merge is not a release">
          <Stat>nothing has deployed from this run</Stat>
        </Fact>
      ) : (
        e.deployments.map((d) => (
          <RunRow
            key={d.id}
            tight
            lead={d.environment}
            sub={<Stat tone={deployTone(d.status)}>{d.status.replace(/_/g, " ")}</Stat>}
            time={ago(d.at)}
          />
        ))
      )}

      {since(e.shippedAt) ? (
        <Fact label="Marked shipped">
          <Stat>{since(e.shippedAt)}</Stat>
        </Fact>
      ) : null}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 07 Learn: the outcome, and what it taught
 * ------------------------------------------------------------------ */

function Learn({
  e,
  initials,
  onOpen,
}: {
  e: LearnEvidence;
  initials: string;
  onOpen: () => void;
}) {
  const who = e.recordedByAgentSlug ? agentDisplayName(e.recordedByAgentSlug) : "you";
  const moved = e.priorIce != null && e.newIce != null && e.priorIce !== e.newIce;
  return (
    <Region title={STAGE_LABEL.learn} goTo="Open Learn" onGoTo={onOpen}>
      {/* The second and last recess in the product's run screen. This is the
          crescendo the brain canon names: not where the record lives, but the
          record telling you what the bet turned out to be worth, which is what
          it uses to warn you next time. The metric is NOT repeated up here as
          a subtitle: it is one fact and it gets one place. */}
      <Recess
        evidence={
          moved ? (
            <>
              scored <Figure>{e.priorIce}</Figure> before, <Figure>{e.newIce}</Figure> after
            </>
          ) : undefined
        }
      >
        {e.summary}
      </Recess>

      <Fact label="The verdict">
        {/* THE THIRD ARM IS `hold`, NOT A WARNING, and the rename fixed the
            meaning rather than the token. Anything that is neither validated nor
            missed is a verdict NOBODY HAS RECORDED YET: stopped, waiting on a
            condition, and not on you. That is the one thing amber may say in
            this system, and it is exactly what this arm means. */}
        <Stat tone={e.verdict === "validated" ? "pass" : e.verdict === "missed" ? "fail" : "hold"}>
          {say(VERDICT, e.verdict)}
        </Stat>
      </Fact>

      {e.metricLabel && e.metricValue ? (
        <Fact label={e.metricLabel}>
          <Stat>
            <Figure>{e.metricValue}</Figure>
          </Stat>
        </Fact>
      ) : (
        <Fact label="The measure" sub="a learning with no number is an opinion with a date on it">
          <Stat>none was recorded</Stat>
        </Fact>
      )}

      {e.recordedByAgentSlug ? (
        <RunRow
          tight
          mark={<RunMark slug={e.recordedByAgentSlug} state="done" />}
          lead={`${who} measured it`}
          sub={e.viaMission ? "against this run" : "against the spec"}
          time={ago(e.at)}
        />
      ) : (
        <RunRow
          tight
          mark={<PersonMark initials={initials} />}
          lead="You recorded it"
          sub={e.viaMission ? "against this run" : "against the spec"}
          time={ago(e.at)}
        />
      )}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * The empty states. One per stage, in that stage's own terms.
 * ------------------------------------------------------------------ */

/** What each stage says when nothing stands behind it, and it is never the
 *  same sentence twice. The second clause exists because "quiet" and
 *  "finished" look identical if nobody says which one this is. */
function emptyWords(station: AgentStation, fact: RunStageFact | null): string {
  switch (station) {
    case "sense":
      return "No opportunity links this run back to anything that was noticed. That is not a claim that nobody noticed anything, only that nothing connects this run to it.";
    case "decide":
      return "No decision is recorded against this run or its spec. The work went ahead without a call being written down.";
    case "define":
      return "No spec sits behind this run, so there is no plan to read. The work was dispatched without one.";
    case "design":
      return "Nothing was drawn for this run, and no spec sits behind it to draw from.";
    case "ship":
      return "Nothing has been staged to ship. There is no branch, no pull request and nothing to promote.";
    case "learn":
      return fact?.state === "next"
        ? "Nothing has been recorded yet. The change is merged, so the outcome is what closes this run."
        : "Nothing has been recorded yet. A run records what it taught once something of it reaches users.";
    default:
      return "Nothing is recorded against this stage for this run.";
  }
}

/** Where an empty stage's door goes. Build and Ship have none: a run with no
 *  changeset has no pull request to open, and inventing a destination is the
 *  arrow to nowhere the doctrine bans. */
const DOOR: Partial<Record<AgentStation, string>> = {
  sense: "/discover",
  decide: "/decide",
  learn: "/learn",
};

/* ------------------------------------------------------------------ *
 * The panel
 * ------------------------------------------------------------------ */

/**
 * One of the six non-Build stages, chosen by the strip.
 *
 * It renders exactly what `getRunStages` read and nothing it inferred. Which
 * is why it takes the evidence rather than the note: a chip's note is a
 * summary, and a summary is not evidence.
 */
export function StagePanel({
  station,
  fact,
  evidence,
  initials,
  error,
  onRetry,
}: {
  station: AgentStation;
  fact: RunStageFact | null;
  evidence: StageEvidence | null;
  initials: string;
  /** The lineage read failed. A failure is not an empty state and must never
   *  wear one's clothes: "nothing here" and "we could not find out" are
   *  different facts and you act differently on each. */
  error: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const label = STAGE_LABEL[station];

  if (error) {
    return (
      <Region title={label}>
        <ReadFailedLine onRetry={onRetry}>{error}</ReadFailedLine>
      </Region>
    );
  }

  if (!evidence) {
    return (
      <Region title={label}>
        <Reading>Reading what this run did at {label.toLowerCase()}.</Reading>
      </Region>
    );
  }

  const open = (to: string) => () => void navigate({ to });

  if (station === "sense" && evidence.discover) {
    return <Discover e={evidence.discover} initials={initials} onOpen={open("/discover")} />;
  }
  if (station === "decide" && evidence.decide) {
    return <Decide e={evidence.decide} initials={initials} onOpen={open("/decide")} />;
  }
  if (station === "define" && evidence.plan) {
    return (
      <Plan
        e={evidence.plan}
        initials={initials}
        onOpen={open(`/plan/spec/${evidence.plan.prdId}`)}
      />
    );
  }
  if (station === "design" && evidence.design) {
    return (
      <Design
        e={evidence.design}
        initials={initials}
        onOpen={open(`/plan/spec/${evidence.design.prdId}`)}
      />
    );
  }
  if (station === "ship" && evidence.ship) {
    return <Ship e={evidence.ship} onOpen={open("/ship")} />;
  }
  if (station === "learn" && evidence.learn) {
    return <Learn e={evidence.learn} initials={initials} onOpen={open("/learn")} />;
  }

  // Nothing behind this stage. The door still opens, because the library it
  // leads to is where you would go to give this run an origin it lacks.
  const door = fact?.href ?? DOOR[station] ?? null;
  return (
    <Region title={label}>
      <NothingYet
        action={door ? <Button onClick={open(door)}>Open {label.toLowerCase()}</Button> : undefined}
      >
        {emptyWords(station, fact)}
      </NothingYet>
    </Region>
  );
}

export default StagePanel;

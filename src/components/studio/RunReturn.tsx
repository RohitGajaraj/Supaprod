/**
 * THE RETURN DOCUMENT.
 *
 * A person opens this after an agent worked for minutes or hours without them.
 * What they land on is a document — what moved, what it wants from them, and the
 * evidence for both — and NOT a log. The log is one press away and is still
 * complete; it is simply not the thing you read first.
 *
 * Measured against the agent consoles that get this right, the return artefact is
 * four beats in this order: a seconds-precise duration receipt, a prose summary
 * with typed inline references, the checks it ran on itself with their real
 * results, and a collapsed roll-up of what changed. The first three live here.
 * The fourth is the run surface's own tabbed region, because the diff already has
 * a viewer and a second one would be a second source of the same truth.
 *
 * The data rules live next door in run-return.ts, pure and under test. Nothing in
 * this file decides what is true; it decides what is drawn.
 */

import * as React from "react";
import { Num } from "@/components/meridian/surface-parts";
import { Block, Door, Empty, Loading, Pre, Prose, Row } from "@/components/shell/primitives";
import {
  checkCalls,
  finalSummary,
  formatCheckDuration,
  splitSummary,
  typedRefs,
  type CheckState,
  type RunLike,
} from "./run-return";

/**
 * Agent prose with its file paths, line references and commands set in mono.
 *
 * WHY `Num` AND NOT A NEW CHIP. `Num` is the system's single mono atom ("IBM
 * Plex Mono for every number, and for nothing else" — ink.css), and a path with
 * a line range on it is exactly that kind of token: something you check rather
 * than read. Its 0.92em is an OPTICAL correction, not a demotion — mono carries a
 * larger x-height, so at 0.92em it renders the same visual size as the sentence
 * around it. A second mono treatment invented here would fork the type rule for
 * one surface.
 */
export function RefProse({ text }: { text: string }) {
  return (
    <>
      {typedRefs(text).map((t, i) =>
        t.kind === "ref" ? (
          <Num key={i}>{t.value}</Num>
        ) : (
          <React.Fragment key={i}>{t.value}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * What came back, in the agent's own words: short by default, whole on request.
 *
 * THE DEFECT THIS REPLACES: this text was rendered as one anonymous row in the
 * step list, clipped to 180 characters, cut mid-sentence. It is the single most
 * valuable thing the run produces.
 *
 * It is NOT simply un-clipped and dumped. Verbose AI output is its own named
 * pain — one team calls the artefacts "slop grenades" — and the answer to a bad
 * cut is not the whole blob, it is a lead that stops at a full stop with the rest
 * one press away. Brevity is the feature; completeness is the promise underneath
 * it.
 */
export function ReturnSummary({
  runs,
  live,
  holder,
  holderSlug,
  liveAction,
}: {
  runs: RunLike[];
  live: boolean;
  holder: string;
  holderSlug: string | null;
  /** What it is doing right now, when it is doing anything. */
  liveAction: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const summary = React.useMemo(() => finalSummary(runs), [runs]);
  const split = React.useMemo(() => (summary ? splitSummary(summary.text) : null), [summary]);

  return (
    <Block title="What came back">
      {split ? (
        <>
          <Prose>
            <RefProse text={open ? split.full : split.lead} />
          </Prose>
          {split.more ? (
            <Door onClick={() => setOpen((v) => !v)}>{open ? "Shorter" : "Read all of it"}</Door>
          ) : null}
        </>
      ) : live ? (
        // A live run has not written its account yet, and that is a WAIT rather
        // than an absence. `working` is honest here in a way it is not on a
        // plain fetch: an agent really is dispatched.
        <Loading working agent={holderSlug ?? undefined} detail={liveAction}>
          {`${holder} is still working`}
        </Loading>
      ) : (
        <Empty>
          {holder} finished without writing an account of this run. Every step it took is under
          Steps below.
        </Empty>
      )}
    </Block>
  );
}

/** Pass, fail and warn are outcomes, so they are the one place colour speaks
 *  here. All three survive greyscale: the word carries the fact and the hue only
 *  agrees with it. */
function toneClass(state: CheckState): string | undefined {
  if (state === "pass") return "sp-pass";
  if (state === "fail") return "sp-fail";
  if (state === "warn") return "sp-warn";
  return undefined;
}

function Verdict({ state, children }: { state: CheckState; children: React.ReactNode }) {
  const cls = toneClass(state);
  return cls ? <span className={cls}>{children}</span> : <>{children}</>;
}

type CiCheck = {
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  summary: string | null;
};

/**
 * HOW IT CHECKED ITSELF.
 *
 * The measured rule from the products that earn trust here: show the LITERAL
 * thing that ran and its result, never the words "I tested it". You believe it
 * because you could go and re-run it.
 *
 * WHAT THIS PLATFORM ACTUALLY RECORDS, and what it therefore draws:
 *   · `studio.checks.run` clones the branch into a disposable sandbox and runs
 *     the repo's own checks. The record keeps each check's NAME, its real EXIT
 *     CODE, how long it took, and its stderr. It does not keep the command
 *     string — that is composed server-side — so this draws the exit code, which
 *     is the part a person can hold the machine to, and the stderr verbatim on a
 *     failure. A command line guessed at here would be the one thing worse than
 *     no command line.
 *   · the read-only inspections (review, secrets, tests owed, dependencies) with
 *     the verdict each one recorded.
 *   · the repo's own CI checks, by name, with the conclusion GitHub gave them and
 *     a door to the run itself.
 *
 * AND WHEN THERE IS NOTHING, IT SAYS SO. An absent check block would read as
 * "nothing to report"; the truth is "nothing was checked", and those are opposite
 * facts for someone about to merge.
 */
export function CheckedItself({ runs, ci }: { runs: RunLike[]; ci: CiCheck[] | null }) {
  const [shown, setShown] = React.useState<string | null>(null);
  const calls = React.useMemo(() => checkCalls(runs), [runs]);
  const ciChecks = ci ?? [];

  if (calls.length === 0 && ciChecks.length === 0) {
    return (
      <Block title="How it checked itself">
        <Empty>
          Nothing ran a check on this work: no sandbox run, and no CI has reported. Whether it works
          is still an open question.
        </Empty>
      </Block>
    );
  }

  return (
    /* THE CLAIM THE ROWS ATTACH TO, said once, above them.
     *
     * Findings rendered flat are how a document stops being read: a leader
     * covers a doc in a hundred comments and nobody can tell which one matters.
     * Every row below is one of three KINDS of evidence — a command that really
     * executed, an inspection that returned a verdict, a check GitHub ran — and
     * a reader who cannot tell them apart is reading a list rather than an
     * argument. The sub-line states what they have in common; each row says
     * which kind it is (an exit code, a tool name, "on the pull request"). */
    <Block
      title="How it checked itself"
      sub="Every line here is something that ran, with the result it returned. None of it is the agent's opinion of its own work."
    >
      {calls.map((call) =>
        call.ran.length > 0 ? (
          // The executed checks, one row per command that really ran. The exit
          // code is the evidence; the name is only the label on it.
          <React.Fragment key={call.key}>
            {call.ran.map((c) => {
              const open = shown === `${call.key}-${c.name}`;
              return (
                <React.Fragment key={c.name}>
                  <Row
                    tight
                    lead={
                      <>
                        <Num>{c.name}</Num>{" "}
                        <Verdict state={c.passed ? "pass" : "fail"}>
                          {c.timedOut ? "timed out" : c.passed ? "passed" : "failed"}
                        </Verdict>
                      </>
                    }
                    sub={
                      <>
                        {c.exitCode != null ? (
                          <>
                            exit <Num>{c.exitCode}</Num>
                          </>
                        ) : null}
                        {c.exitCode != null && formatCheckDuration(c.durationMs) ? " · " : null}
                        {formatCheckDuration(c.durationMs) ? (
                          <Num>{formatCheckDuration(c.durationMs)}</Num>
                        ) : null}
                      </>
                    }
                    action={
                      c.stderr ? (
                        <Door onClick={() => setShown(open ? null : `${call.key}-${c.name}`)}>
                          {open ? "Hide the output" : "What it printed"}
                        </Door>
                      ) : undefined
                    }
                  />
                  {/* The machine's own words, untouched. A failure paraphrased is
                      a failure you cannot act on. */}
                  {open && c.stderr ? <Pre>{c.stderr}</Pre> : null}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ) : (
          <Row
            key={call.key}
            tight
            lead={<Num>{call.tool}</Num>}
            sub={call.verdict ? <Verdict state={call.state}>{call.verdict}</Verdict> : undefined}
          />
        ),
      )}

      {ciChecks.map((c) => (
        <Row
          key={c.html_url || c.name}
          tight
          lead={<Num>{c.name}</Num>}
          sub={
            <>
              <Verdict
                state={
                  c.conclusion === "success"
                    ? "pass"
                    : c.conclusion === "failure" || c.conclusion === "timed_out"
                      ? "fail"
                      : c.conclusion
                        ? "warn"
                        : "quiet"
                }
              >
                {c.conclusion ?? c.status}
              </Verdict>
              {/* WHOSE CHECK THIS IS. Without it a GitHub check name sits in the
                  same column as a sandbox command and a tool id, and the reader
                  cannot tell which machine to go and argue with. */}
              {" · on the pull request"}
            </>
          }
          action={
            c.html_url ? (
              <Door onClick={() => window.open(c.html_url, "_blank", "noopener,noreferrer")}>
                Open it
              </Door>
            ) : undefined
          }
        />
      ))}
    </Block>
  );
}

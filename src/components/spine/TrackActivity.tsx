/**
 * Who is working on this right now, who worked on it before, and what came out.
 *
 * FOUNDER RULING 2026-08-01: "if some agents are working, there should be some
 * scope for showing visually that this agent is what, after this particular
 * agent it switched to next agent, this is the outcome. Something like Claude
 * Code or Copilot or Codex... so the user knows what is happening."
 *
 * THE REFERENCE, named before building. Claude Code's transcript: a flat
 * chronological stream, one actor per entry, each stamped with what it touched
 * and what came back. No progress bar, no percentage, no spinner with a noun
 * attached. What is borrowed is the INFORMATION MODEL, not the chrome:
 *
 *   who acted  ->  what they did  ->  what you now have
 *
 * WHAT IS ADDED, because this product has stations and Claude Code does not:
 * the HANDOFF. The moment one agent finishes and the next picks the work up is
 * the product's entire claim, and until now it happened silently in a cron. A
 * turn that starts a new station is marked so a person can see the baton move.
 *
 * IT NEVER INVENTS A STATUS. Every line is derived from a row the run wrote
 * itself. "Working" is only said when the run row literally says `running`, and
 * a turn that filed nothing says so plainly rather than being dressed up as
 * progress. A person has to be able to tell facts from guesses, and the moment a
 * status display guesses, they cannot.
 *
 * ONE COLOUR, like its sibling `TrackChain`. Colour is spent on the one fact a
 * person came for, which is what is live now. Everything finished is quiet, and
 * the only other tone is a genuine stop, which is allowed to look like one.
 */
import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackActivity } from "@/lib/spine/track.functions";
import { countKinds, type Turn } from "@/lib/spine/activity";
import { relativeTime } from "@/lib/memory-view";
import { Reading, ReadFailedLine, RecordSpeaks, Value } from "@/components/meridian/surface-parts";
import { AgentPulse } from "@/components/meridian/AgentPulse";

/** How a finished turn reads, in verbs rather than status words. */
function headline(t: Turn): string {
  if (t.outcome === "working") return `${t.agentName} is working`;
  if (t.outcome === "waiting") return `${t.agentName} is queued`;
  if (t.made.length) return `${t.agentName} filed ${countKinds(t.made)}`;
  if (t.outcome === "stopped") return `${t.agentName} stopped, filing nothing`;
  return `${t.agentName} finished, filing nothing`;
}

/**
 * The tone. Only two are ever used.
 *
 * A finished turn that produced nothing is deliberately NOT toned as a failure:
 * a critic that reads a design back and finds it sound is supposed to file
 * nothing, and colouring that red would teach a person to distrust the one
 * agent doing its job correctly. The sentence already says what happened.
 *
 * `live` BECAME `agent` IN THE MERIDIAN PORT, and it is a token change rather
 * than a rename. The retired `live` was GREEN, and green in this system reports
 * an OUTCOME, so "still running" and "it worked" were rendering in one colour.
 * `--mrd-agent` is azure and means a machine is working, present tense, which
 * is exactly what this branch says.
 */
function toneOf(t: Turn): "agent" | "pass" | "fail" | undefined {
  // `agent` is the only tone in the system that means work is happening RIGHT
  // NOW, and it is spent on the one fact a person came for. Queued is NOT it,
  // because nothing is running yet and azure would say otherwise.
  if (t.outcome === "working") return "agent";
  if (t.outcome === "waiting") return "pass";
  if (t.outcome === "stopped") return "fail";
  return undefined;
}

function stateWord(t: Turn): string {
  if (t.outcome === "working") return "working";
  if (t.outcome === "waiting") return "queued";
  if (t.outcome === "stopped") return "stopped";
  if (t.outcome === "partly") return "part done";
  return "done";
}

export function TrackActivity({ trackId }: { trackId: string }) {
  const fetchActivity = useServerFn(getTrackActivity);
  const q = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fetchActivity({ data: { trackId } }),
    // A live view has to move on its own, or a person watching a run has to
    // guess whether nothing has happened or nothing is being fetched. Ten
    // seconds is under the driver's tick and cheap: two indexed reads.
    refetchInterval: 10_000,
  });

  if (q.isLoading) return <Reading>Reading what happened.</Reading>;
  if (q.isError)
    return (
      // The LINE half of the failed-read pair, not the boxed one: this renders
      // inside a region that already draws its own container, and the standard
      // caps a region at one bordered box.
      <ReadFailedLine>
        The activity did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );

  const turns = q.data?.turns ?? [];
  // NOT "no agent has worked on this yet", which is a claim this cannot support.
  // Runs only carry a track from the day `track_id` was added, so work done
  // before that is real and unlinked, and saying it never happened would be
  // exactly the invention this view exists to refuse. Deliberately silent on the
  // reason: an unlinked history and a genuinely new track are indistinguishable
  // here, and a made-up reason is worse than a plain absence.
  if (!turns.length) {
    return (
      <RecordSpeaks>
        Nothing is recorded against this work yet. Activity appears here as agents run.
      </RecordSpeaks>
    );
  }

  // One clock for the whole list, so ten rows do not each render a slightly
  // different "now" and disagree with each other.
  const now = Date.now();

  // Newest first: a person opening this wants to know what is happening NOW,
  // and reading the whole history to reach the present is backwards for the
  // question they actually arrived with.
  const ordered = [...turns].reverse();

  return (
    <>
      {ordered.map((t, i) => {
        // The handoff. Marked when the station changes from the turn that ran
        // BEFORE this one, which in this reversed list is the next element.
        const previous = ordered[i + 1];
        const handedOver =
          Boolean(t.stationName) && Boolean(previous) && previous.stationName !== t.stationName;

        return (
          <Row
            key={t.runId}
            tight
            lead={headline(t)}
            time={relativeTime(t.at, now)}
            sub={
              <>
                {t.stationName ? `${t.stationName}` : ""}
                {handedOver && previous?.stationName
                  ? `, picked up from ${previous.stationName}`
                  : ""}
                {t.said ? (
                  <>
                    {t.stationName ? " · " : ""}
                    {/* The agent's own words, trimmed and never rewritten. One
                      line is enough to tell whether it understood the job; the
                      full text lives on the run. */}
                    {t.said.length > 160 ? `${t.said.slice(0, 160)}...` : t.said}
                  </>
                ) : null}
              </>
            }
            action={
              // A RUNNING seat gets the pulse, not a word. This is the moment
              // the founder called the platform's core USP: something is
              // happening in the background and the person has to be able to
              // feel it. Everything finished stays a quiet word, because a
              // screen of pulses is noise and proves nothing.
              t.outcome === "working" ? (
                <AgentPulse label={`${t.agentName} is working`} seed={t.agentSlug} compact />
              ) : (
                <Value tone={toneOf(t)}>{stateWord(t)}</Value>
              )
            }
          />
        );
      })}
    </>
  );
}

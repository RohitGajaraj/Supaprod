/**
 * WHAT WE ARE SOLVING, AT THE TOP OF DISCOVER.
 *
 * The surface half of gap #16. The shape and the measurement behind it are in
 * `what-were-solving.ts`; this file is the read, the three states and the one
 * action, and nothing else.
 *
 * ── WHICH EXISTING COMPONENT I CHECKED FIRST, AND WHY IT DID NOT SERVE ─────
 * The brief's standing rule, after `TrackActivity` and `TrackChain` sat with
 * zero importers for 24 days while the same thing was re-requested.
 *
 * 1. **`OpportunityDetailSheet` (`src/components/discover/`, 70KB) already
 *    renders all three fields**, at `:1369-1384`, under a region titled "The
 *    bet". It is the closest thing in the repo and it is **the right shape on
 *    the wrong surface**: it is a sheet opened from a LIST of bets on the
 *    Discover browse route, it takes a fully-hydrated opportunity plus that
 *    surface's handlers, and its 190-line prop interface is that surface's
 *    row. It cannot mount in the run pane, and lifting it would drag the
 *    browse surface behind it. **Its one behaviour I deliberately did NOT
 *    copy is the blank-skipping** (`{o.problem ? <Stated/> : null}`), which is
 *    what §2.1 calls passing quietly.
 * 2. **`SenseBody` (`ArtifactPane.tsx:1915`) is Discover's body** and it is
 *    where this mounts rather than beside. It draws evidence grouped under its
 *    patterns and has no bet concept at all; `src/components/track/**` returns
 *    **zero** matches for "opportunit" before this file.
 * 3. **`DetailKit` (`discover/`) is the browse surface's primitives**
 *    (`StatCell`, `StatStrip`, `DetailHeader`) and is about scores and stats,
 *    not about a field that was left empty.
 * 4. `ReasonField`, `Region`, `Action`, `RecordSpeaks` and `ReadFailedLine`
 *    are all Meridian and all reused here as they stand. Nothing new was
 *    added to the design system, because nothing needed to be.
 *
 * ── THE READ, AND WHY IT IS THE CLIENT'S OWN ──────────────────────────────
 * `PrototypeCard` in this same pane established it: "the read is the caller's
 * own RLS-scoped client, the exact pattern the public page uses minus the
 * share gate." Two reasons it is right here too. `Track` does not carry
 * `theme_id` and adding it is `src/lib/spine/**`, which is S0's. And
 * `listOpportunities` -- the server function that would otherwise serve --
 * takes no filter and caps at `limit(500)` against **531 rows**, so a bet can
 * fall off the end of it and be reported as absent. A filtered `eq` cannot.
 */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { promoteThemeToOpportunity, updateOpportunity } from "@/lib/discovery.functions";
import { Action, ReadFailedLine, Reading, RecordSpeaks } from "@/components/meridian/surface-parts";
import { ReasonField } from "@/components/meridian/forms";
import { Prose } from "@/components/meridian/Prose";
import { plainProse } from "@/lib/plain-prose";
import {
  solvingFields,
  solvingState,
  shapeLine,
  type Bet,
  type SolvingField,
} from "@/components/track/what-were-solving";

/** The columns the shape is read from. Named once so the read cannot drift. */
const BET_COLUMNS = "id,title,problem,target_user,hypothesis" as const;

export function WhatWereSolving({
  trackId,
  hasEvidenceBelow,
}: {
  trackId: string;
  /**
   * Whether Discover has anything to show under this section.
   *
   * FOUND BY DRIVING IT, NOT BY READING IT. The first draft said "Nothing has
   * been grouped into a pattern yet" whenever `spine_tracks.theme_id` was
   * null, and track `63b22b97` proved that false on screen: its column is
   * null and **two named patterns render directly below the sentence**. The
   * two facts are not the same fact -- the column says what this piece of work
   * is ABOUT, the members say what the crew was briefed on, and 16 of 32
   * tracks disagree between them. A sentence about the second, derived from
   * the first, is the read-came-back-empty defect in copy form.
   */
  hasEvidenceBelow: boolean;
}) {
  const qc = useQueryClient();
  const fUpdate = useServerFn(updateOpportunity);
  const fPromote = useServerFn(promoteThemeToOpportunity);
  /** Which field's answer box is open. One at a time, like `ThemeCard`. */
  const [answering, setAnswering] = React.useState<SolvingField["column"] | null>(null);

  const read = useQuery({
    queryKey: ["what-were-solving", trackId],
    queryFn: async () => {
      /*
       * `spine_tracks.theme_id` and NOT the track's `theme` members. Measured
       * 2026-08-31: 16 of the 32 tracks carrying theme members have no member
       * equal to their own `theme_id`, and the member route reaches a bet for
       * 1 track of 32 where the column reaches one for 28 of 106. The members
       * are what the crew was briefed on; the column is what the track is
       * about, and they are not the same question.
       */
      const { data: track, error: tErr } = await supabase
        .from("spine_tracks")
        .select("theme_id")
        .eq("id", trackId)
        .maybeSingle();
      if (tErr) throw new Error(tErr.message);
      const themeId = (track as { theme_id: string | null } | null)?.theme_id ?? null;
      if (!themeId) return { themeId: null, bets: [] as Bet[] };

      const { data: rows, error: oErr } = await supabase
        .from("opportunities")
        .select(BET_COLUMNS)
        .eq("theme_id", themeId)
        .order("created_at", { ascending: true });
      if (oErr) throw new Error(oErr.message);
      return { themeId, bets: (rows ?? []) as Bet[] };
    },
    staleTime: 30_000,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["what-were-solving", trackId] });
    void qc.invalidateQueries({ queryKey: ["track-artifacts", trackId] });
  };

  const answer = useMutation({
    mutationFn: (input: { id: string; column: SolvingField["column"]; text: string }) =>
      fUpdate({ data: { id: input.id, [input.column]: input.text } }),
    onSuccess: () => {
      setAnswering(null);
      invalidate();
    },
  });
  const promote = useMutation({
    mutationFn: (themeId: string) => fPromote({ data: { theme_id: themeId } }),
    onSuccess: invalidate,
  });

  if (read.isLoading) return <Reading>Reading what this is for.</Reading>;
  /*
   * A FAILED READ IS SAID, NEVER DRESSED AS AN EMPTY STATE (R-16). This is the
   * repo's dominant defect class stated in my own brief: "a narrow read coming
   * back empty, taken as a fact about the record rather than about the column
   * read". Every other branch below is a claim about the record, so this one
   * has to be a claim about the reading.
   */
  if (read.isError) {
    return (
      <ReadFailedLine error={read.error} onRetry={() => void read.refetch()}>
        What this piece of work is for did not load.
      </ReadFailedLine>
    );
  }

  const state = solvingState(read.data?.themeId ?? null, read.data?.bets ?? []);

  if (state.kind === "no-pattern") {
    /*
     * No action offered, on purpose. `promoteThemeToOpportunity` needs a theme
     * and there is none, so a control here would throw. The sentence points
     * down at the evidence, which is the thing that becomes a pattern, and
     * that is the next action rather than a dead end (brief unit 5).
     */
    return (
      <section aria-label="What we're solving" className="flex flex-col gap-mrd-2">
        <Heading />
        <RecordSpeaks>
          {hasEvidenceBelow
            ? "Nothing here says what we would change or why. What was found so far is below."
            : "Nothing here says what we would change or why, and nothing has been found yet either."}
        </RecordSpeaks>
      </section>
    );
  }

  if (state.kind === "no-bet") {
    return (
      <section aria-label="What we're solving" className="flex flex-col gap-mrd-2">
        <Heading />
        <RecordSpeaks>
          A pattern was found and nobody has turned it into a piece of work yet, so nothing here
          says what we would change or why.
        </RecordSpeaks>
        <div>
          <Action
            variant="quiet"
            busy={promote.isPending}
            onClick={() => promote.mutate(state.themeId)}
          >
            {promote.isPending ? "Making it a piece of work" : "Make it a piece of work"}
          </Action>
        </div>
        {promote.isError ? (
          <ReadFailedLine error={promote.error}>
            That could not be turned into a piece of work just now.
          </ReadFailedLine>
        ) : null}
      </section>
    );
  }

  const fields = solvingFields(state.bet);

  return (
    <section aria-label="What we're solving" className="flex flex-col gap-mrd-3">
      <Heading />
      <span className="mrd-meta">{shapeLine(fields)}</span>
      <dl className="flex flex-col gap-mrd-3">
        {fields.map((field) => (
          <div key={field.column} className="flex flex-col gap-mrd-1">
            <dt className="text-mrd-label font-medium leading-mrd-snug text-mrd-ink">
              {field.name}
            </dt>
            <dd className="flex flex-col gap-mrd-2">
              {field.value ? (
                <Prose markdown={false}>{plainProse(field.value) ?? field.value}</Prose>
              ) : (
                <>
                  {/*
                   * §4.3: "A missing field is a question the product asks, not
                   * a blank the person is handed" -- so the gap carries the one
                   * action that resolves it, in the place the work already is,
                   * and never a link to somewhere else.
                   */}
                  <RecordSpeaks>{field.absent}</RecordSpeaks>
                  {answering === field.column ? (
                    <ReasonField
                      id={`solving-${field.column}-${state.bet.id}`}
                      label={field.answerLabel}
                      hint="It goes on this piece of work, and every step after this one reads it."
                      commitLabel="Add it"
                      cancelLabel="Leave it open"
                      busy={answer.isPending}
                      onCommit={(text) =>
                        answer.mutate({ id: state.bet.id, column: field.column, text })
                      }
                      onCancel={() => setAnswering(null)}
                    />
                  ) : (
                    <div>
                      <Action variant="quiet" onClick={() => setAnswering(field.column)}>
                        {field.answerLabel}
                      </Action>
                    </div>
                  )}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {answer.isError ? (
        <ReadFailedLine error={answer.error}>That answer did not save.</ReadFailedLine>
      ) : null}
    </section>
  );
}

/**
 * The station's own words, and never the file's. §4.5 rule 4: `intent.md` and
 * `sdlc.stage` are file names and machine fields and they never become UI
 * vocabulary.
 */
function Heading() {
  return (
    <span className="text-mrd-label font-medium leading-mrd-snug text-mrd-ink">
      What we&rsquo;re solving
    </span>
  );
}

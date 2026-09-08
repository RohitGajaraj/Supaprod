/**
 * WHAT THIS WORKSPACE ALREADY HOLDS ABOUT THE SUBJECT, BEFORE THE WORK STARTS.
 *
 * F-184's door, `SPEC-BUILD-PATHS.md` §2.3 — one step earlier than Discover's
 * connector dry-run, which puts it at track creation.
 *
 * ── THE MEASURED CASE, AND IT IS S0'S NOT MINE ────────────────────────────
 * `060bc5ff` — *"password-reset link 404s"* — spent **three completed runs and
 * three attempts** for all three Discover seats to report, correctly and
 * independently, that the workspace holds no evidence about it. **One query at
 * creation would have said so.** The workspace was never empty: **267 signals
 * from 40 sources.** That is §0.7's first rank, a station doing its job without
 * a person, and it is a track that died at the first station for a reason a
 * sentence could have prevented.
 *
 * ── IT TELLS. IT NEVER REFUSES. ───────────────────────────────────────────
 * S0's header states the constraint and it is the whole design: *"A subject the
 * evidence is silent on may be exactly what somebody wants investigated, and a
 * door that blocks is worse than a door that tells you… nothing here may become
 * a gate."* **So this renders a sentence and nothing else** — no disabled
 * button, no warning colour, no confirm step. The composer behaves identically
 * whether this says anything or not.
 *
 * ── WHAT I CHECKED FIRST, AND WHY NONE OF IT SERVED ───────────────────────
 * | Checked | Why it did not serve |
 * | --- | --- |
 * | `connections/AskInPlace` | asks for a **connector**, not for what already exists |
 * | `track/TrackConsent` | a **gate**, which S0's header rules out in terms |
 * | `track/WhatWereSolving` | reads `opportunities` for a track that **already exists**; this runs before one does |
 * | `track/discover-has-no-sources` | answers *"is anything connected"* for a track at Discover, not *"what is already here"* at creation |
 *
 * Nothing needed changing and nothing was. **The words are S0's** —
 * `evidenceLine` handles the three cases — so this file is the mount and the
 * debounce, and invents no vocabulary of its own.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Door } from "@/components/meridian/surface-parts";

import { getSubjectEvidence } from "@/lib/evidence.functions";
import { evidenceLine, NO_EVIDENCE_READ } from "@/lib/spine/what-the-evidence-already-says";

/**
 * How long the subject must be before we ask.
 *
 * NOT A QUALITY BAR — a spend one. `searchTermsFor` needs something to tokenise,
 * and firing on "a" costs a round trip to learn nothing. Short enough that a
 * real subject reaches it within a few words.
 */
const ENOUGH = 8;

/** How long typing must pause. One beat, so a fast typist fires once. */
const SETTLE_MS = 450;

export function WhatWeAlreadyHold({ subject }: { subject: string }) {
  const navigate = useNavigate();
  const fEvidence = useServerFn(getSubjectEvidence);

  /*
   * DEBOUNCED SO IT ASKS ABOUT A SUBJECT, NOT ABOUT A KEYSTROKE. Without this
   * every character is a query, and the sentence flickers between answers for
   * prefixes nobody typed on purpose.
   */
  const [settled, setSettled] = React.useState("");
  React.useEffect(() => {
    const t = window.setTimeout(() => setSettled(subject.trim()), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [subject]);

  const ask = settled.length >= ENOUGH;
  const q = useQuery({
    queryKey: ["subject-evidence", settled],
    queryFn: () => fEvidence({ data: { subject: settled } }),
    enabled: ask,
    staleTime: 60_000,
  });

  if (!ask) return null;

  /*
   * ── IT SAYS IT IS READING, AND THE GUARD TAUGHT ME THAT TWICE ────────────
   * This was `if (q.isLoading) return null`, on the reasoning that a claim
   * changing under the reader is worse than one arriving late.
   * `a-null-under-a-heading-is-a-broken-promise` failed it, correctly, **and it
   * is the second time in one session that guard has caught me** — I obeyed it
   * before rather than joining its tolerated list, and then wrote the same line
   * again in a new file.
   *
   * **The guard is right and my reasoning was half of the rule.** `RunPresence`'s
   * lesson is that a state derived during a first read must be TRUE — not that
   * nothing may be drawn. It answers *"Reading this piece of work now."* So does
   * this. The person typed a subject and something is happening; saying so is
   * more honest than a line that pops in from nothing.
   */
  if (q.isLoading) {
    return <span className="mrd-meta">Checking what this workspace already holds about this.</span>;
  }

  /*
   * A FAILED READ IS SAID, and S0's own shape carries it: `NO_EVIDENCE_READ` has
   * `count: null`, and `evidenceLine` renders "I could not check what this
   * workspace already holds about this." Returning nothing here would let a
   * database error read as a quiet all-clear on the exact surface built to stop
   * a wasted run.
   */
  const evidence = q.isError ? NO_EVIDENCE_READ : (q.data ?? NO_EVIDENCE_READ);

  /* ZERO IS AN INVITATION WITH A DOOR. The line already says "connect a
     source, or start it anyway"; on a workspace with nothing connected it
     read as a reproach with no way to act on it (entry review, 2026-09-08).
     The door opens Sources; Enter in the box above is the other half. */
  return (
    <span className="mrd-meta">
      {evidenceLine(evidence)}
      {evidence.count === 0 ? (
        <>
          {" "}
          <Door onClick={() => void navigate({ to: "/sync" })}>Connect a source</Door>
        </>
      ) : null}
    </span>
  );
}

export default WhatWeAlreadyHold;

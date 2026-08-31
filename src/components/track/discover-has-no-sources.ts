/**
 * DISCOVER FINDING NOTHING SAYS WHY, AND THE WAY OUT IS ON THE SAME SCREEN.
 *
 * ── THE ARCHITECTURE ALREADY RULED THIS AND IT WAS NEVER BUILT ────────────
 * `THE-ONE-SCREEN.md`, in the table of things that are not destinations:
 *
 *   *"**Connectors / Integrations** → Reached at the moment they are needed.
 *   Discover finding nothing says 'I have no sources for this. Connect one?' —
 *   inline, with the connect control right there. **Never a shelf you browse
 *   first.**"*
 *
 * And `SESSION-1-THE-RUN.md`'s fifth unit: *"A refused station is not a failed
 * station (R-26): say which door is locked, and offer the next action. **No
 * dead end, ever.**"*
 *
 * ── THE MEASUREMENT, AND IT IS WHY THIS RANKS ABOVE POLISH ────────────────
 * Measured 2026-08-31 on production:
 *
 * | | |
 * | --- | --- |
 * | real tracks sitting at Discover | **82** |
 * | of those, with **no evidence filed at all** | **47** |
 * | `scout_targets`, every workspace | **0** |
 * | `scout_snapshots`, ever | **0** |
 *
 * **Forty-seven pieces of work stopped at the first station because there is
 * nothing to read, and the screen never said so.** `SPEC-BUILD-PATHS.md` §2.3
 * names the cause in the same breath: `scout_targets` is 0 in 21 of 21
 * workspaces *"partly because nobody could see what connecting would do."*
 *
 * ── WHAT I CHECKED FIRST, AND WHY THE ANSWER WAS NOT TO BUILD ─────────────
 * **`AskInPlace` (`src/components/connections/AskInPlace.tsx`) is exactly this
 * control and S3 repaired it for this caller.** Its defect was that it decided
 * the need was met by asking whether a CONNECTOR EXISTS, so it concluded
 * "satisfied" and returned null at the moment a station could not proceed.
 * S3's fix added `needIsMet`, so the caller's own test wins when it has one:
 *
 *   `satisfied = needIsMet ?? connectorPresent`
 *
 * So this module is **not a control**. It is the one thing `AskInPlace` cannot
 * know — whether DISCOVER, specifically, has anything to read — and it exists
 * so the answer is derived from a row rather than assumed.
 *
 * ── THE HONESTY CONSTRAINT THAT SHAPES THE WHOLE FILE ─────────────────────
 * "I have no sources" is a claim about the workspace, and a claim this surface
 * may only make when it has counted them. **A failed read is not zero sources**
 * — that is this repo's dominant defect class, and it would be especially bad
 * here because the remedy it offers is for a person to go and connect something
 * they may already have connected.
 */

/** What the Discover pane knows when it is deciding whether to ask. */
export type SourceSituation = {
  /** Whether Discover filed any evidence on THIS track. */
  filedAnything: boolean;
  /**
   * How many sources the workspace has configured, or **null when the read did
   * not come back**. Null is not zero and is never treated as zero.
   */
  sourceCount: number | null;
};

export type SourceVerdict =
  /** Discover produced, so there is nothing to ask about. */
  | { kind: "fine" }
  /** Nothing filed, and we counted zero sources. This is the ask. */
  | { kind: "no-sources" }
  /** Nothing filed, and sources DO exist. A different problem, not this one. */
  | { kind: "sources-exist" }
  /** Nothing filed, and we could not count. Say nothing rather than guess. */
  | { kind: "cannot-tell" };

/**
 * ORDER MATTERS AND EACH BRANCH IS A DIFFERENT SENTENCE.
 *
 * `filedAnything` is checked first because a station that produced needs no
 * explanation, whatever the workspace is configured with — and offering to
 * connect a source under a list of findings would read as though the findings
 * were not real.
 */
export function sourceVerdict(s: SourceSituation): SourceVerdict {
  if (s.filedAnything) return { kind: "fine" };
  if (s.sourceCount === null) return { kind: "cannot-tell" };
  return s.sourceCount === 0 ? { kind: "no-sources" } : { kind: "sources-exist" };
}

/**
 * The sentence, in the run's own voice. Null where there is nothing honest to
 * add — and `sources-exist` is deliberately one of those.
 *
 * **Why `sources-exist` says nothing here.** Discover having sources and still
 * filing nothing is a real problem and a DIFFERENT one: the sources may be
 * empty, the query may match nothing, or the station may have failed. This
 * module cannot tell which, and `StationPanel` already says the station filed
 * nothing. A second sentence guessing at the cause would be the surface
 * inventing a diagnosis, which is what `way-out.ts` refuses for holds it cannot
 * explain.
 */
export function sourceLine(v: SourceVerdict): string | null {
  switch (v.kind) {
    case "no-sources":
      /*
       * "NOTHING SET UP TO READ FROM", NOT "NOTHING CONNECTED", AND DRIVING IT
       * IS WHY. The first version said "There is nothing connected for me to
       * read" -- and `AskInPlace` rendered its connected-but-not-enough branch
       * directly beneath, reading "the connection for it is already here, so
       * connecting again would change nothing." Two sentences, one screen,
       * contradicting each other, which is the defect this lane has spent the
       * day removing from other surfaces.
       *
       * Both were true of different things. A CONNECTION can exist (this
       * workspace has one through an env credential) while `scout_targets` is
       * still 0, because nothing has been pointed at anything to read. That
       * distinction is the whole finding: `scout_targets` 0 and
       * `scout_snapshots` 0 rows ever is not "nobody connected an account", it
       * is "nobody told it where to look".
       */
      return "Nothing is set up for me to read from, so there was nothing to find.";
    case "cannot-tell":
      /*
       * A FAILED READ IS SAID (R-16). Without this branch, "we could not count
       * the sources" and "you have none" render identically — and the second
       * one sends a person off to connect something they may already have.
       */
      return "I could not check what is connected, so I cannot say whether anything was there to read.";
    case "fine":
    case "sources-exist":
      return null;
  }
}

/**
 * Whether to offer the connect control. **Only on a counted zero.**
 *
 * Not on `cannot-tell`: offering a remedy for a problem we have not established
 * is worse than saying nothing, because the person acts on it.
 */
export function offerToConnect(v: SourceVerdict): boolean {
  return v.kind === "no-sources";
}

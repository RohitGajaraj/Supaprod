/**
 * WHERE THE WORK CAME TO REST, said in the thread that started it.
 *
 * A run that finishes in a chat log has not handed back. The conversational
 * front door is only additive to the seven stations if a result LANDS on the
 * station that owns it - a drafted spec on Plan, a recorded decision on Decide -
 * and the person who asked for it is told so where they are standing. Without
 * this row the pane becomes the place work goes to disappear, and a pane that
 * swallows results is not a door onto the stations, it is a replacement for
 * them.
 *
 * ONE ROW, THREE FACTS, and nothing else: what was made, where it is now, and
 * the way to go and see it. It is not a summary of the artifact and it is
 * deliberately not a preview: the station already renders the thing properly,
 * and a second half-rendering of a spec inside a 392px pane would be both worse
 * and a second place to keep correct.
 *
 * THE COPY IS PAST TENSE, ALWAYS. "The spec is on Plan" is a claim the reader
 * can check by pressing the link next to it. "Your spec is being built" is a
 * promise this component has no way to keep, and one broken promise here costs
 * more than the row is worth. So every sentence below states a fact about now.
 *
 * THE SENTENCE AND THE LINK CANNOT DISAGREE. Both are derived from ONE resolved
 * station rather than from two parallel tables, so there is no arrangement of
 * inputs that says "on Plan" over a link to Build. That is why the kind map
 * below resolves to a station and the route is looked up from the station,
 * rather than each kind carrying its own path.
 *
 * IT IS EMITTED NOW, and this comment used to say it was not. `api/chat.ts`
 * sends a `landing` frame the moment `createMission` returns a real row, so a
 * dispatched mission hands the reader back to Build instead of ending in a chat
 * log. That was the last of the four disconnected pieces: the frame was declared,
 * parsed, accumulated and rendered, and nothing sent one.
 *
 * STILL INERT WITHOUT ONE, which is the part that has not changed. This renders
 * only when something hands it a real kind and a real id, so a turn that landed
 * nowhere shows no register rather than a placeholder.
 */

import { Link } from "@tanstack/react-router";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";

/** What a `landing` frame carries: the smallest honest fact about a result. */
export type LandedArtifact = {
  /** The artifact kind, as the server names it ("prd", "decision", …). */
  kind: string;
  /** The row id. Shown verbatim: it is the handle a person can quote back. */
  id: string;
  /** The station the server said it landed on, when it said one. */
  station?: AgentStation;
};

/**
 * The seven stations to the seven surfaces that hold them. Verified against
 * `src/routes/`: every one of these files exists, so no entry here is a guess.
 * `sense` and `define` keep their internal ids and land on the paths a person
 * knows them by, which is the same split `AGENT_STATIONS` already draws between
 * id and display name.
 */
const STATION_ROUTE = {
  sense: "/arriving",
  // P-14 (A-QUEUE.md, R-34): /decide, /plan, /design and /build are deleted.
  // Their own ruling table names Start as the honest destination for what
  // each used to carry (the ranked queue, work in flight, brand rules and
  // prototypes, the live block) -- the sentence above this link still names
  // the real station ("The spec is on Define."), only the door changes.
  decide: "/start",
  define: "/start",
  design: "/start",
  build: "/start",
  // P-14b (A-QUEUE.md, 2026-09-09): /ship is a redirect stub; Ship's record
  // is Outcomes' artifacts tab, which is where Learn already lands.
  ship: "/outcomes",
  learn: "/outcomes",
} as const satisfies Record<AgentStation, string>;

/**
 * The artifact kinds this pane can place, and the noun a person calls each one.
 *
 * A kind that is NOT in here renders a row with no link. That is the whole point
 * of the table being a closed list: guessing that an unrecognised `kind` belongs
 * on Build would send somebody to a surface that does not hold their work, and
 * a wrong destination is worse than an absent one - it costs a navigation, a
 * search, and the reader's belief in every other row like it.
 *
 * The noun is what the row says out loud, so it is the customer's word rather
 * than the server's: a `prd` is a spec, because "spec" is what the product calls
 * it everywhere else.
 */
const KIND_LANDING: Record<string, { station: AgentStation; noun: string }> = {
  prd: { station: "define", noun: "spec" },
  spec: { station: "define", noun: "spec" },
  decision: { station: "decide", noun: "decision" },
  opportunity: { station: "sense", noun: "opportunity" },
  design: { station: "design", noun: "design" },
  mission: { station: "build", noun: "mission" },
  changeset: { station: "build", noun: "changeset" },
  release: { station: "ship", noun: "release" },
  announcement: { station: "ship", noun: "announcement" },
  learning: { station: "learn", noun: "learning" },
  outcome: { station: "learn", noun: "outcome" },
};

/**
 * PURE. What a kind is called and where it lives, or null when this pane has
 * never heard of it. Exported because it is the rule the row is built on, and a
 * rule worth testing should not be locked inside a component.
 */
export function landingForKind(kind: string): { station: AgentStation; noun: string } | null {
  /**
   * `Object.hasOwn`, NOT a bare index, and the difference is a live defect.
   *
   * `KIND_LANDING` is a plain object literal, so it inherits from
   * `Object.prototype`. `KIND_LANDING["constructor"]` is therefore a FUNCTION,
   * not undefined, and `?? null` never fires -- the same for `toString`,
   * `valueOf` and `hasOwnProperty`. `kind` arrives on a server frame, so a
   * value like that is reachable input rather than a thought experiment.
   *
   * The failure was worse than a wrong noun. The row treats a truthy lookup as
   * KNOWN, which suppresses the "This pane has no place to open a X yet."
   * sentence, while `STATION_ROUTE[undefined]` leaves the href undefined so no
   * link renders either -- a row with neither a way in nor the sentence saying
   * why. The unknown-kind path exists precisely to stop that, and this is how
   * it was being walked past.
   */
  const k = kind.trim().toLowerCase();
  return Object.hasOwn(KIND_LANDING, k) ? KIND_LANDING[k] : null;
}

/** An unknown kind still gets named rather than hidden: "prd_scaffold" reads as
 *  "prd scaffold". Reformatting is safe here; inventing a word would not be. */
function readableKind(kind: string): string {
  const said = kind.trim().replace(/[_-]+/g, " ");
  return said || "result";
}

export function AskLanding({ kind, id, station }: LandedArtifact) {
  const known = landingForKind(kind);

  // The station the server named WINS over the one the kind implies. A server
  // that says where it put something knows better than a lookup table, and the
  // route is read off this same resolved value below, so the sentence and the
  // link move together or not at all.
  const at = station ?? known?.station ?? null;
  const stationName = at ? AGENT_STATIONS[at].name : null;

  // A destination only for a kind this pane actually knows. A named station
  // with an unrecognised kind still says WHERE it is - that fact came off the
  // wire and is true - but offers no way in, because we do not know what a
  // "prd_scaffold" looks like on that surface or whether it is reachable there.
  const to = known ? STATION_ROUTE[at ?? known.station] : null;

  const noun = known?.noun ?? readableKind(kind);
  const lead = stationName ? `The ${noun} is on ${stationName}.` : `The ${noun} was made.`;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: "var(--mrd-s4)",
        background: "var(--mrd-sink)",
        border: "1px solid var(--mrd-line-soft)",
        borderRadius: "var(--mrd-r-card)",
        padding: "14px 16px",
        marginTop: "4px",
      }}
    >
      {/* A BULLET, NOT A STATUS. This carried the station's own hue from
          `stageHueForStation`, and five of the seven tokens behind it were
          never defined -- so on Discover, Decide, Plan, Design and Ship the
          `background` was invalid and the dot simply did not draw. Nobody
          reported it.

          It is not repaired with five new colours, because the founder's
          2026-09-08 ruling keeps status colour off labels and law 4 says
          identity is SHAPE: a station is known by its glyph and its name. This
          row already names it on its own action ("Open Design"), so the mark
          goes back to being a mark. */}
      <span
        aria-hidden="true"
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          flex: "none",
          marginTop: "6px",
          background: "var(--mrd-edge)",
        }}
      />

      <div
        style={{
          // Wraps the action underneath itself in a narrow pane instead of
          // squeezing the sentence into a column two words wide.
          flex: "1 1 180px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "var(--mrd-s2)",
        }}
      >
        <div
          style={{
            fontSize: "var(--mrd-t-prose)",
            lineHeight: "var(--mrd-lh-snug)",
            color: "var(--mrd-ink)",
          }}
        >
          {lead}
        </div>
        {/* The id, verbatim and in mono. It is the handle: the thing a person
            pastes into a search or quotes to somebody else, so it is never
            shortened into something that cannot be used. */}
        <div
          style={{
            fontFamily: "var(--mrd-mono)",
            fontSize: "var(--mrd-t-data)",
            color: "var(--mrd-mute)",
            overflowWrap: "anywhere",
          }}
        >
          {id}
        </div>
        {!known ? (
          <div
            style={{
              fontSize: "var(--mrd-t-base)",
              lineHeight: "var(--mrd-lh-snug)",
              color: "var(--mrd-mute)",
            }}
          >
            {`This pane has no place to open a ${noun} yet.`}
          </div>
        ) : null}
      </div>

      {to && stationName ? (
        <Link
          to={to}
          className="sp-btn"
          data-variant="ghost"
          style={{ textDecoration: "none", marginLeft: "auto", flex: "none" }}
        >
          {`Open ${stationName}`}
        </Link>
      ) : null}
    </div>
  );
}

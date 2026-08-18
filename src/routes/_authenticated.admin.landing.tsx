/**
 * ADMIN / LAUNCH. The read side of a table that had none.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The founder on launch morning, between two other things, wanting to know
 *    whether the page is working. Not to study a funnel: to find out whether
 *    anyone arrived, whether anyone joined, and where they came from, and then
 *    to go back to answering people.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Reading `landing_events` WITHOUT a psql prompt. That table has been written
 *    by recordLandingEvent since the 20260715 migration and read by nothing, so
 *    the entire argument for capturing the funnel first-party — that launch day
 *    stays verifiable with no vendor key — was void, because the only person who
 *    could verify it was the one person who would have no time to. Every block
 *    below is justified only if its absence would leave a real launch-day
 *    question answerable only in SQL.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    ADD   the four funnel counts, which is the whole point of the pass.
 *    ADD   the referrer breakdown. `props.ref` has carried the visit's referrer
 *          HOSTNAME since the landing_visit effect shipped, and no surface has
 *          ever displayed it. Where a launch's traffic came from was already in
 *          the database and already unreadable.
 *    KILL  before it was written: a conversion-rate chart. Four counts and a day
 *          series answer the question; a chart over a table with double-digit
 *          rows is decoration, and the shape of a launch curve is not a decision
 *          anyone makes on launch morning.
 *    KILL  before it was written: any dash, any placeholder, any "—" in an empty
 *          cell. Claims law: a number that cannot be pulled live does not render.
 *          A block with no rows says WHY it has none and what would fill it.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    Per-session detail and the email list. Neither is a launch-morning question
 *    and the second is an identified table, which is the strongest possible
 *    reason to keep it off a page whose job is aggregate counts.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment is the first line, which is a verdict rather than a heading:
 *    "412 visits turned into 37 waitlist signups", earned from real rows.
 *    The confusion this surface must keep refusing is the one every analytics
 *    page invites: a zero that means "nobody came" wearing the same clothes as a
 *    zero that means "the capture broke". A failed read renders Failed with a
 *    retry and never an empty state, an empty window says what would fill it,
 *    and a visit count of zero standing beside a non-zero signup count is
 *    reported as the contradiction it is rather than smoothed over.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Nowhere, and that is the correct answer rather than a gap. No agent writes
 *    a landing event; every row here is a stranger's browser. Putting agent
 *    marks on it would be decoration, and the agentic-first test asks whether
 *    the crew's presence PROVES something, not whether it is visible.
 *
 * 7. WHY THE FIGURES CAN DISAGREE WITH A VENDOR DASHBOARD, SAID ONCE HERE
 *    RATHER THAN APOLOGISED FOR ON THE SCREEN. `landing_visit` is gated on
 *    sessionStorage, so it counts SESSIONS and not page loads, and a visitor who
 *    blocks storage never counts at all. That makes every number here a floor.
 *    Undercounting is the direction this product errs in everywhere it counts
 *    anything, and it is the only direction that is safe to publish from.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row } from "@/components/meridian/rows";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Block, Empty, Failed, Loading } from "@/components/shell/primitives";
import { getLandingFunnel, type LandingEventName } from "@/lib/landing.functions";

export const Route = createFileRoute("/_authenticated/admin/landing")({
  component: AdminLanding,
});

/** The window this surface reads. The server function clamps and defaults to the
 *  same fourteen days; it is named here so the copy can state it out loud. */
const WINDOW_DAYS = 14;

/**
 * The funnel in the order the plan names it, with each step said the way the
 * person who built the page would say it rather than by its event slug. The
 * sub-line carries the one fact that stops a count being misread — WHERE the
 * event fires — because a reader who does not know that cannot tell a quiet step
 * from a step that is not wired.
 */
const STEPS: Array<{ event: LandingEventName; lead: string; sub: string }> = [
  {
    event: "landing_visit",
    lead: "Arrived on the landing page",
    sub: "One per browser session, not per page load",
  },
  {
    event: "waitlist_join",
    lead: "Joined the waitlist",
    sub: "Fires once per address; a returning email does not count twice",
  },
  {
    event: "referral_share",
    lead: "Copied their referral link",
    sub: "Only reachable after joining, so this is a share and never a visit",
  },
  {
    event: "demo_click",
    lead: "Opened the demo",
    sub: "The nav link, the hero link, or the walkthrough's own door",
  },
];

function AdminLanding() {
  const fFunnel = useServerFn(getLandingFunnel);
  const funnel = useQuery({
    queryKey: ["admin-landing-funnel", WINDOW_DAYS],
    queryFn: () => fFunnel({ data: { days: WINDOW_DAYS } }),
    staleTime: 60_000,
  });

  if (funnel.isLoading) {
    return <Loading>Reading what the landing page recorded.</Loading>;
  }

  // A read that did not complete is not a quiet launch. These two facts look
  // identical on screen and are acted on completely differently, so a failure
  // never gets to borrow an empty state's clothes.
  if (!funnel.data || "error" in funnel.data) {
    return (
      <Failed onRetry={() => void funnel.refetch()}>
        The launch figures did not load, so nothing here can be read as a count.{" "}
        {funnel.data && "error" in funnel.data
          ? funnel.data.error
          : funnel.error instanceof Error
            ? funnel.error.message
            : "The read failed."}
      </Failed>
    );
  }

  const f = funnel.data;
  const visits = f.totals.landing_visit;
  const joins = f.totals.waitlist_join;
  const anyEvent = STEPS.some((s) => f.totals[s.event] > 0);

  // Every branch here is a real reading of the two numbers. The fourth is the
  // one worth having the page for: signups arriving with no visits behind them
  // means the event capture stopped, not that the launch is quiet, and it is the
  // failure most likely to go unnoticed because the product still works.
  const funnelVerdict =
    visits === 0 && joins === 0
      ? `Nothing was recorded in the last ${f.windowDays} days`
      : visits > 0 && joins > 0
        ? `${visits} visits turned into ${joins} waitlist signups`
        : visits > 0
          ? `${visits} visits, and not one of them joined the waitlist`
          : `${joins} joined the waitlist with no visit recorded beside them`;

  const dayVerdict =
    f.days.length === 0
      ? `No day in the last ${f.windowDays} carried anything`
      : f.signupsInWindow === 0
        ? `${f.days.length} active day${f.days.length === 1 ? "" : "s"}, and no signup among them`
        : `${f.signupsInWindow} signed up over ${f.days.length} active day${
            f.days.length === 1 ? "" : "s"
          }`;

  const referrerVerdict =
    f.referrers.length === 0
      ? "No visit has been recorded, so there is nothing to attribute"
      : f.referrers.length === 1
        ? "Every recorded visit came from one place"
        : `Visits arrived from ${f.referrers.length} places`;

  return (
    <>
      <Block
        title={funnelVerdict}
        sub={
          <>
            The last {f.windowDays} days, counted from the events the page itself wrote. Each share
            below is of VISITS, not of the step above it: the demo opens without joining, so these
            are four counts of one audience rather than a ladder.
            {f.eventsTruncated
              ? ` More than the row cap was recorded in this window, so the day series and the referrers below cover only the most recent rows. The four counts here stay exact.`
              : null}
          </>
        }
      >
        {!anyEvent ? (
          <Empty>
            No landing event has been recorded in the last {f.windowDays} days. This table is
            written by the landing page itself, so it stays empty until somebody opens it. If the
            page is live and busy, an empty block here is the capture being broken rather than the
            launch being quiet.
          </Empty>
        ) : (
          STEPS.map((s) => {
            const n = f.totals[s.event];
            return (
              <Row
                key={s.event}
                tight
                lead={s.lead}
                sub={
                  // The share renders only when there is a denominator to divide
                  // by. With no visits recorded there is no percentage to state,
                  // and stating one anyway is the fabricated number this refuses.
                  visits > 0 && s.event !== "landing_visit" ? (
                    <>
                      {s.sub} · <Num>{Math.round((n / visits) * 100)}%</Num> of visits
                    </>
                  ) : (
                    s.sub
                  )
                }
                time={String(n)}
              />
            );
          })
        )}
      </Block>

      <Block
        title={dayVerdict}
        sub={
          <>
            Days are UTC, newest first, and a day with nothing on it is left out rather than drawn
            as a row of zeroes. {f.signupsAllTime} people have joined the waitlist in total, all
            time.
            {f.signupsTruncated
              ? " More signups landed in this window than the row cap, so the per-day split below is partial; the totals are exact."
              : null}
          </>
        }
      >
        {f.days.length === 0 ? (
          <Empty>
            Not one event or signup landed on any day in the last {f.windowDays} days. The first row
            appears the first time somebody opens the landing page.
          </Empty>
        ) : (
          f.days.map((d) => (
            <Row
              key={d.day}
              tight
              lead={
                d.signups === 0 ? (
                  "No signup"
                ) : (
                  <>
                    <Num>{d.signups}</Num> joined
                  </>
                )
              }
              sub={
                <>
                  <Num>{d.events.landing_visit}</Num> visits · <Num>{d.events.demo_click}</Num> demo
                  · <Num>{d.events.referral_share}</Num> shared
                </>
              }
              time={d.day}
            />
          ))
        )}
      </Block>

      <Block
        title={referrerVerdict}
        sub="Taken from the visit event, which records the referring HOSTNAME and nothing else: never the path, never the query string. It is the only event that carries one."
      >
        {f.referrers.length === 0 ? (
          <Empty>
            No landing visit has been recorded in the last {f.windowDays} days, so there is no
            referrer to break down. This fills in on the first visit after somebody links to the
            page.
          </Empty>
        ) : (
          f.referrers.map((r) => (
            <Row
              key={r.host ?? " missing"}
              tight
              lead={
                r.host === null ? (
                  "No referrer field on the row"
                ) : r.host === "" ? (
                  "No referrer sent"
                ) : (
                  <span style={{ fontFamily: "var(--sp-font-mono)" }}>{r.host}</span>
                )
              }
              // Only the two ambiguous buckets get a sub-line. A named hostname
              // explains itself, and repeating "hostname only" under every row
              // would restate the block's own sub-line once per row.
              sub={
                r.host === null
                  ? "Recorded before the visit began carrying a referrer, or the props never reached the server. This is a gap in our own capture, not a visitor behaviour."
                  : r.host === ""
                    ? "Typed the address, opened a bookmark, or followed a link whose referrer policy stripped it."
                    : undefined
              }
              time={String(r.count)}
            />
          ))
        )}
      </Block>

      <Block
        title={
          f.sources.length === 0
            ? "No signup carries a source yet"
            : "Where each signup says it came from"
        }
        sub="The source stamped on the waitlist row at the moment it was written, which is the product's own account of the entry point rather than the browser's."
      >
        {f.sources.length === 0 ? (
          <Empty>
            Nobody has joined the waitlist in the last {f.windowDays} days, so there is no source to
            break down. The first row appears with the first signup.
          </Empty>
        ) : (
          f.sources.map((s) => (
            <Row
              key={s.source ?? " missing"}
              tight
              lead={
                s.source === null ? (
                  "No source recorded"
                ) : (
                  <span style={{ fontFamily: "var(--sp-font-mono)" }}>{s.source}</span>
                )
              }
              sub={
                s.source === null
                  ? "The row was written without one, so where it came from is genuinely unknown rather than uncategorised."
                  : undefined
              }
              time={String(s.count)}
            />
          ))
        )}
      </Block>
    </>
  );
}

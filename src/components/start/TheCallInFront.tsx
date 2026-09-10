/**
 * ── THE LEAD: ONE PIECE OF WORK, TOLD WHOLE ──────────────────────────────
 *
 * The reasoning, the measurements and the reason the previous answer did not
 * hold are all in `the-call-in-front.ts`. This file draws what that module
 * chose, and it makes three composition decisions of its own.
 *
 * ── 1. NO EYEBROW, AND THAT IS A RULE NOW, NOT A PREFERENCE ──────────────
 *
 * Counted across the signed-in product on 2026-09-10: **114 tracked-out
 * ALL-CAPS labels** — 88 through `mrd-eyebrow`, 26 hand-rolled — with up to 17
 * on the run screen alone. One of them reads `WHAT THIS RELEASE IS ON THE HOOK
 * FOR`: a 36-character sentence set in 10px uppercase at weight 650. That is a
 * heading wearing a label's clothes.
 *
 * `DESIGN-SYSTEM.md` already argues the opposite of what five surfaces do:
 * *"promoting the eyebrow would name the page 'Build', which is true of a
 * hundred runs"*. The rule was written down and the implementation inverted it.
 *
 * So the largest region on the home carries no label at all. **The call's own
 * sentence is the heading**, because it is the only thing on this screen that
 * is true of exactly one object.
 *
 * ── 2. THE ROAD IS DRAWN AROUND A REAL THING OR IT IS NOT DRAWN ──────────
 *
 * `Journey`'s full form already accepts `outcome` — *"one short line under the
 * node"* — and `journeyOfRun` already fills it from `produced`, per station,
 * for every run. The home was calling that same function at `size="row"`, which
 * is 96px wide and drops every outcome line on the floor. The product has been
 * computing "what each station of this run produced" on every poll and drawing
 * it as seven dots.
 *
 * Full width, it is the journey: what each stop handed on, where the work
 * stands, and where it stopped.
 *
 * ── 3. ONE ACCENT ON THE SCREEN, AND IT IS THE ANSWER ────────────────────
 *
 * Meridian's colour law says orchid means a person is required. On this screen
 * exactly one control is orchid, and it is the one that ends the wait. Nothing
 * else here is coloured, including the road's labels.
 */

import { Link } from "@tanstack/react-router";
import { Journey } from "@/components/meridian/Journey";
import { ACTION_LINK_FACE, Action, Actions, Approve } from "@/components/meridian/surface-parts";
import { journeyOfRun } from "@/components/start/journey-of-a-run";
import { dateTimeInZone } from "@/lib/time-of-day";
import type { Lead } from "@/components/start/the-call-in-front";

/**
 * THE REGION HOLDS ITS PLACE IN EVERY STATE (law 32).
 *
 * Twelve conditional regions is what made the home read as a dump: no two
 * visits shared a shape, so there was nothing to learn. This one draws in the
 * same position every time and says what is true — including "nothing is
 * waiting on you", which is a real answer and the first one most people meet.
 * The single exception is an unread read, which draws nothing at all, because
 * a zero we did not measure is worse than a silence.
 */
export function TheCallInFront({
  lead,
  zone,
  nowIso,
  onApprove,
  onDecline,
  onSnooze,
  busy = false,
}: {
  lead: Lead;
  zone: string;
  nowIso: string;
  onApprove: () => void;
  onDecline: () => void;
  onSnooze?: () => void;
  busy?: boolean;
}) {
  if (lead.kind === "unread") return null;

  if (lead.kind === "nothing") {
    return (
      <section data-mrd="" data-lead="nothing" aria-label="What needs you">
        <h2 className="text-mrd-h1 leading-mrd-tight font-medium text-mrd-ink">
          Nothing is waiting on you.
        </h2>
        <p className="mt-mrd-3 max-w-[var(--mrd-measure-page)] mrd-copy">
          When a run stops to ask something, the question arrives here and the run holds until you
          answer it. Say what should change below and the first one starts.
        </p>
      </section>
    );
  }

  if (lead.kind === "run") {
    const road = journeyOfRun(lead.run);
    return (
      <section data-mrd="" data-lead="run" aria-label="Where your work stands">
        <Link
          to="/track/$trackId"
          params={{ trackId: lead.run.id }}
          search={{}}
          className="block text-mrd-h1 leading-mrd-tight font-medium text-mrd-ink hover:underline"
        >
          {lead.run.title}
        </Link>
        <p className="mt-mrd-3 max-w-[var(--mrd-measure-page)] mrd-copy">{lead.line}</p>
        <Road stations={road} />
        {/* A RUN HAS A URL, SO THE CONTROL THAT OPENS IT IS A LINK (law 22).
            `ACTION_LINK_FACE` is Meridian's own answer for exactly this: the
            paint of a control on an element that is genuinely an anchor, so
            cmd-click, middle-click and copy-link-address all survive. */}
        <div className="mt-mrd-5">
          <Link
            to="/track/$trackId"
            params={{ trackId: lead.run.id }}
            search={{}}
            data-mrd=""
            className={ACTION_LINK_FACE.primary}
          >
            Open the run
          </Link>
        </div>
      </section>
    );
  }

  const { item, run, waited, releases, why, cost, promise } = lead;
  const road = run ? journeyOfRun(run) : null;
  const when = promise?.horizonDate ? dateTimeInZone(promise.horizonDate, zone, nowIso) : null;

  return (
    <section data-mrd="" data-lead="call" aria-label="What needs you">
      <h2 className="text-mrd-h1 leading-mrd-tight font-medium text-mrd-ink">{item.title}</h2>

      {/* WHY IT IS BEING ASKED, WITH PROVENANCE. `evidence[]` has been on the
          wire on this screen since the queue was federated and has never once
          been drawn here. It is the first half of the judgement the person is
          about to make, so it reads directly under the call rather than behind
          a door. Two lines, because a third is a document. */}
      {why.length > 0 ? (
        <ul className="mt-mrd-4 flex flex-col gap-mrd-2">
          {why.slice(0, 2).map((line) => (
            <li key={line} className="max-w-[var(--mrd-measure-page)] mrd-copy">
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {/* THE ROAD, AROUND THIS CALL'S OWN RUN. Absent when the call belongs to
          no run, which is honest and common: only tool-call gates carry one. */}
      {road ? <Road stations={road} /> : null}

      {/* WHAT IT COSTS, HOW LONG IT HAS WAITED, AND WHETHER ANSWERING STILL
          RELEASES ANYTHING — three facts, one line, and the third of them is
          the one no surface in this product has ever said before a person
          pressed. See `releaseLine`. */}
      <p className="mt-mrd-4 max-w-[var(--mrd-measure-page)] mrd-copy">
        {[waited ? `Waiting on you ${waited}.` : null, releases, cost].filter(Boolean).join(" ")}
      </p>

      {/* WHAT IT IS BETTING ON — layer 3, on the same object as the call, which
          is the whole point. The forecast is attached to the queue item and the
          home used to run a SECOND query against `decisions` to find a
          different, unrelated open bet three regions further down. */}
      {promise ? (
        <div className="mt-mrd-4 border-l border-mrd-line pl-mrd-4">
          <p className="max-w-[var(--mrd-measure-page)] mrd-copy">{promise.claim}</p>
          {promise.howWeWillKnow ? (
            <p className="mt-mrd-2 max-w-[var(--mrd-measure-page)] mrd-meta">
              {promise.howWeWillKnow}
            </p>
          ) : null}
          {when ? <p className="mt-mrd-2 mrd-meta">You will know by {when}.</p> : null}
        </div>
      ) : null}

      <Actions
        className="mt-mrd-5"
        trailing={onSnooze ? <Action onClick={onSnooze}>Not now</Action> : undefined}
      >
        <Approve busy={busy} onClick={onApprove}>
          Approve
        </Approve>
        <Action busy={busy} onClick={onDecline}>
          Decline
        </Action>
        {run ? (
          <Link
            to="/track/$trackId"
            params={{ trackId: run.id }}
            search={{}}
            className="mrd-meta self-center underline underline-offset-2 hover:text-mrd-ink"
          >
            Open the run
          </Link>
        ) : null}
      </Actions>

      {/* WHAT EACH ANSWER CAUSES, under the control that causes it. Both
          strings are on the queue item and neither has ever been drawn on this
          surface. A person should not have to press to find out. */}
      {item.approveConsequence || item.rejectConsequence ? (
        <p className="mt-mrd-3 max-w-[var(--mrd-measure-page)] mrd-meta">
          {[
            item.approveConsequence ? `Approve: ${item.approveConsequence}` : null,
            item.rejectConsequence ? `Decline: ${item.rejectConsequence}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </section>
  );
}

/**
 * The road at its full width, which is the size `Journey`'s own `outcome` field
 * was written for and the size the home has never drawn it at.
 */
function Road({ stations }: { stations: React.ComponentProps<typeof Journey>["stations"] }) {
  return (
    <div className="mt-mrd-5">
      <Journey size="full" stations={stations} label="The road this work travels" />
    </div>
  );
}

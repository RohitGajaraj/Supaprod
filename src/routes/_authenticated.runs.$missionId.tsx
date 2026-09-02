import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14, A-QUEUE.md, R-35's ruling: "a mission without a track
 * is not a run"). 395 of 407 missions carry no `agent_runs` row with a
 * `track_id`, so this page's own gate ("Any NO HOME row blocks the deletion
 * of that page") looked unmet at first read -- until the ruling: the fact
 * this page carried was never the page's to keep. A driven mission now
 * always has a track (the spine drives every run), so its report is
 * `/track/:id`; an undriven one is the pre-spine archive, kept in the
 * database and in `build.list_sessions`, and gets no page. The source that
 * kept minting track-less missions (`trigger-tick`'s cluster branch) already
 * writes a bet instead, shipped ahead of this stub.
 *
 * This address stays live for the one-week inbound-link window P-10 and
 * P-14a already used, then a follow-up packet deletes this stub.
 *
 * `search: true` forwards whatever the old address carried, raw -- the same
 * shorthand the other four P-14 stubs use.
 */
export const Route = createFileRoute("/_authenticated/runs/$missionId")({
  beforeLoad: () => {
    throw redirect({ to: "/start", search: true });
  },
});

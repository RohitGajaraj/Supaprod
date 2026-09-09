/**
 * `/learn` IS A DOOR TO OUTCOMES NOW (Lane 2, 2026-09-09; P-14b, A-QUEUE.md).
 *
 * The rail stopped reaching this route on 2026-09-07 and nothing on the loop
 * pointed at it, so the settle gate and the forecasts desk, the write Learn
 * exists for, sat where nobody arrived. Outcomes is the one door to Learn: the
 * desk sits at its top, and everything else this route drew is
 * `components/learn/LearnRecord.tsx`, mounted under its outcomes tab. The
 * route's own header, with the argument for each region, is in git at the
 * commit before this one.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/learn")({
  beforeLoad: () => {
    throw redirect({ to: "/outcomes", search: { tab: "learnings" } });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /boundary folded into the Engine Room (item 22, executed 2026-08-25).
 *
 * WHAT THIS ADDRESS WAS. The one place a person said what their crew may do
 * alone. FOUNDER RULING 2026-08-01, which the surface served and which still
 * governs what the controls may do wherever they now live:
 *
 *   "Agents that run the whole product loop without asking permission, because
 *    you set the boundary once, and every crossing is on the record."
 *
 * WHY THE ADDRESS CLOSED. The route's own header once argued it should be a
 * first-class surface rather than an engine-room view, and that argument was
 * honestly made and honestly lost: the route grew to 1131 lines with NO rail
 * door -- reachable from one crew link and from a component inside the Safety
 * room that linked the reader OUT of itself to reach its own subject. The
 * audit named it; request 022 asked LANE 0 to host the controls; LANE 0's
 * `214cfffd5` landed every block verbatim -- the tool-mode editor (the
 * platform's only one), the automation boundary, trust graduations, ceilings
 * and the declined ledger -- onto the Safety room's front tab, between the
 * statement that says why and the guardrails that say what may be said.
 * Nothing was reachable here that is not reachable there, one door earlier.
 *
 * WHERE EVERYTHING WENT: `/engine-room?room=safety&view=rules` -- the tab
 * labelled "What is allowed", which is this surface's own question in the
 * room's own words. The old header's market argument (Cursor's
 * permissions.json, Claude Code's settings.json: policy as a readable file,
 * not a permission queue) is preserved in git history under this path.
 */
export const Route = createFileRoute("/_authenticated/boundary")({
  beforeLoad: () => {
    throw redirect({
      to: "/engine-room",
      search: { room: "safety", view: "rules" },
    });
  },
});

# WO-FID — Functional fidelity: the existing mockup surfaces must WORK, not just look right

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**WHY.** Founder (2026-07-23): "everything in the HTML is not actually implemented at code level… the design screen is a placeholder, not functional and working." The love-gate proved visual fidelity; this packet family proves FUNCTION. For every element on a shipped mockup surface: is it wired (server fn, action, deep link, live state)? A control that does nothing may not ship — wire it, or render the honest GAP state ("record how it landed" not "we measured"; "drafts only, nothing sends itself"), never a dead button.

**The shared method (every packet):**
1. Open the mockup and the live surface side by side (dev server, seeded workspace per `docs/operations/demo-credentials.md`).
2. Build the element inventory from the mockup: every button, chip, link, expandable, live region, state variant (rest/active/empty).
3. For each element test the LIVE surface: does it exist? does clicking it DO the thing? does the data come from a real server fn (check the `src/lib/*.functions.ts` the route imports) or is it hardcoded? does every id chip (SIG/BET/DEC/SPEC/REL/LRN) navigate somewhere real (the lineage pass)?
4. Verdict per element: WIRED / COSMETIC (looks live, does nothing) / MISSING / DISHONEST (claims more than the backend does).
5. Fix: COSMETIC → wire it to the existing server fn if one exists, else convert to the honest GAP treatment; MISSING → build it if S-sized, else report with the exact fn/table that would be needed; DISHONEST → reword to what is true.
6. Report: the element table (mockup element → verdict → action taken) + screenshots.

**Fence (all packets):** own only your surface's components + its route file. No schema/migration changes. No new server functions without flagging in the report first (S-sized additions to an existing `*.functions.ts` are allowed). No design-token changes (WO-EMBER owns those).

Verification (all): `bunx tsc --noEmit && bun run build && bun test` + click every element you touched.

---

## FID-1 Rest face + returning landing · branch `wo/fid-rest`
Floor: `screen-2-room-rest.html` + `landing-when-you-login.html` Frame A. Surface: `faces.tsx` RestFace + `_authenticated.m.$productId.tsx` entry. Key checks: per-stage receipts real? shipped-history rows door to real releases? memory highlights come from real reflections? briefing card = real briefing fn? "Start the loop" actually dispatches? (Coordinate with WO-D — its gate-row addition merges first.)

## FID-2 Approvals tray + decision board · branch `wo/fid-approvals`
Floor: `screen-4-room-gated-tray.html`. Surfaces: the tray in `_authenticated.m.$productId.tsx` (`?panel=approvals`), `ApprovalsTray` component, `/approvals` board. Key checks: ONE count ONE source everywhere (nav pill, spine node, tray chip, cards); keys 1/2/3/H + J/K work; Enter opens evidence; approving runs the real mutation + choreography; expiries real; the logging footer true.

## FID-3 Plan face / journey slice · branch `wo/fid-plan`
Floor: `screen-5-journey-flow.html` + `_shell-template.html` (spec face). Surface: `faces.tsx` SpecFace/plan region + `/plan` workbench. Key checks: the working triple (plan/reading/streaming) renders during a real run? finished spec shows assumptions/outcome contract/task graph from the real PRD? the handoff card ("Build SPEC-61") pre-fills the composer? entry caps honest?

## FID-4 Design face · branch `wo/fid-design` · KNOWN OFFENDER
Floor: `screen-6-design-face.html`. Surface: `faces.tsx` PrototypeFace + `/design` workbench. The founder singled this out: the mockup shows a version trail (flow map → wireframe → branded → interactive), clickable-path annotations, 4 switchable states, brand-kit note — the code renders a fraction. Inventory ALL of it; wire what `design.functions`/prototype data supports (the live scaffold iframe exists); the rest becomes honest staged GAP treatments (e.g. version trail shows the versions that exist, absent rungs render as "not generated yet — ask Design"), never fake tabs. Report exactly which mockup elements need new backend (fn + table) so the founder can gate that work.

## FID-5 Build workbench · branch `wo/fid-build` · KNOWN OFFENDER
Floor: `screen-3-room-building.html` (+ `screen-3b` after it lands). Surfaces: `/build` home + `/build/$missionId` + `faces.tsx` CodeFace. Key checks: decomposed plan = real run steps? files-changing rail = real changeset? diff hunk controls actually stage/reject (they do in ChangesPanel — verify the room door); CI strip = real check runs; terminal = real streamed output (sandbox-badged), not decoration; run timeline real. Coordinate: WO-BE-B owns `BuildMissionRow`, WO-BE-C owns the CodeFace deltas — this packet audits everything else in the workbench and fixes what they don't own.

## FID-6 Settings shell · branch `wo/fid-settings`
Floor: `screen-7-agents-settings.html` (+ screens 16/17 after they land). Surface: `_authenticated.settings.tsx` + `src/components/settings/*`. Key checks: all 16 sections reachable via `?section=`; the roster's approval-mode controls actually persist; tool-grant ledger real; BYOK save/verify flows work; connections OAuth round-trips; credits figures real; every "→ Brain"/cross-pointer navigates.

## FID-7 Threads home · branch `wo/fid-threads`
Floor: `screen-9-threads-home.html`. Surface: `/threads` + `ThreadsSurface`. Key checks: scopes (product/workspace) filter truly; rename persists; "Save to the brain" writes a real memory; "Make this a bet" creates one; the gate chip on a thread row shares the one count; search filters (never a second composer); `G T` opens it.

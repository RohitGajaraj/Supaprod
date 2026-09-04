# WO-LAND — Public landing sweep: a cold visitor understands, wants in, and nothing confuses

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Branch:** `wo/land-public-landing` · Fully disjoint from app lanes; dispatchable anytime after the Round-3 mockups land on main.

**WHY.** Founder (2026-07-23): the landing carries elements he cannot explain to himself — "public teardown", "/demo", PRD vocabulary — and it doesn't yet deliver the designed ink+starfield experience end to end. The landing must showcase the core product (the loop, the agents, the brain) in vocabulary a cold visitor understands, serve the standing positioning (door → body → brain: "Cursor for PMs" is the door, the closed loop is the body, the compounding memory is the crescendo — one headline per surface, never all three at once), and cut everything that needs insider context.

**Design canon:** `design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md` (the ink/starfield canvas, three-voice trace grammar, Pixel hero, vocabulary rulings) — read it FIRST, it is binding for every public page. Positioning: `docs/pitch/repositioning-2026-07-22.md` (per-surface vocabulary rules). Voice: `docs/conventions/humanized-output.md` + `ui-voice.md`.

**Files owned:** `src/components/landing/*` (Hero, TheGap, LoopWalkthrough, FieldStops, Receipts, TrustClose, WaitlistForm, LandingNav, LandingFooter, inkTheme), `src/routes/index.tsx`. NOT owned: `/p/*` public pages themselves, pricing/security/updates pages (audit their labels only where the landing links to them).

## Steps

1. **Block-by-block audit** (write it up in your report BEFORE changing anything). For each block answer: (a) does a cold visitor understand it in 5 seconds? (b) does it serve door→body→brain in that order? (c) is every claim honest to what ships (claim-never-outruns-wiring)? The known suspects:
   - `LandingNav` + `Hero` + `LoopWalkthrough` + `LandingFooter` links to **`/demo`** ("the demo is our real workspace, read-only, no signup") — VERIFY `/demo` actually works logged-out and looks presentable. If yes: keep, but label it in visitor language ("See it live"). If no: cut the links until it does.
   - `Receipts` + footer link to **`/p/teardown`** ("A public teardown, no signup") — "teardown" is insider vocabulary. Either rename to visitor language ("Watch it critique a real product idea") with a one-line explanation, or cut the block if the page doesn't deliver.
   - Any **PRD** mentions — translate to plain speech ("the spec", "the plan") per the vocabulary rulings; PMs know PRD, but the rule is one insider term max where it buys credibility.
2. **The rewrite:** keep the ink+starfield canvas and the applied record's grammar; one Pixel hero moment; one ember CTA per viewport; the section order tells door → body → brain (entry promise → the loop with agents visibly working → the compounding brain as the crescendo). Cut or rewrite the audited failures. The agentic proof must ride REAL surfaces (the trace grammar the applied record defines), never fabricated screenshots.
3. **Waitlist/CTA integrity:** verify the WaitlistForm submits successfully and the signup path works end to end; the primary CTA reflects the actual state (beta open per the signup page).
4. Verify against the composition playbook (`design-reference/tempo-v5/research/vercel-composition-playbook.md`) — spacing, type scale, restraint budget; both themes if the landing supports them, else dark.

## Out of scope

No app-shell changes. No new marketing pages. No pricing changes. No claims beyond what ships (nothing "coming soon" without the founder's sign-off).

## Acceptance checklist

- [ ] The audit table (block → verdict keep/rewrite/cut → why) is in the report.
- [ ] Every remaining link on the landing resolves and looks presentable logged-out.
- [ ] No insider vocabulary a cold visitor can't parse; door→body→brain order holds; one headline per surface.
- [ ] One ember CTA per viewport; one Pixel moment; humanized copy (no em dashes, no AI-tells).
- [ ] Waitlist + signup flows verified end to end.
- [ ] `bunx tsc --noEmit && bun run build && bun test` green; before/after screenshots attached.

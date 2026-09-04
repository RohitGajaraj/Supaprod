# WO-EMBER — The restraint sweep: one ember per screen, everywhere

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Branch:** `wo/ember-restraint-sweep` · **Start only after WO-A and WO-B are on main** (you audit the merged shell).

**WHY.** Founder ruling (2026-07-23): "there is too much amber; it's overpowering." The design law was always one-ember-locus-per-screen, but the built app drifted: ember chips, counts, badges, and secondary buttons compete with the actual gate. Brand color must mark exactly one thing per screen — the human's move. Everything else: ink, gray, white, silver, slate.

**The law (from `../mockups/_round3-brief.md`):** ember KEEPS only: the gate object / single primary CTA (`.sp-btn-accent` equivalents), the spine `is-gate` node, spine caps, focus rings, the WarmSlot single action. Chips wear the slate ramp (`--chip-*` in `src/styles/ink.css`). Memory wears Vellum only. Gold appears only in the brand mark's center bead.

**Files owned:** any component under `src/components/mission/`, `src/components/obsidian/`, `src/components/settings/`, `src/components/studio/` whose ONLY change is color-token demotion; plus `src/styles/ink.css` if a shared chip class needs its token corrected. You may NOT change layout, copy, data, or behavior — tokens and classes only. (Exception already handled elsewhere: faces.tsx Critic-Revise fix belongs to WO-BE-C; skip it if already merged, otherwise include it.)

## Steps

1. Inventory pass (read-only): run the app (`bun run dev`, login per `docs/operations/demo-credentials.md`) and walk: `/m/$productId` all 7 stages + rest, the tray open, `/threads`, `/artifacts`, `/settings` (all 16 sections), `/brain`, `/approvals`, `/engine-room`, and the 7 wrapped station routes. For EVERY screen record every ember/amber/orange element (grep help: `voice-human|ember|amber|orange|#ff6b2c|#f05a1a` across the owned folders).
2. For each screen, decide the ONE legitimate locus (the gate if present, else the primary CTA). Everything else on that screen wearing ember gets demoted: chips/badges/counts → slate ramp; secondary buttons → default ink button; informational accents → `--ink-*` tiers.
3. Apply, screen by screen, in small commits ("WHY: ember restraint — <screen>: demote <elements>, keep <locus>").
4. Screenshot-diff verification: before/after screenshot per changed screen (Playwright or the browser tools); attach the pairs to your report. The grayscale test must still attribute everything (chips/glyphs carry meaning, not color).

## Out of scope

No layout, spacing, copy, or behavior changes. No public-landing changes (WO-LAND owns those). No mockup edits.

## Acceptance checklist

- [ ] Every audited screen has EXACTLY one ember locus (list each screen + its locus in the report).
- [ ] Zero ember chips/badges/counts remain; approvals counts wear slate.
- [ ] Vellum only on memory moments; gold only in the mark.
- [ ] Before/after screenshots attached for every changed screen.
- [ ] `bunx tsc --noEmit && bun run build && bun test` green.

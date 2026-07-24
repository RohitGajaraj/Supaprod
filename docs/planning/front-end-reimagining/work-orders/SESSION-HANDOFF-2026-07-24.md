# Session handoff — Round 3.1 mockups + dispatch pack (2026-07-24, Fable session)

> For the NEXT agent (Fable-class). Deliverable scope per founder ruling: **HTML mockups + work orders ONLY — NO code implementation** (the founder dispatches code lanes to his own sub-agents from the packets in this folder).

## What is DONE (committed)

1. **The law:** `../mockups/_round3-brief.md` — the complete authoring law. Read it FIRST, fully. §1-§5 base rules · §6 focus-collapse · **§6b quality addendum** (benchmark = existing screens 2/3/4 studied end-to-end; behavior rails; typography) · **§6c** (color aliveness — near-grayscale = defect; three-beat focus; every clickable names its door + consequence; Ask docked ONLY on speak-primary surfaces, ⌘J summon elsewhere) · **§6d** (brand truth: the verbatim epitrochoid mark SVG — never dots, logo never rotates, glint treatment; official Google G; NO Pixel on auth; the orb avatar recipe; spacing economy; subtle focus rings) · §7 review gates (the full checklist incl. 6b/6c/6d gates).
2. **The work-order pack:** this folder — README (branch protocol + dispatch order) + WO-A/B/C/D, WO-BE, WO-EMBER, WO-FID (7 packets), WO-NEW (8 packets), WO-LAND, WO-E (with 2026-07-24 DB pre-flight findings: **approvals=0 is a demo BLOCKER — re-seed needed**; explore@ has NO account_credits row), WO-F, PC-35.
3. **Round-3.1 mockups authored so far** (in `../mockups/`, at the RAISED bar, 110-119KB each): `screen-10-discover-face.html`, `screen-12-ship-face.html`, `screen-13-learn-face.html`, `screen-14-brain.html`, `screen-15-auth-and-account.html`.

## What REMAINS (the next session's job)

**A. Author the 7 missing mockups** (per-file specs are in `round3-authoring-specs.js` in THIS folder — the `SPECS` array carries the full content spec per file; the `COMMON` constant is the author preamble; use them verbatim as agent prompts):
- `screen-11-decide-face.html` · `screen-1b-first-run-v2.html` · `screen-3b-build-focus.html` · `screen-16-settings-you-workspace.html` · `screen-17-settings-connections-plan.html` · `screen-18-library.html` · `screen-19-engine-room.html`
- NOTE: those specs predate §6c/§6d — the brief OVERRIDES them where they conflict (e.g. specs naming Pixel moments → now default zero; the composer → §6c.4 placement rule; any brand mark → §6d verbatim SVG).

**B. Verify ALL 12 files** against brief §7 (every gate, incl.: density parity with screen-3 — "would it sit beside screen-3 without looking simpler?"; behavior rail present; color aliveness; every clickable has door+consequence; Ask placement; §6d brand truth). The 5 existing files were authored mid-law-evolution — screen-15 especially needs a §6d pass (real mark, real Google G, no Pixel title, sub-line copy "Sign in to get back to what your agents are doing.", tight spacing, subtle focus rings). Fix what fails. The founder personally flagged screen-13 (overwhelm/blandness — apply §6c) and screen-15 (§6d).
- Cross-file consistency: the master timeline in brief §4 (times 9:05 / 9:41 / 10:05 / 11:52 / 12:15 / 12:30; shared ids BET-35, DEC-19, LRN-13, REL-20 must match across files).

**C. Gallery + audit:** add a "Round 3" section to `../mockups/index.html` (existing card pattern; one card per file naming the one question it answers); note in `../fidelity-audit.md` (if present) that rows for Decide/Ship/Learn/Brain/etc. now have mockup floors and that screen-8 is a decision-board doc (screen-11 is the real Decide floor).

**D. Hand the founder the dispatch summary:** point him to `README.md` here (dispatch order + branch protocol); remind him of the two founder gates (demo-repo GitHub OAuth + pre-run missions per WO-E step 6; the WO-E re-seed for the 3 pending approvals).

## Method notes (hard-won, follow them)

- Spawn one author agent per file in parallel (they inherit Fable); each MUST deep-study screens 2/3/4 end-to-end before writing (this is what fixed the quality). Verify each file with an independent agent against §7; fix; then a cross-file consistency pass.
- Files are 60-120KB; authors write the COMPLETE file in one Write.
- Founder rulings history (do not re-litigate): card recognition = A chip-only; Brain naming = door "Brain" / hero "What [workspace] knows"; three-place IA = Threads (how it happened) / Library (what we made, promotion-not-accumulation, plan-tiered share links) / Brain (what we know); ember = ONE locus but other voices must LIVE; Conductor = internal tool only, equivalent built on our seam (PC-35).
- DB access: Lovable MCP `query_database`, project id `371dd588-1b70-4629-9bb5-9f003f3af373` (workspace "Luna"). Read-only unless the founder says otherwise.
- BUILD-ONLY MODE: no doc ceremony; commit with a WHY; push `git push origin <branch>:main` explicit refspec.

## The founder's paste-able continuation prompt

> Continue the Round-3.1 mockup program exactly from the handoff at `docs/planning/front-end-reimagining/work-orders/SESSION-HANDOFF-2026-07-24.md`. Read that file first, then the law at `docs/planning/front-end-reimagining/mockups/_round3-brief.md` (all sections including 6b/6c/6d and the §7 gates). Deliverables: mockups + work orders ONLY — do not implement code. (1) Author the 7 missing mockups using the per-file SPECS in `work-orders/round3-authoring-specs.js`, with the brief overriding where they conflict; every author deep-studies mockups/screen-2, screen-3, and screen-4 end-to-end first and must match their density and craft. (2) Verify all 12 Round-3 files against the §7 gates (including §6d brand truth on screen-15 and §6c color/focus on screen-13) and fix failures. (3) Update the mockups gallery index.html with a Round 3 section. (4) Commit with a WHY and push with the explicit refspec. Then give me the dispatch summary from work-orders/README.md.

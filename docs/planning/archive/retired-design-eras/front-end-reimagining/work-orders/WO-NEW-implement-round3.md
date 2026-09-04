# WO-NEW — Implement the Round-3 mockups (screens 10–19, 1b, 3b)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**WHY.** The Round-3 mockups are the founder-approved floor for the surfaces that had none. Each packet implements one surface to "do exactly what's shown" — including the FUNCTIONAL CONTRACT in each mockup's header comment (primary question, primary actions, lineage doors, agents/attribution, focus/collapse, empty/loading/blocked states). The mockup header is part of the spec: read it first, every time.

**Shared rules:** the mockup + `../mockups/_round3-brief.md` bind. Reuse the existing face/server-fn wiring — every one of these surfaces has real data behind it (listed per packet); the work is presentation + wiring, not new backends. Honest GAP states where the mockup itself marks one. One ember locus; slate chips; Vellum memory. Verification per packet: `tsc/build/test` + walking the mockup's element inventory live (the WO-FID method applies to YOUR new code too).

---

## NEW-1 Discover face · branch `wo/new-discover` · floor `screen-10-discover-face.html`
Target: `faces.tsx` EvidenceFace (+ `/discover` workbench where the face doors). Data: the signals/themes fns the current face + `_authenticated.discover.tsx` already read. Build: source-chip row; theme cluster cards w/ the expanded explainability pattern ("Clustered by Watch from N signals" + member list); signal triage action row (Make this a bet / Add to BET-… / Dismiss) — wire to existing opportunity/bet fns; Dismiss records feedback (if no fn exists, S-add to the discovery fns or render the honest "coming" treatment per the mockup); the act-here explainer line; Comet-style WarmSlot empty state.

## NEW-2 Decide face · branch `wo/new-decide` · floor `screen-11-decide-face.html`
Target: `faces.tsx` DecisionFace. Data: ranked bets/opportunities + Critic verdict fns already feeding the face. Build: the three-bet ranked layout w/ ICE bars, Critic verdict blocks (Revise = slate), memory-alignment lines w/ DEC-chip doors to the Brain, "Kill if" lines, the gate card wording (3-clause ember copy), the teardown-verdict layout for J2 results.

## NEW-3 Ship face · branch `wo/new-ship` · floor `screen-12-ship-face.html`
Target: `faces.tsx` ShipFace. Data: releases/deployments fns. Build: release card + environment path strip; guarded rollout plan (render what release data supports; guards not in data = the mockup's honest annotation); launch-kit draft cards w/ copy-out buttons ("nothing sends itself" line verbatim); outcome-check armed chip; the provenance line on the live state.

## NEW-4 Learn face · branch `wo/new-learn` · floor `screen-13-learn-face.html`
Target: `faces.tsx` GrowthFace. Data: outcome/attestation fns (the Landed/Mixed/Missed mutation exists in the outcome flow). Build: contract-vs-evidence two-card layout (contract wears the Vellum chip; honest "not connected" cells); the attestation gate trio; the recorded state (learning card, re-scored bet, supersession card, the return-arrow beat on the spine — coordinate the spine animation with the existing choreography budget: reuse, don't add).

## NEW-5 Brain · branch `wo/new-brain` · floor `screen-14-brain.html`
Target: rebuild `_authenticated.brain.tsx` fully in the non-room shell (RoomChromeShell, no spine/thread), keeping its 4 tabs' real data. Build: the hero + counts row (blue mono numerals — real counts); KNOWS decision cards on Vellum w/ provenance + supersession chains + the challenged-state card (real assumption-challenge data if present, else the honest absence); RUNS loop cards from the real cron/loop registrations w/ receipt trails; the ask-the-record composer wired to the existing chat/RAG over memory; the Graph tab preview = the auto-laid lineage fragment (read-only; reuse the existing graph tab's data). Naming: door "Brain", hero "What [workspace] knows".

## NEW-6 Auth re-skin · branch `wo/new-auth` · floor `screen-15-auth-and-account.html` Frame A + band
Target: `src/routes/login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `join.$token.tsx`. Build: the public ink+starfield card grammar (Pixel "Sign in" title, one ember CTA, plain Google button, mono footer links, humanized inline errors, calm white input rings). Keep ALL existing auth logic — this is presentation only. The account menu (Frame B) is WO-A, already landed; do not touch it.

## NEW-7 Settings panes to floor · branch `wo/new-settings` · floors `screen-16` + `screen-17`
Target: `src/components/settings/*` panes for the 13 non-Agents sections. Settings is functionally rich already — this packet brings presentation to the mockup floor: plain-sentence notification matrix, versioned top-bet rows w/ supersession note, preview-card doors, source rows w/ mono last-event times, the money-only-here credits layout, one-line Diagnostics. Coordinate with FID-6 (function) — this packet is layout/copy to floor; if FID-6 already merged, rebase and keep its wirings.

## NEW-8 Library + Engine room · branch `wo/new-library-engine` · floors `screen-18` + `screen-19`
Target: `/artifacts` surface (rename user-facing strings to **Library**; routes/ids stay) + `/engine-room`. Library: entry chips (gate-exit "approved …" / "saved by …") from real artifact provenance; version-trail chips; thread-link + brain-link glyphs per card; the share popover w/ plan-tiered scopes — wire "view in workspace" + org link where `/p/$slug`-style mechanisms exist; locked scopes render visible w/ the honest upgrade line (enforcement rides the billing rail; do NOT build new billing checks — read the existing plan state). Engine room: glance strip w/ one real number each; Quality room table from real eval fns; trace peek w/ the L2 "Open the full trace" door.

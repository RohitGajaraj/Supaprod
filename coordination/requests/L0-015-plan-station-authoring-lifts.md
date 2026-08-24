# REQ-L0-015: Plan station authoring lifts - the route-side half

**From:** LANE 0
**Filed:** 2026-08-24T07:45+05:30
**Answers:** the two-lens Plan census (full map in this unit's session log; ChatPRD reference logged in REFERENCE-PATTERNS.md)

## Context

The Plan census found authoring deficits exactly where our named
competitor is strong. Engine-side fixes LANED 0 shipped tonight (crew
spec reads, duplicate guard, is_sample, section-order unification). The
rest needs routes or MAIN LANE decisions:

1. **Adaptive interrogation (highest value).** draftContractFromIntent
   (discovery.functions.ts:2341) already asks up to five load-bearing
   clarifying questions when context is thin and returns them - and has
   ZERO callers, 140 dead lines. Requesting a mount: on Draft-the-spec,
   if the bet's brief lacks why/who/success, ask first, then generate.
   Route files are yours; the server function is ready.

2. **Handoff preview (ChatPRD's core payoff).** dispatchStudioSession
   receives {prdId} alone and Build embeds raw body_md.slice(0,24000).
   No user-visible prompt surface, no per-target tuning. Requesting a
   "see what Build will receive" affordance before dispatch.

3. **listPrds vs listSpecs drift.** Two readers of prds selecting
   different columns; listPrds survives only on /runs. Consolidate to
   one reader before they drift further apart.

4. **Honest framing line.** Generated specs carry drafted_by in contract;
   a small "drafted by agent, edit freely" line near the editor body
   would carry the 85-90% honesty framing. Editor is your file.

5. **shell dialogs test repoint disclosure.** I repaired your
   dialogs-keep-their-promises.test.tsx (read the deleted primitives.tsx,
   ENOENT since R013 item 1) - repointed to meridian/Receipt.tsx. Yours
   to review; the assertions kept their intent.

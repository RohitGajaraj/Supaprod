# Three Code-Fixable Gaps: Implementation Plan

> _Created: 2026-08-05_

**Status:** Prioritized plan for end-to-end workflow closure before launch.

**Scope:** These are pure application logic gaps, no database schema changes required. All three can be wired through existing infrastructure (artifact_lineage, critic_review, and message metadata).

---

## Executive Summary

Three gaps block users from tracing complete end-to-end workflows: **Origin bet links** (trace decisions back to source opportunities), **Critic verdict prominence** (surface the red-team verdict where it influences the gate), and **Evidence continuity** (carry decision rationale forward through Plan/Build/Ship). All three have complete wiring paths and no external dependencies.

**Recommendation:** Implement in this order:
1. **Critic Verdict Prominence (fastest, highest ROI)** — 2-3 hours
2. **Origin Bet Links (medium complexity, spans multiple surfaces)** — 4-5 hours
3. **Evidence Continuity (deepest discovery phase)** — 3-4 hours for foundation

---

## Gap 1: Critic Verdict Prominence

**Problem:** Critic verdict (ship/revise/kill + confidence) is buried in the context column under "Who has touched it" on the Decide surface. A decision-maker must open the detail sheet to see what the red-team concluded.

**Current State:**
- `CriticReview` type stored in `opportunities.critic_review` JSON column (src/lib/ai/critic.server.ts, line 30)
- Verdict values: `"ship" | "revise" | "kill" | "PENDING"`
- Confidence (0-100) available in same object
- OpportunityDetailSheet renders verdict in a detail panel (src/components/discover/OpportunityDetailSheet.tsx, ~line 100)
- Decide surface shows nothing about verdict in the queue/gate (src/routes/_authenticated.decide.tsx)

**Wire Path (NO schema changes needed):**

```
opportunities.critic_review (JSON)
  └─ contains: verdict, confidence, findings[]
    └─ Read at render time from `OpportunityDetailRecord` (which reads the full row)
```

**Implementation Strategy:**

1. **Define the verdict display component (new file):**
   - Create `src/components/discover/VerdictBadge.tsx`
   - Input: `{ verdict: VerdictWord; confidence?: number }`
   - Output: Compact badge showing verdict + confidence
   - Reuse from existing `VerdictChip` (search existing codebase)
   - Color scheme: `ship` (green), `revise` (amber), `kill` (red), `PENDING` (grey)
   - Show confidence only when verdict !== PENDING

2. **Add verdict display to Gate headline:**
   - File: `src/routes/_authenticated.decide.tsx` (~line 450-550, the Gate rendering)
   - Current Gate shows: bet title + status lane
   - **Add after status:** `<VerdictBadge verdict={active?.critic_review?.verdict} confidence={...} />`
   - Ancestors: Gate, CtxHead, CtxRow — all primitive blocks that stack right
   - 1-line precedent: look at how `BestBetStamp` nests inside a row

3. **Optional enhancement (same pass):**
   - Add one-line advisor text: "Critic says: [verdict]" directly in the Gate title or CtxRow
   - Mirrors how `verdictSentence()` already formats verdicts (line 191-193)
   - Font: normal weight, secondary color, advisory tone

**Testing:**
- Unit test: render with all four verdict states + missing/null
- Integration: Decide surface with an opportunity that has a verdict
- Verify: Critic verdict appears without opening the detail sheet
- Verify: clicking the badge or verdict text does NOT steal focus from the Gate button

**Files to change:**
- `src/components/discover/VerdictBadge.tsx` (NEW)
- `src/routes/_authenticated.decide.tsx` (3-5 lines added, 1-2 imports)
- Possibly `src/components/discover/format.ts` if verdictSentence needs a helper

**Effort:** 2-3 hours | **Risk:** Low (read-only, no mutation)

---

## Gap 2: Origin Bet Links

**Problem:** Users can see a mission was built from a spec, and a changeset from a mission, but cannot trace back to the opportunity that originated the work. The chain stops at the spec.

**Current State:**

Lineage edges flow this way:
```
opportunity → (Critic judges) → opportunity (same row)
opportunity → (Generate PRD) → prd (artifact_lineage: "promoted")
prd → (Dispatch mission) → mission (artifact_lineage: "promoted")
mission → (Poll, build, commit) → changeset (studio_changesets.mission_id column)
changeset → (Merge) → changelog (releases, from deploy)
```

**The Gap:**
- `missions` table has NO `opportunity_id` or `prd_id` column (it has `prd_id` IMPLIED through lineage only)
- `changesets` table has NO `opportunity_id` (must walk lineage back through mission → prd → opportunity)
- `changelog` entries have NO opportunity/prd context

Currently, Lineage drawer correctly walks backward, but:
- It's read-only for the user
- No UI surfaces show "this changeset came from bet X"
- Build and Ship surfaces don't display opportunity context

**Wire Path (still NO schema changes, but need data flow changes):**

```
spec (prd)
  ├─ prd_id available
  └─ Walk lineage: prd ← mission (via artifact_lineage, relation="promoted")

mission (studio_orchestration or agent_missions)
  ├─ Has mission_id
  ├─ Walk lineage: mission ← prd ← opportunity
  └─ Could store prd_id in a derived/cache column (optional optimization)

changeset (studio_changesets)
  ├─ mission_id column available
  ├─ Fetch mission → walk lineage to prd/opportunity
  └─ Or: store prd_id + opportunity_id at changeset creation time

changelog (ship releases)
  ├─ Linked via deployment.id
  ├─ No backward link to changeset/mission yet
  └─ Ship surface must walk from release ← deployment ← changeset
```

**Implementation Strategy:**

1. **Add derived lookup functions (no DB changes):**
   - Create `src/lib/opportunity-trace.functions.ts`
   - Export: `getOpportunityForSpec(supabase, prdId)` → traces prd ← opportunity via lineage
   - Export: `getOpportunityForMission(supabase, missionId)` → traces mission ← prd ← opportunity
   - Export: `getOpportunityForChangeset(supabase, changesetId)` → traces via mission
   - Export: `getOpportunityForRelease(supabase, releaseId)` → traces via deployment ← changeset
   - Implementation: Each walks artifact_lineage with the relation filters already in place
   - Caching: Optional at the function level (but not required for launch)

2. **Display opportunity context on Plan surface:**
   - File: `src/routes/_authenticated.plan.spec.$id.tsx` (the spec detail route)
   - Add block showing: "Originated from: [Opportunity title]" with link to Decide
   - Query: call `getOpportunityForSpec(specId)`
   - Link target: `/decide` with query param `focus=opportunity_id` (if routing supports it)
   - Fallback empty state: "This spec has no linked opportunity"

3. **Display opportunity context on Build surface:**
   - File: `src/routes/_authenticated.build.$missionId.tsx` or equivalent
   - Add same block showing opportunity origin
   - Query: call `getOpportunityForMission(missionId)`
   - Show the full chain: Opportunity → Spec → Mission (breadcrumb-style)

4. **Display opportunity context on Ship surface:**
   - File: `src/routes/_authenticated.ship.tsx` (the releases view)
   - For each release row, add an optional "From" column showing the opportunity
   - Query: call `getOpportunityForRelease(releaseId)`
   - May need to fetch opportunityId from the release's deployment trail
   - Fallback: Show spec title if opportunity cannot be traced

5. **Optional: Surface-specific receivers:**
   - Decide: when opening a spec, show "This became mission X" (forward trace)
   - Plan: when viewing a spec, show "This came from bet Y" (backward trace)
   - Both: Add one query-param channel so the UI can highlight/scroll to the origin when navigating

**Testing:**
- Unit test: all four trace functions with real lineage chains
- Integration: create opportunity → draft spec → dispatch mission → commit changeset → deploy release, trace at each step
- Verify: breaking a lineage edge (e.g., missing artifact_lineage row) degrades gracefully to empty state

**Files to change:**
- `src/lib/opportunity-trace.functions.ts` (NEW)
- `src/routes/_authenticated.plan.spec.$id.tsx` (3-5 lines added, query hook)
- `src/routes/_authenticated.build.*.tsx` (same as plan)
- `src/routes/_authenticated.ship.tsx` (same pattern)
- Optional: routing/query param helpers if navigation between surfaces needs linking

**Effort:** 4-5 hours | **Risk:** Medium (multiple surfaces, but each is same pattern)

---

## Gap 3: Evidence Continuity

**Problem:** Evidence is collected during Decide phase (via the Critic, linked signals, and manual notes). Plan, Build, and Ship surfaces have no access to "why we decided this." The decision rationale is lost.

**Current State (Discovery Phase Required):**

Need to determine:
1. Where is evidence currently stored?
   - `opportunities.problem` (the problem statement)
   - `opportunities.target_user` (the user it solves for)
   - Links to signals (via artifact_lineage or direct column?)
   - Critic findings (in `opportunities.critic_review` JSON)
   - Related decisions/learnings?

2. When is it written?
   - At opportunity creation (runWedgeTeardown in src/lib/discovery.functions.ts)
   - When Critic runs (critic_review JSON updated)
   - Manually via the detail sheet (updateOpportunity)

3. Where should it be available?
   - PRD (spec) should carry a link to the opportunity's evidence
   - Mission should carry forward the spec's evidence
   - Changeset should be able to cite why this work was started
   - Release notes should reference the opportunity/decision

**Data Flow to Investigate:**

```
opportunity
  ├─ id, title, problem, target_user, impact/confidence/ease
  ├─ critic_review { verdict, findings[], missing_evidence[] }
  └─ linked signals (how? lineage edges? or direct column?)
      └─ each signal has: source, content, date

prd (spec)
  ├─ id, title, body_md
  ├─ created_from_opportunity_id ← (QUESTION: does this column exist?)
  └─ should carry: brief + evidence summary for Build reference

mission
  ├─ id, created_from_spec_id
  └─ should carry: decision rationale link

changeset
  ├─ id, mission_id
  └─ build summary should cite: "this changeset ships decision X" with evidence
```

**Implementation Strategy (Foundation Layer):**

1. **Audit current storage (research first):**
   - Search codebase for all writes to `prd` (generatePrd in discovery.functions.ts)
   - Check if prd row carries ANY opportunity_id
   - Check if missions carry prd_id or opportunity context
   - Check if changesets carry context beyond code diff
   - Check: does prds.body_md already contain evidence, or is it spec-only?

2. **Define evidence schema (per-surface):**
   - `PrdEvidenceContext` type: { opportunity_id?, title, problem, key_signals[], critic_verdict }
   - Store in: `prds.context` JSON column (create via migration if not present)
   - Written at: spec creation (generatePrd)
   - Read at: Plan (show evidence), Build (reference in mission detail), Ship (release notes)

3. **Carry evidence from opportunity → prd:**
   - Modify `generatePrd` (discovery.functions.ts, ~line 119) to capture:
     - The originating opportunity's id, title, problem
     - Link to the Critic review that justified the spec
     - Top 3-5 signals that drove the opportunity ranking
   - Store as `prd_evidence_context` JSON on the spec
   - Write lineage edge: opportunity → prd with relation="evidenced"

4. **Expose evidence on Plan surface:**
   - File: `src/routes/_authenticated.plan.spec.$id.tsx`
   - Add "Evidence" block showing: opportunity title, problem, key signals, verdict
   - Query: read prd.context or re-fetch opportunity if needed
   - Design: "Why this spec exists" section, mirrored from Decide

5. **Expose evidence on Build surface:**
   - File: `src/routes/_authenticated.build.$missionId.tsx`
   - Add "Context" block showing: spec's evidence context
   - Query: walk mission ← prd, read prd.context
   - Design: "What we're solving" brief, one-line summary

6. **Expose evidence on Ship/Release surface:**
   - File: `src/routes/_authenticated.ship.tsx` or release detail
   - When showing release notes, include: "Shipped to resolve: [opportunity title]"
   - Query: trace release → changeset → mission → prd → opportunity
   - Link: make opportunity clickable

**Testing:**
- Unit test: evidence capture at spec creation
- Integration: create opportunity with evidence → draft spec → check context flows through
- Verify: Plan surface shows evidence
- Verify: Build surface can cite the opportunity
- Verify: Ship surface references decision in release notes

**Files to change (foundation layer):**
- `src/lib/discovery.functions.ts` (modify generatePrd to capture evidence)
- `src/lib/opportunity-trace.functions.ts` (add getEvidenceForSpec, etc.)
- Schema: may need a migration to add `prds.context` JSON column (optional, can store in temp table)
- `src/routes/_authenticated.plan.spec.$id.tsx` (add evidence block)
- `src/routes/_authenticated.build.*.tsx` (add context block)
- `src/routes/_authenticated.ship.tsx` (add opportunity reference)

**Effort:** 3-4 hours (foundation) + 2-3 hours (surface wiring) = 5-7 hours total | **Risk:** Medium (touches spec generation, audit required first)

---

## Sequencing & Effort Estimate

**Total: 11-15 hours over 2-3 days**

### Day 1 (5-6 hours)
- Gap 1: Critic Verdict Prominence (2-3 hours)
  - Build VerdictBadge component
  - Wire into Decide Gate
  - Test
- Gap 2.1: Origin Links foundation (3-4 hours)
  - Build opportunity-trace functions
  - Test lineage walking
  - Add to Plan surface

### Day 2 (4-5 hours)
- Gap 2.2: Origin Links surfaces (2-3 hours)
  - Wire Build surface
  - Wire Ship surface
  - Test chains
- Gap 3.1: Evidence Continuity discovery + foundation (2-3 hours)
  - Audit current prd generation
  - Design evidence schema
  - Modify generatePrd

### Day 3 (2-4 hours) (optional / ongoing)
- Gap 3.2: Evidence wiring on surfaces (2-3 hours)
  - Plan evidence block
  - Build context block
  - Ship reference
- Polish & testing (1-2 hours)

---

## Key Questions Before Starting

1. **Critic Verdict:** Should it appear in the Gate headline, in CtxRow, or as a separate Ember-colored line? (Founder taste call)

2. **Origin Links:** When a user clicks an opportunity title in Plan/Build/Ship, should it navigate to Decide or just open a detail sheet in-place?

3. **Evidence Continuity:** Should `prds.body_md` already contain the evidence summary, or should it be a separate `prds.context` JSON field? (This affects whether generatePrd writes body_md differently)

4. **Optional optimization:** Should missions and changesets cache `opportunity_id` in a denormalized column, or is the lineage walk acceptable for read performance? (Affects DB schema, but not required for launch)

---

## Implementation Notes

- **No breaking changes:** All three gaps add data flows; nothing removes or changes existing writes.
- **Graceful degradation:** If evidence is missing or lineage is broken, surfaces show empty states rather than errors.
- **Lineage integrity:** The artifact_lineage table is already the system of record (see lineage.functions.ts); these gaps consume it correctly.
- **Tests required:** Each gap needs 2-3 integration tests to prove the chain works end-to-end.
- **Launch readiness:** All three must be tested in production data before launch; demo/staging alone won't catch real-world lineage gaps.

---

## Reference Implementations (existing patterns)

Look at these files for precedent:
- `src/lib/lineage.functions.ts` — how to walk artifact_lineage safely
- `src/lib/trust-chain.functions.ts` — chain assembly pattern (mission chain walk)
- `src/routes/_authenticated.decide.tsx` — precedent display pattern (lines 344-356)
- `src/components/discover/OpportunityDetailSheet.tsx` — evidence/verdict display pattern
- `src/lib/opportunity-trace.functions.ts` (to be created) — new seam for traceback queries

---

## Success Criteria

- [ ] Critic verdict visible on Decide surface without opening detail sheet
- [ ] Origin opportunity traceable from Plan surface (with link)
- [ ] Origin opportunity traceable from Build surface (with link)
- [ ] Origin opportunity displayed on Ship surface (with link)
- [ ] Evidence carries forward from Decide → Plan → Build → Ship
- [ ] All three gaps work in production with real data (not just demo)
- [ ] Graceful empty states when lineage is incomplete
- [ ] No performance regression (lineage walks are < 100ms)
- [ ] Tests pass: tsc 0, bun test green, build succeeds


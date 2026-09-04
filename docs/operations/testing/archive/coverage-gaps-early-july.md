# Test Coverage Gaps Analysis

> _Created: 2026-08-04 · Last updated: 2026-08-04_

**Date**: 2026-07-11  
**Audit Run**: Coverage audit batch 2 + comprehensive follow-up  
**Status**: 3 critical + 2 high-priority gaps identified with test skeletons

---

## Critical Gaps (Action Required)

### 1. FigmaEmbed Round-Trip Persistence via TipTap Editor

**File**: `src/components/cadence/editor/FigmaEmbed.test.ts`  
**Status**: ⚠️ CRITICAL — Round-trip data loss risk  
**Root Cause**: The `parseHTML` extraction of `src` from nested iframe is unit-tested in isolation but never validated through a real TipTap Editor save-serialize-parse cycle.

**Risk**:

- User saves a Figma design embed in the editor
- Document serializes to HTML
- User reloads or shares the document
- The iframe src is lost due to `parseHTML` bug
- The embedded design disappears

**Test Skeleton**: Added to `FigmaEmbed.test.ts` (lines 350+)  
**Recommended Tests**:

- Full round-trip: insert → serialize → parse → verify src
- Edge case: iframe with empty src
- Edge case: div[data-figma-embed] with no iframe child
- Complex URLs: proto mode with node-id and scaling params

**Implementation Effort**: ~60 minutes (requires Editor setup + TipTap imports)  
**Owner**: @builder (part of FigmaEmbed feature)

---

### 2. ranking.nextActionFor Verdict Differentiation

**File**: `src/components/discover/ranking.test.ts`  
**Status**: ⚠️ CRITICAL — Silent functional bug  
**Root Cause**: Function returns "Draft the spec" for SHIP, WATCH, REVISE, and KILL all equally (lines 187–192).

**Risk**:

- User sees identical action recommendation for rejected bets (KILL) and endorsed ones (SHIP)
- Unclear whether bet should be built, fixed, or abandoned
- Agent cannot distinguish actionable verdicts (REVISE = fixable) from terminal ones (KILL = not fixable)

**Current Behavior**:

```typescript
function nextActionFor(opp: RankableOpportunity): string {
  const verdict = verdictFor(opp);
  if (verdict === "PENDING") return "Challenge with the Critic first";
  if (opp.status === "shipped") return "Review the outcome";
  return "Draft the spec"; // ← BUG: All other verdicts collapse here
}
```

**Expected Behavior**:

- PENDING → "Challenge with the Critic first" ✓ (correct)
- REVISE → "Address the Critic's feedback" (fixable)
- KILL → "Understand why this was rejected" (not fixable)
- SHIP → "Start building" or "Begin execution"
- WATCH → "Monitor and validate"
- shipped → "Review the outcome" ✓ (correct)

**Test Skeleton**: Added to `ranking.test.ts` (lines 556+)  
**Recommended Tests**:

- REVISE: actionable feedback distinct from KILL
- KILL: rejection clarity distinct from REVISE
- SHIP: execution action distinct from PENDING (needs validation)
- WATCH: monitoring action distinct from SHIP/PENDING
- Comprehensive: all 5 verdicts return unique actions

**Implementation Effort**: ~30 minutes (fix logic + add 5 test cases)  
**Owner**: @builder (part of Discover ranking feature)

---

### 3. Duplicate Test Suite Consolidation

**Files**:

- `src/components/knowledge/graph-visual.test.ts` + `__tests__/graph-visual.test.ts`
- `src/components/knowledge/ship-format.test.ts` + `__tests__/ship-format.test.ts`

**Status**: MEDIUM — Maintenance burden, test divergence risk  
**Root Cause**: Migration from `__tests__/` convention (Jest) to co-located `*.test.ts` (Bun) resulted in duplicates.

**Impact**:

- Two test files test identical functions
- Changes must be made twice (or forgotten once)
- Over time, suites may diverge
- Wastes CI/local test cycles

**Consolidation Guide**: Created in `docs/operations/testing/duplicate-test-consolidation.md`

**Runbook**:

1. Audit both files for unique test cases
2. Port any unique high-value cases to the canonical `*.test.ts`
3. Delete the `__tests__/` duplicate
4. Verify test pass
5. Commit with clear message

**Implementation Effort**: ~20 minutes per module (audit + consolidate + verify)  
**Owner**: @builder (maintenance task)

---

## High-Priority Gaps (Recommend Addressing)

### 4. Signal Body Humanization Edge Cases (format.ts)

**File**: `src/components/discover/format.ts` + `format.test.ts`  
**Status**: MEDIUM — Good coverage, but edge cases remain  
**Functions Tested**:

- `relTimeCaps()` ✓ (well-covered: past/future/malformed)
- `latestIso()` ✓ (well-covered: null/blank/malformed)
- `traceRef()` ✓ (well-covered: first 6 chars uppercase)
- `verdictFor()` ✓ (well-covered: critic precedence + status mapping)
- `signalPreview()` ✓ (extensive: 680 lines, JSON parsing, markdown stripping, URL cleanup, truncation)
- `signalCleanBody()` ✓ (extensive: JSON extraction, markdown, whitespace, paragraph breaks)
- `signalHasRaw()` ✓ (tested: comparison logic)

**Remaining Edge Cases** (low priority, but worth documenting):

- signalPreview with extremely nested JSON (>4 depth) — should fall back to raw
- signalPreview with circular references in JSON — should not crash
- signalCleanBody with malformed markdown (unclosed brackets) — should degrade gracefully
- signalPreview with URLs that have fragments (#) and trailing whitespace

**Test Skeleton**: Already mostly covered; add 2-3 additional edge case tests to `format.test.ts`  
**Implementation Effort**: ~15 minutes

**Owner**: Optional (coverage is already ~95% on these functions)

---

### 5. ResearchActivity Component Edge Cases (ResearchActivity.tsx)

**File**: `src/components/chat/ResearchActivity.tsx` + `.test.ts`  
**Status**: MEDIUM — Core logic tested, UI integration gaps  
**Functions Tested**:

- `parseResearchStatus()` ✓ (well-covered: valid/invalid payloads, null, missing fields)
- `summarySegments()` ✓ (well-covered: zero/positive counts, workspace boolean)

**Remaining Edge Cases**:

- `ResearchActivityLine` component: Does the spinner render when statuses is non-empty?
- `ResearchActivityLine` component: Does the label truncate correctly at 420px maxWidth?
- `ResearchSummaryRow` component: Does it render nothing when research.mode === "chat"?
- `ResearchSummaryRow` component: Does it count web sources correctly (kind === "web")?
- Cross-workspace detection: Does it correctly identify internal/both/workspace sources?

**Test Skeleton**: Component tests require RTL or direct JSX inspection  
**Implementation Effort**: ~30 minutes (requires RTL setup or component test pattern)

**Owner**: Optional (core parsing logic is solid; UI rendering is secondary)

---

## Low-Priority Gaps (Already Well-Tested)

### ✓ decisions-shared.ts

- `ageOf()` — fully tested (buckets, malformed, future)
- `hasSource()` — fully tested (all three source types)
- `displayWho()` — fully tested (null, legacy "builder" rename, pass-through)

### ✓ design-memory-shared.ts

- All vocabulary mappings tested

### ✓ incident-format.ts

- `incidentRealId()` — fully tested
- `incidentTraceRef()` — fully tested
- `incidentTone()` — fully tested

### ✓ ship-format.ts (module-level)

- `relTime()` — fully tested (all buckets, malformed)
- `fmtUsd()` — fully tested (precision, edge values)
- ⚠️ Duplicate test suite exists (consolidation only)

### ✓ graph-visual.ts (module-level)

- All exports tested (kindVisual, kindLabel, kindCssColor, etc.)
- ⚠️ Duplicate test suite exists (consolidation only)

---

## Consolidation & Implementation Roadmap

| Priority | Item | Effort | Status |
| --- | --- | --- | --- |
| **CRITICAL** | FigmaEmbed round-trip test skeleton | 60m | Added `.skip` test suite in FigmaEmbed.test.ts |
| **CRITICAL** | ranking.nextActionFor fix + tests | 30m | Added `.skip` test suite in ranking.test.ts |
| **HIGH** | Consolidate graph-visual test suites | 20m | Runbook in `duplicate-test-consolidation.md` |
| **HIGH** | Consolidate ship-format test suites | 20m | Runbook in `duplicate-test-consolidation.md` |
| **MEDIUM** | signal humanization edge cases | 15m | Optional enhancement |
| **MEDIUM** | ResearchActivity component tests | 30m | Optional enhancement |

---

## Running the Test Suites

### Run all tests

```bash
bun test
```

### Run specific module tests

```bash
# FigmaEmbed (once round-trip skeleton is implemented, remove `.skip`)
bun test src/components/cadence/editor/FigmaEmbed.test.ts

# ranking (once nextActionFor fix is implemented, remove `.skip`)
bun test src/components/discover/ranking.test.ts

# Format (signal humanization)
bun test src/components/discover/format.test.ts

# Consolidation target (after duplicate removal)
bun test src/components/knowledge/graph-visual.test.ts
bun test src/components/knowledge/ship-format.test.ts
```

### Watch mode for development

```bash
bun test --watch src/components/discover/ranking.test.ts
```

---

## Notes for the Builder

1. **Test skeleton pattern**: All added `.skip` test suites are documented with:
   - Description of what the test validates
   - Step-by-step TODO comments for implementation
   - Assertion targets and edge cases to consider
   - No actual implementation (yet) to avoid false passes

2. **Duplicate consolidation**: Before running the consolidation, manually audit both files to ensure unique high-value test cases are ported (not just deleted).

3. **nextActionFor fix**: The verdict differentiation fix will likely improve UX clarity for users and agents. Consider this when prioritizing vs. other build work.

4. **FigmaEmbed round-trip**: This is the highest-risk gap — data loss through a save-serialize-parse cycle could silently break user workflows.

---

## Audit Summary

**Functions examined**: 30+  
**Test suites reviewed**: 12  
**Duplicate suites found**: 2  
**Critical gaps found**: 2  
**High-priority gaps found**: 2  
**Well-tested modules**: 8

**Coverage estimate**: ~92% of tested paths; 5–8% of edge cases and integration scenarios uncovered.

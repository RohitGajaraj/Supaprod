# Duplicate Test Suite Consolidation

> _Created: 2026-08-04 · Last updated: 2026-08-04_

**Status**: Identified during coverage audit 2026-07-09, pending consolidation  
**Impact**: Medium — Two test files test the same functions, creating maintenance burden and potential divergence

## Overview

Two modules have duplicate test suites in separate locations, with minor wording/assertion differences:

### 1. graph-visual (priority: HIGH)

- **Source file**: `src/components/knowledge/graph-visual.ts` (147 lines)
- **Test file A**: `src/components/knowledge/graph-visual.test.ts` (~280 lines)
- **Test file B**: `src/components/knowledge/__tests__/graph-visual.test.ts` (~280 lines)
- **Difference**: Wording varies slightly in test descriptions; both test identical functions

**Functions under test**:

- `kindVisual()` — maps node kind to color/label
- `kindCssColor()` — returns CSS var with fallback
- `kindLabel()` — extracts label from visual
- `kindTracePrefix()` — generates 3-letter trace prefix
- `nodeRadius()` — computes node size from influence
- `truncateTitle()` — shortens titles with ellipsis
- `computeReducedMotion()` — logic for motion preferences (pure, testable)
- `usePrefersReducedMotion()` — React hook (requires RTL or hook-testing setup)

**Consolidation task**:

1. **Audit both test files** — identify unique test cases in each (if any)
2. **Port unique cases** to one canonical test file (recommend `*.test.ts` over `__tests__/`)
3. **Delete the duplicate** (`__tests__/graph-visual.test.ts`)
4. **Verify coverage** — `bun test src/components/knowledge/graph-visual.test.ts`

### 2. ship-format (priority: MEDIUM)

- **Source file**: `src/components/knowledge/ship-format.ts` (24 lines, only 2 functions)
- **Test file A**: `src/components/knowledge/ship-format.test.ts` (~60 lines)
- **Test file B**: `src/components/knowledge/__tests__/ship-format.test.ts` (~65 lines)
- **Difference**: Test descriptions and assertion style vary slightly

**Functions under test**:

- `relTime()` — formats ISO timestamp to relative time (e.g., "3d", "1h", "now", or "Jan 5")
- `fmtUsd()` — formats number to USD string with 2-4 decimal places

**Consolidation task**:

1. **Audit both test files** — check edge cases (empty input, NaN, extreme values, precision)
2. **Port unique cases** to one canonical test file (recommend `*.test.ts`)
3. **Delete the duplicate** (`__tests__/ship-format.test.ts`)
4. **Verify coverage** — `bun test src/components/knowledge/ship-format.test.ts`

---

## Why This Happened

This repo evolved through multiple refactoring phases:

- Initially, `__tests__/` subdirectories were used (Jest convention)
- Later, the project migrated to co-located `*.test.ts` files (modern Bun convention)
- Both patterns remain; some modules have both, causing duplication

## Consolidation Process (Runbook)

For each duplicate module:

### Step 1: Audit

```bash
# Open both test files side-by-side
code src/components/knowledge/graph-visual.test.ts
code src/components/knowledge/__tests__/graph-visual.test.ts

# Check for unique test cases (use git diff or manual comparison)
# Look for: test("...") that exists in one file but not the other
```

### Step 2: Port Unique Cases

```bash
# If there are unique high-value test cases in the duplicate file:
# - Copy them to the canonical file
# - Verify they still pass: bun test src/components/knowledge/graph-visual.test.ts
# - Commit with message: "feat: consolidate duplicate graph-visual test suites; port unique edge cases"
```

### Step 3: Delete Duplicate

```bash
# Remove the __tests__/ version
git rm src/components/knowledge/__tests__/graph-visual.test.ts

# Verify build & tests still pass
bun run build
bun test src/components/knowledge/graph-visual.test.ts

# Commit: "refactor: remove duplicate graph-visual.test.ts (consolidated into *.test.ts)"
```

### Step 4: Verify Coverage

```bash
# After consolidation, run the full test suite to confirm no regressions
bun test src/components/knowledge/

# Or, test just the module
bun test src/components/knowledge/graph-visual.test.ts
```

---

## Quick Checklist

**graph-visual consolidation**:

- [ ] Audit both test files for unique cases
- [ ] Port any unique high-value cases to the canonical file
- [ ] Delete `src/components/knowledge/__tests__/graph-visual.test.ts`
- [ ] Run `bun test` to confirm no regressions
- [ ] Commit with clear message

**ship-format consolidation**:

- [ ] Audit both test files for unique cases
- [ ] Port any unique high-value cases to the canonical file
- [ ] Delete `src/components/knowledge/__tests__/ship-format.test.ts`
- [ ] Run `bun test` to confirm no regressions
- [ ] Commit with clear message

---

## Why This Matters

1. **Maintenance burden**: Two identical tests mean changes are made twice (or forgotten once)
2. **Test divergence**: Over time, one suite might gain coverage the other lacks
3. **Execution time**: Running duplicate tests wastes CI/local test cycles
4. **Clarity**: New contributors may not know which file to modify

By consolidating to a single canonical test file, we:

- Ensure consistent coverage across the codebase
- Reduce maintenance surface area
- Speed up test execution
- Make patterns clearer for future contributors

---

## Related Items

- **Coverage audit 2026-07-09**: Identified these duplicates
- **Architecture principle**: Prefer co-located `*.test.ts` over `__tests__/` subdirectories (Bun convention)
- **Build config**: `bunfig.toml` – test runner configuration

# Test Patterns & Conventions

> _Created: 2026-08-04 · Last updated: 2026-08-04_

**Reference guide for implementing test skeletons in the Supaprod codebase**

---

## 1. Pure Function Testing (No React)

### Pattern: Standalone function testing with bun:test

```typescript
import { describe, expect, test } from "bun:test";
import { myFunction } from "./my-module";

describe("myFunction", () => {
  test("returns expected value for valid input", () => {
    const result = myFunction("input");
    expect(result).toBe("output");
  });

  test("handles edge case: empty string", () => {
    const result = myFunction("");
    expect(result).toBe("");
  });

  test("handles edge case: malformed input", () => {
    const result = myFunction("not-a-valid-format");
    expect(result).not.toThrow();
    // Assertion depends on spec: does it fallback, return null, or the raw input?
  });
});
```

**Used in**:

- `format.ts` (signal humanization, time formatting)
- `ranking.ts` (opportunity ranking, designation logic)
- `ship-format.ts` (time/currency formatting)
- `graph-visual.ts` (color mapping, prefix generation)

---

## 2. Component Testing via Direct Invocation

### Pattern: Call React component as a function, inspect returned JSX

```typescript
// From ResearchActivity.test.ts
import { ResearchActivityLine } from "./ResearchActivity";

test("renders spinner when statuses is non-empty", () => {
  const statuses = [{ phase: "search" as const, label: "Searching..." }];
  const result = ResearchActivityLine({ statuses });

  // Inspect the JSX object structure
  expect(result).toBeDefined();
  expect(result?.type).toBe("div"); // The wrapper div
  expect(result?.props.className).toContain("fade-up");

  // Find the spinner within children
  const children = result?.props.children;
  // Spinner is typically a child span with className="spinner"
  const hasSpinner =
    Array.isArray(children) && children.some((child: any) => child?.props?.className === "spinner");
  expect(hasSpinner).toBe(true);
});

test("returns null when statuses is empty", () => {
  const result = ResearchActivityLine({ statuses: [] });
  expect(result).toBeNull();
});
```

**Pattern notes**:

- Call component as a function: `Component({ props })`
- Inspect returned JSX object (not DOM)
- Check `.type`, `.props`, `.children`
- No RTL or DOM rendering needed (faster, pure)

**Used in**:

- `ResearchActivity.test.ts` (ResearchActivityLine, ResearchSummaryRow)

---

## 3. Hook Testing (if needed)

### Pattern: Use @testing-library/react for hook testing

```typescript
import { renderHook } from "@testing-library/react";
import { usePrefersReducedMotion } from "./graph-visual";

test("usePrefersReducedMotion returns false on mount (SSR-safe)", () => {
  const { result } = renderHook(() => usePrefersReducedMotion());
  expect(result.current).toBe(false);
});

test("usePrefersReducedMotion responds to OS preference change", async () => {
  // Requires setting up matchMedia mock
  // See: https://testing-library.com/docs/queries/
});
```

**Note**: The codebase uses RTL but sparingly. Most test logic is pure functions.

---

## 4. Fixture Builders

### Pattern: Factory function for test data

```typescript
import type { RankableOpportunity } from "./ranking";

function mk(over: Partial<RankableOpportunity> & { id: string }): RankableOpportunity {
  return {
    ice_score: 5,
    confidence: 5,
    impact: 5,
    ease: 5,
    created_at: "2026-01-01T00:00:00Z",
    status: "backlog",
    critic_review: null,
    ...over, // Override defaults with test-specific values
  };
}

test("higher ice_score ranks first", () => {
  const a = mk({ id: "a", ice_score: 8 });
  const b = mk({ id: "b", ice_score: 3 });
  // Both have all other fields equal; only ice differs
  expect(rank([b, a])[0].opp.id).toBe("a");
});
```

**Benefits**:

- One place to define defaults (reduces duplication)
- Tests read clearly (what's varied is explicit)
- Easy to update if the type changes

**Used in**:

- `ranking.test.ts` (mk fixture builder)
- `format.test.ts` (payload builders)
- `decisions-shared.test.ts` (base fixture with spread override)

---

## 5. Critic/Verdict Test Data

### Pattern: Helper for critic review fixtures

```typescript
function critic(verdict: "ship" | "revise" | "kill"): CriticReview {
  return {
    verdict,
    summary: "",
    risks: [],
    kill_criteria: [],
    missing_evidence: [],
    confidence: 0,
    reviewer_model: "test",
    reviewed_at: "2026-01-01T00:00:00Z",
  };
}

test("critic verdict takes precedence over status", () => {
  const opp = mk({
    id: "test",
    status: "backlog",
    critic_review: critic("ship"),
  });
  expect(verdictFor(opp)).toBe("SHIP");
});
```

**Used in**:

- `ranking.test.ts` (verdict tie-breaking tests)
- `format.test.ts` (verdict for input mapping)

---

## 6. Time-Sensitive Testing

### Pattern: Relative timestamps without hardcoding

```typescript
test("ageOf: 3 hours ago", () => {
  const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
  expect(ageOf(iso)).toBe("3h ago");
});

test("ageOf: future timestamp doesn't go negative", () => {
  const iso = new Date(Date.now() + 60_000).toISOString();
  expect(ageOf(iso)).toBe("now");
});
```

**Avoid**: `new Date("2026-01-01")` unless testing a specific fixed date

**Used in**:

- `decisions-shared.test.ts` (ageOf time buckets)
- `format.test.ts` (relTimeCaps buckets)

---

## 7. Error Handling & Fallback Testing

### Pattern: Malformed input should not crash

```typescript
test("malformed ISO timestamp returns empty string", () => {
  expect(relTimeCaps("not-a-date")).toBe("");
});

test("malformed ISO timestamp in latestIso is skipped", () => {
  const latest = latestIso(["2026-01-01T00:00:00Z", "garbage", "2026-06-01T00:00:00Z"]);
  expect(latest).toBe("2026-06-01T00:00:00Z");
});

test("NaN age falls back to empty string (guard against 'Invalid Date' rendering)", () => {
  const result = ageOf("not-a-valid-timestamp");
  expect(result).not.toContain("Invalid");
  expect(result).toBe("");
});
```

**Pattern**: Error cases should degrade gracefully, never crash or render invalid content.

**Used in**:

- `format.test.ts` (withTimeout, malformed URLs)
- `decisions-shared.test.ts` (malformed timestamps)

---

## 8. String/Enum Mapping Testing

### Pattern: Map entries should cover all cases

```typescript
describe("SOURCE_LABEL mapping", () => {
  test("all DecisionSource values have a label", () => {
    const allSources: DecisionSource[] = ["mission", "prd", "meeting", "manual"];
    for (const source of allSources) {
      expect(SOURCE_LABEL[source]).toBeDefined();
      expect(typeof SOURCE_LABEL[source]).toBe("string");
    }
  });
});

describe("STATUS_TONE mapping", () => {
  test("all DecisionRow statuses have a tone", () => {
    const allStatuses: DecisionRow["status"][] = ["approved", "rejected", "pending"];
    for (const status of allStatuses) {
      expect(STATUS_TONE[status]).toBeDefined();
    }
  });
});
```

**Pattern**: Ensures no missing enum entries (compile-time via TS, but runtime test confirms).

**Used in**:

- `decisions-shared.ts` vocabulary mappings

---

## 9. Deterministic Order Testing

### Pattern: Verify stable, reproducible ordering

```typescript
test("rankOpportunities returns deterministic order (stable sort)", () => {
  const opps = [
    mk({ id: "c", ice_score: 5 }),
    mk({ id: "a", ice_score: 5 }),
    mk({ id: "b", ice_score: 5 }),
  ];

  const order1 = rankOpportunities(opps, () => 0).map((r) => r.opp.id);
  const order2 = rankOpportunities(opps, () => 0).map((r) => r.opp.id);

  expect(order1).toEqual(order2); // Same order every time
  expect(order1).toEqual(["a", "b", "c"]); // Alphabetical finalizer
});
```

**Pattern**: Pure functions should return the same result every time.

**Used in**:

- `ranking.test.ts` (compareOpportunities tie-breaks)

---

## 10. Skipped Tests (`.skip`)

### Pattern: Document missing tests without failing the suite

```typescript
// This test is not yet implemented, but the skeleton documents what should be tested
describe.skip("parseHTML round-trip via TipTap Editor (CRITICAL GAP)", () => {
  test("preserves figmaEmbed node src through HTML serialization", () => {
    // TODO: Implement round-trip test
    // 1. Create Editor with FigmaEmbed
    // 2. Insert figmaEmbed node
    // 3. Serialize to HTML
    // 4. Parse HTML back
    // 5. Verify src attribute is preserved
  });
});
```

**Pattern**:

- Use `.skip` to prevent false passes
- Include clear TODO comments
- Document assertion targets
- Reference related issues/decisions

**Used in**:

- This audit's new test skeletons

---

## 11. Assertion Matchers Cheat Sheet

```typescript
expect(value).toBe(exact); // Strict equality
expect(value).toEqual(object); // Deep equality
expect(value).not.toBe(exact); // Negation
expect(fn).toThrow(); // Throws an error
expect(fn).not.toThrow(); // Does not throw
expect(string).toContain("substring"); // String includes
expect(array).toHaveLength(n); // Array length
expect(num).toBeGreaterThan(10); // Numeric comparison
expect(num).toBeGreaterThanOrEqual(10);
expect(result).toBeDefined(); // Not undefined
expect(result).not.toBeDefined(); // Is undefined
```

**Bun uses Jest-compatible matchers**. See: https://docs.getterms.dev/docs/bun/test

---

## 12. Running Tests

```bash
# All tests
bun test

# Specific file
bun test src/components/discover/ranking.test.ts

# Watch mode (re-runs on file change)
bun test --watch src/components/discover/ranking.test.ts

# Pattern matching
bun test --grep "nextActionFor"

# Verbose output
bun test --verbose

# Filter out .skip tests (to find unskipped tests)
# Note: bun test does not have a built-in flag; use grep:
bun test --grep "not skip" # or run specific suites
```

---

## 13. File Organization

```
src/components/discover/
├── ranking.ts               # Source file
├── ranking.test.ts          # Test file (co-located, canonical)
└── __tests__/               # OLD: Deprecated pattern (consolidate away)
    └── ranking.test.ts      # Duplicate (to be removed)
```

**Convention**: Prefer `*.test.ts` co-located with source (Bun convention).  
**Anti-pattern**: `__tests__/` subdirectories (Jest convention, causes duplication).

---

## 14. Test Naming Guidelines

✅ **Good**:

```typescript
test("ageOf returns '3h ago' for a timestamp 3 hours in the past");
test("nextActionFor returns 'Draft the spec' for SHIP verdict with backlog status");
test("verdictFor prefers critic verdict over status mapping");
```

❌ **Bad**:

```typescript
test("it works");
test("test ageOf function");
test("various inputs");
```

**Pattern**: Describe the input and expected output; read like a specification.

---

## 15. Coverage Tooling

```bash
# Bun doesn't have built-in coverage yet, but can use:
# 1. Comment-based tracking (manual)
# 2. External tools (c8, nyc)
# 3. Test suite review + visual audit

# For now: Run tests frequently and manually audit untested paths
bun test --reporter=spec  # Detailed output per test
```

---

## Summary

| Pattern | Files | Use Case |
| --- | --- | --- |
| Pure function testing | format, ranking, ship-format | Most common; no dependencies |
| Component via invocation | ResearchActivity | JSX inspection without RTL |
| Fixture builders | ranking, format | Reduce duplication in test data |
| Hook testing (RTL) | graph-visual | React hooks with side effects |
| Relative timestamps | decisions-shared, format | Time-sensitive logic |
| Error/fallback testing | format, ranking | Graceful degradation |
| Enum coverage | decisions-shared | All cases mapped |
| Deterministic order | ranking | Reproducible results |
| Skipped test skeletons | This audit | Document gaps without false passes |

---

**Next step**: Implement the test skeletons using these patterns as reference. Start with FigmaEmbed round-trip (highest risk) and ranking.nextActionFor differentiation (highest impact).

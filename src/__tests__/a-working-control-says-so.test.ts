import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * "UNAVAILABLE" AND "WORKING ON IT" ARE DIFFERENT FACTS, AND ONE CONTROL SAID
 * ONLY THE FIRST.
 *
 * THE DEFECT, counted 2026-08-21. `Action` and `Approve` are the two controls
 * in Meridian, and 196 call sites disabled themselves on a pending flag while a
 * mutation was in flight. Not one announced it. A screen reader therefore heard
 * "unavailable" for the entire round trip of every mutation in the product --
 * every save, every approve, every promote -- and "unavailable" is the wrong
 * fact: the control is not unavailable, it is busy, and the difference is
 * whether a person should wait or go away.
 *
 * WHY IT COULD NOT BE DERIVED FROM `disabled`, which is the reason `busy` had to
 * exist as its own prop. Of those 196, **70 are mixed**: `disabled={!dirty ||
 * save.isPending}` is disabled because there is nothing to save OR because it is
 * saving, and only the second half is busy. A component cannot tell which term
 * fired. So the caller says it, and this guard can only police the half where
 * there is nothing to judge.
 *
 * WHAT THIS GUARD FORBIDS, and it is deliberately narrow: a bare pending
 * reference as the WHOLE of `disabled`. `disabled={save.isPending}` says less
 * than it knows, and `busy={save.isPending}` says the same thing plus the
 * announcement, because `busy` implies `disabled`. There is no case where the
 * first is preferable, so it is the one shape a test can rule on.
 *
 * WHAT IT DELIBERATELY PERMITS. Every compound expression, because each one is a
 * per-site judgement about which term means "not allowed": those want
 * `busy={mut.isPending}` ALONGSIDE the `disabled` they already have, and which
 * clause to split is a reading of the surface rather than a rule.
 *
 * NOTHING ELSE COULD CATCH THIS. `disabled={x.isPending}` is correct TypeScript,
 * correct React and correct HTML. It renders, it typechecks, and the control
 * does go dead while the work runs. The only thing wrong with it is a fact it
 * declines to state, and an omission is invisible in a diff of one file. It took
 * counting 196 of them across two directories to see the shape at all.
 */

const ROOT = join(import.meta.dir, "..", "..");
const SRC = join(ROOT, "src");

/** The two Meridian controls that carry `busy`. */
const CONTROLS = /<(Action|Approve)\b/g;

/**
 * A term that names WORK IN FLIGHT rather than permission.
 *
 * Matched against the whole expression, so `save.isPending` qualifies and
 * `!canSave` does not. `busy` and `pending` are included as bare identifiers
 * because that is what a caller names a locally aggregated pending flag, and
 * every one of them was read at migration time to confirm it holds only pending
 * terms.
 */
const PENDING = /^[\w$]*(isPending|pending|loading|saving|busy|acting|submitting|drafting|deciding|checking|revoking)[\w$]*$/i;

/** Every `.tsx` under `src`, skipping tests and the file that declares the props. */
function surfaces(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      surfaces(full, out);
      continue;
    }
    if (!e.name.endsWith(".tsx")) continue;
    if (/\.test\.tsx$/.test(e.name)) continue;
    // `surface-parts.tsx` DECLARES `busy` and destructures `disabled`, so its own
    // source is not a call site and would read as one.
    if (e.name === "surface-parts.tsx") continue;
    out.push(full);
  }
  return out;
}

/**
 * The opening tags of every `Action`/`Approve` in a file.
 *
 * Braces are COUNTED rather than matched by regex, because a prop can hold a
 * nested element (`trailing={<Action .../>}`) and a lazy regex stops at the
 * first `>` it meets, which in practice is inside the nested tag. The first
 * version of this reader did exactly that and reported the inner control's
 * attributes against the outer one.
 */
function controlTags(src: string): { tag: string; line: number }[] {
  const out: { tag: string; line: number }[] = [];
  for (const m of src.matchAll(CONTROLS)) {
    let i = m.index + m[0].length;
    let depth = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
      i++;
    }
    out.push({ tag: src.slice(m.index, i), line: src.slice(0, m.index).split("\n").length });
  }
  return out;
}

/** `disabled={...}` on this tag, or null. Inner-brace-free, so a nested element
 *  in another prop cannot be mistaken for this one's value. */
function disabledExpr(tag: string): string | null {
  const m = tag.match(/\bdisabled=\{([^{}]*)\}/);
  return m ? m[1].trim() : null;
}

describe("a control that is working says so, rather than only going dead", () => {
  const offenders: string[] = [];
  let sitesWithBusy = 0;
  let sitesWithCompoundDisabled = 0;

  for (const file of surfaces(SRC)) {
    const src = readFileSync(file, "utf8");
    for (const { tag, line } of controlTags(src)) {
      if (/(?<!aria-)\bbusy=\{/.test(tag)) sitesWithBusy++;
      const expr = disabledExpr(tag);
      if (expr === null) continue;
      const simple = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(expr);
      if (!simple) {
        sitesWithCompoundDisabled++;
        continue;
      }
      // A single reference that names work in flight. The whole of `disabled`,
      // so there is no second term to preserve and nothing to judge.
      if (!PENDING.test(expr.split(".").pop() ?? "") && !PENDING.test(expr)) continue;
      if (/(?<!aria-)\bbusy=\{/.test(tag)) continue;
      offenders.push(`${file.slice(ROOT.length + 1)}:${line} disabled={${expr}} should be busy={${expr}}`);
    }
  }

  it("no Action or Approve disables on a bare pending flag without announcing it", () => {
    // Sorted so a failure reads the same way twice and a diff is legible.
    expect(offenders.sort()).toEqual([]);
  });

  it("the scan found the real call sites, so this cannot pass by finding nothing", () => {
    // A guard whose inputs are empty is decoration. 161 sites carry `busy` after
    // the 2026-08-21 migration and 70 keep a compound `disabled` that is a
    // per-site judgement; both floors are well under those figures so ordinary
    // churn does not fail the test, and both are far enough above zero that a
    // broken reader cannot slip through.
    expect(sitesWithBusy).toBeGreaterThan(120);
    expect(sitesWithCompoundDisabled).toBeGreaterThan(40);
  });
});

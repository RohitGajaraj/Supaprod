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
const PENDING =
  /^[\w$]*(isPending|pending|loading|saving|busy|acting|submitting|drafting|deciding|checking|revoking)[\w$]*$/i;

/**
 * THE EXEMPTION REGISTER, each entry carrying why `busy` would be the false
 * fact. The header above claims "no case where the first is preferable"; that
 * held until answers/UL0-004 found one. A BYSTANDER control blocked while a
 * SIBLING's write runs does no work of its own: its handler is a synchronous
 * setPhase move. `busy` on it would announce "working on it" about a control
 * that is merely standing aside, which is exactly the inverse lie this guard
 * exists to prevent. For such controls `disabled` alone states the true fact:
 * clicking it right now is not allowed.
 *
 * Keyed by file and the exact bare expression, so a NEW distinct expression in
 * an exempted file still fails loudly and must earn its own entry with its own
 * reason.
 */
const EXEMPT: ReadonlyArray<{ file: string; expr: string; why: string }> = [
  {
    file: "src/components/brief/BriefFormationFlow.tsx",
    expr: "save.isPending",
    why: "Skip and the three Backs are bystanders blocked during Save-and-continue's versioned upsert; their handlers are synchronous setPhase moves, so busy would announce work they do not perform (answers/UL0-004 C-01 and C-03)",
  },
  {
    file: "src/components/prds/RewindButton.tsx",
    expr: "revert.isPending",
    why: "'Keep it as it is' is a bystander during 'Take it back'; its handler is a synchronous setOpen(false), so busy would announce work it does not do. The hand-rolled version this replaced carried busy on it, which is the inverse lie this guard exists to prevent, and it passed unnoticed because busy being PRESENT is all the scan can see. It stays disabled rather than losing the prop: revertPrdToPrevious is already in flight and nothing cancels it",
  },
  {
    file: "src/components/decisions/RewindButton.tsx",
    expr: "revert.isPending",
    why: "Cancel is a bystander during Revert's write; its handler is a synchronous setOpen(false), so busy would announce work it does not do. It stays DISABLED rather than losing the prop because revertDecisionToPrevious is already in flight and nothing cancels it, so a clickable Cancel would close the question while the revert lands anyway",
  },
  {
    file: "src/components/studio/RepoGateDialog.tsx",
    expr: "provision.isPending",
    why: "'Not now' and 'Connect a repo' are bystanders during 'Provision a starter repo'; both handlers are synchronous (onOpenChange, and onOpenChange + navigate), so busy would announce work neither performs. And Connect must stay DISABLED rather than lose the prop: provisionThenRetry re-runs the interrupted act on the surface that mounted this, and navigating to /sources mid-flight fires that retry at an unmounted caller",
  },
  {
    file: "src/components/track/ArtifactPane.tsx",
    expr: "del.isPending",
    why: "SignalCard's 'Keep it' is a bystander during its sibling 'Discard it for good'; its handler is a synchronous setConfirmingDiscard(false), so busy would announce work it does not do. And it must stay DISABLED rather than simply lose the prop: deleteSignal is already in flight by then and nothing cancels it, so a clickable 'Keep it' would close the question and let the row be deleted anyway, promising the one thing it cannot deliver",
  },
];

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
      // The register: a bystander control blocked during a sibling's write
      // states the true fact with `disabled` alone (answers/UL0-004 C-01).
      const rel = file.slice(ROOT.length + 1);
      if (EXEMPT.some((e) => e.file === rel && e.expr === expr)) continue;
      offenders.push(`${rel}:${line} disabled={${expr}} should be busy={${expr}}`);
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

/**
 * P-54 (A-QUEUE.md). A1, 22:09 IST, on the approvals page with the Ask panel
 * open: a sentence typed into what the browser reported as the panel's
 * textbox landed on the page's single-letter shortcuts instead (`a` approves,
 * `d` declines, `z` snoozes the item in front). The page settled four times
 * in three seconds, one real proposal moved to *now* on the demo roadmap
 * (restored by hand), and *What you settled* recorded three approvals and a
 * decline when one row actually changed.
 *
 * TWO SEPARATE DEFECTS, ONE INCIDENT:
 *
 *   1. AskPane is deliberately not a modal (no `role="dialog"`, no
 *      `aria-modal`, no scrim -- its own header says so), so `isModalOpen()`
 *      structurally can never see it open. The field-focus guard is the only
 *      thing standing between the panel and the page's shortcuts, and it only
 *      covers the instant focus sits inside an editable element. The fix is a
 *      third guard in the key handler: `ask.isOpen`.
 *
 *   2. Even guarded keys that DO reach a resolver were reported as settled
 *      regardless of whether anything actually changed. `resolveApproval`
 *      (tool_call) and `resolveAssumptionChallenge` both resolve a lost race
 *      -- the gate was already decided a moment earlier -- as `{ ok: true }`,
 *      which is correct (losing that race is not an error) but was
 *      indistinguishable from a real decision until `routeDecision` started
 *      returning whether a row changed.
 *
 * WHY TEXT-BASED FOR (1). This repo has no working precedent for mounting
 * `_authenticated.approvals.tsx` (Supabase singleton, Rule-14 mock-shadowing),
 * and `onKey` is a closure inside a `useEffect`, not an exported pure
 * function. `approvals-keys-stand-down.test.ts` already establishes reading
 * the handler's body as text, stripped of comments, and pinning statement
 * order by index; this file extends that same harness rather than inventing
 * a second one.
 *
 * WHY A REAL FUNCTION CALL FOR (2). `decideSettledLine` was pulled out of the
 * mutation's `onSuccess` specifically so this branch is testable without a
 * mutation, a query client or a mount -- the established pattern for a
 * route's pure decisions in this repo (`bindingDoorTarget`, `syncHeadline`).
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { decideSettledLine } from "../_authenticated.approvals";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

const ROUTE = join(import.meta.dir, "..", "_authenticated.approvals.tsx");

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

function keyHandlerBody(source: string): string {
  const start = source.indexOf("function onKey(e: KeyboardEvent) {");
  if (start === -1) throw new Error("the keydown handler is not named onKey any more");
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error("the keydown handler has no closing brace");
}

const RAW = readFileSync(ROUTE, "utf8");
const SOURCE = stripComments(RAW);
const BODY = keyHandlerBody(SOURCE);

describe("the approvals shortcuts stand down while Ask is open", () => {
  it("reads useAsk from the shared ask context, not a local reimplementation", () => {
    expect(RAW).toContain('import { useAsk } from "@/lib/ask-context";');
    expect(RAW).toContain("const ask = useAsk();");
  });

  it("a keydown with focus in a textarea does nothing: the ask.isOpen guard runs before any key is read", () => {
    expect(BODY).toContain("if (ask.isOpen) return;");
    // Before the field-focus check and before any e.key comparison, so a
    // keystroke that reaches this handler while Ask is open never falls
    // through to a shortcut on some technicality of what has focus.
    expect(BODY.indexOf("if (ask.isOpen) return;")).toBeLessThan(
      BODY.indexOf("/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;"),
    );
    expect(BODY.indexOf("if (ask.isOpen) return;")).toBeLessThan(BODY.indexOf("e.key ==="));
  });

  it("the effect re-subscribes when Ask opens or closes", () => {
    expect(SOURCE).toContain("[visibleItems, focusedId, decide, snooze, ask.isOpen]");
  });
});

describe("a settle whose write changes no row is not listed as settled", () => {
  const item: ApprovalQueueItem = {
    id: "queue-1",
    sourceId: "source-1",
    kindKey: "tool_call",
    title: "Run studio.pr.merge",
    timestamp: null,
  } as ApprovalQueueItem;

  it("a real decision keeps the verdict sentence", () => {
    const line = decideSettledLine({ item, verdict: "approve" }, true, "10:00 AM");
    expect(line.verb).toBe("You approved");
    expect(line.failed).toBeUndefined();
  });

  it("a press that changed nothing is never printed as a verdict", () => {
    const line = decideSettledLine({ item, verdict: "approve" }, false, "10:00 AM");
    expect(line.verb).not.toBe("You approved");
    expect(line.verb).not.toBe("You declined");
    expect(line.verb).toBe("Nothing changed");
    expect(line.consequence).toBe("This was already decided.");
    // A press that did nothing gets the failed shape, the same rule
    // SettledTrail already states: "never a success shape over a failed
    // write."
    expect(line.failed).toBe(true);
  });

  it("the same is true declining", () => {
    const line = decideSettledLine({ item, verdict: "reject" }, false, "10:00 AM");
    expect(line.verb).toBe("Nothing changed");
  });
});

describe("the server side of the fix: a lost race reports changed:false", () => {
  const SRC = readFileSync(
    join(import.meta.dir, "..", "..", "lib", "approvals-queue.functions.ts"),
    "utf8",
  );

  it("routeDecision returns whether a row actually changed, not void", () => {
    expect(SRC).toContain(
      "async function routeDecision(\n  db: SupabaseClient,\n  data: z.infer<typeof DecideSchema>,\n): Promise<boolean> {",
    );
  });

  it("the tool_call arm reads resolveApproval's already_decided flag rather than discarding it", () => {
    const start = SRC.indexOf('case "tool_call": {');
    const end = SRC.indexOf('case "decision": {');
    const arm = SRC.slice(start, end);
    expect(arm).toContain("return !res.already_decided;");
  });

  it("decideApprovalItem hands the flag to the client instead of a bare {ok:true}", () => {
    expect(SRC).toContain(
      "export type DecideApprovalItemResult = { ok: boolean; changed: boolean };",
    );
    const start = SRC.indexOf("export const decideApprovalItem = createServerFn");
    const end = SRC.indexOf("export const MAX_BULK_DECISIONS");
    const single = SRC.slice(start, end);
    expect(single).toContain("return { ok: true, changed };");
  });

  it("the flywheel signal is skipped when nothing actually changed", () => {
    const start = SRC.indexOf("async function decideOneApprovalItem(");
    const end = SRC.indexOf("export const decideApprovalItem = createServerFn");
    const shared = SRC.slice(start, end);
    expect(shared).toContain("if (attribution.agentDrafted && changed) {");
  });
});

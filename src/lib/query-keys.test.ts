/**
 * One read, one key.
 *
 * Measured live 2026-08-03: the two slowest server functions on a page load were
 * each fetched TWICE, because the same read was requested under three different
 * key families and React Query could not tell they were the same thing.
 *
 *   ["shell", "approvals", ws]   AppFrame, AskPane
 *   ["approvals", "queue", ws]   LivePulse, RoomChrome, MissionShell
 *   ["today", "queue", ws]       the Today route
 *
 * The shell is on every page and LivePulse is in its header, so Today paid for
 * three concurrent copies of one number, at 3.2s each, before rendering it once.
 *
 * A comment in LivePulse already asserted the fix was in place ("one shared
 * cache, one number, everywhere"), which is exactly why this is a test and not a
 * convention: the intent was documented, believed, and untrue for five files.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { approvalsQueueKey, missionsKey, APPROVALS_QUEUE_PREFIX, MISSIONS_PREFIX } from "./query-keys";

const SRC = join(import.meta.dir, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.endsWith(" 2")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

describe("shared query keys", () => {
  test("the same workspace always produces the same key", () => {
    expect(approvalsQueueKey("ws-1")).toEqual(approvalsQueueKey("ws-1"));
    expect(missionsKey("ws-1")).toEqual(missionsKey("ws-1"));
  });

  test("different workspaces do not share a cache entry", () => {
    // The counts are per tenant; sharing one entry would show a colleague's.
    expect(approvalsQueueKey("ws-1")).not.toEqual(approvalsQueueKey("ws-2"));
  });

  test("a missing workspace is one stable key, not undefined-vs-null churn", () => {
    expect(approvalsQueueKey(undefined)).toEqual(approvalsQueueKey(null));
    expect(missionsKey(undefined)).toEqual(missionsKey(null));
  });

  test("the invalidation prefixes actually prefix the keys they must clear", () => {
    // If these drift apart, settling a gate stops refreshing the header and the
    // count goes stale with no error anywhere. That is the quiet regression.
    expect(approvalsQueueKey("ws-1").slice(0, APPROVALS_QUEUE_PREFIX.length)).toEqual([
      ...APPROVALS_QUEUE_PREFIX,
    ]);
    expect(missionsKey("ws-1").slice(0, MISSIONS_PREFIX.length)).toEqual([...MISSIONS_PREFIX]);
  });

  test("no surface writes its own key for these two reads", () => {
    // The literal families that caused the duplicate fetches. A new caller that
    // hand-rolls one of these fails here rather than in a latency graph.
    const banned = [
      /queryKey:\s*\[\s*"shell"\s*,\s*"approvals"/,
      /queryKey:\s*\[\s*"approvals"\s*,\s*"queue"/,
      /queryKey:\s*\[\s*"today"\s*,\s*"queue"/,
      /queryKey:\s*\[\s*"shell"\s*,\s*"missions"/,
      /queryKey:\s*\[\s*"today"\s*,\s*"missions"/,
    ];
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const re of banned) {
        if (re.test(text)) offenders.push(`${file.replace(SRC, "src")} :: ${re.source}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

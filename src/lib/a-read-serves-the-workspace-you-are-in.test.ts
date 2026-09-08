/**
 * ── A READ SERVES THE WORKSPACE YOU ARE STANDING IN (P-75) ───────────────
 *
 * A1 walked the empty probe workspace and read, on the two doors a person opens
 * first after Start: "135 clusters need your decisions ... 200 signals" on
 * Arriving, and "1 of 2 graded forecasts came true" on Outcomes. All of it was
 * Helio Labs'.
 *
 * ── AND IT IS A SHARPER SHAPE THAN THE UNSCOPED READS P-67 HOLDS ─────────
 *
 * These reads ARE scoped. They resolve `current_user_default_workspace()` --
 * the person's DEFAULT -- and never take the one they have open. On a
 * one-workspace account the two are the same value and the defect is invisible;
 * since migration 20260907010000 a person can hold two.
 *
 * `getForecastCalibration` is the case worth reading twice: its callers already
 * passed `activeWorkspaceId` in the QUERY KEY, so react-query cached one
 * workspace's answer under another's name. Switching workspaces changed the key
 * and not the data. The read looked scoped from every angle except the screen.
 *
 * ── A RATCHET, NOT A CLEAN BILL ──────────────────────────────────────────
 *
 * 20 server functions across 17 files still resolve only the default. This
 * records them per file and fails when a file grows, so the next one cannot be
 * written and every packet that closes one lowers a number that never rises.
 *
 * WHAT IS NOT COUNTED: a function that takes `workspaceId` and falls back to the
 * default when the caller supplies none. That is the correct shape -- the
 * fallback is what keeps a caller that genuinely has no workspace working --
 * and demanding more would only push the resolution somewhere less visible.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Measured 2026-09-04. A number may go DOWN and never up. */
const BASELINE: Record<string, number> = {
  "src/lib/agent_loop.functions.ts": 1,
  "src/lib/brain-insights.functions.ts": 1,
  "src/lib/brain/insights.functions.ts": 1,
  "src/lib/build.functions.ts": 1,
  "src/lib/connections.functions.ts": 1,
  "src/lib/dashboard.functions.ts": 1,
  "src/lib/design-scaffold.functions.ts": 1,
  "src/lib/evidence.functions.ts": 1,
  "src/lib/forecast.functions.ts": 1,
  "src/lib/guardrails.functions.ts": 1,
  "src/lib/onboarding.functions.ts": 1,
  "src/lib/playbooks.functions.ts": 2,
  "src/lib/stakeholder-pack.functions.ts": 1,
  "src/lib/threads.functions.ts": 3,
  "src/lib/today-lanes.functions.ts": 1,
};

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !/\.test\.|__tests__|\.gen\./.test(p)) out.push(p);
  }
  return out;
}

/** Server functions in one file that resolve the default and take no override. */
function defaultOnlyReads(file: string): number {
  const src = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const parts = src.split("createServerFn(");
  let n = 0;
  for (let i = 1; i < parts.length; i += 1) {
    /* Bounded, never to end-of-file (F-191): one server function's own block. */
    const block = parts[i].slice(0, 4000);
    const at = block.indexOf("current_user_default_workspace");
    if (at === -1) continue;
    /* A `workspaceId` named BEFORE the resolve is the caller's override, which
       is the correct shape. */
    if (/workspaceId/.test(block.slice(0, at))) continue;
    n += 1;
  }
  return n;
}

describe("a read serves the workspace you are standing in", () => {
  const files = sourceFiles("src").sort();

  it("finds them at all, so a broken scan cannot pass as a clean repo", () => {
    const total = files.reduce((t, f) => t + defaultOnlyReads(f), 0);
    expect(total).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(500);
  });

  it("lets no file grow a new default-only read", () => {
    const grown: string[] = [];
    for (const f of files) {
      const now = defaultOnlyReads(f);
      const was = BASELINE[f] ?? 0;
      if (now > was) grown.push(`${f}: ${was} -> ${now}`);
    }
    /*
     * If this fails: the server function you added resolves the person's
     * DEFAULT workspace and cannot be told which one they are looking at, so it
     * will answer with another desk's rows the moment somebody holds two -- and
     * a caller passing `activeWorkspaceId` in its query key will make that look
     * correct while it is wrong. Take `workspaceId` as an optional input and
     * resolve the default only when it is absent.
     */
    expect(grown).toEqual([]);
  });

  it("keeps the baseline honest: no file listed that no longer has any", () => {
    const stale = Object.keys(BASELINE).filter((f) => {
      try {
        return defaultOnlyReads(f) === 0;
      } catch {
        return true;
      }
    });
    expect(stale).toEqual([]);
  });

  it("holds the two doors this packet was written for at zero", () => {
    // Arriving and Outcomes are the first two doors after Start, and the ones
    // A1 read another workspace's numbers on.
    expect(defaultOnlyReads("src/lib/brain-insights.functions.ts")).toBe(
      BASELINE["src/lib/brain-insights.functions.ts"] ?? 0,
    );
  });
});

describe("the doors A1 walked read their own workspace", () => {
  const code = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const AGENTS = code(readFileSync("src/lib/agents.functions.ts", "utf8"));
  const CONN = code(readFileSync("src/lib/connections.functions.ts", "utf8"));
  const THREADS = code(readFileSync("src/lib/threads.functions.ts", "utf8"));
  const APPROVALS = code(readFileSync("src/routes/_authenticated.approvals.tsx", "utf8"));
  const THREAD_ROUTE = code(readFileSync("src/routes/_authenticated.threads.tsx", "utf8"));

  /** One function's body, bounded at both ends (F-191). */
  const fn = (src: string, name: string): string => {
    const from = src.indexOf(`export const ${name} = createServerFn`);
    expect(from, `${name} not found`).toBeGreaterThan(-1);
    const to = src.indexOf("\nexport const ", from + 1);
    return src.slice(from, to === -1 ? src.length : to);
  };

  it("does not say 'one just came in' about another workspace", () => {
    // A1 read it in an EMPTY probe workspace where nothing had. The sentence
    // fires only when the queue is otherwise empty, so it appears exactly when
    // it is most likely to be another desk's and says the most alarming thing.
    const body = fn(AGENTS, "getLiveActivity");
    expect(body).toContain('runsQ.eq("workspace_id", wid)');
    expect(body).toContain("countNeedsYouCalls(");
    // Both halves of the sentence read the same desk.
    expect(body).toContain("wid,");
    expect(APPROVALS).toContain('queryKey: ["approvals-live-activity", activeWorkspaceId ?? null]');
  });

  it("does not name another workspace's repository on Sources", () => {
    // The page's whole subject is what THIS workspace may read, so another
    // desk's binding reads as a permission the person granted.
    const body = fn(CONN, "listWorkspaceBindings");
    expect(body).toContain('bindingsQ.eq("workspace_id", wid)');
  });

  it("keys every bindings read on the workspace, or the cache shares one answer", () => {
    for (const f of [
      "src/components/connections/AccountConnectionsSection.tsx",
      "src/components/engine-room/EngineRoomEmbedded.tsx",
    ]) {
      /*
       * READS ONLY. `invalidateQueries({ queryKey: ["workspace-bindings"] })`
       * is a PREFIX match and is correct as it stands: it clears every
       * workspace's entry at once, which is what a write should do. The first
       * draft of this guard banned the string outright and failed on four
       * invalidations that were right.
       */
      const src = code(readFileSync(f, "utf8"));
      const reads = [...src.matchAll(/useQuery\(\{[\s\S]{0,400}?\}\)/g)].map((m) => m[0]);
      for (const r of reads) {
        if (!r.includes('"workspace-bindings"')) continue;
        expect(r, `${f} reads workspace-bindings without a workspace`).toContain(
          "activeWorkspaceId",
        );
      }
    }
  });

  it("does not open a thread that belongs to another workspace", () => {
    // The LIST was scoped in P-70. This takes an id, and RLS says yes to a
    // member of both: scoping a list does not scope what the list links to, and
    // an id in a URL outlives the workspace it was copied from.
    const body = fn(THREADS, "getThread");
    expect(body).toContain('convQ.eq("workspace_id", wid)');
    expect(body).toContain("if (!conv)");
    expect(THREAD_ROUTE).toContain('queryKey: ["thread", selectedId, activeWorkspaceId ?? null]');
  });

  it("reads nothing further once the thread is not this workspace's", () => {
    // Fetching its messages anyway would put another desk's conversation on
    // screen under an empty title, which is worse than an honest absence.
    const body = fn(THREADS, "getThread");
    const refuse = body.indexOf("if (!conv)");
    const messages = body.indexOf('.from("messages")');
    expect(refuse).toBeGreaterThan(-1);
    expect(messages).toBeGreaterThan(refuse);
  });
});

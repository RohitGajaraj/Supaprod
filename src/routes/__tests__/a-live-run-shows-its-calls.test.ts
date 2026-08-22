import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A LIVE RUN'S TOOL STREAM SHOWS WHAT THE DATABASE RECORDED, OR NOTHING.
 *
 * WHAT THIS EXISTS TO STOP. `ToolStream` shipped on 2026-08-20 with no product
 * caller at all: its one importer was the Meridian gallery, which builds its
 * rows with `Array.from({ length: 40 }, (_, i) => ({ ... durationMs: 400 +
 * ((i * 137) % 2600) }))`. That is the correct thing for a gallery and it is a
 * fabricated agent step anywhere else. When the component finally got a real
 * mount on /runs/$missionId the gallery's shape was the nearest example to
 * hand, and copying it would have put invented latencies and invented call
 * times on a surface whose entire job is to be the proof of what an agent did.
 *
 * THE SECOND FABRICATION IS SUBTLER AND IS THE ONE WORTH A BUILD FAILURE.
 * `ToolStreamState` offers running | done | failed, and NOTHING IN THIS PRODUCT
 * RECORDS AN EXECUTING CALL. The loop measures `Date.now() - t0` at
 * loop.server.ts:1661 and inserts the `tool_calls` row at :1690 (ok) or :1732
 * (failed) — both AFTER the tool has returned — and the checkpoint that might
 * otherwise witness one is written BEFORE the provider call (:1201). So a row
 * marked "running" on this surface is not a lag or an approximation; it is a
 * claim no writer in the system can support. It is also the single most natural
 * thing for someone to add, because the state exists in the type and the run is
 * live, which is exactly the shape `no-fabricated-agent-steps.test.ts` was
 * written for.
 *
 * THE THIRD IS A FALSE MEASUREMENT RATHER THAN A FALSE EVENT, AND IT WAS ON
 * SCREEN. ToolStream printed its durations through `formatDuration`
 * (components/studio/run-return.ts:65-74), which floors to whole seconds
 * because it was written for a run's total span. Nobody caught it in review
 * because the component had no data source to check it against. It does now,
 * and the data says the resolution is wrong: measured 2026-08-22 20:30:16 UTC
 * over the two newest traces in `public.tool_calls`, the latencies are 68, 27,
 * 82, 386, 536, 1139 and 3531 ms, and FIVE OF THOSE SEVEN would have said "0s".
 * `callTook` in ToolStream.tsx replaced it; the last case below is what stops
 * the whole-second formatter coming back.
 *
 * A 0 in that column is separately not a measurement — `Date.now() - t0`
 * returns 0 for a call that came back inside the clock's resolution — so it
 * draws no figure at all. Measured at the same instant, `select count(*) filter
 * (where latency_ms = 0), count(*) from public.tool_calls` -> 0 of 345, so that
 * guard is for the first sub-millisecond tool rather than for a row on screen
 * today.
 *
 * Modelled on run-evidence-holds.test.ts and no-fabricated-agent-steps.test.ts:
 * read the route as TEXT and strip comments first, because the mount comment
 * legitimately NAMES every banned shape in prose in order to ban it.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.runs.$missionId.tsx");

/** Strip comments so prose that NAMES the banned shape does not trip it. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const src = stripComments(readFileSync(ROUTE, "utf8"));

/**
 * Where the one `<ToolStream …/>` element starts.
 *
 * The trailing space is load-bearing: `React.useMemo<ToolStreamRow[]>` also
 * begins with the characters `<ToolStream`, and matching it made an earlier
 * draft of this guard read the type annotation as the mount and fail on the
 * very code it was written to accept.
 */
function mountAt(): number {
  const m = /<ToolStream\s/.exec(src);
  expect(m).not.toBeNull();
  return m!.index;
}

/** The `rows={…}` expression handed to that element. */
function rowsExpression(): string {
  const at = mountAt();
  const tag = src.slice(at, src.indexOf("/>", at));
  const m = /rows=\{([^}]*)\}/.exec(tag);
  expect(m).not.toBeNull();
  return m![1].trim();
}

/**
 * The body of the memo that builds those rows, from its declaration to the next
 * top-level `const` in the component. Sliced rather than parsed because every
 * other guard on this route reads it as text, and a real parser would be a
 * second way of knowing the same thing.
 */
function rowsMemoBody(ident: string): string {
  const at = src.indexOf(`const ${ident} = React.useMemo`);
  expect(at).toBeGreaterThan(-1);
  const rest = src.slice(at + 1);
  const end = rest.indexOf("\n  const ");
  return end === -1 ? rest : rest.slice(0, end);
}

describe("the live tool stream renders recorded calls, never invented ones", () => {
  it("feeds ToolStream from the server payload, not from a synthesized array", () => {
    const expr = rowsExpression();
    // A bare identifier. An inline `.map`, a literal or the gallery's generator
    // all fail here, which is the point: the rows must come from somewhere this
    // test can then follow.
    expect(expr).toMatch(/^[A-Za-z_$][\w$]*$/);

    const body = rowsMemoBody(expr);
    // And what it follows to is `toolCalls`, the getStudioSession field that
    // holds real public.tool_calls rows.
    expect(body).toContain("toolCalls");
    expect(body).not.toContain("Array.from(");
  });

  it("derives every row's state from ok, and never marks one running", () => {
    const body = rowsMemoBody(rowsExpression());
    // Scoped to the memo ON PURPOSE. "running" is a legitimate agent_run and
    // mission status and appears more than a dozen times elsewhere in this
    // file; the banned shape is the ToolStreamRow field, not the word.
    expect(body).not.toMatch(/state:\s*"running"/);
    expect(body).not.toMatch(/state:[^,]*"running"/);
    // The only honest source for the state is the recorded outcome column.
    expect(body).toMatch(/state:\s*[^,]*\bok\b/);
  });

  it("guards the duration instead of passing latency_ms through", () => {
    const body = rowsMemoBody(rowsExpression());
    const m = /durationMs:\s*([^\n]*?),\s*$/m.exec(body);
    expect(m).not.toBeNull();
    const value = m![1].trim();
    // A bare column read is the defect: 0 is a real value in that column and it
    // is the absence of a measurement, not a call that took no time.
    expect(value).not.toMatch(/^[A-Za-z_$][\w$]*\.latency_ms$/);
    // Whatever the guard's shape, it has to be able to say "no duration".
    expect(value).toContain("undefined");
  });

  it("prints a sub-second call as a real figure, not as zero", async () => {
    /*
     * THIS ASSERTION IS ABOUT THE COMPONENT AND IT LIVES HERE ON PURPOSE. It is
     * a fact about THIS lane's data, not about ToolStream's own contract: the
     * component was written with no source and reached for `formatDuration`,
     * which floors to whole seconds because it was built for a run's total
     * span. Real tool calls are three orders of magnitude smaller. Measured
     * 2026-08-22 20:30:16 UTC over the two newest traces in `public.tool_calls`,
     * the latencies are 68, 27, 82, 386, 536, 1139 and 3531 ms — five of the
     * seven would have rendered "0s" on a surface whose whole claim is that it
     * shows what actually happened.
     */
    const { render } = await import("@testing-library/react");
    const { ToolStream } = await import("@/components/meridian/ToolStream");
    const { createElement } = await import("react");

    const { container } = render(
      createElement(ToolStream, {
        rows: [
          {
            id: "a",
            tool: "workspace.search",
            at: Date.UTC(2026, 7, 22, 20, 0),
            state: "done" as const,
            durationMs: 386,
          },
          {
            id: "b",
            tool: "cluster.trigger",
            at: Date.UTC(2026, 7, 22, 20, 1),
            state: "done" as const,
            durationMs: 3531,
          },
          {
            id: "c",
            tool: "signals.list",
            at: Date.UTC(2026, 7, 22, 20, 2),
            state: "done" as const,
            durationMs: 0,
          },
        ],
      }),
    );

    /* `RunTook` is the span treatment; `RunClock` is a <time> with the same
       classes, so the element name is what separates a duration from an
       arrival instant. Reading textContent instead matched "0s" inside the
       clock's own "20:00", which is how this assertion first went green
       against the wrong thing. */
    const figures = [...container.querySelectorAll("span.tabular-nums.text-mrd-faint")].map(
      (n) => n.textContent,
    );
    expect(figures).toEqual(["386ms", "3.53s"]);
    // Two figures for three rows: a 0 is "under the clock's resolution", not a
    // call that took no time, so it draws nothing rather than "0ms" or "0s".
  });

  it("only mounts the stream while the run is live", () => {
    // The 2026-08-21 ruling recorded at ToolStream.tsx:68-77: the Steps ledger
    // below already renders every tool call, so a settled stream beside it is
    // one fact on screen twice in two rhythms.
    const at = mountAt();
    const gate = src.slice(0, at).lastIndexOf("isLive ? (");
    expect(gate).toBeGreaterThan(-1);
    // Only its own Region opens between the gate and the mount, so the gate
    // belongs to this stream and not to some enclosing live-only block that a
    // later edit could widen.
    const between = src.slice(gate, at);
    expect(between.match(/<[A-Z]/g)?.length ?? 0).toBe(1);
    expect(between).toContain('<Region title="What it is calling"');
    // And the alternative is `null`, so a settled run draws nothing here rather
    // than something else taking the slot.
    expect(/^[ \t]*\) : null\}[ \t]*$/m.test(src.slice(at, at + 400))).toBe(true);
  });
});

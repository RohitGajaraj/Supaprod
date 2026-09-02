/**
 * A PIN IS A POSITION IN THE QUEUE, NOT A LOCK AND NOT A PRIORITY FIELD.
 *
 * ── THE GAP, IN THE FOUNDER'S WORDS ───────────────────────────────────────
 * 2026-09-02: *"when various signals are queued, bucketed and themed, how do I
 * decide which one to hack on? Is there any prominence for that?"*
 *
 * Two things decide order today and neither is a person. A theme becomes a run
 * when it crosses the workspace bar, ranked severity then frequency then
 * confidence. The sweep then serves open runs in strict round robin by
 * `driven_at`, which is deliberately fair and deliberately opinionless: the run
 * that moved longest ago goes next. Between them there was nowhere to say "this
 * one".
 *
 * ── WHY AN INSTANT AND NOT A NUMBER ───────────────────────────────────────
 * A priority number needs a scale, a scale needs an agreed meaning, and a
 * meaning nobody agreed becomes five runs all set to 1. A nullable instant
 * answers the only question being asked -- is this the one -- and orders several
 * pins by when they were made, which is the order the person meant.
 *
 * ── AND THE ONE LIMIT THAT KEEPS THE LIST HONEST ──────────────────────────
 * A pin sorts inside the LIVE half of the list. A pin on finished work cannot
 * mean "first": the sweep will never serve it, and floating it above a run
 * waiting on an answer would make the list argue with the thing it describes.
 */
import { describe, expect, it } from "bun:test";

import { startRows, type StartRowInput } from "./tracks-feed";

const WORDS = { prd: { one: "spec", many: "specs" } } as const;
const phrase = () => null;
const NOW = Date.parse("2026-09-02T12:00:00Z");

const run = (over: Partial<StartRowInput> = {}): StartRowInput => ({
  id: "t-1",
  title: "A run",
  status: "open",
  stationName: "Build",
  updatedAt: "2026-09-02T11:00:00Z",
  drivenAt: "2026-09-02T11:00:00Z",
  holdReason: null,
  holdBecause: null,
  working: null,
  needsYou: null,
  produced: [],
  pinnedAt: null,
  ...over,
});

const rows = (rs: StartRowInput[]) => startRows(rs, NOW, WORDS, phrase).map((r) => r.id);

describe("a pin puts one run first", () => {
  it("outranks the kind order it would otherwise sit under", () => {
    /*
     * Needs-you is first by default because it is the only kind blocked ON the
     * person. A pin is the person saying otherwise, so it wins.
     */
    expect(
      rows([
        run({ id: "needs-you", needsYou: { tool: "studio.pr.merge" } }),
        run({ id: "pinned", pinnedAt: "2026-09-02T11:30:00Z" }),
      ]),
    ).toEqual(["pinned", "needs-you"]);
  });

  it("orders two pins by when they were made, not by which run is newer", () => {
    expect(
      rows([
        run({ id: "second", pinnedAt: "2026-09-02T11:40:00Z", updatedAt: "2026-09-02T11:59:00Z" }),
        run({ id: "first", pinnedAt: "2026-09-02T11:20:00Z", updatedAt: "2026-09-02T10:00:00Z" }),
      ]),
    ).toEqual(["first", "second"]);
  });

  it("leaves everything unpinned in exactly the order it already had", () => {
    /*
     * A pin is a position, not a lock: nothing is starved and no other row
     * changes place because one row was pinned.
     */
    const unpinned = [
      run({ id: "needs-you", needsYou: { tool: "studio.pr.merge" } }),
      run({ id: "running", working: { seat: "Draft", since: "2026-09-02T11:59:00Z", tool: null } }),
      run({ id: "waiting", holdReason: "out-of-time" }),
    ];
    expect(rows(unpinned)).toEqual(["needs-you", "running", "waiting"]);
    expect(rows([...unpinned, run({ id: "pinned", pinnedAt: "2026-09-02T11:30:00Z" })])).toEqual([
      "pinned",
      "needs-you",
      "running",
      "waiting",
    ]);
  });
});

describe("what a pin cannot do", () => {
  it("does not float finished work above a run that is waiting on somebody", () => {
    /*
     * THE ONE LIMIT. The sweep never serves a finished run, so a pin on one
     * cannot mean "first"; honouring it would make the list argue with the thing
     * it describes.
     */
    expect(
      rows([
        run({ id: "done-and-pinned", status: "done", pinnedAt: "2026-09-02T11:30:00Z" }),
        run({ id: "needs-you", needsYou: { tool: "studio.pr.merge" } }),
      ]),
    ).toEqual(["needs-you", "done-and-pinned"]);
  });

  it("does not float abandoned work either", () => {
    expect(
      rows([
        run({ id: "abandoned-and-pinned", status: "abandoned", pinnedAt: "2026-09-02T11:30:00Z" }),
        run({ id: "waiting", holdReason: "out-of-time" }),
      ]),
    ).toEqual(["waiting", "abandoned-and-pinned"]);
  });

  it("treats a row with no pin field at all as unpinned, not as an error", () => {
    // `pinnedAt` is optional on the input because a database that has not taken
    // the migration returns rows without it, and that is a degraded ordering
    // rather than a broken page.
    const noField = { ...run({ id: "a" }) };
    delete (noField as { pinnedAt?: unknown }).pinnedAt;
    expect(rows([noField, run({ id: "b", updatedAt: "2026-09-01T10:00:00Z" })])).toEqual([
      "a",
      "b",
    ]);
  });
});

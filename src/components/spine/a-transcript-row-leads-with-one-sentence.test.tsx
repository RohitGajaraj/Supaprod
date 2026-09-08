import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Turn } from "@/lib/spine/activity";
import { transcriptLead } from "./TrackActivity";

/**
 * A TRANSCRIPT ROW LEADS WITH ONE SENTENCE, AND THE REST FOLDS (P-105, A-QUEUE.md).
 *
 * The served tablet track carried the Design critic's 400-word paragraph and
 * the Build seat's 300-word one IN the row itself, always visible, under two
 * lines already stating the verdict and the seat -- "a dump of text" was the
 * founder's own phrase for the run screen this replaced (P-37). This pins the
 * packet's own Guard: a rendered row's lead is under 140 characters, and the
 * body -- the paragraph, the marks, the calls -- is folded by default.
 *
 * NO FULL-COMPONENT RENDER TEST, same reason
 * `one-station-display-on-the-run-screen.test.ts` states for its own subject:
 * `TrackActivity` opens two server functions through `useServerFn`, so
 * standing it up honestly means mocking the whole read layer, and a guard
 * whose scaffolding is bigger than its subject is a guard nobody maintains.
 * The pure composer is tested directly; the wiring that keeps the
 * artifact-select press alive alongside the new fold toggle is pinned as
 * source text, the same discipline that file already uses for this component.
 */

const turn = (over: Partial<Turn> = {}): Turn => ({
  runId: "r-1",
  agentSlug: "discovery-scout",
  agentName: "Discovery Scout",
  station: "sense",
  stationName: "Sense",
  at: "2026-09-02T10:00:00Z",
  outcome: "done",
  made: [],
  said: null,
  tookMs: 42_000,
  tokens: null,
  usd: 0,
  credits: 0,
  stopLine: null,
  ...over,
});

describe("transcriptLead composes the verdict and the seat into one sentence", () => {
  it("matches the packet's own example shape: verdict, seat, duration", () => {
    expect(transcriptLead(turn())).toBe("Filed nothing. Discovery Scout, 42.0s.");
  });

  it("names what it filed when it filed something", () => {
    const t = turn({ made: [{ kind: "prd", word: "spec", id: "p-1" }] });
    expect(transcriptLead(t)).toBe("Filed a spec. Discovery Scout, 42.0s.");
  });

  it("says the seat alone when nothing measured how long it took", () => {
    const t = turn({ tookMs: null });
    expect(transcriptLead(t)).toBe("Filed nothing. Discovery Scout.");
  });

  /* THE GUARD, Scope's own words: "a row that was stopped or refused leads
     with that fact". headline() already puts the consequence first for a
     stopped turn; this pins that transcriptLead never loses it. */
  it("a stopped turn leads with the consequence, not the cause", () => {
    const t = turn({ outcome: "stopped", made: [] });
    expect(transcriptLead(t)).toBe("Nothing was filed for this step. Discovery Scout, 42.0s.");
  });

  it("a stopped turn that filed something still leads with what happened", () => {
    const t = turn({
      outcome: "stopped",
      made: [
        { kind: "prd", word: "spec", id: "p-1" },
        { kind: "task", word: "task", id: "t-1" },
      ],
    });
    expect(transcriptLead(t)).toBe(
      "Stopped after filing a spec and a task. Discovery Scout, 42.0s.",
    );
  });

  it("a live turn leads with what it is doing, not a stale duration", () => {
    expect(transcriptLead(turn({ outcome: "working" }))).toBe("Working. Discovery Scout, 42.0s.");
    expect(transcriptLead(turn({ outcome: "waiting" }))).toBe("Queued. Discovery Scout, 42.0s.");
  });

  /* THE GUARD (A-QUEUE.md P-105 Scope, verbatim): "a rendered row's lead is
     under 140 characters". Composed from a fixed vocabulary plus a name and a
     clock, never from the seat's own paragraph, so this holds by
     construction rather than by truncation -- checked against the longest
     realistic shape rather than trusted on faith. */
  it("stays under 140 characters even for the longest realistic shape", () => {
    const t = turn({
      agentName: "A Very Long Display Name For A Custom Agent Seat",
      tookMs: 2 * 60 * 60 * 1000 + 45 * 1000,
      made: [
        { kind: "prd", word: "spec", id: "p-1" },
        { kind: "task", word: "task", id: "t-1" },
        { kind: "decision", word: "decision", id: "d-1" },
      ],
      outcome: "stopped",
    });
    const lead = transcriptLead(t);
    expect(lead.length).toBeLessThan(140);
  });
});

describe("the row still does two jobs on one press, and neither is lost", () => {
  const src = readFileSync(fileURLToPath(new URL("./TrackActivity.tsx", import.meta.url)), "utf8");

  it("the lead is the composed sentence, never the bare verdict alone", () => {
    expect(src).toContain("<RunSubject>{transcriptLead(t)}</RunSubject>");
    // headline(t) still exists (transcriptLead calls it), but the row itself
    // must not also render it raw -- that would be the two-line shape again.
    expect(src).not.toContain("<RunSubject>{headline(t)}</RunSubject>");
  });

  it("a press still selects the newest artifact when there is one to select", () => {
    // Unchanged from before this packet: `the-artifact-is-the-control.test.tsx`
    // and `one-station-display-on-the-run-screen.test.ts` both pin this shape
    // directly; this is the same claim made about the file that now also
    // folds, so a change to either contract is caught in two places.
    expect(src).toContain("canOpen(t) ? (");
    expect(src).toContain("aria-pressed={t.made.some((m) => m.id === selected)}");
    expect(src).toContain("if (id) onSelect?.(id);");
  });

  it("the same press also opens the fold, on both the pressable and the plain row", () => {
    expect(src).toContain('toggleTurn(row.key, t.outcome === "working")');
    expect(src).toContain('isTurnOpen(row.key, t.outcome === "working")');
    // Both branches -- the artifact-select button and the plain toggle button
    // for a turn that filed nothing -- carry aria-expanded, so a screen
    // reader is told the fold's state on every row, not only the pressable
    // half.
    expect(
      src.split('aria-expanded={isTurnOpen(row.key, t.outcome === "working")}').length - 1,
    ).toBe(2);
  });

  /*
   * 2026-09-08: a WORKING turn starts open, because the seat's tool stream
   * lives inside the fold and a fold that started closed hid the one thing
   * worth watching while the agent works (founder: tool calls drawn live).
   * A finished turn still starts closed; the person's own press on either
   * is kept for that turn.
   */
  it("the fold is closed by construction on a finished turn, and open on a live one", () => {
    expect(src).toContain(
      "const isTurnOpen = (key: string, live: boolean) => turnChoices.get(key) ?? live;",
    );
    expect(src).toContain(
      'gridTemplateRows: isTurnOpen(row.key, t.outcome === "working") ? "1fr" : "0fr",',
    );
  });
});

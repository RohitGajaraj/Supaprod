// Suggestion ranking (behavior contract): typed matches rank above the
// standing final Ask row; rows derive from the palette data; dedupe across
// sections; the Ask row always exists and always carries the query verbatim.
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { SuggestionPopover, buildSuggestionRows } from "../SuggestionPopover";

describe("buildSuggestionRows: ranking", () => {
  test("an empty draft returns only the standing Ask row", () => {
    const rows = buildSuggestionRows("");
    expect(rows.length).toBe(1);
    expect(rows[0].kind).toBe("ask");
    expect(rows[0].label).toBe("Ask Supaprod");
  });

  test("typed matches rank above the Ask row, which is always last", () => {
    const rows = buildSuggestionRows("brain");
    expect(rows.length).toBeGreaterThan(1);
    const last = rows[rows.length - 1];
    expect(last.kind).toBe("ask");
    for (const row of rows.slice(0, -1)) expect(row.kind).toBe("run");
  });

  test("the Ask row names the query verbatim", () => {
    const rows = buildSuggestionRows("  why did churn spike  ");
    const last = rows[rows.length - 1];
    expect(last.kind).toBe("ask");
    if (last.kind === "ask") {
      expect(last.label).toBe('Ask Supaprod: "why did churn spike"');
      expect(last.query).toBe("why did churn spike");
    }
  });

  test("sections keep palette order (Jump, Act, Catalog) and cap at 3 each", () => {
    const rows = buildSuggestionRows("e");
    const sections = rows.flatMap((r) => (r.kind === "run" ? [r.section] : []));
    const order = { JUMP: 0, ACT: 1, CATALOG: 2 } as const;
    for (let i = 1; i < sections.length; i++) {
      expect(order[sections[i]]).toBeGreaterThanOrEqual(order[sections[i - 1]]);
    }
    for (const section of ["JUMP", "ACT", "CATALOG"] as const) {
      expect(sections.filter((s) => s === section).length).toBeLessThanOrEqual(3);
    }
  });

  test("a label appearing in Act and Catalog renders once (deduped)", () => {
    const rows = buildSuggestionRows("connect a source");
    const labels = rows.flatMap((r) => (r.kind === "run" ? [r.label.toLowerCase()] : []));
    const connects = labels.filter((l) => l === "connect a source");
    expect(connects.length).toBe(1);
  });

  test("a nonsense draft still offers the Ask door and nothing else", () => {
    const rows = buildSuggestionRows("zzz qqq xyzzy");
    expect(rows.length).toBe(1);
    expect(rows[0].kind).toBe("ask");
  });
});

describe("buildSuggestionRows: a typed id", () => {
  test("an audit tag ranks first and carries the canonical ref", () => {
    const rows = buildSuggestionRows("mis-7e7d59");
    expect(rows[0].kind).toBe("trace");
    if (rows[0].kind === "trace") {
      expect(rows[0].ref).toBe("MIS·7E7D59");
      expect(rows[0].label).toContain("MIS·7E7D59");
    }
    // The Ask door survives: an id is an offer, never a hijack.
    expect(rows[rows.length - 1].kind).toBe("ask");
  });

  test("a bare uuid is offered without naming a kind it cannot know", () => {
    const uuid = "7e7d59a1-0f2b-4c3d-8e9f-0123456789ab";
    const rows = buildSuggestionRows(uuid);
    expect(rows[0].kind).toBe("trace");
    if (rows[0].kind === "trace") expect(rows[0].ref).toBe(uuid);
  });

  test("prose that merely mentions an id does not light the row", () => {
    const rows = buildSuggestionRows("what happened on MIS·7E7D59");
    expect(rows.some((r) => r.kind === "trace")).toBe(false);
  });
});

describe("SuggestionPopover: rendering and pick", () => {
  test("renders the rows, marks the active one, and reports a pick", () => {
    const rows = buildSuggestionRows("brain");
    const onPick = mock(() => {});
    render(<SuggestionPopover rows={rows} activeIndex={rows.length - 1} onPick={onPick} />);
    expect(screen.getByTestId("suggestion-popover")).toBeTruthy();
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(rows.length);
    // The Ask row is the active (default) one.
    expect(options[options.length - 1].getAttribute("aria-selected")).toBe("true");
    fireEvent.click(options[0]);
    expect(onPick).toHaveBeenCalledWith(rows[0]);
  });
});

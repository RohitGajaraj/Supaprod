/**
 * THE PLAN'S STEPS RENDER AS STEPS, NOT AS TITLE LINES.
 *
 * ── THE GAP ────────────────────────────────────────────────────────────────
 * `StationPanel` renders one rich body for the station's PRIMARY artifact and
 * a bare `MemberLine` for everything else. No station's expected kind is
 * `task` or `mission`, so the 118 filed tasks — the third most common artifact
 * the spine files — and every Build mission rendered as opaque title rows. A
 * plan read as "the spec, then six unlabeled lines" hides the order, the done
 * state, and the recorded risk: the three things a person scans a breakdown
 * for.
 *
 * ── WHAT THIS PINS ─────────────────────────────────────────────────────────
 * Order comes from `seq`, not filing order — a breakdown filed out of order
 * must still read in order. A done step says so and only a done step gets the
 * chip: a status the vocabulary cannot vouch for renders as the plain word,
 * never dressed as an outcome. The mission card carries the goal and the two
 * numbers that answer "did the crew check its own work".
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { MissionCard, TaskSteps } from "./ArtifactPane";
import type { ArtifactView } from "@/lib/spine/track.functions";

const task = (over: Partial<ArtifactView> & { fields?: ArtifactView["fields"] }): ArtifactView => ({
  kind: "task",
  word: "step",
  artifactId: over.artifactId ?? "t-1",
  createdAt: over.createdAt ?? "2026-08-25T10:00:00Z",
  title: over.title ?? null,
  missing: false,
  fields: over.fields ?? {},
});

describe("the step list", () => {
  it("orders by seq even when filed out of order", () => {
    const { container } = render(
      <TaskSteps
        items={[
          task({ artifactId: "b", title: "Wire the API", fields: { seq: 2 } }),
          task({ artifactId: "a", title: "Write the migration", fields: { seq: 1 } }),
          task({ artifactId: "c", title: "Ship the flag", fields: { seq: 3 } }),
        ]}
      />,
    );
    const rows = [...container.querySelectorAll("li")].map((li) => li.textContent ?? "");
    expect(rows.length).toBe(3);
    expect(rows[0]).toContain("Write the migration");
    expect(rows[1]).toContain("Wire the API");
    expect(rows[2]).toContain("Ship the flag");
  });

  it("says how many steps the plan has", () => {
    const { getByText } = render(
      <TaskSteps
        items={[
          task({ artifactId: "a", fields: { seq: 1 } }),
          task({ artifactId: "b", fields: { seq: 2 } }),
        ]}
      />,
    );
    expect(getByText("The 2 steps of this plan")).toBeTruthy();
  });

  it("a done step says Done; an unvouched status stays a plain word", () => {
    const { container, getByText } = render(
      <TaskSteps
        items={[
          task({ artifactId: "a", title: "Done step", fields: { seq: 1, status: "done" } }),
          task({ artifactId: "b", title: "Open step", fields: { seq: 2, status: "doing" } }),
        ]}
      />,
    );
    expect(getByText("Done")).toBeTruthy();
    expect(getByText("doing")).toBeTruthy();
    // The outcome chip appears exactly once: "doing" is not an outcome and
    // must never be dressed as one.
    expect(container.querySelectorAll(".bg-mrd-pass-chip").length).toBe(1);
  });

  it("carries the recorded risk and estimate, and invents neither", () => {
    const { container } = render(
      <TaskSteps
        items={[
          task({
            artifactId: "a",
            title: "Risky step",
            fields: { seq: 1, risk: "touches the auth path", estimate_hours: 3 },
          }),
          task({ artifactId: "b", title: "Plain step", fields: { seq: 2 } }),
        ]}
      />,
    );
    const rows = [...container.querySelectorAll("li")].map((li) => li.textContent ?? "");
    expect(rows[0]).toContain("risk: touches the auth path");
    expect(rows[0]).toContain("~3h");
    expect(rows[1]).not.toContain("risk");
    expect(rows[1]).not.toContain("~");
  });
});

describe("the mission card", () => {
  it("carries the goal and the crew's own-work numbers", () => {
    const { container } = render(
      <MissionCard
        item={{
          kind: "mission",
          word: "mission",
          artifactId: "m-1",
          createdAt: "2026-08-25T10:00:00Z",
          title: "Build the address autofill",
          missing: false,
          fields: {
            goal: "Prefill the checkout address from the account record.",
            status: "completed",
            hop_count: 2,
            verify_cycles: 1,
            completed_at: "2026-08-25T11:00:00Z",
          },
        }}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Build the address autofill");
    expect(text).toContain("Prefill the checkout address");
    expect(text).toContain("2 hops");
    expect(text).toContain("checked its own work 1 time");
    /*
     * ── THE CHIP BECAME A CLAUSE, AND THE FACT IS STILL ASSERTED ───────────
     * This read `toContain("Completed")` against a `StatusChip status="pass"`.
     * P-01's rule is one status per screen: the run header carries exactly one
     * chip for the whole piece of work, and a second chip a few hundred pixels
     * below it, about a mission nested inside Build, is two verdicts with
     * nothing saying which subject each belongs to. On `d1168015` the header
     * read Finished over this one reading Completed.
     *
     * So the chip went and the fact moved into the meta line, where it also
     * gained the thing the chip could not carry: WHEN. The assertion follows
     * the fact rather than the widget.
     */
    expect(text).toContain("completed");
    expect(container.querySelectorAll("[data-status]").length).toBe(0);
  });

  it("an unfinished mission is not dressed as a completed one", () => {
    const { container } = render(
      <MissionCard
        item={{
          kind: "mission",
          word: "mission",
          artifactId: "m-2",
          createdAt: "2026-08-25T10:00:00Z",
          title: "Half-run mission",
          missing: false,
          fields: { goal: "Do the thing.", status: "running", hop_count: 1, verify_cycles: 0 },
        }}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("running");
    expect(container.querySelectorAll(".bg-mrd-pass-chip").length).toBe(0);
    // Zero verify cycles is a fact to omit, never a boast to invert.
    expect(text).not.toContain("checked its own work");
  });
});

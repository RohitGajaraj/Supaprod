import { describe, it, expect } from "bun:test";
import { decisionsForGrading } from "./graded-decisions";

const D = (id: string, missing = false) => ({ kind: "decision", artifactId: id, missing });
const other = (kind: string) => ({ kind, artifactId: "x", missing: false });

describe("the decisions a learning may be grading", () => {
  it("finds one filed at a station other than decide", () => {
    /*
     * THE CASE THAT WAS ON SCREEN. `d1168015` is the only track in this
     * database to walk all seven stations, and the decision its learning grades
     * sits at SHIP. Searching the decide stop alone returned nothing, and the
     * Learn tab told a person no forecast had been recorded while one had.
     */
    const stops = [{ items: [D("decide-1")] }, { items: [other("prd")] }, { items: [D("ship-1")] }];
    expect(decisionsForGrading(stops).map((d) => d.artifactId)).toEqual(["decide-1", "ship-1"]);
  });

  it("drops a decision whose row could not be read", () => {
    // `missing` means the lookup ran and the row was not there. Passing one on
    // would let a card render a forecast it never actually read.
    const stops = [{ items: [D("ok"), D("gone", true)] }];
    expect(decisionsForGrading(stops).map((d) => d.artifactId)).toEqual(["ok"]);
  });

  it("keeps every other kind out", () => {
    const stops = [{ items: [other("learning"), other("signal"), D("keep"), other("task")] }];
    expect(decisionsForGrading(stops).map((d) => d.artifactId)).toEqual(["keep"]);
  });

  it("is empty rather than undefined when there is nothing to search", () => {
    // The pane calls this while its read is still in flight.
    expect(decisionsForGrading(undefined)).toEqual([]);
    expect(decisionsForGrading([])).toEqual([]);
    expect(decisionsForGrading([{ items: [] }])).toEqual([]);
  });
});

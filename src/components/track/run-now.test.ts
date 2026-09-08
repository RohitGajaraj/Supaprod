import { describe, expect, it } from "bun:test";
import { nextStation, runNow, type NowInput, type NowTrack } from "./run-now";

const track = (over: Partial<NowTrack> = {}): NowTrack => ({
  status: "open",
  station: "build",
  hold: null,
  holdReason: null,
  holdBecause: null,
  drivenAt: "2026-09-04T10:00:00Z",
  deferredUntil: null,
  attempts: 0,
  route: { path: ["sense", "decide", "define", "design", "build", "ship", "learn"] },
  ...over,
});

const input = (over: Partial<NowInput> = {}): NowInput => ({
  track: track(),
  loading: false,
  feedDead: false,
  live: false,
  currentTool: null,
  seats: [],
  legsLeft: null,
  horizon: null,
  gradableBySource: null,
  shippedAt: null,
  verdict: null,
  nowMs: Date.parse("2026-09-08T10:00:00Z"),
  ...over,
});

describe("runNow picks one register, on purpose", () => {
  it("names the working seat and what it is doing, and what comes next", () => {
    const now = runNow(
      input({
        live: true,
        seats: [{ name: "Studio", waiting: false }],
        currentTool: "repo.read",
        legsLeft: 3,
      }),
    );
    expect(now.register).toBe("working");
    expect(now.status).toBe("agent");
    expect(now.pulse).toBe(true);
    expect(now.headline.startsWith("Studio is ")).toBe(true);
    expect(now.line).toContain("Next: Ship.");
    expect(now.line).toContain("3 automatic steps left");
  });

  it("calls a run that is live in production and waiting for its date QUIET, not a stoppage", () => {
    const now = runNow(
      input({
        track: track({ station: "learn", holdReason: "needs-evidence", hold: "Learn is waiting." }),
        horizon: "2026-09-21",
        shippedAt: "2026-09-04T06:58:00Z",
      }),
    );
    expect(now.register).toBe("scheduled");
    expect(now.status).toBe("quiet");
    expect(now.headline).toContain("Live in production");
    expect(now.line).toContain("Nothing here needs you until then.");
    expect(now.headline).not.toContain("stopped");
  });

  it("is the person's when a call is in front of them", () => {
    const now = runNow(
      input({
        track: track({ holdReason: "waiting-on-a-person", hold: "A call is in front of you." }),
      }),
    );
    expect(now.register).toBe("you");
    expect(now.status).toBe("you");
  });

  it("says stopped, in the person's colour, when nothing will pick it up again", () => {
    const now = runNow(input({ track: track({ holdReason: "given-up", hold: "It gave up." }) }));
    expect(now.register).toBe("stopped");
    expect(now.status).toBe("you");
    expect(now.headline).toBe("Stopped at Build.");
  });

  it("holds, in amber, on a condition that must change", () => {
    const now = runNow(
      input({
        track: track({
          station: "design",
          holdReason: "waiting-on-another-run",
          hold: "Design is waiting on another run that holds the same file.",
          attempts: 1,
        }),
      }),
    );
    expect(now.register).toBe("held");
    expect(now.status).toBe("hold");
    expect(now.line).toContain("It last moved");
  });

  it("says a person stopped it before it says anything about a hold", () => {
    const now = runNow(
      input({ track: track({ holdReason: "paused", holdBecause: "Stopped by you." }) }),
    );
    expect(now.register).toBe("paused");
    expect(now.headline).toBe("You stopped this.");
  });

  it("is finished with the verdict when the run is done", () => {
    const now = runNow(input({ track: track({ status: "done" }), verdict: "held" }));
    expect(now.register).toBe("finished");
    expect(now.status).toBe("pass");
    expect(now.line).toContain("did what you said");
  });

  it("is ready, quietly, on work never driven", () => {
    const now = runNow(input({ track: track({ drivenAt: null, station: "sense" }) }));
    expect(now.register).toBe("ready");
    expect(now.status).toBe("quiet");
  });

  it("reads before it claims anything", () => {
    expect(runNow(input({ loading: true, track: null })).register).toBe("reading");
    expect(runNow(input({ feedDead: true })).register).toBe("unread");
  });
});

describe("nextStation follows the route's own path", () => {
  it("skips waived stations because they are not on the path", () => {
    expect(nextStation({ station: "define", route: { path: ["define", "build", "ship"] } })).toBe(
      "build",
    );
    expect(nextStation({ station: "ship", route: { path: ["define", "build", "ship"] } })).toBe(
      null,
    );
  });
});

describe("the calendar wait names the source gap inside it", () => {
  it("stays quiet while the date is ahead, and says what closes the gap", () => {
    const now = runNow(
      input({
        track: track({ station: "learn", holdReason: "needs-evidence", hold: "Learn is waiting." }),
        horizon: "2026-09-21",
        shippedAt: "2026-09-04T06:58:00Z",
        gradableBySource: false,
      }),
    );
    expect(now.register).toBe("scheduled");
    expect(now.status).toBe("quiet");
    expect(now.line).toContain("connect a source before then");
    expect(now.line).toContain("grade it yourself on the day");
  });
});

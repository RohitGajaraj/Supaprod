/**
 * P-14 (A-QUEUE.md ruling): "The ranking's home is Start's *Or start one of
 * these* (top three by ICE)." `jobFromOpportunity` is the mapping this needs
 * to prove; the component tests below prove real bets replace the static
 * examples rather than sitting beside them, and that an empty workspace
 * keeps the examples it was built for.
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "bun:test";
import { ExampleJobs, jobFromOpportunity, shippedLabel, EXAMPLE_JOBS } from "./ExampleJobs";
import type { TopOpportunity } from "@/lib/discovery.functions";

afterEach(cleanup);

const bet = (over: Partial<TopOpportunity> = {}): TopOpportunity => ({
  id: "o-1",
  title: "Off-hours latency",
  problem: "Requests time out past 30s outside business hours.",
  iceScore: 6.7,
  shipped: null,
  ...over,
});

describe("jobFromOpportunity: a real bet in the composer's own shape", () => {
  it("carries the bet's own title and problem, unchanged", () => {
    const job = jobFromOpportunity(bet());
    expect(job.sentence).toBe("Off-hours latency");
    expect(job.sub).toBe("Requests time out past 30s outside business hours.");
  });

  it("is existing-feature, never new-capability, so origin (the problem) reaches the track", () => {
    expect(jobFromOpportunity(bet()).shape).toBe("existing-feature");
  });
});

describe("ExampleJobs: real bets replace the examples, they do not join them", () => {
  it("shows the static examples when there are no bets", () => {
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} />);
    expect(screen.getByText(EXAMPLE_JOBS[0]!.sentence)).toBeDefined();
    expect(screen.queryByText("Off-hours latency")).toBeNull();
  });

  it("shows real bets instead of the examples once any exist", () => {
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} bets={[bet()]} />);
    expect(screen.getByText("Off-hours latency")).toBeDefined();
    expect(screen.queryByText(EXAMPLE_JOBS[0]!.sentence)).toBeNull();
  });

  it("names the section for what it is showing, examples or ranked bets", () => {
    const { unmount } = render(<ExampleJobs onStart={() => {}} onUse={() => {}} />);
    expect(screen.getByLabelText("Example sentences")).toBeDefined();
    unmount();
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} bets={[bet()]} />);
    expect(screen.getByLabelText("Ranked bets")).toBeDefined();
  });

  it("pressing a bet's Start it calls onStart with that bet's job shape", () => {
    let started: string | undefined;
    render(
      <ExampleJobs
        onStart={(job) => {
          started = job.sentence;
        }}
        onUse={() => {}}
        bets={[bet({ title: "Cut the checkout drop-off" })]}
      />,
    );
    screen.getByRole("button", { name: "Start it" }).click();
    expect(started).toBe("Cut the checkout drop-off");
  });
});

/**
 * ── P-33: AN EXAMPLE MUST NOT BE ABLE TO FILE A RUN ───────────────────────
 * Both lists rendered through one `PickCard` under one "Or start one of these."
 * with one **Start it**, and both called `onStart`, which starts a run. So the
 * three sentences we hard-coded were offered as if the product had ranked them
 * for this workspace, and pressing one filed real work about a checkout or a
 * sign-up form the person may not have.
 *
 * These four assertions are the ones somebody would have to delete to bring
 * that back.
 */
describe("an example is a sentence to edit, a bet is work to start", () => {
  it("offers the examples as sentences to use, never as runs to start", () => {
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} />);
    expect(screen.getAllByRole("button", { name: "Use this sentence" }).length).toBe(
      EXAMPLE_JOBS.length,
    );
    expect(screen.queryByRole("button", { name: "Start it" })).toBeNull();
  });

  it("never calls onStart from an example, by either door", () => {
    // Both doors, because the card is pressable as well as its button, and the
    // card is the one that used to be wired straight to onStart.
    let starts = 0;
    const used: string[] = [];
    render(
      <ExampleJobs
        onStart={() => {
          starts += 1;
        }}
        onUse={(job) => used.push(job.sentence)}
      />,
    );
    screen.getAllByRole("button", { name: "Use this sentence" })[0]!.click();
    screen.getByText(EXAMPLE_JOBS[0]!.sentence).click();
    expect(starts).toBe(0);
    expect(used).toEqual([EXAMPLE_JOBS[0]!.sentence, EXAMPLE_JOBS[0]!.sentence]);
  });

  it("never calls onUse from a real bet, which IS the workspace's own work", () => {
    let used = 0;
    render(<ExampleJobs onStart={() => {}} onUse={() => (used += 1)} bets={[bet()]} />);
    screen.getByRole("button", { name: "Start it" }).click();
    expect(used).toBe(0);
  });

  it("does not say the examples were ranked, because nothing ranked them", () => {
    const { unmount } = render(<ExampleJobs onStart={() => {}} onUse={() => {}} />);
    expect(screen.queryByText(/ranked/i)).toBeNull();
    expect(screen.getByText(/examples of sentences this takes/i)).toBeDefined();
    unmount();
    // And the bets, which WERE ranked, may say so.
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} bets={[bet()]} />);
    expect(screen.getByText(/ranked from what has arrived/i)).toBeDefined();
  });
});

/*
 * P-126 (A-QUEUE.md): a bet whose spec already shipped is not offered as a
 * start -- its card reads "Shipped 12:28" and opens the run instead.
 */
describe("shippedLabel", () => {
  it("reads the UTC clock the spec shipped at", () => {
    expect(shippedLabel("2026-09-04T12:28:00.000Z")).toBe("Shipped 12:28");
  });
});

describe("a shipped bet's card reads what happened, not an offer to redo it", () => {
  const SHIPPED = bet({
    title: "Skip the address re-confirm when nothing changed",
    shipped: { at: "2026-09-04T12:28:00.000Z", trackId: "track-1" },
  });

  it("shows Shipped HH:MM instead of Start it", () => {
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} bets={[SHIPPED]} />);
    expect(screen.getByText("Shipped 12:28")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Start it" })).toBeNull();
  });

  it("still shows an unshipped bet's Start it, on the same list", () => {
    render(<ExampleJobs onStart={() => {}} onUse={() => {}} bets={[SHIPPED, bet({ id: "o-2" })]} />);
    expect(screen.getByRole("button", { name: "Start it" })).toBeDefined();
    expect(screen.getByText("Shipped 12:28")).toBeDefined();
  });

  it("pressing See the run calls onOpenRun with the shipped track, never onStart", () => {
    let opened: string | undefined;
    let started = 0;
    render(
      <ExampleJobs
        onStart={() => (started += 1)}
        onUse={() => {}}
        onOpenRun={(trackId) => {
          opened = trackId;
        }}
        bets={[SHIPPED]}
      />,
    );
    screen.getByRole("button", { name: "See the run" }).click();
    expect(opened).toBe("track-1");
    expect(started).toBe(0);
    // The card itself is the second door to the same act.
    screen.getByText(SHIPPED.title).click();
    expect(opened).toBe("track-1");
    expect(started).toBe(0);
  });

  it("names no run door when the track cannot be resolved", () => {
    render(
      <ExampleJobs
        onStart={() => {}}
        onUse={() => {}}
        bets={[bet({ shipped: { at: "2026-09-04T12:28:00.000Z", trackId: null } })]}
      />,
    );
    expect(screen.getByText("Shipped 12:28")).toBeDefined();
    expect(screen.queryByRole("button", { name: "See the run" })).toBeNull();
  });
});

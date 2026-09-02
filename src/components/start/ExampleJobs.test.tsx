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
import { ExampleJobs, jobFromOpportunity, EXAMPLE_JOBS } from "./ExampleJobs";
import type { TopOpportunity } from "@/lib/discovery.functions";

afterEach(cleanup);

const bet = (over: Partial<TopOpportunity> = {}): TopOpportunity => ({
  id: "o-1",
  title: "Off-hours latency",
  problem: "Requests time out past 30s outside business hours.",
  iceScore: 6.7,
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
    render(<ExampleJobs onStart={() => {}} />);
    expect(screen.getByText(EXAMPLE_JOBS[0]!.sentence)).toBeDefined();
    expect(screen.queryByText("Off-hours latency")).toBeNull();
  });

  it("shows real bets instead of the examples once any exist", () => {
    render(<ExampleJobs onStart={() => {}} bets={[bet()]} />);
    expect(screen.getByText("Off-hours latency")).toBeDefined();
    expect(screen.queryByText(EXAMPLE_JOBS[0]!.sentence)).toBeNull();
  });

  it("names the section for what it is showing, examples or ranked bets", () => {
    const { unmount } = render(<ExampleJobs onStart={() => {}} />);
    expect(screen.getByLabelText("Example jobs")).toBeDefined();
    unmount();
    render(<ExampleJobs onStart={() => {}} bets={[bet()]} />);
    expect(screen.getByLabelText("Ranked bets")).toBeDefined();
  });

  it("pressing a bet's Start it calls onStart with that bet's job shape", () => {
    let started: string | undefined;
    render(
      <ExampleJobs
        onStart={(job) => {
          started = job.sentence;
        }}
        bets={[bet({ title: "Cut the checkout drop-off" })]}
      />,
    );
    screen.getByRole("button", { name: "Start it" }).click();
    expect(started).toBe("Cut the checkout drop-off");
  });
});

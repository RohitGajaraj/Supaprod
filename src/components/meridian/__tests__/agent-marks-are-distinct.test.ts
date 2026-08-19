/**
 * No two agents may share a mark, because shape is the only thing that says which
 * agent this is.
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────
 * Founder: "it would be great if you could differentiate the logos for Archivist,
 * Reactor, Guide, Verify, and Critique. All five hold the same logo."
 *
 * The cause is written in `agent-glyphs.tsx`'s own header: it was built for "thirteen
 * distinct silhouettes" and the catalog now carries eighteen active agents. The five
 * added since fell through `BY_NAME` to `Unknown` -- so the single mark that means "no
 * drawing exists" was standing in for a fifth of the crew.
 *
 * That matters more here than it would in most products. This system deliberately
 * refuses to encode agent identity as colour (law 4: identity is shape, status is hue,
 * and the colour ramp has been removed three times). Shape is therefore not decoration
 * on top of a colour, it is the WHOLE encoding -- so two agents sharing a silhouette
 * are, to a reader, the same agent.
 *
 * This test fails the moment a nineteenth agent is added without a drawing, which is
 * the only way that stays true.
 */
import { describe, expect, it } from "bun:test";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { SPECIALIST_CATALOG, agentDisplayName } from "@/lib/agent-vocabulary";

const ACTIVE = SPECIALIST_CATALOG.filter((entry) => entry.status === "active");

describe("every active agent has a mark of its own", () => {
  it("has active agents to check, so a broken catalog read cannot pass this file", () => {
    // Without this, an empty ACTIVE would make every assertion below vacuously true.
    expect(ACTIVE.length).toBeGreaterThan(12);
  });

  it("draws a distinct component for each display name", () => {
    /*
     * Keyed on DISPLAY NAME, matching the module, because the catalog rolls several
     * slugs onto one identity on purpose (discovery-scout, discovery, scout and
     * competitor-watcher are all "Watch"). Those sharing a mark is correct; two
     * different names sharing one is the bug.
     */
    const byName = new Map<string, () => unknown>();
    for (const entry of ACTIVE) byName.set(agentDisplayName(entry.slug), glyphForSlug(entry.slug));

    const marks = new Map<unknown, string[]>();
    for (const [name, glyph] of byName) {
      marks.set(glyph, [...(marks.get(glyph) ?? []), name]);
    }

    const shared = [...marks.values()].filter((names) => names.length > 1);
    expect(
      shared.map((names) => names.join(" + ")),
      "these agents share one silhouette, so a reader cannot tell them apart",
    ).toEqual([]);
  });

  it("gives nobody the fallback mark", () => {
    /*
     * THE ASSERTION THAT WOULD HAVE CAUGHT THE ORIGINAL FIVE. Distinctness alone is not
     * enough: if every missing agent resolves to `Unknown`, they are distinct from the
     * DRAWN ones and identical to each other. This checks the fallback is unused, by
     * comparing against a slug the catalog certainly does not hold.
     */
    const fallback = glyphForSlug("a-slug-that-does-not-exist-anywhere");
    const onFallback = ACTIVE.filter((entry) => glyphForSlug(entry.slug) === fallback).map(
      (entry) => agentDisplayName(entry.slug),
    );
    expect(onFallback, "these agents have no drawing and share the placeholder").toEqual([]);
  });

  it("keeps the five the founder named specifically", () => {
    // Named rather than left to the general rule, so a regression reports the same
    // words he used and nobody has to re-derive which five.
    for (const name of ["Archivist", "Reactor", "Guide", "Verify", "Critique"]) {
      const entry = ACTIVE.find((candidate) => agentDisplayName(candidate.slug) === name);
      expect(entry, `${name} is no longer an active agent`).toBeDefined();
      const fallback = glyphForSlug("a-slug-that-does-not-exist-anywhere");
      expect(glyphForSlug(entry!.slug), `${name} is back on the placeholder`).not.toBe(fallback);
    }
  });
});

/**
 * ── THE STACK'S STATE, ADDED 2026-08-19 (K-08) ──────────────────────────────
 *
 * `MarkStack` took ONE state for the whole stack, so it could not render three
 * agents in three states. That is not an edge case in a seven-station loop, it is
 * the normal case: Watch has finished, Research is still going, Challenge is
 * waiting on a person. A stack that can only say one thing about all three has to
 * say the least true of them.
 *
 * TWO PROPERTIES ARE UNDER TEST AND THE SECOND IS THE IMPORTANT ONE.
 *
 *   1. Three states render at once.
 *   2. THE ONE-BLINK RULE STILL HOLDS THROUGH THE NEW DOOR. `gate` is the only
 *      animated state and exactly one mark on a screen may wear it. The old rule
 *      could be read off the index because there was one state; a per-mark state
 *      is a way for a caller to hand three marks `gate` individually, and if the
 *      rule still only looked at the shared prop, four marks would blink in
 *      unison again. So the rule runs over the RESOLVED states.
 *
 * `createElement` rather than JSX because this file is `.ts` and predates the
 * change. The queue item names it `.tsx`, which it is not; renaming it would
 * break the read-tracking of a file two other guards live in, for no gain.
 *
 * State is read off the ACCESSIBLE NAME rather than off a class, because that is
 * where `AgentMark` puts it (`"Watch, gate"`), and a reader who cannot separate
 * orchid from orchid-dim gets the state from exactly there.
 */
import { createElement } from "react";
import { render } from "@testing-library/react";

import { MarkStack, type StackAgent } from "../marks";

/** Every mark's state, in DOM order, read the way a screen reader would. */
function statesOf(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="img"]')].map((node) => {
    const label = node.getAttribute("aria-label") ?? "";
    const at = label.lastIndexOf(", ");
    return at === -1 ? "idle" : label.slice(at + 2);
  });
}

function stack(agents: StackAgent[], state?: StackAgent["state"]) {
  return render(createElement(MarkStack, state ? { agents, state } : { agents }));
}

describe("a stack can say three different things at once", () => {
  it("renders three marks in three states", () => {
    const { container } = stack([
      { slug: "discovery-scout", state: "verified" },
      { slug: "researcher", state: "running" },
      { slug: "critic", state: "gate" },
    ]);

    expect(statesOf(container)).toEqual(["verified", "running", "gate"]);
  });

  it("animates only the one that is asking, and only that one", () => {
    const { container } = stack([
      { slug: "discovery-scout", state: "verified" },
      { slug: "researcher", state: "running" },
      { slug: "critic", state: "gate" },
    ]);

    const animated = [...container.querySelectorAll('[role="img"]')]
      .map((node) => node.getAttribute("style") ?? "")
      .map((style) => (style.includes("mrd-attention") ? "moves" : "still"));

    // `running` is ambient and breathes; `gate` blinks faster; `verified` is an
    // outcome and has nothing left to wait for, so it must be still.
    expect(animated).toEqual(["still", "moves", "moves"]);
  });

  it("falls back to the stack's state for any mark that does not carry one", () => {
    const { container } = stack(
      [{ slug: "discovery-scout" }, { slug: "researcher", state: "failed" }, { slug: "critic" }],
      "running",
    );

    expect(statesOf(container)).toEqual(["running", "failed", "running"]);
  });
});

describe("the one-blink rule survives the new door", () => {
  it("gives gate to the first mark that asks and dresses the rest as waiting", () => {
    const { container } = stack([
      { slug: "discovery-scout", state: "gate" },
      { slug: "researcher", state: "gate" },
      { slug: "critic", state: "gate" },
    ]);

    expect(
      statesOf(container),
      "three marks are blinking in unison, which is the defect this rule exists for",
    ).toEqual(["gate", "waiting", "waiting"]);
  });

  it("passes the blink to the first ASKING mark, not to the first mark", () => {
    /*
     * The subtle half. Under the old signature "first wins" was the same as
     * "index zero wins". It is not any more: if the crew's finished agent is
     * listed first, the blink belongs to whoever is actually waiting.
     */
    const { container } = stack([
      { slug: "discovery-scout", state: "verified" },
      { slug: "researcher", state: "gate" },
      { slug: "critic", state: "gate" },
    ]);

    expect(statesOf(container)).toEqual(["verified", "gate", "waiting"]);
  });

  it("spends the blink only on a mark that is actually drawn", () => {
    /*
     * The stack draws four. Resolving before slicing would let a fifth agent claim
     * the one blink and leave the four on screen all showing `waiting`, which
     * reads as a queue with nothing at the front of it.
     */
    const { container } = stack([
      { slug: "discovery-scout", state: "running" },
      { slug: "researcher", state: "running" },
      { slug: "critic", state: "running" },
      { slug: "builder", state: "running" },
      { slug: "planner", state: "gate" },
    ]);

    expect(statesOf(container)).toEqual(["running", "running", "running", "running"]);
  });
});

describe("every existing caller renders exactly as it did", () => {
  it("keeps the shared-state signature working untouched", () => {
    // `AppFrame.tsx:1417` and `AgentRelay.tsx:145` both call it exactly like this.
    const { container } = stack([{ slug: "discovery-scout" }, { slug: "researcher" }], "running");
    expect(statesOf(container)).toEqual(["running", "running"]);
  });

  it("reduces to the old gate behaviour when the state is shared", () => {
    // `AppFrame.tsx:1419` passes a shared `gate` over a list of waiting agents.
    const { container } = stack(
      [{ slug: "discovery-scout" }, { slug: "researcher" }, { slug: "critic" }],
      "gate",
    );
    expect(statesOf(container)).toEqual(["gate", "waiting", "waiting"]);
  });

  it("still draws a single agent without the stack wrapper", () => {
    const { container } = stack([{ slug: "discovery-scout" }], "gate");
    expect(container.querySelectorAll('[role="img"]').length).toBe(1);
    expect(statesOf(container)).toEqual(["gate"]);
  });

  it("still draws nothing at all for an empty crew", () => {
    const { container } = stack([]);
    expect(container.innerHTML).toBe("");
  });

  it("still caps the stack at four", () => {
    const { container } = stack(
      Array.from({ length: 9 }, () => ({ slug: "researcher" })),
      "running",
    );
    expect(container.querySelectorAll('[role="img"]').length).toBe(4);
  });
});

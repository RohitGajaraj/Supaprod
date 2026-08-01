/**
 * The spine route's rules, tested without a database.
 *
 * The invariants worth protecting are not "does the array have the right
 * length". They are the two arguments the module was built on: a waiver has to
 * be able to expire, and work that enters below Discover has to say where it
 * came from. Both are tested directly, because both are the difference between
 * a route and a checklist.
 */

import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";
import {
  applyTrigger,
  describeRoute,
  fullRoute,
  inSpineOrder,
  nextStation,
  previousStation,
  reopen,
  suggestRoute,
  validateRoute,
  waive,
  waiverFor,
  type SpineRoute,
} from "./route";

describe("fullRoute", () => {
  it("visits every station, in spine order, waiving nothing", () => {
    const r = fullRoute();
    expect(r.path).toEqual(AGENT_STATION_ORDER);
    expect(r.waived).toEqual([]);
    expect(r.entry).toBe("sense");
    expect(validateRoute(r)).toEqual([]);
  });
});

describe("inSpineOrder", () => {
  it("sorts by the spine, never by arrival", () => {
    expect(inSpineOrder(["ship", "sense", "build"])).toEqual(["sense", "build", "ship"]);
  });
});

describe("nextStation", () => {
  it("skips over a waived station rather than stopping at it", () => {
    // under-the-hood waives design, so build follows define directly.
    const r = suggestRoute("under-the-hood", "A slow query on the billing page");
    expect(nextStation(r, "define")).toBe("build");
  });

  it("returns null at the end of the route, which is an answer not a gap", () => {
    const r = fullRoute();
    expect(nextStation(r, "learn")).toBeNull();
  });

  it("answers from a station that is not itself on the path", () => {
    // An agent standing at a waived station still has to know where to hand off.
    const r = suggestRoute("incident-fix", "Checkout is returning 500s");
    expect(r.path).not.toContain("design");
    expect(nextStation(r, "design")).toBe("build");
  });
});

describe("previousStation", () => {
  it("names the station the work actually came from on this route", () => {
    const r = suggestRoute("under-the-hood", "A slow query");
    expect(previousStation(r, "build")).toBe("define");
  });

  it("is null at the entry", () => {
    expect(previousStation(fullRoute(), "sense")).toBeNull();
  });
});

describe("waive", () => {
  it("takes the station off the path and records who and why", () => {
    const r = waive(fullRoute(), "design", {
      reason: "Nothing a user sees changes",
      by: "human",
      reopensWhen: "touches-interface",
    });
    expect(r.path).not.toContain("design");
    expect(waiverFor(r, "design")?.by).toBe("human");
    expect(validateRoute(r)).toEqual([]);
  });

  it("is idempotent, so a second waiver cannot duplicate the record", () => {
    const once = waive(fullRoute(), "design", {
      reason: "Nothing a user sees changes",
      by: "policy",
      reopensWhen: "touches-interface",
    });
    const twice = waive(once, "design", {
      reason: "something else",
      by: "human",
      reopensWhen: "never",
    });
    expect(twice.waived).toHaveLength(1);
    expect(waiverFor(twice, "design")?.by).toBe("policy");
  });

  it("does not mutate the route it was given", () => {
    const before = fullRoute();
    waive(before, "design", { reason: "x", by: "policy", reopensWhen: "never" });
    expect(before.path).toEqual(AGENT_STATION_ORDER);
  });
});

describe("reopen", () => {
  it("puts the station back in SPINE order, not at the end", () => {
    // The case the whole module exists for: Build discovers an interface change,
    // so Design has to come back BEHIND the work rather than after it.
    const r = reopen(suggestRoute("under-the-hood", "A slow query"), "design");
    expect(r.path).toEqual(inSpineOrder(r.path));
    expect(r.path.indexOf("design")).toBeLessThan(r.path.indexOf("build"));
    expect(waiverFor(r, "design")).toBeNull();
  });

  it("refuses to reopen a hard human waiver on its own", () => {
    const r = waive(fullRoute(), "design", {
      reason: "We are not touching the interface, full stop",
      by: "human",
      reopensWhen: "never",
    });
    expect(reopen(r, "design").path).not.toContain("design");
  });

  it("honours an explicit human override of a hard waiver", () => {
    const r = waive(fullRoute(), "design", {
      reason: "We are not touching the interface, full stop",
      by: "human",
      reopensWhen: "never",
    });
    expect(reopen(r, "design", { force: true }).path).toContain("design");
  });

  it("is a no-op for a station that was never waived", () => {
    const r = fullRoute();
    expect(reopen(r, "design")).toBe(r);
  });
});

describe("applyTrigger", () => {
  it("reopens every station whose waiver was contingent on that trigger", () => {
    const r = applyTrigger(
      suggestRoute("incident-fix", "Checkout is returning 500s"),
      "touches-interface",
    );
    expect(r.path).toContain("design");
  });

  it("leaves waivers contingent on a different trigger alone", () => {
    const r = applyTrigger(suggestRoute("under-the-hood", "A slow query"), "customer-visible");
    expect(r.path).not.toContain("design");
  });

  it("never reopens a hard waiver", () => {
    const r = applyTrigger(suggestRoute("incident-fix", "Checkout 500s"), "never");
    expect(r.path).not.toContain("sense");
  });
});

describe("the origin rule", () => {
  it("rejects work that enters below Discover with nothing to say for itself", () => {
    const codes = validateRoute(suggestRoute("existing-feature")).map((p) => p.code);
    expect(codes).toContain("origin-required");
  });

  it("accepts the same route once it states where it came from", () => {
    const r = suggestRoute("existing-feature", "Two enterprise accounts asked for SSO in Q3");
    expect(validateRoute(r)).toEqual([]);
  });

  it("does not ask work that started at Discover for an origin", () => {
    expect(validateRoute(fullRoute())).toEqual([]);
  });
});

describe("validateRoute", () => {
  it("catches a path that runs backwards through the spine", () => {
    const bad: SpineRoute = { entry: "sense", path: ["build", "decide"], waived: [], origin: null };
    expect(validateRoute(bad).map((p) => p.code)).toContain("out-of-order");
  });

  it("catches a station that is both waived and on the path", () => {
    const bad: SpineRoute = {
      entry: "sense",
      path: [...AGENT_STATION_ORDER],
      waived: [{ station: "design", reason: "x", by: "policy", reopensWhen: "never" }],
      origin: null,
    };
    expect(validateRoute(bad).map((p) => p.code)).toContain("waived-and-on-path");
  });

  it("catches a waiver with no reason, because an unexplained skip is not a decision", () => {
    const bad: SpineRoute = {
      entry: "sense",
      path: AGENT_STATION_ORDER.filter((s) => s !== "design"),
      waived: [{ station: "design", reason: "   ", by: "agent", reopensWhen: "never" }],
      origin: null,
    };
    expect(validateRoute(bad).map((p) => p.code)).toContain("waiver-without-reason");
  });

  it("refuses a route where nothing will ever grade the work", () => {
    const bad: SpineRoute = {
      entry: "sense",
      path: ["sense", "decide"],
      waived: [],
      origin: null,
    };
    expect(validateRoute(bad).map((p) => p.code)).toContain("learn-missing");
  });

  it("catches an empty path", () => {
    const bad: SpineRoute = { entry: "sense", path: [], waived: [], origin: null };
    expect(validateRoute(bad).map((p) => p.code)).toContain("empty-path");
  });
});

describe("suggestRoute", () => {
  it("keeps Learn on every shape, because a change nobody grades is how learning stops", () => {
    for (const shape of [
      "new-capability",
      "existing-feature",
      "interface-change",
      "under-the-hood",
      "incident-fix",
    ] as const) {
      expect(suggestRoute(shape, "why").path).toContain("learn");
    }
  });

  it("produces a valid route for every shape once an origin is given", () => {
    for (const shape of [
      "new-capability",
      "existing-feature",
      "interface-change",
      "under-the-hood",
      "incident-fix",
    ] as const) {
      expect(validateRoute(suggestRoute(shape, "a stated reason"))).toEqual([]);
    }
  });

  it("gives every waiver a reason and a way back", () => {
    for (const w of suggestRoute("under-the-hood", "why").waived) {
      expect(w.reason.trim().length).toBeGreaterThan(0);
      expect(w.reopensWhen).toBeTruthy();
    }
  });

  it("lets an existing product enter at Plan rather than marching it through discovery", () => {
    const r = suggestRoute("existing-feature", "Two accounts asked for SSO");
    expect(r.entry).toBe("define");
    expect(r.path).not.toContain("sense");
    expect(r.path).toContain("define");
  });

  it("routes an incident straight to Build and still ships and grades it", () => {
    const r = suggestRoute("incident-fix", "Checkout is returning 500s");
    expect(r.entry).toBe("build");
    expect(r.path).toEqual(["build", "ship", "learn"]);
  });
});

describe("describeRoute", () => {
  it("says all seven when nothing is waived", () => {
    expect(describeRoute(fullRoute())).toContain("All seven");
  });

  it("names what was waived rather than counting it", () => {
    expect(describeRoute(suggestRoute("under-the-hood", "why"))).toContain("design");
  });
});

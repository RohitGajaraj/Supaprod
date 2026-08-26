/**
 * THE FAQ SPENT TWELVE DAYS TELLING BUYERS THAT LINEAR AND JIRA DO NOT WORK.
 *
 * They did. `figma`, `jira` and `linear` got real adapters on 2026-08-15 and the
 * mail family on 2026-08-26 (F-81). The public answer describing them was
 * written before that, was true when written, and nothing in the repo noticed
 * when it stopped being true. It named the two integrations a product team is
 * most likely to require and said they returned nothing.
 *
 * That is the sixth outward surface found this night where copy and code
 * disagreed, and every one of them was true on the day it was written. The
 * defect is not carelessness, it is that a sentence and the code it describes
 * have no connection, so nothing can fail when they part company.
 *
 * SO THE FAQ NOW DERIVES ITS ANSWER from `PROVIDERS_WITHOUT_ADAPTERS`, and this
 * test is what makes that safe rather than merely tidier. Deriving from a second
 * hand-maintained list would have moved the drift rather than removed it: two
 * lists that can disagree are worse than one list that is wrong, because the
 * second one looks authoritative.
 *
 * This asserts the client-safe list and the real server adapter map are the same
 * set. Ship an adapter and forget to update the list, and this fails here rather
 * than on a page a buyer is reading.
 */
import { describe, it, expect } from "bun:test";
import { CONNECTOR_ADAPTERS } from "@/lib/connectors/providers/index.server";
import {
  PROVIDERS_WITHOUT_ADAPTERS,
  providerReturnsSignals,
  CONNECTOR_REGISTRY,
  type ProviderId,
} from "@/lib/connectors/registry";

/**
 * A stub is recognised by IDENTITY, not by name. Every stubbed provider points
 * at the same single `stubAdapter` object, so comparing references finds them
 * without this test needing to know what the placeholder is called or what it
 * returns. A name check would pass the day somebody renames it.
 */
function stubbedProviders(): Set<ProviderId> {
  const ids = Object.keys(CONNECTOR_ADAPTERS) as ProviderId[];
  const counts = new Map<unknown, ProviderId[]>();
  for (const id of ids) {
    const adapter = CONNECTOR_ADAPTERS[id];
    counts.set(adapter, [...(counts.get(adapter) ?? []), id]);
  }
  // The shared placeholder is the only adapter object used by more than one
  // provider. Real adapters are one per provider by construction.
  for (const [, sharedIds] of counts) {
    if (sharedIds.length > 1) return new Set(sharedIds);
  }
  return new Set();
}

describe("the public answer about connectors matches the adapters that exist", () => {
  it("PROVIDERS_WITHOUT_ADAPTERS is exactly the set that points at the shared stub", () => {
    const actual = [...stubbedProviders()].sort();
    const claimed = [...PROVIDERS_WITHOUT_ADAPTERS].sort();
    expect(claimed).toEqual(actual);
  });

  it("every provider in the list is a real registry id, so a typo cannot hide here", () => {
    for (const id of PROVIDERS_WITHOUT_ADAPTERS) {
      expect(CONNECTOR_REGISTRY[id]).toBeDefined();
    }
  });

  it("providerReturnsSignals answers for every provider the registry declares", () => {
    const ids = Object.keys(CONNECTOR_REGISTRY) as ProviderId[];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(typeof providerReturnsSignals(id)).toBe("boolean");
    }
  });

  it("the working set is not empty, which would mean the stub check inverted", () => {
    const ids = Object.keys(CONNECTOR_REGISTRY) as ProviderId[];
    const working = ids.filter(providerReturnsSignals);
    // Not pinned to a number: a count here would be one more thing to update,
    // which is the defect this file exists to stop. What must hold is that most
    // providers work and the exceptions are the short list.
    expect(working.length).toBeGreaterThan(PROVIDERS_WITHOUT_ADAPTERS.length);
  });
});

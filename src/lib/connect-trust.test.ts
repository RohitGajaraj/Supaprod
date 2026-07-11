import { describe, expect, it } from "bun:test";
import { trustCopyFor } from "./connect-trust";
import type { ProviderId } from "./connectors/registry";

const ALL_PROVIDERS: ProviderId[] = [
  "github",
  "linear",
  "notion",
  "google_docs",
  "google_calendar",
  "gmail",
  "google_tasks",
  "microsoft_outlook",
  "microsoft_mail",
  "figma",
  "jira",
  "firecrawl",
  "intercom",
  "stripe",
  "slack",
  "zendesk",
  "hubspot",
  "salesforce",
  "canny",
  "productboard",
];

describe("connect-trust - trustCopyFor", () => {
  it("has non-empty, distinct copy for every registered provider", () => {
    for (const id of ALL_PROVIDERS) {
      const copy = trustCopyFor(id);
      expect(copy.weRead.length).toBeGreaterThan(0);
      expect(copy.weNeverRead.length).toBeGreaterThan(0);
      expect(copy.weRead).not.toBe(copy.weNeverRead);
    }
  });

  it("falls back to a generic answer for an unmapped id without throwing", () => {
    const copy = trustCopyFor("not_a_real_provider" as ProviderId);
    expect(copy.weRead.length).toBeGreaterThan(0);
    expect(copy.weNeverRead.length).toBeGreaterThan(0);
  });
});

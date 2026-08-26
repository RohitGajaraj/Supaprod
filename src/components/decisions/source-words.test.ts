import { describe, expect, it } from "bun:test";

import { sourceWords } from "./source-words";

describe("a stored source name, read by a person", () => {
  it("turns machine punctuation into spaces", () => {
    // The four shapes actually present in `signals.source` on production.
    expect(sourceWords("competitive_research")).toBe("competitive research");
    expect(sourceWords("sales-call")).toBe("sales call");
    expect(sourceWords("workspace_brief")).toBe("workspace brief");
    expect(sourceWords("app-store")).toBe("app store");
  });

  it("leaves the row's own capitals alone", () => {
    /*
     * Title-casing would render `NPS survey` as `Nps Survey`. The stored
     * capitals are the best evidence there is about how a source is written,
     * and inventing a different casing is inventing information.
     */
    expect(sourceWords("NPS survey")).toBe("NPS survey");
    expect(sourceWords("nps")).toBe("nps");
    expect(sourceWords("github")).toBe("github");
  });

  it("passes through what is already words", () => {
    expect(sourceWords("session replay archive")).toBe("session replay archive");
    expect(sourceWords("agent")).toBe("agent");
  });

  it("does not eat a trailing separator into the next word", () => {
    // Defensive: a stray separator should not silently join two names.
    expect(sourceWords("interview_")).toBe("interview_");
  });
});

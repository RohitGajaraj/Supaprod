import { describe, it, expect } from "bun:test";
import { signalEmbeddingText } from "./signal-embedding.server";

describe("signalEmbeddingText", () => {
  it("puts the title first so it survives truncation", () => {
    const out = signalEmbeddingText("CSV export missing", "A customer asked for CSV export.");
    expect(out.startsWith("CSV export missing")).toBe(true);
  });

  it("collapses whitespace so the same complaint wrapped differently embeds identically", () => {
    const a = signalEmbeddingText("Export   is\nbroken", "Users  cannot\t\texport.");
    const b = signalEmbeddingText("Export is broken", "Users cannot export.");
    expect(a).toBe(b);
  });

  it("does not repeat the title when content merely duplicates it", () => {
    const out = signalEmbeddingText("Billing is broken", "Billing is broken");
    expect(out).toBe("Billing is broken");
  });

  it("tolerates null title or content", () => {
    expect(signalEmbeddingText(null, "just content")).toBe("just content");
    expect(signalEmbeddingText("just title", null)).toBe("just title");
    expect(signalEmbeddingText(null, null)).toBe("");
  });

  it("bounds the text it sends to the embedder", () => {
    const out = signalEmbeddingText("t", "x".repeat(50_000));
    expect(out.length).toBeLessThanOrEqual(8_000);
  });

  it("keeps distinct signals distinct", () => {
    const a = signalEmbeddingText("CSV export missing", "Pro users want CSV.");
    const b = signalEmbeddingText("SSO login fails", "Okta handshake times out.");
    expect(a).not.toBe(b);
  });
});

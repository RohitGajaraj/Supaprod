/**
 * ASK MUST NOT ANSWER OUT OF ANOTHER PRODUCT'S RECORD.
 *
 * THE DEFECT THIS PREVENTS. `retrievalProductId` has been a real, working option
 * on `useAskStream` since PC-36 -- it reaches `/api/chat`, which passes it to
 * `match_rag_chunks(for_product)` -- and `AskPane` never set it. So Ask retrieved
 * across every product in the workspace regardless of which one you were
 * standing in. 11 of 17 workspaces already hold more than one product and 7 hold
 * four, so this was live rather than hypothetical, and for an agency running
 * three clients in one workspace it is a confidentiality breach rather than
 * noise. The ruling is agent-first-platform.md 2.3: evidence is product-scoped.
 *
 * WHY THE PERSISTENCE SCOPE IS NOT TESTED HERE, and it is the mistake available
 * in this file. `AskPane` also passes `productId: null`, which forces ONE
 * conversation per session into the workspace bucket. That is deliberate, it has
 * its reasoning written beside it, and it answers a different question: which
 * THREAD you are in, versus which RECORD answers. The last assertion below
 * guards that it stayed null, so a future pass cannot "tidy" the two into one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { retrievalScope } from "../ask-context";

const SRC = join(import.meta.dir, "..", "..");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a product-scoped screen narrows retrieval to that product", () => {
  it("hands the active product id to the retriever", () => {
    const r = retrievalScope({
      productId: "p-relay",
      productName: "Relay",
      manyProducts: true,
    });

    expect(r.productId).toBe("p-relay");
  });

  it("names the product, so the scoping is never silent", () => {
    const r = retrievalScope({
      productId: "p-relay",
      productName: "Relay",
      manyProducts: true,
    });

    expect(r.chip).toBe("Answering from Relay");
    expect(r.detail).toContain("Relay");
  });
});

describe("workspace-wide retrieval where no product resolves", () => {
  it("passes no product, so every product's record is read", () => {
    const r = retrievalScope({ productId: null, productName: null, manyProducts: true });

    expect(r.productId).toBe(null);
  });

  it("says so, in words, rather than leaving the reader to assume", () => {
    const r = retrievalScope({ productId: null, productName: null, manyProducts: true });

    expect(r.chip).toBe("Answering from every product");
    // The two branches must not read the same, or the chip is decoration.
    expect(r.chip).not.toBe(
      retrievalScope({ productId: "p-relay", productName: "Relay", manyProducts: true }).chip,
    );
  });
});

describe("one product is not a boundary", () => {
  it("narrows nothing and draws nothing where the workspace holds one product", () => {
    // `use-workspace.tsx` already rules that the product concept stays invisible
    // until a second product exists. Narrowing here could only drop rows without
    // isolating anything from anything.
    const r = retrievalScope({ productId: "p-only", productName: "Relay", manyProducts: false });

    expect(r.productId).toBe(null);
    expect(r.chip).toBe("");
  });

  it("waits for the name rather than drawing a placeholder", () => {
    // Products load a beat after the workspace. A chip that reads "this product"
    // and then becomes "Relay" is a flicker; retrieval still narrows.
    const r = retrievalScope({ productId: "p-relay", productName: null, manyProducts: true });

    expect(r.productId).toBe("p-relay");
    expect(r.chip).toBe("");
  });
});

describe("the copy a person reads", () => {
  const both = [
    retrievalScope({ productId: "p-relay", productName: "Relay", manyProducts: true }),
    retrievalScope({ productId: null, productName: null, manyProducts: true }),
  ];

  it("carries no em or en dash", () => {
    for (const r of both) {
      expect(r.chip).not.toMatch(/[\u2013\u2014]/);
      expect(r.detail).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("never says 'context', which on a surface means the model's window", () => {
    for (const r of both) {
      expect(`${r.chip} ${r.detail}`.toLowerCase()).not.toContain("context");
    }
  });
});

describe("the wiring, because a working option nobody sets is the whole bug", () => {
  const pane = stripComments(readFileSync(join(SRC, "components", "ask", "AskPane.tsx"), "utf8"));
  const hook = stripComments(readFileSync(join(SRC, "hooks", "use-ask-stream.ts"), "utf8"));

  it("the hook still reads the option, so this guard protects something live", () => {
    expect(hook).toMatch(/options\.retrievalProductId/);
  });

  it("the pane sets it from the resolved scope", () => {
    expect(pane).toMatch(/retrievalProductId:\s*retrieval\.productId/);
  });

  it("the pane draws what it resolved", () => {
    expect(pane).toMatch(/retrieval\.chip/);
  });

  it("leaves the persistence bucket alone", () => {
    // A different concern from retrieval, and the one thing in this area that
    // must not change.
    expect(pane).toMatch(/productId:\s*null/);
  });
});

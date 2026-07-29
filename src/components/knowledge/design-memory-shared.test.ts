import { describe, expect, test } from "bun:test";
import { CATEGORY_LABEL, SOURCE_LABEL, STATUS_WORD } from "./design-memory-shared";
import type {
  DesignMemoryCategory,
  DesignMemorySourceKind,
  DesignMemoryStatus,
} from "@/lib/design-memory.functions";

describe("CATEGORY_LABEL", () => {
  test("defines all expected category types", () => {
    // The record should have entries for all category types
    const expectedKeys = ["token", "type", "spacing", "principle", "voice", "pattern"];
    expectedKeys.forEach((key) => {
      expect(CATEGORY_LABEL).toHaveProperty(key);
    });
  });

  test("maps category 'token' to 'Token'", () => {
    expect(CATEGORY_LABEL.token).toBe("Token");
  });

  test("maps category 'type' to 'Type'", () => {
    expect(CATEGORY_LABEL.type).toBe("Type");
  });

  test("maps category 'spacing' to 'Spacing'", () => {
    expect(CATEGORY_LABEL.spacing).toBe("Spacing");
  });

  test("maps category 'principle' to 'Principle'", () => {
    expect(CATEGORY_LABEL.principle).toBe("Principle");
  });

  test("maps category 'voice' to 'Voice'", () => {
    expect(CATEGORY_LABEL.voice).toBe("Voice");
  });

  test("maps category 'pattern' to 'Pattern'", () => {
    expect(CATEGORY_LABEL.pattern).toBe("Pattern");
  });

  test("all category label values are non-empty strings", () => {
    Object.values(CATEGORY_LABEL).forEach((label) => {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });

  test("all category label values start with uppercase letter", () => {
    Object.values(CATEGORY_LABEL).forEach((label) => {
      expect(label[0]).toBe(label[0]?.toUpperCase());
    });
  });

  test("category labels are sentence-case (not all caps)", () => {
    Object.values(CATEGORY_LABEL).forEach((label) => {
      expect(label).not.toBe(label.toUpperCase());
    });
  });

  test("can look up category by key at runtime", () => {
    const category: DesignMemoryCategory = "token";
    expect(CATEGORY_LABEL[category]).toBe("Token");
  });
});

describe("SOURCE_LABEL", () => {
  test("defines all expected source types", () => {
    const expectedKeys = ["url_import", "pasted", "default", "learned"];
    expectedKeys.forEach((key) => {
      expect(SOURCE_LABEL).toHaveProperty(key);
    });
  });

  test("maps source 'url_import' to 'URL import'", () => {
    expect(SOURCE_LABEL.url_import).toBe("URL import");
  });

  test("maps source 'pasted' to 'Pasted'", () => {
    expect(SOURCE_LABEL.pasted).toBe("Pasted");
  });

  test("maps source 'default' to 'Default'", () => {
    expect(SOURCE_LABEL.default).toBe("Default");
  });

  test("maps source 'learned' to 'Learned'", () => {
    expect(SOURCE_LABEL.learned).toBe("Learned");
  });

  test("all source label values are non-empty strings", () => {
    Object.values(SOURCE_LABEL).forEach((label) => {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });
  });

  test("all source label values start with uppercase letter", () => {
    Object.values(SOURCE_LABEL).forEach((label) => {
      expect(label[0]).toBe(label[0]?.toUpperCase());
    });
  });

  test("can look up source by key at runtime", () => {
    const source: DesignMemorySourceKind = "pasted";
    expect(SOURCE_LABEL[source]).toBe("Pasted");
  });

  test("handles multi-word labels like 'URL import' correctly", () => {
    const label = SOURCE_LABEL.url_import;
    expect(label).toContain("URL");
    expect(label).toContain("import");
  });
});

// STATUS_WORD replaced the retired VerdictTone map, 2026-07-29. The chip it fed
// is gone; the outcome is a WORD carried by the one class that means it, and
// "not settled" is deliberately monochrome because a call nobody has settled
// yet is not an outcome.
describe("STATUS_WORD", () => {
  test("defines all expected status types", () => {
    const expectedKeys = ["approved", "rejected", "pending"];
    expectedKeys.forEach((key) => {
      expect(STATUS_WORD).toHaveProperty(key);
    });
  });

  test("approved reads as in force, and green carries it", () => {
    expect(STATUS_WORD.approved.word).toBe("In force");
    expect(STATUS_WORD.approved.tone).toBe("sp-pass");
  });

  test("rejected reads as dropped, and red carries it", () => {
    expect(STATUS_WORD.rejected.word).toBe("Dropped");
    expect(STATUS_WORD.rejected.tone).toBe("sp-fail");
  });

  test("pending stays MONOCHROME: an unsettled rule is not an outcome", () => {
    expect(STATUS_WORD.pending.word).toBe("Not settled");
    expect(STATUS_WORD.pending.tone).toBe("");
  });

  test("every tone is an sp- class or empty, never a raw colour", () => {
    Object.values(STATUS_WORD).forEach(({ tone }) => {
      expect(tone === "" || tone.startsWith("sp-")).toBe(true);
    });
  });

  test("every word is a non-empty plain-language string", () => {
    Object.values(STATUS_WORD).forEach(({ word }) => {
      expect(typeof word).toBe("string");
      expect(word.length).toBeGreaterThan(0);
    });
  });

  test("can look up status by key at runtime", () => {
    const status: DesignMemoryStatus = "approved";
    expect(STATUS_WORD[status].word).toBe("In force");
  });

  test("green and red are spent ONLY on a settled outcome", () => {
    const coloured = Object.values(STATUS_WORD).filter((v) => v.tone !== "");
    expect(coloured).toHaveLength(2);
  });
});

describe("integration: mapping lookups", () => {
  test("can iterate over categories and look up labels", () => {
    const categories: DesignMemoryCategory[] = [
      "token",
      "type",
      "spacing",
      "principle",
      "voice",
      "pattern",
    ];
    categories.forEach((category) => {
      const label = CATEGORY_LABEL[category];
      expect(label).toBeDefined();
      expect(typeof label).toBe("string");
    });
  });

  test("can iterate over sources and look up labels", () => {
    const sources: DesignMemorySourceKind[] = ["url_import", "pasted", "default", "learned"];
    sources.forEach((source) => {
      const label = SOURCE_LABEL[source];
      expect(label).toBeDefined();
      expect(typeof label).toBe("string");
    });
  });

  test("can iterate over statuses and look up their words", () => {
    const statuses: DesignMemoryStatus[] = ["approved", "rejected", "pending"];
    statuses.forEach((status) => {
      const entry = STATUS_WORD[status];
      expect(entry).toBeDefined();
      expect(typeof entry.word).toBe("string");
    });
  });

  test("records have no null or undefined values", () => {
    Object.values(CATEGORY_LABEL).forEach((v) => {
      expect(v).not.toBeNull();
      expect(v).not.toBeUndefined();
    });
    Object.values(SOURCE_LABEL).forEach((v) => {
      expect(v).not.toBeNull();
      expect(v).not.toBeUndefined();
    });
    Object.values(STATUS_WORD).forEach((v) => {
      expect(v).not.toBeNull();
      expect(v).not.toBeUndefined();
      expect(v.word).not.toBeUndefined();
    });
  });
});

describe("consistency: label capitalization", () => {
  test("CATEGORY_LABEL and SOURCE_LABEL use consistent sentence-case style", () => {
    // All labels should start with uppercase, then lowercase (except multi-word like "URL import")
    const allLabels = [...Object.values(CATEGORY_LABEL), ...Object.values(SOURCE_LABEL)];
    allLabels.forEach((label) => {
      // First character should be uppercase
      expect(label.charCodeAt(0)).toBeGreaterThanOrEqual("A".charCodeAt(0));
      expect(label.charCodeAt(0)).toBeLessThanOrEqual("Z".charCodeAt(0));
    });
  });

  test("STATUS_WORD reads as sentence case, because it is a WORD not a chip", () => {
    Object.values(STATUS_WORD).forEach(({ word }) => {
      expect(word[0]).toBe(word[0].toUpperCase());
      expect(word).not.toBe(word.toUpperCase());
    });
  });
});

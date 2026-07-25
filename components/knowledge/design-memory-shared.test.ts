import { describe, expect, test } from "bun:test";
import { CATEGORY_LABEL, SOURCE_LABEL, STATUS_TONE } from "./design-memory-shared";
import type {
  DesignMemoryCategory,
  DesignMemorySourceKind,
  DesignMemoryStatus,
} from "@/lib/design-memory.functions";
import type { VerdictTone } from "@/components/obsidian/verdict";

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

describe("STATUS_TONE", () => {
  test("defines all expected status types", () => {
    const expectedKeys = ["approved", "rejected", "pending"];
    expectedKeys.forEach((key) => {
      expect(STATUS_TONE).toHaveProperty(key);
    });
  });

  test("maps status 'approved' to 'KEPT' verdict tone", () => {
    expect(STATUS_TONE.approved).toBe("KEPT");
  });

  test("maps status 'rejected' to 'KILL' verdict tone", () => {
    expect(STATUS_TONE.rejected).toBe("KILL");
  });

  test("maps status 'pending' to 'PENDING' verdict tone", () => {
    expect(STATUS_TONE.pending).toBe("PENDING");
  });

  test("all status tones are valid VerdictTone values (uppercase)", () => {
    const validTones: VerdictTone[] = ["SHIP", "WATCH", "PENDING", "REVISE", "KILL", "KEPT"];
    Object.values(STATUS_TONE).forEach((tone) => {
      expect(validTones).toContain(tone);
    });
  });

  test("all status tone values are non-empty strings", () => {
    Object.values(STATUS_TONE).forEach((tone) => {
      expect(typeof tone).toBe("string");
      expect(tone.length).toBeGreaterThan(0);
    });
  });

  test("can look up status by key at runtime", () => {
    const status: DesignMemoryStatus = "approved";
    expect(STATUS_TONE[status]).toBe("KEPT");
  });

  test("status tones use established verdict vocabulary (not arbitrary strings)", () => {
    // These values should align with the VerdictChip / verdict system's known tones
    expect(STATUS_TONE.approved).toBe("KEPT");
    expect(STATUS_TONE.rejected).toBe("KILL");
    // PENDING is a safe middle ground used elsewhere in the codebase
    expect(STATUS_TONE.pending).toBe("PENDING");
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

  test("can iterate over statuses and look up tones", () => {
    const statuses: DesignMemoryStatus[] = ["approved", "rejected", "pending"];
    statuses.forEach((status) => {
      const tone = STATUS_TONE[status];
      expect(tone).toBeDefined();
      expect(typeof tone).toBe("string");
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
    Object.values(STATUS_TONE).forEach((v) => {
      expect(v).not.toBeNull();
      expect(v).not.toBeUndefined();
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

  test("STATUS_TONE uses uppercase (verdict convention), not sentence-case", () => {
    Object.values(STATUS_TONE).forEach((tone) => {
      // All verdict tones are uppercase
      expect(tone).toBe(tone.toUpperCase());
    });
  });
});

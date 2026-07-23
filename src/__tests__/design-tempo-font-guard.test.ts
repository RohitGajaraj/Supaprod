import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// Regression guard for DESIGN-TEMPO.md SS3's "known footgun" (2026-07-11): a
// literal retired-font string quietly won the CSS cascade in a legacy
// [data-obsidian] block for months before anyone noticed. This test scans
// every source file for the retired faces so that class of bug fails CI
// instead of shipping silently. Extend BANNED_FACES if a new face retires.

const SRC_ROOT = join(import.meta.dir, "..");
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const SKIP_DIRS = new Set(["__tests__", "node_modules", "fonts"]);

// Word pieces joined by \s or + so both CSS ("Schibsted Grotesk") and
// Google-Fonts URL ("Schibsted+Grotesk") spellings are caught.
const BANNED_FACES: Array<{ name: string; pattern: RegExp }> = [
  { name: "Newsreader", pattern: /Newsreader/ },
  { name: "Schibsted Grotesk", pattern: /Schibsted[\s+]Grotesk/ },
  { name: "JetBrains Mono", pattern: /JetBrains[\s+]Mono/ },
  { name: "IBM Plex Mono", pattern: /IBM[\s+]Plex[\s+]Mono/ },
  { name: "Codystar", pattern: /Codystar/ },
  { name: "Caveat", pattern: /Caveat/ },
  { name: "Silkscreen", pattern: /Silkscreen/ },
];

// Strip comments before scanning: styles.css and this file's own docs
// legitimately name the retired faces to document that they're banned.
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "") // /* block comments */ (CSS + TS)
    .replace(/^\s*\/\/.*$/gm, ""); // // line comments (TS)
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, out);
    } else if (
      SCAN_EXTENSIONS.has(extname(entry)) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

describe("Tempo v5 font guardrail (DESIGN-TEMPO.md SS3)", () => {
  const files = collectFiles(SRC_ROOT);

  it("scans at least the known font-bearing files (sanity check the walker works)", () => {
    expect(files.some((f) => f.endsWith("styles.css"))).toBe(true);
  });

  // Positive control: verify the scanner actually catches banned fonts, not just
  // that the codebase happens to be clean. Tests the scanner logic itself.
  describe("positive control — fixture injection", () => {
    it("detects Newsreader when present in test fixture", () => {
      const testCode = `
        /* This comment mentions Newsreader but should be stripped */
        const fontName = "Newsreader";
        font-family: Newsreader, serif;
      `;
      const stripped = stripComments(testCode);
      expect(/Newsreader/.test(stripped)).toBe(true);
    });

    it("strips block comments and then detects injected Schibsted Grotesk", () => {
      const testCode = `
        /* font-family: Schibsted Grotesk */ comment mentions it
        /* font-family: Schibsted+Grotesk */ comment mentions it with plus
        const realUse = "Schibsted Grotesk"; // This line mentions it
      `;
      const stripped = stripComments(testCode);
      // After stripping comments, the const line should remain and match the pattern
      expect(/Schibsted[\s+]Grotesk/.test(stripped)).toBe(true);
    });

    it("verifies stripComments removes //-style line comments", () => {
      const testCode = `
        // line comment with Newsreader banned
        const x = "Newsreader"; // another comment with it
        const y = "safe";
      `;
      const stripped = stripComments(testCode);
      // The "safe" line should be intact, comments should be gone
      expect(stripped).toContain('const y = "safe"');
      // Line comments should be gone
      expect(stripped).not.toContain("line comment with Newsreader banned");
    });

    it("verifies stripComments removes /* */ block comments", () => {
      const testCode = `/* start */ const x = "real"; /* Newsreader here */`;
      const stripped = stripComments(testCode);
      expect(stripped).toContain('const x = "real"');
      expect(stripped).not.toContain("Newsreader");
    });
  });

  for (const face of BANNED_FACES) {
    it(`never reintroduces the retired "${face.name}" face outside comments`, () => {
      const offenders: string[] = [];
      for (const file of files) {
        const raw = readFileSync(file, "utf-8");
        const code = stripComments(raw);
        if (face.pattern.test(code)) {
          offenders.push(file.replace(SRC_ROOT, "src"));
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});

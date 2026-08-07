// THE BLUE GUARD.
//
// Founder ruling 2026-08-05: the mark is a WHITE seven-petal spiral, an ember
// core and a gold bead. There is no second brand colour. The kit used to stroke
// the app icon with an ember-to-blue gradient (#FF6B2C -> #3E63DD), which blends
// through violet, and the founder rejected it on sight.
//
// WHY THIS FILE EXISTS RATHER THAN A COMMENT. The ruling WAS written down, in
// mark.ts, in full, with its reasoning. It did not hold. On 2026-08-07 an agent
// shipped the violet app icon to public/ anyway, because:
//
//   1. The generated PNGs in docs/growth/branding/icons/ were three weeks OLDER
//      than the ruling and nothing marked them stale, and
//   2. a surviving comment in generate-social.ts still described the blue as
//      "an asset that is already right", so reading the kit honestly led you to
//      the wrong file.
//
// The founder caught it, twice, by eye. That is not a control. A ruling that is
// only prose gets re-litigated by whoever reads the prose next; a ruling with a
// failing test attached does not.
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "..", "..", "..");
const BRAND = join(REPO, "docs", "growth", "branding");

/**
 * Neutral greys legitimately carry a slight blue bias (platinum #A8AEB8 is 16
 * points bluer than it is red). A brand colour does not: #3E63DD is 122 points
 * bluer than its next channel. The gap between those two is wide enough that
 * any threshold in between works, so this sits at 40 and never has to be tuned.
 */
const MAX_BLUE_BIAS = 40;

function blueBias(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return b - Math.max(r, g);
}

/** Every file that can put colour into a generated brand asset. */
function brandSourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        // Only the vector + source layers. Rasters are checked by provenance,
        // not by pixel, in the second test below.
        if (entry === "logo") walk(full);
        continue;
      }
      if (/\.(ts|svg)$/.test(entry)) out.push(full);
    }
  };
  walk(BRAND);
  out.push(join(REPO, "public", "favicon.svg"));
  return out;
}

describe("there is no second brand colour", () => {
  it("no brand source file declares a blue or violet", () => {
    const offences: string[] = [];

    for (const file of brandSourceFiles()) {
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, i) => {
        // A hex named inside a comment is a RECORD of the ruling, not a use of
        // the colour. mark.ts and generate-social.ts both quote #3E63DD while
        // explaining why it is gone, and that is exactly what we want them to
        // keep doing.
        const code = line.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");
        for (const hex of code.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) {
          if (blueBias(hex) > MAX_BLUE_BIAS) {
            offences.push(
              `${file.replace(REPO + "/", "")}:${i + 1} → ${hex} (blue bias ${blueBias(hex)})`,
            );
          }
        }
      });
    }

    expect(offences).toEqual([]);
  });

  it("the threshold actually separates the palette from the banned blue", () => {
    // Guards the guard. If someone widens MAX_BLUE_BIAS to silence a failure,
    // this fails instead and says why.
    expect(blueBias("#3E63DD")).toBeGreaterThan(MAX_BLUE_BIAS); // the banned blue
    expect(blueBias("#A8AEB8")).toBeLessThan(MAX_BLUE_BIAS); // platinum, legitimate
    expect(blueBias("#565660")).toBeLessThan(MAX_BLUE_BIAS); // graphite-lo, legitimate
    expect(blueBias("#050507")).toBeLessThan(MAX_BLUE_BIAS); // void, legitimate
    expect(blueBias("#FF6B2C")).toBeLessThan(MAX_BLUE_BIAS); // ember
    expect(blueBias("#E8B44C")).toBeLessThan(MAX_BLUE_BIAS); // gold
  });

  it("every shipped icon in public/ is byte-identical to an approved master", () => {
    // The 2026-08-07 failure was not a bad colour being AUTHORED. It was a
    // correct source and a stale artifact, so a source-only check would have
    // passed while violet shipped. This closes that gap by provenance: if a
    // file in public/ is not a copy of something in avatars/, nobody can say
    // which ruling it was built under.
    const approved = new Map<string, string>();
    const avatars = join(BRAND, "avatars");
    for (const entry of readdirSync(avatars)) {
      approved.set(Bun.hash(readFileSync(join(avatars, entry))).toString(), entry);
    }

    // Sizes that are a straight copy of a master. Downscaled variants
    // (apple-touch-icon at 180, icon-192) have no byte-identical twin by
    // construction and are covered by the source check plus review.
    const nativeCopies = ["icon-512.png", "favicon.png"];
    for (const name of nativeCopies) {
      const bytes = readFileSync(join(REPO, "public", name));
      const hash = Bun.hash(bytes).toString();
      expect(
        approved.has(hash)
          ? `${name} <- ${approved.get(hash)}`
          : `${name} MATCHES NO APPROVED MASTER`,
      ).toContain("<-");
    }
  });
});

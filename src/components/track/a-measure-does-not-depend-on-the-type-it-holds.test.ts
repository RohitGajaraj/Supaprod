/**
 * A PROSE MEASURE IS WRITTEN IN `rem`, BECAUSE `ch` MEANS A DIFFERENT WIDTH
 * IN EVERY SIZE IT IS USED ON.
 *
 * ── THE FOURTH TIME, AND THE FIRST ON THESE SURFACES ───────────────────────
 * `meridian.css:1067` records the first three and the migration that ended
 * them on 2026-09-01: `ch` is the width of the font's ZERO GLYPH, so a `ch` cap
 * scales with the type inside it, and a three-rung ladder written 74 / 68 / 62
 * rendered 654 / 536 / 548px -- inverted at the bottom, "and no amount of
 * tuning the three numbers can fix it while they are `ch`: raising a number can
 * narrow a block, which is not a thing a reader of the source can be expected
 * to hold in their head."
 *
 * `surface-parts.tsx`, `CrewMethods`, `CrewChrome` and `Hero` all migrated to
 * the `--mrd-measure-*` rem rungs. **The run screen and its depth panes did
 * not**, and measured 2026-09-09 they carried the same defect one layer along:
 *
 *   ArtifactPane.tsx:324  `mrd-copy max-w-[62ch]`   14px    -> 548px
 *   ArtifactPane.tsx:325  `mrd-meta max-w-[62ch]`   12px    -> 470px
 *
 * **The same written number, on two lines two pixels apart, ragging to right
 * edges 78px apart** -- a metric and the line saying whether it can be graded,
 * reading as two unrelated blocks instead of a fact and its footnote. Five more
 * prose blocks ran to 548px, 36px past the 512px Meridian settled on, while
 * `TrackConsent`'s supporting sentences stopped at 450px on the same `62ch`.
 *
 * ── WHY `ch` IS STILL CORRECT ON A MONOSPACE ELEMENT ───────────────────────
 * In a monospace face every glyph has the zero glyph's advance, so `1ch` IS one
 * character and `max-w-[40ch]` on a truncated URL means exactly "forty
 * characters". That is not the defect and this does not touch it: the rule is
 * about a measure whose width no author can predict, and on mono it is
 * perfectly predictable. `RunProof.tsx:148` is the one such site and it is
 * allowed by carrying `font-mrd-mono` on the same element.
 *
 * NOT A RULE ABOUT EVERY `max-w`. A narrow cap on a header's second line is a
 * layout constraint rather than a prose measure; it is exempted by name below,
 * with its number, rather than by a pattern that would let the next prose block
 * through too.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

/* `fileURLToPath`, not `.pathname`: this repo's path contains spaces, which a
   URL keeps percent-encoded, and the read then fails with ENOENT. */
const read = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** Lane 2's surfaces: the run screen, its depth panes and the traces route. */
const FILES = [
  "ArtifactPane.tsx",
  "TrackRun.tsx",
  "TrackConsent.tsx",
  "RunNow.tsx",
  "RunProof.tsx",
  "LiveStation.tsx",
  "TakeOver.tsx",
  "SteerComposer.tsx",
  "HoldCard.tsx",
  "GateBanner.tsx",
  "RunFooter.tsx",
  "../spine/TrackActivity.tsx",
  "../../routes/_authenticated.traces.$traceId.tsx",
] as const;

/**
 * The one place a `ch` cap is still right, and the one that is not a measure.
 *
 * Both carry their reason and their number, so a future reader can tell an
 * exemption that was argued from one that was pasted.
 */
const ALLOWED = [
  {
    file: "RunProof.tsx",
    why: "a truncated URL in font-mrd-mono, where 1ch IS one character",
    // The element must actually be monospace, or the exemption is a loophole.
    requires: "font-mrd-mono",
  },
] as const;

type Site = { file: string; line: number; text: string };

function chSites(): Site[] {
  const out: Site[] = [];
  for (const f of FILES) {
    const src = read(`./${f}`);
    src.split("\n").forEach((text, i) => {
      if (/max-w-\[\d+(\.\d+)?ch\]/.test(text)) {
        out.push({ file: f.split("/").pop()!, line: i + 1, text: text.trim() });
      }
    });
  }
  return out;
}

describe("a measure does not depend on the type it holds", () => {
  it("reads the surfaces it is about, so this scan covers something", () => {
    // A rename that empties the list must fail rather than pass silently.
    for (const f of FILES) expect(read(`./${f}`).length).toBeGreaterThan(200);
    expect(read("./ArtifactPane.tsx")).toContain("--mrd-measure-prose");
  });

  it("writes every prose measure on these surfaces in rem, never in ch", () => {
    const offenders = chSites().filter((s) => {
      const ok = ALLOWED.find((a) => a.file === s.file);
      return !(ok && s.text.includes(ok.requires));
    });
    expect(
      offenders.map((s) => `${s.file}:${s.line}  ${s.text.slice(0, 90)}`),
      [
        "A `ch` cap scales with the type inside it, so the same written number",
        "renders a different width at every size it is used on. Measured on these",
        "surfaces: 62ch was 548px on 14px prose, 470px on 12px meta and 450px on",
        "11.5px data -- and two of those sat two pixels apart in one column.",
        "",
        "Use `max-w-[var(--mrd-measure-prose)]` (32rem), or `--mrd-measure-region`",
        "/ `--mrd-measure-page` for the wider rungs. See meridian.css:1067 for the",
        "three earlier times this happened and why rem ended it.",
        "",
        "If the element is genuinely monospace, `ch` is correct and predictable:",
        "add it to ALLOWED above with its reason.",
      ].join("\n"),
    ).toEqual([]);
  });

  it("keeps the mono exemption honest by requiring the mono face on the element", () => {
    /*
     * The exemption is what makes this rule safe to enforce, so it is the part
     * most worth pinning: it applies only where `font-mrd-mono` sits on the
     * same element. Drop the face and the site stops being exempt.
     */
    const mono = chSites().filter((s) => s.file === "RunProof.tsx");
    expect(mono.length).toBe(1);
    expect(mono[0]!.text).toContain("font-mrd-mono");
    expect(mono[0]!.text).toContain("truncate");
  });
});

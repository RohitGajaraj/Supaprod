/**
 * THE DATA FACE PRINTED 21000 (2026-09-01).
 *
 * Photographed on Settings → Billing, signed in, on the free tier:
 *
 *     Spent 21000 credits in the last 7 days.
 *     291 runs · 9518 credits available now.
 *
 * `Num` sets the mono, tabular face for every figure in the product across 596
 * call sites, and formatted none of them. So the one surface where a person is
 * deciding whether to spend money showed them an unreadable run of glyphs.
 *
 * The grouping went into the primitive rather than the call sites because it
 * was ALREADY being done at some of them by hand -- `{r.credits.toLocaleString()}`
 * -- which is the tell that the default was wrong, not that the callers were
 * careless. 596 sites cannot be swept one at a time and stay swept.
 *
 * This file exists for the three things it must NOT do. Each one has a live
 * call site in the product today, and each would be a silent corruption rather
 * than a visible bug -- the number would still look like a number.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";

import { Num } from "./surface-parts";

describe("Num groups what is a quantity", () => {
  it("groups the figures that were unreadable on the billing pane", () => {
    render(
      <>
        <Num>{21000}</Num>
        <Num>{9518}</Num>
      </>,
    );
    expect(screen.getByText("21,000")).toBeDefined();
    // Four digits group too. This is the exact figure that was unreadable, and
    // it is the whole reason the threshold is 1000 rather than 10000.
    expect(screen.getByText("9,518")).toBeDefined();
  });

  it("leaves small numbers alone, so a window of 7 days is still 7", () => {
    render(<Num>{7}</Num>);
    expect(screen.getByText("7")).toBeDefined();
  });
});

describe("and refuses to touch what is not one", () => {
  /*
   * THE ROUNDING TRAP, and it is the reason `Number.isInteger` guards this at
   * all. Bare `toLocaleString()` defaults to `maximumFractionDigits: 3`, so a
   * score of 0.8567 renders as 0.857 -- a formatter that CHANGES THE VALUE.
   * Nobody would see it: 0.857 is a plausible score.
   */
  it("a decimal is never rounded into a different number", () => {
    render(<Num>{0.8567}</Num>);
    expect(screen.getByText("0.8567")).toBeDefined();
    expect(screen.queryByText("0.857")).toBeNull();
  });

  /*
   * Every already-formatted figure in the product arrives as a STRING:
   * `fmtMs(ms)`, `pct(rate)`, `n.toFixed(1)`, `id.slice(0, 8)`, and literals
   * like `7d`. Re-formatting one is how a duration turns into a quantity.
   */
  it("an already-formatted string passes through as written", () => {
    render(
      <>
        <Num>7d</Num>
        <Num>1.2s</Num>
        <Num>{(12345.6789).toFixed(2)}</Num>
        <Num>{"a1b2c3d4"}</Num>
      </>,
    );
    expect(screen.getByText("7d")).toBeDefined();
    expect(screen.getByText("1.2s")).toBeDefined();
    // `toFixed` already decided how this reads. Grouping it would be a second
    // opinion overwriting the first.
    expect(screen.getByText("12345.68")).toBeDefined();
    expect(screen.getByText("a1b2c3d4")).toBeDefined();
  });

  /*
   * A numeric IDENTIFIER is the one case grouping actively corrupts, because
   * `2,026` reads as a count of things. `version_local` on the sync pane is the
   * live one; it passes `raw`.
   */
  it("an identifier marked raw keeps its digits", () => {
    render(<Num raw>{20260901}</Num>);
    expect(screen.getByText("20260901")).toBeDefined();
  });

  it("a mixed child list is left alone, which covers <Num>v{version}</Num>", () => {
    const version = 12;
    render(<Num>v{version}</Num>);
    expect(screen.getByText("v12")).toBeDefined();
  });
});

/**
 * ── AND THE HAND-ROLLED COPIES ARE GONE (2026-09-01) ──────────────────────
 * Nineteen call sites read `<Num>{n.toLocaleString()}</Num>`. They were the
 * evidence that the primitive's default was wrong, and once it grouped they
 * became a second formatter running in front of the first.
 *
 * Harmless for an integer, which is what all nineteen held. NOT harmless in
 * general, and the difference is silent: bare `toLocaleString()` rounds to
 * three fraction digits, so the day one of those values becomes a rate or an
 * average it renders a DIFFERENT NUMBER, plausibly, with nothing to notice.
 * `Num` refuses to touch a non-integer for exactly that reason, and a manual
 * call in front of it takes the refusal away.
 *
 * A figure outside the data face -- in a toast, a `title`, a sentence built by
 * template -- still formats itself, because there is no primitive there to do
 * it. This guard is about `Num` and only `Num`.
 */
const SRC_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsxFiles(full, out);
    else if (entry.endsWith(".tsx") && !entry.includes(".test.")) out.push(full);
  }
  return out;
}

describe("nothing formats a number before handing it to Num", () => {
  it("has no <Num> wrapping a toLocaleString call", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC_DIR)) {
      const body = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const [hit] of body.matchAll(/<Num(?:\s+raw)?>\{[^}]*toLocaleString\([^}]*\}<\/Num>/g)) {
        offenders.push(`${file.replace(SRC_DIR, "src")}: ${hit.slice(0, 90)}`);
      }
    }
    expect(
      offenders.join("\n"),
      [
        "A number is formatted by hand before Num sees it.",
        "",
        "Num already groups integers of 1000 and up. Formatting first turns the",
        "value into a STRING, which Num passes through untouched -- so the",
        "primitive's deliberate refusal to round decimals is bypassed, and bare",
        "toLocaleString() rounds to 3 fraction digits. 0.8567 renders as 0.857,",
        "which looks exactly like a real value.",
        "",
        "Pass the number: <Num>{n}</Num>.",
      ].join("\n"),
    ).toBe("");
  });
});

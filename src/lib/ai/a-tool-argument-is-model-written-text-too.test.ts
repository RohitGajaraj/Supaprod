/**
 * A TOOL ARGUMENT IS MODEL-WRITTEN TEXT TOO (2026-08-26).
 *
 * ── THE GAP, AND HOW IT STAYED INVISIBLE ───────────────────────────────────
 * `humanizeText` has guarded STREAMED model text since it shipped. A tool
 * ARGUMENT is model-written text as well, and nothing guarded it, so
 * `signals.log({ title })` wrote the model's raw string straight into a column
 * the Sense and Discover surfaces render.
 *
 * MEASURED on live data: **120 of 1,483 `signals.title` rows carry an em or en
 * dash**, against **0 of 113 `prds.body_md`**. The split is precisely which path
 * wrote them.
 *
 * `scripts/check-humanized.sh` could not have caught this at any setting. It
 * scans source files for banned characters, and it reported CLEAN across all 548
 * user-facing files while the application was rendering em dashes, because the
 * text was never in the source. It was in the database.
 *
 * ── WHY IT IS SAFE ON EVERY ARGUMENT ───────────────────────────────────────
 * The rewrites only touch U+2013 and U+2014. ASCII hyphens are untouched, so
 * paths, slugs, uuids and branch names survive intact. That property is what
 * lets this run on every tool argument rather than on a hand-kept list of
 * "text-ish" fields, which would go stale the first time a tool gained a column.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { humanizeToolArgs } from "./humanize";

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const RUNTIME = readFileSync(
  fileURLToPath(new URL("./runtime.server.ts", import.meta.url)),
  "utf8",
);

describe("it cleans the text a user will read", () => {
  it("strips an em dash from a signal title", () => {
    const out = humanizeToolArgs({ title: `Checkout stalls ${EM} users abandon` });
    expect(out.title).not.toContain(EM);
  });

  it("and an en dash", () => {
    expect(humanizeToolArgs({ t: `a ${EN} b` }).t).not.toContain(EN);
  });

  it("reaching strings nested in objects and arrays", () => {
    const out = humanizeToolArgs({
      outer: { inner: [`one ${EM} two`, { deep: `three ${EN} four` }] },
    });
    const flat = JSON.stringify(out);
    expect(flat).not.toContain(EM);
    expect(flat).not.toContain(EN);
  });
});

describe("THE PROPERTY THAT MAKES IT SAFE EVERYWHERE: identifiers survive", () => {
  it("ASCII hyphens are never touched", () => {
    const ids = {
      path: "src/lib/ai/humanize-text.ts",
      uuid: "8391835f-0999-472e-8886-0e82fee06a02",
      branch: "lane/first-run-acceptance",
      url: "https://github.com/Supaprod/relay-homeowner-app",
      slug: "saved-payment-methods",
    };
    expect(humanizeToolArgs(ids)).toEqual(ids);
  });

  it("non-strings come back exactly as they went in", () => {
    const v = { n: 42, b: false, z: null, arr: [1, 2, 3], nested: { k: true } };
    expect(humanizeToolArgs(v)).toEqual(v);
  });

  it("an empty object and an empty array keep their shape", () => {
    expect(humanizeToolArgs({})).toEqual({});
    expect(humanizeToolArgs([])).toEqual([]);
  });
});

describe("both provider paths are wired, because one would leave a hole", () => {
  it("the Anthropic tool_use extractor humanizes its args", () => {
    expect(RUNTIME).toContain("args: humanizeToolArgs(c.input)");
  });

  it("the OpenAI tool_calls extractor humanizes its args", () => {
    expect(RUNTIME).toContain("args: humanizeToolArgs(args)");
  });
});

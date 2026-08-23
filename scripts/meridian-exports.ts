/**
 * WHAT MERIDIAN ACTUALLY EXPORTS, which is not what `ls meridian/` shows, AND
 * WHERE EVERY RETIRED SYMBOL GOES.
 *
 * Written 2026-08-23 after TWO rulings in one evening turned on the same hole,
 * then EXTENDED the same night after a third turned on the half this file did
 * not cover.
 *
 *   - REQ-L0-005 asked MAIN LANE to BUILD `Block` and `Pre` equivalents. Both
 *     already existed, in `surface-parts.tsx`, and `Pre` had been written
 *     specifically to replace the retired `.sp-pre`.
 *   - RL0-004 ruled that Meridian had no touch-target rule, from grepping
 *     `min-height` in `meridian.css`. The rule is a Tailwind utility inside
 *     `CONTROL_SHAPE` in a `.tsx` file. Same error, made by the reviewer.
 *   - REQ-L0-005 ADDENDUM 2 then asked for FOUR more to be built -- `Select`,
 *     `Record`, `Value`, `SelectionBar`. All four existed too, and the listing
 *     this file generates did not help, because THREE OF THE FOUR WERE RENAMED
 *     ON THE WAY IN: `Select` is `Picker`, `SelectionBar` is `BulkBar`,
 *     `Record` is `RecordSpeaks`. A table keyed on the Meridian name cannot
 *     answer "what replaced X" once X's name is gone. That is what the second
 *     table below is for.
 *
 * `BulkBar`'s own header predicted the exact miss and it still happened:
 * "An agent scanning this folder's exports for the retired `SelectionBar` finds
 * `SelectionActions` and takes it as the answer, and that has already happened
 * once on the record." A warning inside the destination is not reachable by
 * someone who has concluded the destination does not exist.
 *
 * ── THE MAP IS CHECKED, WHICH IS WHY IT IS CODE AND NOT A MARKDOWN NOTE ──
 * Every target below is verified to still be exported from the file named, and
 * this script EXITS NON-ZERO if one is not. A hand-written porting table would
 * rot silently the first time a component moved; this one breaks the command.
 * It also counts live consumers per retired symbol, so the generated file is
 * the remaining-work list rather than a description of one.
 *
 * WHY THIS IS A GENERATED LIST AND NOT AN `index.ts` BARREL. A barrel is the
 * obvious fix and it would break the adoption metric. `scripts/meridian-adoption.ts`
 * counts a component as adopted by matching the import SOURCE:
 *
 *     from "@/components/meridian/<Component>"
 *
 * An import routed through a barrel does not match that, so every component
 * imported the new way would silently report as UNADOPTED, and the number that
 * tells us whether Meridian is actually being used would decay as adoption rose.
 * A lookup problem is not worth blinding a metric for. Deep imports stay.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(import.meta.dir, "..", "src/components/meridian");
const OUT = join(DIR, "COMPONENTS.md");

const rows: { name: string; file: string; kind: string }[] = [];
for (const file of readdirSync(DIR).filter((f) => /\.tsx?$/.test(f))) {
  const src = readFileSync(join(DIR, file), "utf8");
  for (const m of src.matchAll(/^export (function|const|type|interface) ([A-Za-z0-9_]+)/gm)) {
    rows.push({ name: m[2], file, kind: m[1] });
  }
}
rows.sort((a, b) => a.name.localeCompare(b.name));

/* Components first: a lane hunting "does Meridian have X" wants the renderable
   thing, not a prop type that happens to sort next to it. */
const isComponent = (r: (typeof rows)[number]) =>
  r.kind === "function" && /^[A-Z]/.test(r.name);
const comps = rows.filter(isComponent);
const rest = rows.filter((r) => !isComponent(r));

/* ------------------------------------------------------------------ *
 * WHERE EVERY RETIRED SYMBOL GOES
 *
 * Keyed on the RETIRED name, because that is the name the person porting has
 * in front of them. Three of these were renamed on the way into Meridian and
 * those three are exactly the ones that got filed as gaps.
 * ------------------------------------------------------------------ */

type Move = {
  /** The Meridian export that replaces it. */
  to: string;
  /** Import path, relative to `@/components/`. */
  from: string;
  /** What the port has to decide, when it is not a straight swap. Empty means
   *  the contract is identical and it is an import change. */
  note?: string;
};

const REPLACEMENTS: Record<string, Move[]> = {
  Block: [
    {
      to: "Region",
      from: "meridian/surface-parts",
      note: "Strict superset. `more`/`onMore` SPLITS THREE WAYS -- `goTo` (leaves), `toggle`+`toggled` (reveals, drives aria-expanded), `act`+`acting` (acts on the subject). Judge each site; a blind `more -> goTo` recreates the aria defect C-01 fixed.",
    },
  ],
  Pre: [
    {
      to: "Pre",
      from: "meridian/surface-parts",
      note: "Drop-in, and it CAPS HEIGHT at 320px which the retired `.sp-pre` did not. It sets no outer margin: a site that relied on `.sp-pre`'s baked-in margin-top writes `mt-mrd-3`.",
    },
  ],
  Select: [
    {
      to: "Picker",
      from: "meridian/surface-parts",
      note: "Drop-in: same `SelectHTMLAttributes` passthrough, and `id`/`aria-label`/`disabled` all forward. Native `<select>` on purpose -- keyboard-native, type-ahead, platform sheet on a phone.",
    },
  ],
  SelectionBar: [
    {
      to: "BulkBar",
      from: "meridian/surface-parts",
      note: "IDENTICAL signature `{selection, total, noun, children}`, Escape-to-clear carried. Height moves 38px -> 44px to match Meridian's row floor. NOT `SelectionActions`, which is an unrelated text-selection toolbar.",
    },
  ],
  Value: [
    {
      to: "Value",
      from: "meridian/surface-parts",
      note: "Same name, DIFFERENT tone vocabulary: `warn` -> `hold`, `live` -> `agent`. Both live tone maps (`RECEIPT_VALUE_TONE`, MissionChain's `STATUS_TONE`) declare `warn` in their TYPE but no member uses it, so this is a type-union edit, not a behaviour change.",
    },
  ],
  Record: [
    {
      to: "RecordSpeaks",
      from: "brain/record-parts",
      note: "WHEN THE RECORD IS LIT AND OPENS SOMETHING. Carries all four props including `onClick`/`title`, plus the diamond and the lamp. This is the one for DiscoverSurface and ReceiptDetailSheet.",
    },
    {
      to: "RecordSpeaks",
      from: "meridian/surface-parts",
      note: "WHEN IT IS A PLAIN CLAIM. `{children, evidence}` only: no lamp, no door. This is the one for a citation rendered in a LIST -- a lamp per row is what the scarcity rule exists to prevent.",
    },
  ],
  Button: [
    { to: "Action", from: "meridian/surface-parts", note: "Tiered variants. `busy` is TRUE ONLY WHILE THIS CONTROL'S OWN WORK RUNS -- a synchronous handler takes `disabled`, never `busy`." },
    { to: "Approve", from: "meridian/surface-parts", note: "Where a click UNBLOCKS something." },
  ],
  Failed: [
    { to: "ReadFailed", from: "meridian/surface-parts", note: "Superset: same `{children, onRetry?, retryLabel?}` plus `detail?`." },
  ],
  Loading: [
    {
      to: "Reading",
      from: "meridian/surface-parts",
      note: "NOT A SUPERSET, and the one entry here that is not a straight swap. Retired `Loading` took `{children?, working?, agent?, detail?}` and `Reading` takes `{children?}`. ALL FIVE remaining call sites pass children only, so it is a drop-in for every one of them. A site that wants the AGENT-IS-WORKING fact takes `LoadingState` from `meridian/LoadingState` (`{label, variant, startedAt}`), which is where the rest of the product already went -- conflating the two was the thing the retired component's own header refused to do.",
    },
  ],
  Empty: [{ to: "NothingHere", from: "meridian/surface-parts", note: "Identical `{children, action?}`." }],
  Cell: [
    { to: "Cell", from: "meridian/surface-parts", note: "Identical, `tone` union included (`raised | recessed`)." },
  ],
  Grid: [{ to: "Grid", from: "meridian/surface-parts", note: "Superset: adds `cellMin?` and `columns?`." }],
  Input: [{ to: "Input", from: "meridian/forms", note: "Attribute passthrough on both sides; Meridian's also merges `className`." }],
  Field: [
    {
      to: "Field",
      from: "meridian/forms",
      note: "`htmlFor` IS REQUIRED HERE and was optional on the retired one, so the single consumer (`hooks/use-confirm.tsx`) must give its control an id. `label` widens to ReactNode and `hint?` is new.",
    },
  ],
  CtxHead: [{ to: "CtxHead", from: "meridian/ContextColumn", note: "Identical `{children}`." }],
  CtxRow: [
    { to: "CtxRow", from: "meridian/ContextColumn", note: "Superset of `{mark?, name, sub?}`: adds `title`, `source`, `lead`, `onClick`, `href`." },
  ],
  CtxBody: [{ to: "CtxBody", from: "meridian/ContextColumn", note: "Identical `{children}`." }],
};

/* EVERY TARGET IS VERIFIED TO EXIST. This is the half that makes the map a
   guard: a component that moves or is renamed breaks this command rather than
   leaving a table that quietly points at nothing. */
const COMPONENTS_ROOT = join(import.meta.dir, "..", "src/components");
const missing: string[] = [];
for (const [retired, moves] of Object.entries(REPLACEMENTS)) {
  for (const mv of moves) {
    let found = false;
    for (const ext of [".tsx", ".ts"]) {
      try {
        const body = readFileSync(join(COMPONENTS_ROOT, mv.from + ext), "utf8");
        if (new RegExp(`^export function ${mv.to}\\b`, "m").test(body)) found = true;
      } catch {
        /* next extension */
      }
    }
    if (!found) missing.push(`${retired} -> ${mv.to} (components/${mv.from})`);
  }
}
if (missing.length) {
  console.error("meridian-exports: the porting map points at exports that do not exist:");
  for (const m of missing) console.error("  " + m);
  process.exit(1);
}

/* WHAT IS STILL ON THE RETIRED LAYER, counted from the codebase rather than
   remembered. Comments inside a multi-line import would otherwise be parsed as
   symbol names, so they are stripped first. */
const consumers = new Map<string, Set<string>>();
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
const SRC = join(import.meta.dir, "..", "src");
for (const file of walk(SRC)) {
  if (file.includes("shell/primitives")) continue;
  const body = readFileSync(file, "utf8");
  /* `[^}]*` and NOT `[\s\S]*?`. The lazy form starts at the FIRST `import {` in
     the file and stretches until it finds a closing brace followed by this
     path, so it swallows every import in between and reports their symbols as
     retired ones. Measured: 80 symbols and 66 "unmapped" against a true 17. */
  for (const m of body.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*"@\/components\/shell\/primitives"/g,
  )) {
    const clean = m[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    for (const raw of clean.split(",")) {
      const sym = raw.trim().split(/\s+as\s+/)[0].trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(sym)) continue;
      if (!consumers.has(sym)) consumers.set(sym, new Set());
      consumers.get(sym)!.add(file.slice(SRC.length + 1));
    }
  }
}

const retiredRows = [...new Set([...Object.keys(REPLACEMENTS), ...consumers.keys()])]
  .map((sym) => ({ sym, left: consumers.get(sym)?.size ?? 0, moves: REPLACEMENTS[sym] }))
  .sort((a, b) => b.left - a.left || a.sym.localeCompare(b.sym));

const unmapped = retiredRows.filter((r) => r.left > 0 && !r.moves);
const retiredTable = retiredRows
  .filter((r) => r.left > 0)
  .flatMap((r) =>
    (r.moves ?? [{ to: "**no map entry**", from: "--", note: "Add one to scripts/meridian-exports.ts." }]).map(
      (mv, i) =>
        `| ${i === 0 ? `\`${r.sym}\`` : ""} | ${i === 0 ? r.left : ""} | \`${mv.to}\` | \`@/components/${mv.from}\` | ${mv.note ?? "Contract not yet compared -- do that before swapping."} |`,
    ),
  )
  .join("\n");

const line = (r: (typeof rows)[number]) => `| \`${r.name}\` | \`${r.file}\` | ${r.kind} |`;

writeFileSync(
  OUT,
  `# What Meridian exports

<!-- GENERATED by scripts/meridian-exports.ts. Do not hand-edit; run \`bun run meridian:exports\`. -->

**\`ls\` this directory and you will not find \`Block.tsx\` or \`Pre.tsx\`, and you will
conclude those components do not exist. They do.** \`surface-parts.tsx\` alone carries
${rows.filter((r) => r.file === "surface-parts.tsx").length} exports. Search this table before
filing a \`meridian-gap\` request.

There is deliberately **no \`index.ts\` barrel** -- it would break the adoption metric,
which matches on the deep import path. Import from the file named here.

## Components (${comps.length})

| Export | File | |
| --- | --- | --- |
${comps.map(line).join("\n")}

## Types, constants and helpers (${rest.length})

| Export | File | Kind |
| --- | --- | --- |
${rest.map(line).join("\n")}

## Porting off the retired layer

**Keyed on the RETIRED name, because that is the name in front of you.** Three of
these were renamed on the way into Meridian -- \`Select\` is \`Picker\`,
\`SelectionBar\` is \`BulkBar\`, \`Record\` is \`RecordSpeaks\` -- and those three
are exactly the ones that got filed as gaps that did not exist.

**Every target here is verified to exist at the path shown; \`bun run meridian:exports\`
fails if one does not.** "Left" counts files still importing the retired symbol,
counted from the codebase at generation time.

${
  unmapped.length
    ? `> **${unmapped.length} retired symbol(s) still imported have no map entry:** ${unmapped
        .map((r) => `\`${r.sym}\``)
        .join(", ")}. Rule them and add them here.\n`
    : "> Every retired symbol still imported has a verified destination. **Nothing on the retired layer needs a component built.**\n"
}
| Retired | Left | Use | From | What the port has to decide |
| --- | --- | --- | --- | --- |
${retiredTable}
`,
);
console.log(
  `meridian: ${comps.length} components, ${rest.length} other exports, ` +
    `${retiredRows.filter((r) => r.left > 0).length} retired symbols still imported ` +
    `(${unmapped.length} unmapped) -> ${OUT}`,
);

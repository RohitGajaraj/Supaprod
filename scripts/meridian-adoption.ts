/**
 * MERIDIAN ADOPTION: how much of the design system the PRODUCT actually uses.
 * `bun run design:adoption`
 *
 * ── WHY THIS IS A DIFFERENT QUESTION FROM THE RATCHET ───────────────────
 * `meridian-ratchet` answers "how much retired vocabulary is left", and it
 * only ever counts DOWN. That number can reach zero while the design system is
 * still not adopted, because deleting a `--sp-` token and reaching for a
 * Meridian component are different acts. A surface can be perfectly clean by
 * the ratchet and still be a wall of hand-rolled cards.
 *
 * That is not hypothetical. Measured 2026-08-16, ELEVEN of Meridian's 25
 * components were used in the gallery and in ZERO product surfaces --
 *
 *   Chat  PromptBar  StreamingText  ToolChips  ContextCards  InsightCards
 *   RecommendationCard  DiffTable  FineTuneCard  SelectionActions  SidebarNav
 *
 * and they are precisely the components that carry an EXPERIENCE rather than a
 * paint. The product was running on `surface-parts` and `RecordsTable`: the
 * primitives. Every rich component sat in the gallery being admired.
 *
 * SidebarNav is the one that makes the point unarguable. The app shell's own
 * navigation rail does not use the design system's own navigation component.
 *
 * ── WHY THIS REPORTS RATHER THAN FAILS ──────────────────────────────────
 * A guard that failed on an unadopted component would be wrong, and wrong in a
 * way that costs trust: a component may legitimately be built before the
 * surface that needs it, and the honest answer to "why is Chat unused" is
 * sometimes "the Ask pane has not been ported yet", which is a plan and not a
 * defect. A number nobody can argue with, printed on demand, does the work
 * here. The ratchet forbids; this one measures.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MERIDIAN_DIR = join(REPO_ROOT, "src/components/meridian");

/** The component gallery. Importing a component HERE is not adoption. */
const GALLERY = "src/routes/_authenticated.meridian.tsx";

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const components = readdirSync(MERIDIAN_DIR)
  .filter((f) => /\.tsx$/.test(f))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort();

/* Every file that could adopt Meridian: the product, minus Meridian itself. */
const consumers = [
  ...walk(join(REPO_ROOT, "src/components")),
  ...walk(join(REPO_ROOT, "src/routes")),
]
  .map((f) => relative(REPO_ROOT, f).split(sep).join("/"))
  .filter((f) => !f.startsWith("src/components/meridian/"))
  .filter((f) => !f.includes("__tests__/") && !/\.test\.tsx?$/.test(f));

const sources = new Map(consumers.map((f) => [f, readFileSync(join(REPO_ROOT, f), "utf8")]));

type Row = { component: string; gallery: boolean; product: string[] };
const rows: Row[] = components.map((component) => {
  /* Matched on the import SOURCE. A bare identifier would over-count: Meridian
     reuses names the product already knows (Button, Actions, Door, Empty). */
  const needle = new RegExp(
    `from\\s+["'](?:@/components|\\.{1,2}/[^"']*)/meridian/${component}["']`,
  );
  const users = consumers.filter((f) => needle.test(sources.get(f) ?? ""));
  return {
    component,
    gallery: users.includes(GALLERY),
    product: users.filter((f) => f !== GALLERY),
  };
});

const unadopted = rows.filter((r) => r.product.length === 0);
const adopted = rows.filter((r) => r.product.length > 0);

const pad = (s: string, n: number) => s.padEnd(n);
console.log("");
console.log(`MERIDIAN ADOPTION  ${adopted.length}/${rows.length} components used in the product`);
console.log("");
console.log(`  ${pad("component", 20)} ${pad("gallery", 9)} product surfaces`);
console.log(`  ${"-".repeat(58)}`);
for (const r of [...rows].sort((a, b) => a.product.length - b.product.length)) {
  console.log(
    `  ${pad(r.component, 20)} ${pad(r.gallery ? "yes" : "-", 9)} ${
      r.product.length === 0 ? "NONE" : String(r.product.length)
    }`,
  );
}

if (unadopted.length > 0) {
  console.log("");
  console.log(`UNADOPTED (${unadopted.length}) -- built, and used by no product surface:`);
  for (const r of unadopted) {
    console.log(`  ${pad(r.component, 20)} ${r.gallery ? "gallery only" : "used nowhere at all"}`);
  }
  console.log("");
  console.log("  A component used nowhere but the gallery has not been adopted, it has");
  console.log("  been exhibited. See docs/design/DESIGN-SYSTEM.md.");
}
console.log("");

/**
 * THE MERIDIAN RATCHET, the scanner half.
 *
 * ── WHY THIS EXISTS, AND WHY PROSE DID NOT WORK ─────────────────────────
 * The founder retired every prior design system on 2026-08-14 and
 * `docs/design/DESIGN-SYSTEM.md` has said so in its own header ever since:
 * "no new surface may use it... Never extend it."
 *
 * On 2026-08-15 that instruction was measured. 1,908 legacy token references
 * and 524 raw colour literals were live in `src/components` and `src/routes`.
 * In ONE day, four independent agents each rediscovered the same rule —
 * `--mrd-hover` is a hover wash and must never be a selected state — in four
 * different folders, ten times between them. A constant named `FOCUS_RING`
 * had been INERT in six files for months, spelled correctly, pointing at the
 * right token, and painting nothing, because Tailwind emits utilities into a
 * layer and an unlayered rule beats every layer.
 *
 * None of that was a knowledge problem. Every one of those agents had read
 * the doctrine. THE DOCTRINE WAS NOT ENFORCED BY ANYTHING, so it decayed at
 * exactly the rate new code was written.
 *
 * A design system becomes doctrine when it can fail a build, not when it is
 * written down. This is that mechanism.
 *
 * ── WHAT A RATCHET IS, AND WHY NOT A BAN ────────────────────────────────
 * A flat ban on legacy tokens would fail on 130 files today, so it would be
 * switched off within the hour and never switched back on. That is how the
 * 2026-07 rebuild failed: it tried to delete the old layer in one move and
 * broke every surface at once.
 *
 * A ratchet takes the current state as a frozen baseline and permits only one
 * direction of travel. Every existing file may keep exactly the debt it has
 * today and not one occurrence more. EVERY NEW FILE MUST BE CLEAN, with no
 * exception and no allowlist to argue about. The debt can only shrink, and it
 * shrinks permanently, because a count that goes down is re-frozen at the
 * lower number.
 *
 * The property that matters: this cannot be satisfied by arguing. A reviewer
 * can be persuaded that one more `--sp-line` is pragmatic. This cannot.
 *
 * ── WHY COMMENTS ARE STRIPPED FIRST, AND IT IS NOT A LOOPHOLE ───────────
 * Counting comments would make the ratchet fight its own purpose. The good
 * commits are full of lines like "was `--sp-bg`, now `var(--mrd-bg)`" and
 * "`--mrd-edge-focus` is a FIELD'S BORDER, not a ring" — that is the
 * institutional memory this codebase runs on, and a guard that punishes
 * writing it down would quietly delete the reasoning behind every migration.
 *
 * A legacy token inside a comment paints nothing. Only code ships.
 * `surface-discipline.test.ts` already set this precedent.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Repo root, derived from this file's location rather than from cwd, so the
 * guard reports the same thing however it is invoked.
 *
 * `import.meta.url` and not Bun's `import.meta.dir`: the latter is not in the
 * TypeScript lib this project compiles against, so it runs correctly under
 * `bun test` and fails `bunx tsc --noEmit`. A guard that cannot survive the
 * repo's own typecheck is a guard somebody deletes.
 */
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Only these trees are ratcheted. Styles are handled separately (see below). */
const SCAN_ROOTS = ["src/components", "src/routes"];

const SCAN_EXTENSIONS = [".tsx", ".ts"];

/**
 * Tests are exempt, and deliberately so: a guard's whole job can be to assert
 * that a legacy literal is still present (`surface-discipline.test.ts` pins
 * `--sp-gate`; `runs-keycaps-match-bindings.test.ts` parses source text). A
 * ratchet that forbade those would force the deletion of the tests protecting
 * the migration.
 */
function isExempt(relPath: string): boolean {
  return (
    relPath.includes(`__tests__${sep}`) ||
    relPath.endsWith(".test.ts") ||
    relPath.endsWith(".test.tsx")
  );
}

/**
 * THE RETIRED VOCABULARIES, by the name each shipped under.
 *
 * Each entry is a marker that means "this line is speaking a language the
 * product retired". They are matched against comment-stripped source.
 */
export const RETIRED_MARKERS: ReadonlyArray<{ id: string; pattern: RegExp; lineage: string }> = [
  { id: "--sp-", pattern: /--sp-[a-z0-9-]+/g, lineage: "Cadence/ink" },
  { id: "--ds-", pattern: /--ds-[a-z0-9-]+/g, lineage: "v3 design-system" },
  { id: "--text-", pattern: /--text-[a-z0-9-]+/g, lineage: "Obsidian" },
  { id: "--hairline", pattern: /--hairline\b/g, lineage: "Obsidian" },
  { id: "--madder", pattern: /--madder[a-z0-9-]*/g, lineage: "Obsidian" },
  { id: "--glacier", pattern: /--glacier[a-z0-9-]*/g, lineage: "Obsidian" },
  { id: "--font-pixel", pattern: /--font-pixel\b/g, lineage: "Tempo" },
  { id: "--raised", pattern: /--raised\b/g, lineage: "Obsidian" },
  { id: "data-obsidian", pattern: /data-obsidian/g, lineage: "Obsidian" },

  /*
   * ── THE HOLE THIS GUARD SHIPPED WITH, CLOSED 2026-08-15 ─────────────────
   * The first version counted retired TOKENS and raw colour and stopped there,
   * and it reported `_authenticated.today.tsx` as clean. It is not clean: it
   * composes from `Block` and `PageHead`, which come from
   * `components/shell/primitives.tsx` -- the Cadence/ink component layer, whose
   * retirement is the same ruling that retired the `--sp-*` tokens it is drawn
   * with.
   *
   * MEASURED WHEN THE HOLE WAS FOUND: 137 files import that module. That is
   * more files than carry any token debt at all, and it is the more structural
   * half, because a retired token is one string while a retired component
   * brings its own markup, its own states and its own spacing with it.
   *
   * A guard with a known hole is worse than no guard, because it converts "we
   * have not checked" into "we checked and it was fine". So imports of a
   * retired module count as debt, on the same ratchet, and the baseline is
   * re-frozen at the honest number rather than the flattering one.
   *
   * Matched on the import SOURCE rather than the symbol names, because the
   * names collide with Meridian's own on purpose -- `Button`, `Actions`,
   * `Door`, `Failed` and `Empty` all exist in both worlds, and counting bare
   * identifiers would flag correct Meridian code.
   */
  {
    id: "import:shell/primitives",
    pattern: /from\s+["'](?:@\/components|\.{1,2}\/[^"']*)\/shell\/primitives["']/g,
    lineage: "Cadence/ink components",
  },
  {
    id: "import:components/ui",
    pattern: /from\s+["'](?:@\/components|\.{1,2}\/[^"']*)\/ui\/[^"']+["']/g,
    lineage: "Tempo v5 (shadcn)",
  },
  {
    id: "import:components/obsidian",
    pattern: /from\s+["'](?:@\/components|\.{1,2}\/[^"']*)\/obsidian\/[^"']+["']/g,
    lineage: "Obsidian v3 components",
  },
];

/**
 * ── THE SECOND HOLE, CLOSED 2026-08-16 ──────────────────────────────────
 *
 * The markers above count the import STATEMENT. One line per retired module,
 * however much of that module the file goes on to render. So rule 2 of this
 * guard, "an existing file may not get worse", was not enforced for the
 * component layer at all: a file that already carried its one import line
 * could add unlimited retired UI and the count never moved.
 *
 * MEASURED ON THE COMMIT THAT PROVED IT. `_authenticated.ship.tsx` went from 84
 * to 92 rendered retired components in `608fb56e` while its ratchet debt stayed
 * at exactly 6. A new first-run screen was composed entirely from `Gate`,
 * `Block`, `Row`, `Num` and `CtxBody` -- eight new usages of a vocabulary
 * retired two days earlier -- and every gate passed green.
 *
 * That is the same shape as the hole closed the day before, and the same
 * argument applies: a guard with a known hole converts "we have not checked"
 * into "we checked and it was fine".
 *
 * WHY THIS COUNTS SYMBOLS THE FILE ITSELF IMPORTED, and not bare identifiers.
 * The note above is right that `Button`, `Actions`, `Door`, `Failed` and `Empty`
 * exist in BOTH worlds on purpose, so counting `<Button` across a file would
 * flag correct Meridian code. So the symbols are read out of that file's own
 * retired import block first, and only those names are counted. A file that
 * imports `Button` from Meridian and never from `shell/primitives` scores zero
 * here, which is the whole point.
 *
 * Capitalised symbols are counted as OPENING JSX TAGS, so a paired tag counts
 * once and the number reads as "components rendered". Lowercase symbols are
 * counted at their call sites, which is how a retired hook shows up.
 */
const RETIRED_MODULES: ReadonlyArray<{ id: string; source: RegExp; lineage: string }> = [
  { id: "shell/primitives", source: /\/shell\/primitives$/, lineage: "Cadence/ink components" },
  { id: "components/ui", source: /\/ui\/[^/]+$/, lineage: "Tempo v5 (shadcn)" },
  { id: "components/obsidian", source: /\/obsidian\/[^/]+$/, lineage: "Obsidian v3 components" },
];

/** `import { a, b as c, type D } from "..."`, including multi-line blocks. */
const NAMED_IMPORT = /import\s+\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;

/**
 * How many times a file actually leans on each retired module.
 *
 * Returns usage counts keyed `usage:<module id>`, and also hands back the import
 * blocks it consumed so the caller can exclude them from the count. Without that
 * exclusion the symbol list in the import statement would itself register as
 * usage and every file would score at least its own import.
 */
function retiredUsage(code: string): { counts: Record<string, number>; stripped: string } {
  const symbolsByModule = new Map<string, Set<string>>();
  const importBlocks: string[] = [];

  for (const match of code.matchAll(NAMED_IMPORT)) {
    const [whole, clause, source] = match;
    const mod = RETIRED_MODULES.find((m) => m.source.test(source));
    if (!mod) continue;
    importBlocks.push(whole);
    const set = symbolsByModule.get(mod.id) ?? new Set<string>();
    for (const raw of clause.split(",")) {
      const part = raw.trim();
      if (!part) continue;
      // A type-only symbol renders nothing, so it is not usage. It is still
      // retired vocabulary and is already counted by the import marker above.
      if (/^type\s/.test(part)) continue;
      // `X as Y` binds Y locally, so Y is the name that appears in the markup.
      const local = part.split(/\s+as\s+/).pop()!.trim();
      if (local) set.add(local);
    }
    symbolsByModule.set(mod.id, set);
  }

  let stripped = code;
  for (const block of importBlocks) stripped = stripped.replace(block, "");

  const counts: Record<string, number> = {};
  for (const [id, symbols] of symbolsByModule) {
    let total = 0;
    for (const symbol of symbols) {
      const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = /^[A-Z]/.test(symbol)
        ? new RegExp(`<${escaped}\\b`, "g")
        : new RegExp(`\\b${escaped}\\s*\\(`, "g");
      total += stripped.match(pattern)?.length ?? 0;
    }
    if (total > 0) counts[`usage:${id}`] = total;
  }
  return { counts, stripped };
}

/**
 * RAW COLOUR, which is its own failure and not merely an old vocabulary.
 *
 * A hex in a component is worse than a retired token: a retired token at least
 * moves when the theme moves, because `ink.css` aliases it to Meridian. A hex
 * is frozen. It cannot answer the paper ground, it cannot be measured by the
 * contrast sweep, and it is invisible to every audit that reads tokens.
 *
 * The exception is deliberate and narrow. `--brand-mark-ember` and
 * `--brand-mark-gold` are declared as literal hex ON PURPOSE, because the logo
 * is theme-invariant: the mark keeps its ember and gold in both grounds, per
 * the founder's ruling that the brand mark and the UI accent must never share
 * a token. Those live in `src/styles.css`, which this scanner does not read.
 */
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\([^)]*\)|\bhsla?\s*\([^)]*\)/g;

/**
 * Strip block and line comments so documentation never counts as usage.
 *
 * Deliberately simple: this is a counter, not a parser. It can mis-handle a
 * `//` inside a string literal (a URL), which costs at most a small
 * overcount on that one line and can never UNDERCOUNT — the direction that
 * matters, because an undercount is a hole in the guard.
 */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export type FileDebt = { readonly [marker: string]: number };
export type DebtLedger = { readonly [relPath: string]: FileDebt };

function walk(dir: string, out: string[]): string[] {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(full, out);
    else if (SCAN_EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

/** Count every retired marker and raw colour in one file's shipping code. */
export function debtIn(source: string): FileDebt {
  const code = stripComments(source);
  const debt: Record<string, number> = {};
  for (const { id, pattern } of RETIRED_MARKERS) {
    const n = code.match(new RegExp(pattern.source, "g"))?.length ?? 0;
    if (n > 0) debt[id] = n;
  }
  // How much of each retired module the file actually renders, which the import
  // markers above cannot see. See `retiredUsage`.
  for (const [marker, n] of Object.entries(retiredUsage(code).counts)) debt[marker] = n;
  const colours = code.match(RAW_COLOUR)?.length ?? 0;
  if (colours > 0) debt["raw-colour"] = colours;
  return debt;
}

/**
 * Scan the ratcheted trees and return the current debt, keyed by repo-relative
 * POSIX path so the baseline is identical on every machine.
 */
export function scan(): DebtLedger {
  const ledger: Record<string, FileDebt> = {};
  for (const root of SCAN_ROOTS) {
    for (const file of walk(join(REPO_ROOT, root), [])) {
      const rel = relative(REPO_ROOT, file).split(sep).join("/");
      if (isExempt(rel)) continue;
      const debt = debtIn(readFileSync(file, "utf8"));
      if (Object.keys(debt).length > 0) ledger[rel] = debt;
    }
  }
  return ledger;
}

/** Total occurrences across a ledger, for the one headline number. */
export function totalDebt(ledger: DebtLedger): number {
  return Object.values(ledger).reduce(
    (sum, file) => sum + Object.values(file).reduce((a, b) => a + b, 0),
    0,
  );
}

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

/** The component trees. Stylesheets are ratcheted too, see `STYLE_ROOTS`. */
const SCAN_ROOTS = ["src/components", "src/routes"];

const SCAN_EXTENSIONS = [".tsx", ".ts"];

/**
 * ── THE THIRD HOLE, CLOSED 2026-08-18: THE PAINT ITSELF ─────────────────
 *
 * The two holes above were both "the guard cannot see a kind of usage". This
 * one is larger and of a different kind: the guard could not see a whole
 * LAYER. Until today this scanner read `.ts` and `.tsx` under two component
 * trees and nothing else, and said so in its own words further down --
 * "`src/styles.css`, which this scanner does not read".
 *
 * MEASURED THE DAY IT WAS FOUND, against the 5,794 occurrences the ledger
 * already knew about:
 *
 *   src/styles.css        1,181   (637 --ds-, 398 raw hex, 63 --text-, 53 --hairline)
 *   src/styles/primitives.css 617 (614 --sp-)
 *   src/styles/ink.css      304   (226 --sp-, 76 raw hex)
 *   src/styles/today.css    197
 *   src/styles/shell.css     47
 *   src/styles/meridian.css  16
 *   src/styles/decide.css     5
 *                         -----
 *                         2,367   -- 29% of the true total, entirely unmeasured
 *
 * WHY THAT MATTERS MORE THAN THE NUMBER. The component layer is where retired
 * vocabulary is WRITTEN; the stylesheet layer is where it is PAINTED. A port
 * that swaps `Block` for `Region` in every file and leaves `.sp-mark`,
 * `.sp-term` and `.sp-codediff-*` behind moves the debt rather than clearing
 * it -- and every gate reports green the whole way, because the paint was
 * never on the ledger. That is precisely how a design system gets "migrated"
 * more than once and is never done.
 *
 * So the same ratchet now covers the paint, on the same three rules, and the
 * baseline is re-frozen at the honest number rather than the flattering one.
 * This is the third time that sentence has had to be written in this file.
 */
const STYLE_ROOTS = ["src/styles"];

/** The app-wide legacy sheet is a FILE at the src root, not inside a tree. */
const STYLE_FILES = ["src/styles.css"];

const STYLE_EXTENSIONS = [".css"];

/**
 * ── THE FIFTH HOLE, CLOSED 2026-08-21: THE TOP OF THE TREE IT GUARDS ────
 *
 * Two directories were named at the top of this file and the files sitting
 * BESIDE them were not, so every file directly in `src/` was invisible to this
 * guard. That is AGENTS.md §9's `src/styles.css`-versus-`src/styles/` trap one
 * level up, and it is the fifth time a version of that sentence has had to be
 * written here.
 *
 * WHY IT MATTERED MORE THAN THE COUNT. `src/router.tsx` owns `RouteError`, the
 * route-level error fallback that mounts on the public parchment routes as well
 * as the dark app, and it was carrying four retired `--text-*` uses. So the one
 * surface a person reads BECAUSE something already broke was painted from a
 * retired layer, and the ratchet reported a clean tree throughout.
 * `src/server.ts` is worse: `renderBrandedErrorPage()`, the catastrophic 500
 * document, was filling its primary button with `#ff6b2c`, which is
 * `--brand-mark-ember` -- the BRAND MARK colour on a button, in the one file the
 * guard could not see.
 *
 * WHY IT TOOK A RULING TO WIDEN. The widening was built on 2026-08-21 and
 * `design:ratchet` refused to write the baseline, because bringing files into
 * scope looks identical to adding debt and its one job is to refuse the second.
 * The refusal was correct and the widening was reverted rather than forced. Two
 * things were needed first, and both are now in place: `var(--mrd-*, <literal>)`
 * no longer counts as raw colour (see `stripMeridianFallbacks`), which clears
 * `router.tsx` outright; and `update-meridian-baseline.ts` can now tell a file
 * being scanned for the FIRST TIME from a file whose count grew, so
 * `server.ts`'s 8 literals are adopted at their current number rather than
 * waved through or hidden.
 *
 * SHALLOW, NEVER RECURSIVE. `src` is scanned one level deep only. Recursing
 * would pull in `src/lib`, `src/hooks` and the rest -- roughly the whole
 * codebase -- which is a different and much larger decision than the one that
 * was ruled, and it would also double-count the two trees above.
 */
const SHALLOW_ROOTS = ["src"];

/**
 * Tests are exempt, and deliberately so: a guard's whole job can be to assert
 * that a legacy literal is still present (`surface-discipline.test.ts` pins
 * `--sp-gate`; `runs-keycaps-match-bindings.test.ts` parses source text). A
 * ratchet that forbade those would force the deletion of the tests protecting
 * the migration.
 */
/**
 * Generated, and regenerated by a command rather than edited. AGENTS.md §3
 * forbids hand-editing this file, so failing a build on its contents would
 * demand an edit the rules refuse. Keyed by POSIX-relative path, which is the
 * form `scan` normalises to before it calls `isExempt`.
 */
const GENERATED_FILES = new Set([
  "src/routeTree.gen.ts",
  /*
   * Third-party brand art, written by `bun run scripts/fetch-brand-glyphs.ts`
   * and never by hand. It is full of raw colour BECAUSE THAT IS THE POINT: they
   * are other companies' brand hexes, and Slack's #E01E5A has to read as
   * #E01E5A so anyone can check it against Slack's own brand page. Converting
   * them to oklch to satisfy this scanner would hide the one thing a reviewer
   * needs to see, and would also be gaming a guard rather than obeying it.
   *
   * The same argument already lives in `styles.css`, where `--brand-mark-ember`
   * is a deliberate literal for exactly this reason: identity is fixed, so it
   * is written down rather than derived.
   *
   * The exemption is EARNED by the file genuinely being generated. The script
   * is checked in beside it, so "regenerate rather than edit" is a command
   * anyone can run, not a promise in a comment.
   */
  "src/components/meridian/brand-glyphs.gen.ts",
]);

function isExempt(relPath: string): boolean {
  return (
    GENERATED_FILES.has(relPath) ||
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
   * ── A SECOND SPACING RAMP, WITH NO MARKER TO STOP IT ────────────────────
   *
   * Added 2026-09-10, found by Lane 3 while converting `InvitationsPanel`.
   * `src/styles.css` defined `--space-1..4` as 4 / 8 / 12 / 16 on a "4px grid;
   * rhythm 8/12/16" — **a whole competing opinion about spacing**, against
   * Meridian's 2, 4, 6, 10, 16, 24, 40, 64.
   *
   * It is not an alias like the friendly names below: it resolved to raw pixels
   * of its own, so nothing in this list matched it and a new file could adopt
   * it and pass green. Exactly two callers existed, both admin panels, and both
   * are converted; the definitions are gone. The marker is what stops it coming
   * back, which is the only reason it needs an entry at all.
   */
  { id: "--space-", pattern: /--space-[1-9][0-9]*\b/g, lineage: "pre-Meridian 4px grid" },

  /*
   * ── THE RETIRED SYSTEM REACHED THROUGH A FRIENDLY NAME (F-138) ──────────
   *
   * Found independently by S3 and S4, and it is the fourth instance this week
   * of a guard reporting success while the thing it guards is happening.
   *
   * Every marker above matches a retired token LITERALLY. `src/styles.css` then
   * defines dozens of friendly names as `var(--ds-...)`, so a component writing
   * `var(--canvas)` or `var(--rose)` draws from the retired v3 palette and this
   * scan counted **zero**. Not weakened, BYPASSED, with nothing in the output
   * saying so — while `CLAUDE.md` states the ratchet as enforced rather than
   * requested.
   *
   * The ceiling was the thing that broke. The ratchet's whole design is that
   * debt cannot GROW, and through an alias **a brand new file could be written
   * entirely in the retired system today and pass green.**
   *
   * ── WHAT IS IN THE LIST, AND THE TWO THINGS DELIBERATELY LEFT OUT ────────
   * 64 aliases are declared. 10 are already matched by a marker above
   * (`--glacier`, `--hairline*`, `--raised`, `--madder`, `--text-*`) and would
   * double-count. **13 are shadcn's own contract** — `--background`,
   * `--foreground`, `--card`, `--primary`, `--border` and their kin. Those
   * resolve through `--ds-*` today, but they are the component library's
   * interface rather than the Supaprod palette, and flagging them would put
   * every shadcn primitive in the baseline for a naming coincidence. Repointing
   * them is a separate job with a different argument.
   *
   * That leaves the 41 below: the v3 palette, its easings and its surfaces.
   *
   * ── IT MATCHES USE, NEVER DECLARATION ───────────────────────────────────
   * `var(--canvas)` and not `--canvas:`, so `styles.css` defining the alias is
   * not itself a violation. The declaration is how the old system is kept
   * reachable while it is being removed; the USE is the debt.
   */
  {
    id: "--ds- via alias",
    pattern:
      /var\(--(surface-card-deep|surface-recessed|cta-grad-bottom|shadow-elevated|pencil-apricot|pencil-blossom|surface-raised|surface-hover|cta-grad-top|ember-active|surface-card|action-blue|ease-in-out|pencil-lime|violet-soft|deep-green|ember-soft|focus-blue|focus-ring|ink-subtle|soft-stone|ink-faint|ink-muted|dur-base|dur-slow|ease-out|marigold|cta-ink|emerald|hero-bg|saffron|canvas|agent|amber|coral|hover|paper|ease|moss|rose|ink)\)/g,
    lineage: "v3 design-system, reached through styles.css",
  },

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
  /*
   * ── THE FOURTH HOLE, CLOSED 2026-08-18: THE CLASS NAMES ─────────────────
   * The three holes above were about tokens, components and stylesheets. This
   * one is what survives all three: a file can import nothing retired, carry no
   * `--sp-*` token, pass every gate, and still be painted by the old system,
   * because the retired vocabulary is also a set of CLASS NAMES and a class
   * name is just a string in an attribute.
   *
   * MEASURED THE DAY IT WAS FOUND: 521 occurrences across 258 distinct classes
   * in `src/components` and `src/routes`. `sp-fail` alone is 65, and `sp-warn`
   * is 17 -- a SIXTH status word, in a system whose whole colour law is that
   * there are five.
   *
   * It surfaced the honest way. An agent porting the observe panels moved every
   * component and every token off the retired layer, then wrote down that it had
   * left `sp-pass`/`sp-fail`/`sp-warn` class strings behind because they were
   * not in its mapping. Its files were, by every gate the repo had, done.
   *
   * WHY THE PATTERN NEEDS A LEADING QUOTE OR SPACE. `--sp-line` contains the
   * substring `sp-line`, so a naive match would count every token twice and the
   * ratchet would fight itself. Requiring a quote, backtick or whitespace in
   * front matches a class in an attribute and never a custom property, whose
   * preceding character is always `-`. For the same reason it does not fire on
   * a CSS rule (`.sp-mark`, preceded by a dot): those declarations are already
   * counted by the stylesheet pass, and counting them here would double them.
   */
  { id: "class:sp-", pattern: /["`\s](sp-[a-z0-9-]+)["`\s]/g, lineage: "Cadence/ink CSS classes" },

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
      const local = part
        .split(/\s+as\s+/)
        .pop()!
        .trim();
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
 * a token. Those live in `src/styles.css`, and this paragraph used to end
 * "which this scanner does not read" -- true when it was written, false since
 * 2026-08-18, and the third hole above is named for that exact sentence. The
 * sheet IS read now, and the exemption that keeps those two declarations
 * uncounted is `BRAND_MARK_DECLARATION` below.
 */
/*
 * `(?<!&)` BECAUSE AN HTML NUMERIC ENTITY IS NOT A COLOUR. `&#9633;` is the
 * white square glyph, and `#9633` is a syntactically valid four-digit hex, so
 * the pattern counted it as debt. Found 2026-09-10 while converting
 * `MachineViewContainer` off raw colour: nine literals became one, and the one
 * left was the □ in its own "COPY TO CLIPBOARD" label.
 *
 * ONE OCCURRENCE IN THE TREE TODAY, measured before the fix, so this is a
 * small correction and not a large one. It is made anyway because of WHICH
 * direction it errs in: a phantom count is debt somebody has to either carry
 * forever or delete a glyph to clear, and the ratchet's own header says
 * counting what does not paint makes it fight its own purpose.
 */
const RAW_COLOUR = /(?<!&)#[0-9a-fA-F]{3,8}\b|\brgba?\s*\([^)]*\)|\bhsla?\s*\([^)]*\)/g;

/**
 * A LITERAL INSIDE `var(--mrd-*, <fallback>)` IS NOT RAW COLOUR.
 *
 * Ruled 2026-08-21, and it is a repo-wide refinement of the rule rather than a
 * carve-out for the file that provoked it. The `raw-colour` rule exists to catch
 * a colour hardcoded WHERE A TOKEN BELONGS. In this shape the token is already
 * there, named, and read first; the literal is the documented degradation path
 * for the window before the token layer loads. `router.tsx` is the case that
 * makes it concrete: it mounts on the public parchment routes and before the
 * token layers arrive, so its four literals are what actually paints, and each
 * one is byte-identical to the token it stands in for. Counting them asked a
 * reader to "fix" the one arrangement the rule wants.
 *
 * ONLY `--mrd-*` QUALIFIES, AND THE OPPOSITE READING WAS AVAILABLE. 26 colour
 * literals sit inside a RETIRED token's fallback (`var(--text-subtle, #7d786f)`,
 * `var(--hairline, rgba(...))` and so on), measured 2026-08-21 across the
 * scanned trees. Excusing those would be the wrong answer twice over. The whole
 * end state for `--text-*` and `--hairline` is DELETION, and on the day
 * `ink.css` goes the fallback stops being a fallback and becomes the only paint
 * the declaration has -- a frozen hex that cannot answer the paper ground, which
 * is exactly what this rule is for. So a retired first argument is not a
 * tokenised expression degrading gracefully, it is debt with a hex behind it,
 * and both halves keep counting.
 *
 * A NON-MERIDIAN, NON-RETIRED custom property (`var(--shell-row-h, 44px)`) does
 * not qualify either. It is a local variable rather than a design token, so
 * there is nothing about it that makes a literal beside it correct.
 *
 * IT IS APPLIED TO THE COLOUR PASS ONLY, and `shell.css:1390` is the reason that
 * distinction is load-bearing rather than tidy: it reads
 * `var(--mrd-line, var(--hairline, rgba(255,255,255,0.1)))`. The rgba is inside
 * a Meridian fallback, so it stops counting as colour -- and the `--hairline`
 * sitting in the same expression MUST keep counting as a retired marker. If this
 * stripper ran before the marker pass it would mask that, which is precisely the
 * "nothing is masked" condition the ruling was granted on.
 *
 * Balanced-paren scanning rather than a regex, because `[^)]*` stops at the
 * first `)` and `rgba(255,255,255,0.1))` has two. An unbalanced `var(` is left
 * ALONE and therefore counted, which is the safe direction: this guard may
 * overcount, never undercount.
 */
const MERIDIAN_VAR_WITH_FALLBACK = /var\(\s*--mrd-[a-z0-9-]*\s*,/g;

export function stripMeridianFallbacks(source: string): string {
  let out = "";
  let cursor = 0;
  for (const match of source.matchAll(MERIDIAN_VAR_WITH_FALLBACK)) {
    const fallbackStart = match.index + match[0].length;
    // Already inside a region a previous (outer) match removed. Nested Meridian
    // vars produce a match each, and the outer one has eaten the inner one.
    if (fallbackStart < cursor) continue;
    let depth = 1;
    let i = fallbackStart;
    while (i < source.length) {
      const ch = source[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
      i += 1;
    }
    if (depth !== 0) continue; // unbalanced: leave it in, so it still counts
    out += source.slice(cursor, fallbackStart);
    cursor = i;
  }
  return out + source.slice(cursor);
}

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

/**
 * CSS has ONLY block comments, and the difference is not pedantry.
 *
 * Running the JS stripper over a stylesheet would treat `//` as a line comment
 * and delete the rest of the line. CSS has no such comment, so every `//` in a
 * stylesheet is inside a URL, and deleting from there to the end of the line
 * removes real declarations. That direction is an UNDERCOUNT, which is the one
 * failure this guard may never have: an undercount is a hole, and the file
 * above records two of those already.
 */
export function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * THE ONE DELIBERATE HEX, and it is a founder ruling rather than debt.
 *
 * `--brand-mark-ember` and `--brand-mark-gold` are declared as literal hex ON
 * PURPOSE: the logo is theme-invariant, so the mark keeps its ember and gold in
 * both grounds. The ruling that put them there is the same one that removed
 * ember from every interaction state -- the brand mark and the UI accent must
 * never share a token. Counting them would ask a future reader to "fix" the one
 * colour in the product that is correct as a constant.
 *
 * Narrow on purpose: it drops the DECLARATION line, not every hex near it.
 */
const BRAND_MARK_DECLARATION = /^\s*--brand-mark-[a-z0-9-]*\s*:[^;]*;/gm;

export type FileDebt = { readonly [marker: string]: number };
export type DebtLedger = { readonly [relPath: string]: FileDebt };

function walk(dir: string, out: string[], extensions: readonly string[]): string[] {
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
    if (s.isDirectory()) walk(full, out, extensions);
    else if (extensions.some((e) => entry.endsWith(e))) out.push(full);
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
  // The colour pass reads DIFFERENT TEXT from the marker pass above, on purpose.
  // See `stripMeridianFallbacks`: a literal standing behind a Meridian token is
  // already tokenised, and stripping it here rather than earlier is what keeps a
  // retired marker in the same expression visible.
  const colours = stripMeridianFallbacks(code).match(RAW_COLOUR)?.length ?? 0;
  if (colours > 0) debt["raw-colour"] = colours;
  return debt;
}

/**
 * Count retired vocabulary in one STYLESHEET.
 *
 * Two differences from `debtIn`, and both are about not lying:
 *
 * 1. No module or usage counting. A stylesheet imports nothing and renders
 *    nothing, so `retiredUsage` has no meaning here. Running it would return
 *    zero and quietly imply the file had been checked for something it cannot
 *    contain.
 *
 * 2. A DECLARATION counts, not only a reference. `--sp-mark: 22px` in ink.css
 *    is the retired system being defined, which is the most load-bearing form
 *    of it: every `.sp-*` rule in primitives.css reads those declarations. The
 *    end state for these files is deletion, so the declaration is the debt.
 */
export function debtInCss(source: string): FileDebt {
  const code = stripCssComments(source).replace(BRAND_MARK_DECLARATION, "");
  const debt: Record<string, number> = {};
  for (const { id, pattern } of RETIRED_MARKERS) {
    // The import markers are JS grammar and can never match CSS. Skipped rather
    // than run-and-discard so a reader is not left wondering.
    if (id.startsWith("import:")) continue;
    const n = code.match(new RegExp(pattern.source, "g"))?.length ?? 0;
    if (n > 0) debt[id] = n;
  }
  // Same split as `debtIn`, same reason. See `stripMeridianFallbacks`.
  const colours = stripMeridianFallbacks(code).match(RAW_COLOUR)?.length ?? 0;
  if (colours > 0) debt["raw-colour"] = colours;
  return debt;
}

/**
 * ── WHAT THIS GUARD LOOKS AT, WRITTEN DOWN WHERE A TOOL CAN READ IT ─────
 *
 * The roots above used to be three loose constants consumed inline by `scan`, so
 * the guard's COVERAGE existed only as control flow. That was the reason
 * `design:ratchet` could not tell "the code got worse" from "the scanner got
 * better": nothing recorded what had been looked at, only what had been found,
 * and a clean file and an unscanned file are both simply absent from the
 * baseline.
 *
 * Naming each scope fixes that, because the baseline can now record the scopes it
 * was frozen under. A file in a scope the baseline has never held is being seen
 * for the FIRST TIME and may be adopted at its current count; a file in a scope
 * the baseline already knows may only go down. That is the whole distinction, and
 * it is structural -- derived from this table -- rather than a flag or a path
 * exemption, both of which were rejected when this was ruled.
 *
 * An id is a stable string and is written into the baseline. Renaming one reads
 * as removing a scope and adding a new one, which would adopt every file in it,
 * so treat these as permanent.
 */
type ScanScope = {
  readonly id: string;
  readonly root: string;
  /** `tree` recurses, `shallow` reads one level, `file` is a single path. */
  readonly mode: "tree" | "shallow" | "file";
  readonly extensions: readonly string[];
  readonly lexer: (source: string) => FileDebt;
};

export const SCAN_SCOPES: ReadonlyArray<ScanScope> = [
  ...SCAN_ROOTS.map(
    (root) =>
      ({
        id: `${root}/**`,
        root,
        mode: "tree",
        extensions: SCAN_EXTENSIONS,
        lexer: debtIn,
      }) as const,
  ),
  ...SHALLOW_ROOTS.map(
    (root) =>
      ({
        id: `${root}/*`,
        root,
        mode: "shallow",
        extensions: SCAN_EXTENSIONS,
        lexer: debtIn,
      }) as const,
  ),
  // The paint. Same ratchet, same three rules, different lexer. See STYLE_ROOTS.
  ...STYLE_ROOTS.map(
    (root) =>
      ({
        id: `${root}/**`,
        root,
        mode: "tree",
        extensions: STYLE_EXTENSIONS,
        lexer: debtInCss,
      }) as const,
  ),
  ...STYLE_FILES.map(
    (root) =>
      ({
        id: root,
        root,
        mode: "file",
        extensions: STYLE_EXTENSIONS,
        lexer: debtInCss,
      }) as const,
  ),
];

/** Direct children of one directory, never recursing. See `SHALLOW_ROOTS`. */
function walkShallow(dir: string, extensions: readonly string[]): string[] {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    if (!extensions.some((e) => entry.endsWith(e))) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }
    out.push(full);
  }
  return out;
}

/** Absolute paths one scope covers, before exemptions. */
function filesIn(scope: ScanScope): string[] {
  const full = join(REPO_ROOT, scope.root);
  if (scope.mode === "file") return [full];
  if (scope.mode === "shallow") return walkShallow(full, scope.extensions);
  return walk(full, [], scope.extensions);
}

/**
 * Which scope would produce this repo-relative path, if any.
 *
 * Exported because `update-meridian-baseline.ts` needs it to tell a newly
 * SCANNED file from a newly WORSE one, and reimplementing the mapping there
 * would be the two-lists-drifting defect this repo has already paid for.
 */
export function scopeIdFor(relPath: string): string | undefined {
  for (const scope of SCAN_SCOPES) {
    if (!scope.extensions.some((e) => relPath.endsWith(e))) continue;
    if (scope.mode === "file") {
      if (relPath === scope.root) return scope.id;
      continue;
    }
    if (scope.mode === "shallow") {
      if (relPath.slice(0, relPath.lastIndexOf("/")) === scope.root) return scope.id;
      continue;
    }
    if (relPath.startsWith(`${scope.root}/`)) return scope.id;
  }
  return undefined;
}

/**
 * Scan every ratcheted scope and return the current debt, keyed by repo-relative
 * POSIX path so the baseline is identical on every machine.
 */
export function scan(): DebtLedger {
  const ledger: Record<string, FileDebt> = {};
  for (const scope of SCAN_SCOPES) {
    for (const file of filesIn(scope)) {
      const rel = relative(REPO_ROOT, file).split(sep).join("/");
      if (isExempt(rel)) continue;
      let source: string;
      try {
        source = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      const debt = scope.lexer(source);
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

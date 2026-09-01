/**
 * `git cat-file -e $ref:path` IS NOT A BRANCH CHECK IN ZSH, AND TWO LANES ACTED ON ITS ANSWER.
 *
 * ── WHAT HAPPENED ──────────────────────────────────────────────────────────
 * S1 and S2 independently concluded the wrong thing about what was on a branch,
 * from the same shell bug, and neither questioned it because both got the same
 * answer. S2 told S1 their check was stale; S1 had seen "present" for a file
 * that was absent from disk in the same breath. Agreement between two sessions
 * running the same broken idiom is not corroboration.
 *
 * ── THE MECHANISM, MEASURED ────────────────────────────────────────────────
 * In zsh, `:` after an unbraced parameter starts a MODIFIER, parsed before git
 * ever sees the argument. `s` is the substitution modifier, and a real path has
 * enough `/` in it to complete the `:s/from/to/` form:
 *
 *   $r:src/components/today/Board.tsx   ->  origin/main
 *
 * The whole path is eaten. `git cat-file -e origin/main` then asks "does this
 * REF exist", which is true for any valid ref, so the check silently stops
 * testing the path and starts testing the branch name.
 *
 * ── IT FAILS IN BOTH DIRECTIONS, WHICH IS THE PART THAT WAS MISSED ─────────
 * The finding as first written said the failure is "silent and always
 * optimistic". Measured against `git ls-tree` on this repository:
 *
 *   src/components/today/Board.tsx  -> expands "origin/main"          says PRESENT   truth ABSENT
 *   the-first-run/RULINGS.md        -> expands "mainhe-first-run/..." says ABSENT    truth PRESENT
 *   e2e/helpers/x.mjs               -> expands "2e/helpers/x.mjs"     says absent    truth absent
 *   src/x                           -> zsh: bad substitution
 *   docs/README.md                  -> unaffected, `d` is not a modifier
 *
 * So it also produces FALSE NEGATIVES: a lane can conclude its work never
 * landed when it did, and redo it. "Always optimistic" would leave a reader
 * believing the worst case is over-trust. It is not.
 *
 * ── WHAT IS SAFE ───────────────────────────────────────────────────────────
 * Braces, quotes, or a variable after the colon all stop the modifier being
 * parsed, and `ls-tree` sidesteps the question entirely:
 *
 *   git ls-tree -r --name-only <ref> | grep -qx <path>     BEST, no expansion at all
 *   git cat-file -e "$ref:$path"                            safe, quoted
 *   git cat-file -e "${ref}:literal/path"                   safe, braced
 *   git cat-file -e $ref:literal/path                       UNSAFE in zsh
 *
 * ── WHY A GATE AND NOT A NOTE ──────────────────────────────────────────────
 * `docs/operations/autonomous-build-loop.md:186` is a STANDING FOUNDER RULING
 * binding all lanes and sessions, and it names this exact command as the way to
 * verify code landed. Written with a literal ref it is safe; the moment a lane
 * puts the ref in a variable, which is what a loop does, it is not. A rule that
 * is safe as written and unsafe as followed needs a check rather than a
 * sentence.
 *
 * Bash is unaffected, so this cannot be caught by the session that writes it.
 * That is exactly why it needs to be a gate.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SEARCH = ["scripts", "e2e", "docs", ".claude", "coordination"];

/*
 * EXECUTABLE FILES ONLY, AND THIS GUARD LEARNED IT THE WAY EVERY OTHER ONE HERE HAS.
 *
 * The first version scanned `.md` and `.json` too, and within a day it fired on
 * TWO LANES DOCUMENTING THIS VERY DEFECT -- `docs/lanes/log/S2.md:1059` and
 * `coordination/answers/S0-A10-*.md:48`, both quoting the broken idiom inside
 * backticks to explain it. Neither is executed by anything.
 *
 * The prose-skip below catches a code COMMENT (`*`, `//`, `#`, `>`), and
 * markdown body text starts with none of those, so it sailed through. A guard
 * that fires on the write-up of the bug it guards would have cost two lanes a
 * unit chasing a non-defect, which is the exact harm this lane has filed twice
 * (the `check:unreachable` caveat, and one request in six answered "already
 * exists").
 *
 * So the scan is executable file types. A shell snippet inside a document is not
 * run by anything; if somebody copies it into a script, the script is scanned
 * and caught there, which is the moment it can actually do damage.
 */
const TEXT = /\.(sh|bash|zsh|mjs|js|ts|tsx)$/;

const walk = (dir) => {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const f of entries) {
    if (f === "node_modules" || f === ".git") continue;
    const p = join(dir, f);
    out = statSync(p).isDirectory() ? out.concat(walk(p)) : out.concat([p]);
  }
  return out;
};

/*
 * An UNBRACED, UNQUOTED parameter followed by `:` and a literal path.
 * `"$r:$p"` and `${r}:path` are both safe and must not match, so the pattern
 * requires a bare `$name` and then a path character rather than `$` or `"`.
 */
const UNSAFE = /git\s+cat-file[^\n|;]*\s\$[A-Za-z_][A-Za-z0-9_]*:[A-Za-z0-9_.-]/;

/*
 * PROSE IS NOT CODE, AND THIS CHECK CAUGHT ITSELF FIRST.
 *
 * The first run flagged three lines of this file's own header, which is the
 * repository's standing lesson arriving on schedule: a naive grep reads a
 * comment explaining a defect as the defect. S2 demonstrated the same false
 * positive on its own commit. So comment lines are skipped, and this file is
 * skipped whole -- it is the one place the unsafe form MUST appear, because it
 * is what the check is documenting.
 */
const SELF = "a-branch-check-must-survive-zsh.mjs";
const isProse = (line) => /^\s*(\*|\/\/|>|#\s)/.test(line);

const offenders = [];
for (const dir of SEARCH) {
  for (const f of walk(dir).filter((f) => TEXT.test(f) && !f.endsWith(SELF))) {
    const src = readFileSync(f, "utf8");
    src.split("\n").forEach((line, i) => {
      if (isProse(line)) return;
      if (UNSAFE.test(line))
        offenders.push({ file: f, line: i + 1, text: line.trim().slice(0, 140) });
    });
  }
}

console.log(`Scanned ${SEARCH.join(", ")} for a branch check zsh silently rewrites.`);

/*
 * ANTI-VACUITY. A scan of nothing must never report clean -- this repository
 * has now been burned three times by a zero that meant the instrument died
 * rather than that the defect was absent.
 */
const scanned = SEARCH.flatMap((d) => walk(d)).filter((f) => TEXT.test(f)).length;
if (scanned === 0) {
  console.error("REFUSING TO PASS: scanned 0 files, so this check did not run.");
  process.exit(2);
}
console.log(`${scanned} files read.`);

if (offenders.length === 0) {
  console.log("\nNo unbraced `git cat-file -e $ref:path` anywhere. Holding.");
  process.exit(0);
}

console.error(`\n${offenders.length} unbraced branch check(s), each silently wrong under zsh:\n`);
for (const o of offenders) console.error(`  ${o.file}:${o.line}\n    ${o.text}`);
console.error(
  "\nzsh parses `:` after an unbraced parameter as a modifier and eats the path, so this\n" +
    "stops testing the file and starts testing the ref. It is wrong in BOTH directions:\n" +
    "it reported an absent file present, and a present file absent, on this repository.\n" +
    'Use `git ls-tree -r --name-only <ref> | grep -qx <path>`, or quote it: "$ref:$path".',
);
process.exit(1);

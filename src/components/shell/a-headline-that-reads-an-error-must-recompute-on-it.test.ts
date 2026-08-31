/**
 * A MEMO THAT READS `isError` MUST DEPEND ON IT.
 *
 * ── THE DEFECT THIS CLOSED, AND IT IS THIS LANE'S RECURRING ONE ───────────
 * `AppFrame`'s headline memo read `openTracks.isError` in two branches — the
 * `feedDead` flag and the `"Cannot see what is running"` return — and
 * `openTracks.isError` was **not in its dependency array**. So the one sentence
 * whose entire job is to admit the feed died **could not recompute when the
 * tracks feed was the thing that died.**
 *
 * **Nothing else covered it**, which is what makes this a defect rather than a
 * lint nit. The only other dep fed by that query is `movingRuns`, which
 * memoises on `openTracks.data` — and `data` does not change when a read
 * fails. On a first-load failure it is `undefined` and stays `undefined`; on a
 * later failure TanStack **retains** the last successful value. Either way the
 * reference holds, no dependency changes, and the memo keeps returning the
 * sentence it computed while the feed was alive.
 *
 * ── WHY A TEST WHEN ESLINT ALREADY SAYS IT ────────────────────────────────
 * `react-hooks/exhaustive-deps` did flag it, as a **warning**, inside a repo
 * carrying **1,564 pre-existing lint problems**. A warning in that haystack is
 * not a signal. This asserts the one case that silences an error, so it fails
 * a gate instead of scrolling past in a list nobody can read to the end of.
 *
 * ── COMMENTS ARE STRIPPED FIRST, AND THAT IS NOT A DETAIL ─────────────────
 * Four source scans of mine have reported **my own comment** — quoting the line
 * it replaced — as the defect, and the fix above deliberately writes
 * `openTracks.isError` into a comment explaining itself. A scanner that reads
 * prose as code would pass on the strength of the paragraph describing the bug.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const FILE = "src/components/shell/AppFrame.tsx";

/** The file with block and line comments removed, so prose cannot be read as code. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

interface Memo {
  body: string;
  deps: string;
}

/**
 * Every `React.useMemo(…)` call, split into its body and its dependency array.
 *
 * Balanced-paren walk rather than a regex, because a memo body is full of
 * parentheses and a lazy match would stop at the first one and call the rest of
 * the file a dependency array.
 */
function memosIn(code: string): Memo[] {
  const out: Memo[] = [];
  const NEEDLE = "React.useMemo(";
  for (let at = code.indexOf(NEEDLE); at > -1; at = code.indexOf(NEEDLE, at + 1)) {
    let depth = 0;
    let end = -1;
    for (let i = at + NEEDLE.length - 1; i < code.length; i++) {
      if (code[i] === "(") depth++;
      else if (code[i] === ")") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) continue;
    const whole = code.slice(at + NEEDLE.length, end);
    // The dependency array is the last bracketed group in the call.
    const openDeps = whole.lastIndexOf("[");
    const closeDeps = whole.lastIndexOf("]");
    if (openDeps < 0 || closeDeps < openDeps) continue;
    out.push({ body: whole.slice(0, openDeps), deps: whole.slice(openDeps, closeDeps + 1) });
  }
  return out;
}

const CODE = codeOnly(readFileSync(FILE, "utf8"));

describe("a memo that reads an error state recomputes when it changes", () => {
  it("finds the memos at all, so a silent parse failure cannot pass this file", () => {
    /* A scanner that matched nothing would report zero violations and read as
       green. The count is asserted loosely - the point is that the walk found
       real memos, not that this file has an exact number of them. */
    const memos = memosIn(CODE);
    expect(memos.length).toBeGreaterThan(3);
    expect(memos.some((m) => m.body.includes("isError"))).toBe(true);
  });

  it("names every `X.isError` it reads in its own dependency array", () => {
    const violations: string[] = [];
    for (const memo of memosIn(CODE)) {
      const read = new Set([...memo.body.matchAll(/\b(\w+)\.isError\b/g)].map((m) => m[1]!));
      for (const q of read) {
        if (!new RegExp(`\\b${q}\\.isError\\b`).test(memo.deps)) violations.push(`${q}.isError`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("still reads openTracks.isError, so the guard is not passing on its absence", () => {
    /*
     * The failure mode of the test above is that somebody "fixes" a violation
     * by deleting the READ rather than adding the dep, and a scanner that only
     * checks "reads are covered" goes green on a headline that stopped telling
     * anyone the feed is dead. So the read itself is pinned.
     */
    const headline = memosIn(CODE).find((m) => m.body.includes("Cannot see what is running"));
    expect(headline).toBeDefined();
    expect(headline!.body).toContain("openTracks.isError");
    expect(headline!.deps).toContain("openTracks.isError");
  });

  it("strips comments before scanning, proven on a comment that names the identifier", () => {
    /* The fix's own comment says `openTracks.isError` while explaining why it
       was missing. Under a scanner that reads prose, that paragraph alone would
       satisfy the check. Asserted on a constructed case rather than on the real
       file, so it keeps testing the stripper after the comment is reworded. */
    const withProse = `React.useMemo(() => {
      /* mentions foo.isError only in prose */
      return 1;
    }, [bar])`;
    const [memo] = memosIn(codeOnly(withProse));
    expect(memo).toBeDefined();
    expect(memo!.body).not.toContain("isError");
  });
});

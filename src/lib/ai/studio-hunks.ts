/**
 * I1: pure line-diff / hunk engine for operator curation of a staged change.
 *
 * A staged Studio change carries the file's base_content and new_content. To let
 * the operator accept or reject individual hunks before the gated commit, we need
 * to (a) split the base->new diff into hunks and (b) reconstruct the file content
 * from a hunk selection (rejected hunks revert to their base lines). Both derive
 * from the SAME aligned op sequence so a hunk's id is stable across compute and
 * apply. No I/O here; the server fn that mutates new_content calls these.
 */

export interface Hunk {
  /** Stable index of this hunk within the file's diff (0-based, in file order). */
  id: number;
  /** The original (base) lines this hunk would replace. */
  baseLines: string[];
  /** The staged (new) lines this hunk introduces. */
  modifiedLines: string[];
}

type Op = { type: "equal" | "del" | "ins"; line: string };
type Segment = { equal: string[] } | { hunk: Hunk };

/** Split into lines, preserving a trailing newline as a trailing empty element
 * (so join("\n") round-trips exactly). An empty file is zero lines, not one
 * empty line, so create/delete diffs produce clean one-sided hunks. */
function splitLines(s: string): string[] {
  return s === "" ? [] : s.split("\n");
}

/** Classic LCS line alignment: equal lines stay, others become del (base-only)
 * or ins (modified-only). Deterministic and order-preserving. */
function diffLines(baseLines: string[], modLines: string[]): Op[] {
  const n = baseLines.length;
  const m = modLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        baseLines[i] === modLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (baseLines[i] === modLines[j]) {
      ops.push({ type: "equal", line: baseLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", line: baseLines[i] });
      i++;
    } else {
      ops.push({ type: "ins", line: modLines[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "del", line: baseLines[i++] });
  while (j < m) ops.push({ type: "ins", line: modLines[j++] });
  return ops;
}

/** Group the op stream into equal runs and changed hunks, assigning stable ids. */
function buildSegments(base: string, modified: string): Segment[] {
  const ops = diffLines(splitLines(base), splitLines(modified));
  const segs: Segment[] = [];
  let id = 0;
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type === "equal") {
      const equal: string[] = [];
      while (k < ops.length && ops[k].type === "equal") equal.push(ops[k++].line);
      segs.push({ equal });
    } else {
      const baseLines: string[] = [];
      const modifiedLines: string[] = [];
      while (k < ops.length && ops[k].type !== "equal") {
        if (ops[k].type === "del") baseLines.push(ops[k].line);
        else modifiedLines.push(ops[k].line);
        k++;
      }
      segs.push({ hunk: { id: id++, baseLines, modifiedLines } });
    }
  }
  return segs;
}

/** The hunks of a base->modified diff, in file order, with stable ids. */
export function computeHunks(base: string, modified: string): Hunk[] {
  return buildSegments(base, modified).flatMap((s) => ("hunk" in s ? [s.hunk] : []));
}

/* ------------------------------------------------------------------ *
 * The renderable diff: one row per line, with numbers and collapsing
 * ------------------------------------------------------------------ */

/**
 * One line of a rendered diff, or one collapsed run of unchanged lines.
 *
 * WHY THIS LIVES HERE rather than in a view module. It has to walk the SAME
 * `buildSegments` alignment that `computeHunks` and `applyHunkSelection` walk,
 * because every changed row carries the `hunkId` that per-hunk curation acts on.
 * A second alignment written next to the renderer would drift from the one the
 * server applies, and then rejecting "hunk 3" in the UI would revert a different
 * three lines on disk. This file's header already states the rule: both derive
 * from the same op sequence so a hunk's id is stable. This is the third consumer
 * of that guarantee, not an exception to it.
 *
 * `baseNo` / `nextNo` are 1-based line numbers in the base and the new file, and
 * null on the side where the line does not exist. That is what makes "which
 * line" answerable, which was the point of the exercise.
 */
export type DiffRow =
  | { kind: "same"; baseNo: number; nextNo: number; text: string }
  | { kind: "del"; baseNo: number; nextNo: null; text: string; hunkId: number }
  | { kind: "add"; baseNo: null; nextNo: number; text: string; hunkId: number }
  /**
   * A run of unchanged lines nobody needs to read, stated rather than dropped.
   * `baseNo`/`nextNo` are where reading RESUMES, so an expander can label itself
   * honestly and a person always knows the gap is a gap and not a truncation.
   */
  | { kind: "skipped"; count: number; baseNo: number; nextNo: number };

/** How many unchanged lines to keep on each side of a change. Three is the
 *  universal default (git, GitHub, every review tool), and matching it means
 *  nobody has to learn ours. */
export const DIFF_CONTEXT_LINES = 3;

/**
 * Build the rows for one file's diff.
 *
 * COLLAPSING IS THE WHOLE POINT, and it is why a fixed-height editor was the
 * wrong container. A 900-line file with a four-line change renders four changed
 * rows and six context rows here, so the diff is the size of the CHANGE rather
 * than the size of the file. That is what lets the box fit its content instead of
 * sitting at 420px whether it holds three lines or three hundred.
 *
 * `context = Infinity` disables collapsing entirely, which is what "expand all"
 * passes.
 */
export function diffRows(
  base: string,
  modified: string,
  context: number = DIFF_CONTEXT_LINES,
): DiffRow[] {
  const segs = buildSegments(base, modified);
  const rows: DiffRow[] = [];
  let baseNo = 1;
  let nextNo = 1;

  segs.forEach((seg, i) => {
    if ("hunk" in seg) {
      // Removals first, then additions, which is how a unified diff reads and
      // how the hunk itself is stored.
      for (const line of seg.hunk.baseLines) {
        rows.push({ kind: "del", baseNo: baseNo++, nextNo: null, text: line, hunkId: seg.hunk.id });
      }
      for (const line of seg.hunk.modifiedLines) {
        rows.push({ kind: "add", baseNo: null, nextNo: nextNo++, text: line, hunkId: seg.hunk.id });
      }
      return;
    }

    const lines = seg.equal;
    const first = i === 0;
    const last = i === segs.length - 1;
    // A leading run has no change above it, so it only needs its TAIL; a
    // trailing run only needs its HEAD; a run between two hunks needs both.
    const head = first ? 0 : context;
    const tail = last ? 0 : context;

    if (!Number.isFinite(context) || lines.length <= head + tail) {
      for (const line of lines) {
        rows.push({ kind: "same", baseNo: baseNo++, nextNo: nextNo++, text: line });
      }
      return;
    }

    for (let k = 0; k < head; k++) {
      rows.push({ kind: "same", baseNo: baseNo++, nextNo: nextNo++, text: lines[k] });
    }
    const hidden = lines.length - head - tail;
    baseNo += hidden;
    nextNo += hidden;
    rows.push({ kind: "skipped", count: hidden, baseNo, nextNo });
    for (let k = lines.length - tail; k < lines.length; k++) {
      rows.push({ kind: "same", baseNo: baseNo++, nextNo: nextNo++, text: lines[k] });
    }
  });

  return rows;
}

/** One row of a side-by-side diff: what was there, and what is there now. */
export type SideBySideRow = {
  left: DiffRow | null;
  right: DiffRow | null;
  /** Set when the whole row is a collapsed run, which spans both columns. */
  skipped: { count: number; baseNo: number; nextNo: number } | null;
};

/**
 * Pair unified rows into two columns.
 *
 * Derived FROM the unified rows rather than computed separately, so the two
 * views can never disagree about what changed: side by side is a layout of the
 * same facts, not a second opinion. Within a hunk, removals and additions pair
 * positionally and the shorter side gets nulls, which is what makes a rewritten
 * line read as a replacement rather than as a delete followed by an unrelated
 * insert.
 */
export function pairDiffRows(rows: DiffRow[]): SideBySideRow[] {
  const out: SideBySideRow[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.kind === "same") {
      out.push({ left: row, right: row, skipped: null });
      i++;
      continue;
    }
    if (row.kind === "skipped") {
      out.push({
        left: null,
        right: null,
        skipped: { count: row.count, baseNo: row.baseNo, nextNo: row.nextNo },
      });
      i++;
      continue;
    }
    // One hunk's worth of removals, then its additions.
    const hunkId = row.hunkId;
    const dels: DiffRow[] = [];
    const adds: DiffRow[] = [];
    while (i < rows.length) {
      const r = rows[i];
      if (r.kind === "del" && r.hunkId === hunkId) dels.push(r);
      else if (r.kind === "add" && r.hunkId === hunkId) adds.push(r);
      else break;
      i++;
    }
    for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
      out.push({ left: dels[k] ?? null, right: adds[k] ?? null, skipped: null });
    }
  }
  return out;
}

/**
 * The diffstat of one file: lines added, lines removed.
 *
 * WHY THIS EXISTS. The run screen stated its change in CHARACTERS, because
 * `getStudioSession` reduced each file to base_chars/new_chars before sending
 * it and characters were the only unit left. The comment there was honest about
 * the substitution ("naming the unit stops it being read as lines"), but "+1,240
 * characters" is not how anyone reads a change, and the prototype's own run
 * screen says "+24 -6 across 3 files".
 *
 * A character delta is also not a diff. Rewriting a line to the same length is
 * a real change and nets to zero; swapping two lines nets to zero as well. This
 * counts what the LCS alignment actually found, so a rename shows as one line
 * out and one line in, which is what happened.
 *
 * It reuses the same `buildSegments` alignment that hunk selection uses, so the
 * number on the headline can never disagree with the hunks rendered underneath
 * it. Two implementations of "what changed" is how those two drift apart.
 */
export function diffStat(base: string, modified: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const hunk of computeHunks(base, modified)) {
    added += hunk.modifiedLines.length;
    removed += hunk.baseLines.length;
  }
  return { added, removed };
}

/**
 * Reconstruct file content keeping every hunk EXCEPT the rejected ones, which
 * revert to their base lines. With no rejections this returns `modified`
 * exactly; with every hunk rejected it returns `base` exactly.
 */
export function applyHunkSelection(
  base: string,
  modified: string,
  rejectedHunkIds: number[],
): string {
  const rejected = new Set(rejectedHunkIds);
  const out: string[] = [];
  for (const seg of buildSegments(base, modified)) {
    if ("equal" in seg) {
      out.push(...seg.equal);
    } else {
      out.push(...(rejected.has(seg.hunk.id) ? seg.hunk.baseLines : seg.hunk.modifiedLines));
    }
  }
  return out.join("\n");
}

/**
 * F-BUILDER-MULTIFILE: file-set policy for a multi-file changeset.
 *
 * A Studio changeset can carry a pre-declared *touch list* (the only paths the
 * operator sanctioned) and a *max-files cap*. These pure helpers evaluate the
 * staged file set against that policy so the operator can see what is out of
 * scope and over the cap, and curate it, before the confirm-gated commit. No
 * I/O here; the server fns that read/mutate the changeset call these.
 */

/** Translate a touch-list glob into an anchored RegExp. A double-star matches
 * across path segments; bounded by slashes (or leading / trailing) it collapses
 * zero or more segments, so a globstar dir-prefix also matches files directly
 * under it. A single star matches within one segment; every other metachar is
 * literal. (Examples live in the test file to keep this block-comment safe.) */
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&"); // escape metachars; keep * and /
  // One pass, longest star-forms first, so the regex fragments we emit are not
  // themselves re-processed. A slash-bounded double star collapses zero or more
  // path segments; a lone single star stays within one segment.
  const body = escaped.replace(
    /\/\*\*\/|\*\*\/|\/\*\*|\*\*|\*/g,
    (m: string, offset: number, str: string) => {
      if (m === "/**/") return "/(?:.*/)?";
      if (m === "**/") return offset === 0 ? "(?:.*/)?" : ".*/";
      if (m === "/**") return offset + m.length === str.length ? "(?:/.*)?" : "/.*";
      if (m === "**") return ".*";
      return "[^/]*";
    },
  );
  return new RegExp(`^${body}$`);
}

/** Does `path` satisfy any touch-list entry? First match wins. Entry forms:
 *   - exact: `src/lib/a.ts` matches only that path
 *   - directory prefix: an entry ending in `/` matches everything beneath it
 *   - glob: an entry containing `*` (`src/**`, `src/lib/*.ts`)
 * Empty/whitespace entries never match. */
export function matchesTouchList(path: string, allowedPaths: string[]): boolean {
  for (const raw of allowedPaths) {
    const entry = raw.trim();
    if (!entry) continue;
    if (entry === path) return true;
    if (entry.endsWith("/") && path.startsWith(entry)) return true;
    if (entry.includes("*") && globToRegExp(entry).test(path)) return true;
  }
  return false;
}

export interface FileSetPolicyReport {
  /** A non-empty touch list was declared. */
  hasTouchList: boolean;
  /** A positive max-files cap was declared. */
  hasCap: boolean;
  /** Files currently staged. */
  fileCount: number;
  /** The declared cap, or null when uncapped. */
  maxFiles: number | null;
  /** fileCount <= maxFiles (true when uncapped). */
  withinCap: boolean;
  /** Files over the cap (0 when within or uncapped). */
  overBy: number;
  /** Staged paths in the touch list (all paths when no touch list). */
  inPolicy: string[];
  /** Staged paths NOT in the touch list (empty when no touch list). */
  outOfPolicy: string[];
  /** No touch-list violations AND within the cap. */
  clean: boolean;
}

/** Evaluate a staged file set against its declared touch list + cap. */
export function evaluateFileSetPolicy(input: {
  paths: string[];
  allowedPaths?: string[] | null;
  maxFiles?: number | null;
}): FileSetPolicyReport {
  const allowed = (input.allowedPaths ?? []).filter((p) => p.trim() !== "");
  const hasTouchList = allowed.length > 0;
  const maxFiles =
    typeof input.maxFiles === "number" && Number.isFinite(input.maxFiles) && input.maxFiles > 0
      ? Math.floor(input.maxFiles)
      : null;
  const hasCap = maxFiles !== null;

  const inPolicy: string[] = [];
  const outOfPolicy: string[] = [];
  for (const p of input.paths) {
    if (!hasTouchList || matchesTouchList(p, allowed)) inPolicy.push(p);
    else outOfPolicy.push(p);
  }
  const fileCount = input.paths.length;
  const withinCap = maxFiles === null ? true : fileCount <= maxFiles;
  const overBy = maxFiles === null ? 0 : Math.max(0, fileCount - maxFiles);

  return {
    hasTouchList,
    hasCap,
    fileCount,
    maxFiles,
    withinCap,
    overBy,
    inPolicy,
    outOfPolicy,
    clean: outOfPolicy.length === 0 && withinCap,
  };
}

export interface ChangesetFileInput {
  path: string;
  base: string;
  modified: string;
  rejectedHunkIds: number[];
}

/**
 * Merge a per-file hunk selection across every file of a changeset at once (the
 * multi-file extension of applyHunkSelection). Each file is reconstructed
 * independently, so a file with no rejections round-trips to its modified
 * content exactly, mirroring the single-file behavior.
 */
export function applyChangesetHunkSelections(
  files: ChangesetFileInput[],
): Array<{ path: string; merged: string }> {
  return files.map((f) => ({
    path: f.path,
    merged: applyHunkSelection(f.base, f.modified, f.rejectedHunkIds),
  }));
}

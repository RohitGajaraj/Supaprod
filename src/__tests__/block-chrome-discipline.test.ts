/**
 * ── A CONTROL THAT IS NOT A CONTROL IS STILL A DEFECT ────────────────────────────
 * _Created: 2026-08-17_
 *
 * Founder, on the Brief and voice pane: "there is an Invite teammates button, so that
 * is not at all working and opening."
 *
 * He was right that something was broken and wrong about what. `TeamCard` is fully
 * wired -- email, role, a real mutation, the join link, the pending list. What was
 * broken is that its own `Block title="Invite teammates"` sat INSIDE
 * `Block title="People"`. A Block draws card chrome plus an `<h2>`, so nesting one
 * produced a bordered titled row inside a bordered titled row, which is the shape this
 * product uses for a pressable thing everywhere else. He pressed a heading.
 *
 * Fixing that one instance is not enough, because nothing stopped the next one. These
 * two guards close both shapes of the same defect: chrome that promises an action it
 * cannot perform.
 *
 * A full sweep on the day this landed found ONE instance of each candidate class and
 * both were false positives of a truncating regex, so the parser here is brace-aware
 * rather than a plain `[^>]*` match. That mattered: the naive version reported twelve
 * inert buttons that all had handlers on a later line of a multi-line tag.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/* fileURLToPath, not `.pathname`: this checkout's path contains spaces, and a raw
   URL pathname hands back "My%20Projects", which scandir cannot open. */
const SRC = fileURLToPath(new URL("..", import.meta.url));

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      // The " 2"-suffixed directories are empty macOS case-insensitive artifacts.
      if (name.endsWith(" 2") || name === "node_modules") continue;
      out.push(...tsxFiles(p));
    } else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/**
 * Every `<Block ...>` opening tag, read to its real closing angle bracket.
 *
 * A JSX attribute can hold `>` inside an expression (`sub={<>...</>}`), so depth on
 * braces is tracked and only a `>` at depth zero ends the tag. This is the difference
 * between a guard that works and one that reports a dozen phantoms.
 */
function blockOpenTags(source: string): { index: number; tag: string; selfClosing: boolean }[] {
  const out: { index: number; tag: string; selfClosing: boolean }[] = [];
  for (const m of source.matchAll(/<Block\b/g)) {
    const start = m.index!;
    let i = start + m[0].length;
    let depth = 0;
    while (i < source.length) {
      const c = source[i]!;
      if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) {
        out.push({
          index: start,
          tag: source.slice(start, i + 1),
          selfClosing: source[i - 1] === "/",
        });
        break;
      }
      i += 1;
    }
  }
  return out;
}

const FILES = tsxFiles(SRC);

describe("Block chrome never promises an action it cannot perform", () => {
  it("no Block offers a `more` label without an `onMore` to run", () => {
    /*
     * `Block` renders `more` as a real <button onClick={onMore}>. With no handler that
     * is a button that visibly does nothing when pressed, which is precisely the thing
     * the founder reported. Proven red by deleting an `onMore` from a live call site.
     */
    const offenders: string[] = [];
    for (const file of FILES) {
      const source = readFileSync(file, "utf8");
      for (const { index, tag } of blockOpenTags(source)) {
        if (/\bmore=/.test(tag) && !/\bonMore\b/.test(tag)) {
          const line = source.slice(0, index).split("\n").length;
          offenders.push(`${file.replace(SRC, "src/")}:${line}`);
        }
      }
    }
    expect(offenders, `a \`more\` label with no handler is an inert button:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("no Block is drawn inside another Block, including from another file", () => {
    /*
     * ── WHY CROSS-FILE, AND HOW I FOUND OUT ────────────────────────────────────
     * The first version of this guard counted `<Block>` depth within each file, and it
     * PASSED when I re-planted the exact defect it was written for. The nested Block
     * was never in the same file: `<Block title="People"><TeamCard /></Block>` nests
     * because TeamCard draws a Block in ITS file. A per-file depth count cannot see
     * that, so the guard was decoration.
     *
     * So the components that draw their own Block chrome are resolved first, and then
     * their USAGE inside a Block extent is what fails. Same-file nesting is caught by
     * the same walk, because a literal `<Block>` inside a Block extent is a nest too.
     */
    const drawsOwnBlock = new Map<string, string>();
    for (const file of FILES) {
      const source = readFileSync(file, "utf8");
      /*
       * Column-0 `export function` only, bounded by the next column-0 declaration, so
       * a helper defined INSIDE a component cannot be mistaken for the component. The
       * loose version of this matched `copyLink` and `clockNow`, whose bodies simply
       * sat above their parent's return.
       */
      for (const m of source.matchAll(/^export function ([A-Z]\w+)\s*\(/gm)) {
        const after = source.slice(m.index! + m[0].length);
        const next = after.search(/^(?:export )?(?:function|const|type|class) /m);
        const body = next >= 0 ? after.slice(0, next) : after;
        const ret = body.match(/^\s*return \(?\s*$\n?\s*<(\w+)|^\s*return \(?\s*<(\w+)/m);
        const root = ret?.[1] ?? ret?.[2];
        if (root === "Block") drawsOwnBlock.set(m[1]!, file);
      }
    }
    // The guard is worthless if this list is empty, so the list itself is asserted.
    expect(drawsOwnBlock.size).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of FILES) {
      const source = readFileSync(file, "utf8");
      for (const { index, tag, selfClosing } of blockOpenTags(source)) {
        if (selfClosing) continue;
        // The extent of this Block, by matching tag depth.
        let depth = 1;
        let cursor = index + tag.length;
        let end = source.length;
        const scan = /<Block\b|<\/Block>/g;
        scan.lastIndex = cursor;
        let m: RegExpExecArray | null;
        while ((m = scan.exec(source))) {
          depth += m[0].startsWith("</") ? -1 : 1;
          if (depth === 0) {
            end = m.index;
            break;
          }
        }
        const inner = source.slice(cursor, end);
        const line = source.slice(0, index).split("\n").length;
        if (/<Block\b/.test(inner)) {
          offenders.push(`${file.replace(SRC, "src/")}:${line} holds a literal <Block>`);
        }
        for (const [name] of drawsOwnBlock) {
          // Only when this file actually imports it, so a same-named local is not blamed.
          if (new RegExp(`<${name}[\\s/>]`).test(inner) && new RegExp(`\\b${name}\\b`).test(source.slice(0, index))) {
            offenders.push(`${file.replace(SRC, "src/")}:${line} holds <${name} />, which draws its own Block`);
          }
        }
      }
    }
    expect(
      offenders,
      `a Block inside a Block draws a heading that reads as a control:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});

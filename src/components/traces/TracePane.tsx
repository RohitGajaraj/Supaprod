import { useMemo } from "react";

import { CodeBlock, type CodeToken } from "@/components/meridian/CodeBlock";

/*
 * TRACE PANE, the long text a call sent or got back.
 *
 * ── WHY IT EXISTS ───────────────────────────────────────────────────────
 * The drill layer used to draw its own `<pre>`, under a comment promising that
 * it was "capped, and it scrolls on BOTH axes inside its own box" so that "a
 * 400 line result may never grow the page and a 300 column JSON line may never
 * widen it". The code set no max height and no overflow, so the comment was the
 * spec and nothing implemented it: a long result grew the page until every
 * control below it was off screen, and one wide JSON line pushed the whole page
 * sideways. Meridian's CodeBlock already caps its own height and scrolls inside
 * it, so this file adapts a plain string to that component rather than fixing a
 * hand-rolled box a fourth time.
 *
 * ── TWO KINDS OF TEXT, AND THE RULE IS THE OLD ONE ──────────────────────
 * `json` keeps its structure and scrolls sideways inside the box: indented JSON
 * is unreadable once it is word-broken. Prose wraps, because a paragraph that
 * scrolls sideways is the defect the rule exists to prevent. That ruling is
 * carried over verbatim from the pane this replaces; only the enforcement moved.
 *
 * Prose wrapping is done by overriding CodeBlock's `whitespace-pre` from this
 * wrapper rather than by adding a prop to the shared component. The component
 * is correct for code, which is what it is named for, and a surface that needs
 * paragraphs out of it is this one.
 *
 * ── THE TONES ARE NOT SYNTAX COLOURS ────────────────────────────────────
 * CodeBlock ranks a line by how much of it the author CHOSE: names and literals
 * sit at the top of the neutral text ladder, language scaffolding at the bottom.
 * Applied to a tool call's arguments that reading is exact. The VALUES are what
 * the agent decided; the keys are the tool's schema, which it did not choose;
 * the braces and commas are structure you read past. So values take the ink
 * stop, keys the mute stop, punctuation the faint stop, and the pane still
 * passes a greyscale test by being greyscale.
 *
 * ── THE TOKENISER MUST BE LOSSLESS ──────────────────────────────────────
 * CodeBlock derives the text its Copy control hands over by joining the tokens
 * back together, so a tokeniser that drops or rewrites a single character ships
 * a button that copies something other than what is on screen. Every branch
 * below appends exactly the run it consumed, and every branch consumes at least
 * one character, so the walk both terminates and reconstructs the input.
 */

/** One line of JSON, split by how much of it the agent chose. */
function tokenizeJsonLine(line: string): CodeToken[] {
  const out: CodeToken[] = [];
  let structural = "";
  let i = 0;

  const flush = () => {
    if (structural) {
      out.push({ t: structural, c: "dim" });
      structural = "";
    }
  };

  while (i < line.length) {
    const ch = line[i];

    if (ch === '"') {
      // Walk to the closing quote, stepping over escapes. An unterminated
      // literal cannot happen in JSON.stringify output, and if one ever
      // arrives it is consumed to the end of the line rather than dropped.
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          j += 1;
          break;
        }
        j += 1;
      }
      const literal = line.slice(i, j);
      // A key is a string with a colon after it. A value is everything else.
      let k = i + literal.length;
      while (k < line.length && (line[k] === " " || line[k] === "\t")) k += 1;
      flush();
      out.push({ t: literal, c: line[k] === ":" ? "kw" : "str" });
      i += literal.length;
      continue;
    }

    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let j = i;
      while (j < line.length && /[-+0-9.eE]/.test(line[j])) j += 1;
      flush();
      out.push({ t: line.slice(i, j), c: "num" });
      i = j;
      continue;
    }

    const word = ["true", "false", "null"].find((w) => line.startsWith(w, i));
    if (word) {
      flush();
      // Same ink stop as a number: a literal is a value the agent chose.
      out.push({ t: word, c: "num" });
      i += word.length;
      continue;
    }

    structural += ch;
    i += 1;
  }

  flush();
  return out;
}

/** Prose keeps its own line breaks and takes no tones: nothing in a prompt was
 *  chosen more deliberately than anything else in it. */
function proseLines(text: string): CodeToken[][] {
  return text.split("\n").map((line) => (line.length ? [{ t: line }] : []));
}

function jsonLines(text: string): CodeToken[][] {
  return text.split("\n").map(tokenizeJsonLine);
}

/*
 * CodeBlock caps itself at a chat column's measure, which is right where it was
 * designed to sit and wrong here: this pane is the reason the reader opened the
 * surface, and a system prompt at 380px is a column of two words. The cap is
 * lifted from outside rather than by editing the shared component, so no other
 * surface inherits this one's width.
 */
const WIDEN = "[&>div]:max-w-none";
const WRAP = "[&_pre_span]:whitespace-pre-wrap [&_pre_span]:break-words";

export function TracePane({
  label,
  text,
  json = false,
}: {
  /** What this text is: Input, System prompt, Output, Arguments, Result. */
  label: string;
  text: string;
  /** True for a machine-shaped payload. See the header: it changes the wrap. */
  json?: boolean;
}) {
  const lines = useMemo(() => {
    if (!text) return [];
    return json ? jsonLines(text) : proseLines(text);
  }, [text, json]);

  return (
    <div className={`mt-mrd-6 ${WIDEN} ${json ? "" : WRAP}`}>
      <CodeBlock
        filename={label}
        language={json ? "json" : undefined}
        lines={lines}
        emptyLabel="Nothing was recorded here."
      />
    </div>
  );
}

export default TracePane;

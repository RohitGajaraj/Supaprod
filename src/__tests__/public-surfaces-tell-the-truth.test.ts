import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * PUBLIC SURFACES TELL THE TRUTH.
 *
 * WHY THIS IS A TEST AND NOT A NOTE IN A DOC. On the night of 2026-08-10 three
 * parallel sessions each corrected the same falsified moat claim, each in a
 * different file, and each finished believing the claim was gone. It was not:
 * the sentence lived in a landing component, in the static brief, and in the
 * copy served to answer engines, and no single reader held all three. A rule
 * that depends on somebody remembering it is a rule that gets half applied by
 * three people at once. This file is the same rule expressed as a sweep, so it
 * reads every public surface on every run and cannot be half applied.
 *
 * ---------------------------------------------------------------------------
 * SCOPE, WHICH IS THE PART THAT IS EASY TO GET WRONG
 *
 * The vocabulary here is BANNED IN PUBLIC AND CORRECT IN PRODUCT. That is a
 * register split, not a ban (CLAUDE.md; docs/strategy/positioning-locked-2026-08.md
 * section "Where each claim is allowed to appear"). A stranger on a landing page
 * hears "audit trail" as vendor noise; an operator standing on a trace uses those
 * exact words for the thing in front of them.
 *
 * src/components/supaprod/AuditTag.tsx is the case that proves it. It renders
 * `Trace ${tag}: its full audit trail` and that string is RIGHT. A previous sweep
 * treated the vocabulary as globally banned, changed in-product copy, and had to
 * be reverted. So this file walks a deliberately narrow set and a test below
 * asserts AuditTag is outside it.
 *
 * IN SCOPE   non-_authenticated routes in src/routes, src/components/landing/**,
 *            public/*.html, public/*.txt
 * OUT        everything else, and especially src/components/** outside landing
 *
 * ---------------------------------------------------------------------------
 * COMMENT STRIPPING IS LOAD BEARING, NOT A CONVENIENCE
 *
 * This repo records a retired claim by quoting it in a comment above the
 * correction. Receipts.tsx does exactly that: the comment over the moat
 * paragraph names "backfilled", "bought" and "bolted on" in order to explain
 * why they went. A guard that scanned raw text would fail on that comment, and
 * the fastest way to make it pass would be to delete the explanation. A rule
 * that punishes the documentation habit the codebase runs on gets deleted by
 * the first person it annoys, so every absence assertion below reads VISIBLE
 * TEXT: comments, imports, className values and inline CSS removed first.
 * "the comment stripper works" below pins that with Receipts.tsx as the fixture.
 *
 * ---------------------------------------------------------------------------
 * PENDING, AND WHY THIS FILE SHIPS WITH A BACKLOG RATHER THAN A CLEAN SWEEP
 *
 * The tree already carried violations when this guard was written. Fixing them
 * means choosing replacement copy, which is a positioning call and belongs to
 * the lane that owns positioning, not to the lane that owns the guard. So every
 * pre-existing hit is enumerated in PENDING with its reason, and:
 *
 *   1. anything NOT in PENDING fails, so nothing new gets in;
 *   2. a PENDING row that no longer matches anything ALSO fails, so the list
 *      can only shrink and a fixed line cannot quietly stay excused.
 *
 * The inventory prints on every run. A backlog you can see is a backlog that
 * gets worked; a silent allowlist is how the third session came to believe it
 * was finished.
 */

const REPO = join(import.meta.dir, "..", "..");
const rel = (f: string) => relative(REPO, f);

/* ------------------------------------------------------------------ *
 * 1. Which files are public
 * ------------------------------------------------------------------ */

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      // Tests are not a surface. They quote banned copy in order to ban it.
      if (name === "__tests__") continue;
      walkTsx(full, out);
    } else if (name.endsWith(".tsx") && !name.includes(".test.")) {
      out.push(full);
    }
  }
  return out;
}

function publicSurfaces(): string[] {
  const routes = readdirSync(join(REPO, "src", "routes"))
    .filter((n) => n.endsWith(".tsx") && !n.includes(".test."))
    // The one rule that defines the register split. Everything behind the
    // login is the in-product register and its vocabulary is correct there.
    .filter((n) => !n.startsWith("_authenticated"))
    .map((n) => join(REPO, "src", "routes", n));
  const landing = walkTsx(join(REPO, "src", "components", "landing"));
  const statics = readdirSync(join(REPO, "public"))
    .filter((n) => n.endsWith(".html") || n.endsWith(".txt"))
    .map((n) => join(REPO, "public", n));
  return [...routes, ...landing, ...statics].sort();
}

const FILES = publicSurfaces();

/* ------------------------------------------------------------------ *
 * 2. Visible text: what a human actually reads on the screen
 * ------------------------------------------------------------------ */

/**
 * Comments removed, string and template literals preserved.
 *
 * A character scanner rather than a regex pair, because the regex version
 * cannot tell `//` inside a URL string from the start of a comment, and this
 * repo's public copy is full of paths. Newlines are kept so reported line
 * numbers still point at the real line.
 */
function stripSourceComments(src: string): string {
  let out = "";
  let i = 0;
  let mode: null | "line" | "block" | "single" | "double" | "template" = null;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (mode === null) {
      // `{/* ... */}` is just `{` plus a block comment; the leftover `{}` is
      // inert because it matches neither a text node nor a string literal.
      if (c === "/" && d === "/") {
        mode = "line";
        i += 2;
        continue;
      }
      if (c === "/" && d === "*") {
        mode = "block";
        i += 2;
        continue;
      }
      if (c === '"') mode = "double";
      else if (c === "'") mode = "single";
      else if (c === "`") mode = "template";
      out += c;
      i += 1;
      continue;
    }
    if (mode === "line") {
      if (c === "\n") {
        mode = null;
        out += c;
      }
      i += 1;
      continue;
    }
    if (mode === "block") {
      if (c === "*" && d === "/") {
        mode = null;
        i += 2;
      } else {
        if (c === "\n") out += "\n";
        i += 1;
      }
      continue;
    }
    if (c === "\\") {
      out += c + (src[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (
      (mode === "double" && c === '"') ||
      (mode === "single" && c === "'") ||
      (mode === "template" && c === "`")
    ) {
      mode = null;
    }
    out += c;
    i += 1;
    continue;
  }
  return out;
}

/** Same width, same line count, no content. Keeps reported line numbers true. */
const blank = (m: string) => m.replace(/[^\n]/g, " ");

const CLASS_ATTR = /\b(?:className|class)\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})/g;

/**
 * URLs and code spans are identifiers, not prose. `/trust-ledger` in a robots
 * directive is a route, and treating it as the word "ledger" would report a
 * violation against a path that has to keep its name.
 */
function dropPathsAndCode(text: string): string {
  return text.replace(/`[^`]*`/g, " ").replace(/(^|[\s|(])\/[A-Za-z0-9][A-Za-z0-9._/$-]*/g, "$1 ");
}

type Visible = { text: string; line: number };

function lineCounter(s: string) {
  return (index: number) => s.slice(0, index).split("\n").length;
}

function visibleFromSource(src: string): Visible[] {
  let s = stripSourceComments(src);
  s = s.replace(/^\s*import\s[\s\S]*?(?:;|\n)/gm, blank);
  // Inline <style> is a stylesheet that happens to live in a component.
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, blank);
  s = s.replace(CLASS_ATTR, blank);

  const at = lineCounter(s);
  const out: Visible[] = [];
  // JSX text nodes: what sits between the tags.
  for (const m of s.matchAll(/>([^<>{}]+)</g)) {
    if (/[A-Za-z]/.test(m[1])) out.push({ text: dropPathsAndCode(m[1]), line: at(m.index + 1) });
  }
  // String and template literals that read as prose. Copy also lives in props
  // (title, alt, meta description) and in arrays of labels, not only in text
  // nodes, and the falsified claim reached answer engines through exactly such
  // a template literal (index.tsx MACHINE_CONTENT).
  for (const m of s.matchAll(/"([^"\\\n]{5,})"|'([^'\\\n]{5,})'|`([^`\\]{5,})`/g)) {
    const raw = m[1] ?? m[2] ?? m[3];
    if (raw && isProse(raw)) out.push({ text: dropPathsAndCode(raw), line: at(m.index) });
  }
  return out;
}

/** Prose has words and a space. Identifiers, paths and utility classes do not. */
function isProse(t: string): boolean {
  const s = t.trim();
  if (s.length < 5) return false;
  if (/^[/#.]/.test(s)) return false;
  if (/^https?:/.test(s)) return false;
  const words = s.split(/\s+/).filter((w) => /^[A-Za-z][A-Za-z',.:;!?-]*$/.test(w));
  if (words.length < 2) return false;
  // A Tailwind class list survives className stripping when it is built up in
  // a variable, and it is full of words like "ledger" only by accident.
  if (
    /(^|\s)(?:[a-z-]+:)?(?:flex|grid|text|bg|border|p[xytblr]?|m[xytblr]?|gap|w|h|min|max|rounded|font|leading|tracking|opacity|z|absolute|relative|hidden|hover)-[\w[\]./%-]+/.test(
      s,
    )
  ) {
    return false;
  }
  if (/[{};]/.test(s) && /:/.test(s)) return false;
  return true;
}

function visibleFromHtml(src: string): Visible[] {
  let s = src.replace(/<!--[\s\S]*?-->/g, blank);
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, blank);
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, blank);
  s = s.replace(CLASS_ATTR, blank);
  const at = lineCounter(s);
  const out: Visible[] = [];
  for (const m of s.matchAll(/>([^<>]+)</g)) {
    if (/[A-Za-z]/.test(m[1])) out.push({ text: dropPathsAndCode(m[1]), line: at(m.index + 1) });
  }
  return out;
}

/**
 * A served .txt has no comment layer. `#` is a convention for the crawler that
 * parses it, but a person who opens /agents.txt reads every line, so a `#` line
 * is public copy and is scanned. Only paths and code spans come out.
 */
function visibleFromText(src: string): Visible[] {
  return src.split("\n").map((line, i) => ({ text: dropPathsAndCode(line), line: i + 1 }));
}

function visible(file: string): Visible[] {
  const src = readFileSync(file, "utf8");
  if (file.endsWith(".html")) return visibleFromHtml(src);
  if (file.endsWith(".txt")) return visibleFromText(src);
  return visibleFromSource(src);
}

const VISIBLE = new Map<string, Visible[]>(FILES.map((f) => [f, visible(f)]));

/* ------------------------------------------------------------------ *
 * 3. The sweep
 * ------------------------------------------------------------------ */

type Probe = { id: string; re: RegExp };
type Hit = { file: string; line: number; id: string; text: string };

/** A phrase, matched whole-word and tolerant of the line wraps JSX introduces. */
function phrase(p: string): Probe {
  return { id: p, re: new RegExp(`\\b${p.split(" ").join("\\s+")}\\b`, "i") };
}

function sweep(probes: Probe[], files: string[] = FILES): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    for (const { text, line } of VISIBLE.get(file) ?? []) {
      for (const probe of probes) {
        if (probe.re.test(text)) {
          hits.push({ file, line, id: probe.id, text: text.trim().replace(/\s+/g, " ") });
        }
      }
    }
  }
  return hits;
}

const show = (h: Hit) => `${rel(h.file)}:${h.line} [${h.id}] ${h.text.slice(0, 140)}`;

/* ------------------------------------------------------------------ *
 * 4. PENDING: the backlog, itemised, owned by positioning
 * ------------------------------------------------------------------ */

/**
 * Every row is a violation that was already live when this guard landed. The
 * `why` is not an excuse, it is the reason the fix is somebody else's call.
 * Delete a row the day its string goes; the ratchet test fails if you forget.
 */
type Pending = { file: string; id: string; why: string };

const PENDING: Pending[] = [
  // ---- Rule A, landing page and its components -------------------------
  {
    file: "src/routes/index.tsx",
    id: "receipts",
    why: "JSON-LD disambiguatingDescription, 'governed by one human who gets the receipts'. Structured data feeds answer engines, so the replacement has to be the ratified identity sentence, not an ad-lib.",
  },
  {
    file: "src/components/landing/Receipts.tsx",
    id: "receipts",
    why: "The 'Receipts, not claims.' headline. Receipts.test.ts PINS it (expect(CODE).toContain('Receipts,')) as the ratchet that stopped the invented ledger table coming back, so removing it here breaks a guard that exists for a good reason. Retire both together or neither.",
  },
  {
    file: "src/components/landing/Receipts.tsx",
    id: "ledger",
    why: "The 'On the ledger' capability list, KEPT at founder request 2026-08-09 with the reason written into the file header. Overriding a named ruling is not a lint fix.",
  },
  {
    file: "src/components/landing/ThreeLayers.tsx",
    id: "company brain",
    why: "Layer 03 is called 'the company brain' in CLAUDE.md and README.md. The vocabulary table bans it in public. Two halves of the canon disagree and only positioning can settle which one moves.",
  },

  // ---- Rule A, other public routes --------------------------------------
  {
    file: "src/routes/product.tsx",
    id: "receipts",
    why: "Marketing page: 'all receipts', 'Agents that code with receipts', the CI RECEIPTS label. Squarely the banned public register, and squarely a copy rewrite.",
  },
  {
    file: "src/routes/product.tsx",
    id: "ledger",
    why: "'PROOF LEDGER', 'Ledger records both', 'outcome ledger'. Same page, same rewrite.",
  },
  {
    file: "src/routes/proof.tsx",
    id: "ledger",
    why: "The page is NAMED The Ledger, in its title, its h1 and its og tags. LandingFooter already links it as 'Track record' with a note explaining why, so the rename is half done and the other half needs a ruling.",
  },
  {
    file: "src/routes/proof.tsx",
    id: "receipts",
    why: "Meta description: 'public decision receipts'. Renaming the page renames this too.",
  },
  {
    file: "src/routes/demo.tsx",
    id: "ledger",
    why: "The demo walks a visitor through in-product surfaces, where the word is correct, on a public URL, where it is not. That boundary is a positioning question and the answer decides four strings at once.",
  },
  {
    file: "src/routes/updates.tsx",
    id: "ledger",
    why: "A dated changelog naming the product surface as it was called on the day. Rewriting shipped history is worse than the off-register word.",
  },

  // ---- Rule A, static public files ---------------------------------------
  {
    file: "public/llms.txt",
    id: "unattended",
    why: "Answer-engine copy, mirrors index.tsx MACHINE_CONTENT verbatim. The two must change in the same commit or they drift, which is the exact failure this file exists to catch.",
  },
  {
    file: "public/llms.txt",
    id: "company brain",
    why: "Same mirror. Blocked on the layer-03 naming call above.",
  },
  {
    file: "public/llms.txt",
    id: "receipts",
    why: "'paste a spec and get it argued against, with receipts'.",
  },
  {
    file: "public/llms.txt",
    id: "audit trail",
    why: "Route table row for the trust ledger surface. In-product register leaking into a public file.",
  },
  {
    file: "public/llms-full.txt",
    id: "unattended",
    why: "The long form of llms.txt. Every llms.txt row above has a twin here, which is how one fix comes to look finished while half of it is still live.",
  },
  { file: "public/llms-full.txt", id: "company brain", why: "Twin of the llms.txt row." },
  { file: "public/llms-full.txt", id: "receipts", why: "Twin of the llms.txt row." },
  { file: "public/llms-full.txt", id: "ledger", why: "Twin of the llms.txt row." },
  { file: "public/llms-full.txt", id: "audit trail", why: "Twin of the llms.txt row." },
  {
    file: "public/agents.txt",
    id: "unattended",
    why: "Policy preamble describing the loop. Same sentence as llms.txt, third copy.",
  },
  {
    file: "public/brief.html",
    id: "company brain",
    why: "The brief is named in the canon as a public surface. Section 06 is titled 'The moat, the company brain'. Blocked on the same layer-03 call.",
  },
  {
    file: "public/brief.html",
    id: "ledger",
    why: "Five separate slides. The brief is founder-approved as authored and re-cutting it is a deck revision, not a lint pass.",
  },
  {
    file: "public/brief.html",
    id: "receipts",
    why: "'keep the receipts', one of the three pillars on the moat slide.",
  },
  {
    file: "public/brief.html",
    id: "audit trail",
    why: "'Governance is what enterprises pay for; the ledger is the audit trail.'",
  },
];

function excused(h: Hit): boolean {
  return PENDING.some((p) => p.file === rel(h.file) && p.id === h.id);
}

/* ------------------------------------------------------------------ *
 * Rule A: banned public vocabulary
 * ------------------------------------------------------------------ */

/**
 * Measured across 5.9M words of the market's own writing: each of these scores
 * at or near zero. "receipts" appears 3.0 times per million and "trust ledger"
 * never. They are our words for our thing, not the buyer's words for their
 * problem. In-product they are correct and should be used.
 */
const RULE_A = [
  "receipts",
  "ledger",
  "audit trail",
  "company brain",
  "unattended",
  "first run",
].map(phrase);

describe("Rule A: public surfaces use the buyer's vocabulary", () => {
  it("ships no banned public word that PENDING has not already accounted for", () => {
    const fresh = sweep(RULE_A).filter((h) => !excused(h));
    expect(fresh.map(show)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Rule B: the falsified moat claim
 * ------------------------------------------------------------------ */

/**
 * ONE ASSERTION, SEVEN WAYS OF SAYING IT. The retired claim is that the
 * decision RECORD cannot be backfilled, bought, bolted on, copied quickly or
 * recovered after the fact. Falsified on the record 2026-08-10: Vercel's COO
 * ran an agent over Slack, email and Gong and reconstructed the true cause of a
 * lost deal, overturning the account executive's own account. Two days to
 * build, about $1,000 a year to run. Causes ARE recoverable from raw exhaust,
 * so a well-read buyer breaks the broad claim in one question.
 *
 * THE NARROW CLAIM SURVIVES AND USES THE SAME WORDS. A FORECAST cannot be
 * recovered after the fact: what a team believed would happen, recorded before
 * the outcome was known, is not an artifact and leaves no trace unless
 * something captured it at the moment of the call. public/brief.html says
 * exactly that ("the belief you held going in cannot be recovered after the
 * fact") and it is the approved sentence.
 *
 * So the phrase alone cannot decide. What decides is the SUBJECT: forbidden of
 * the record or the cause, correct of a forecast or a belief. The carve-out
 * below is that distinction, and it is the whole doctrine in one regex.
 */
const RULE_B = [
  "backfilled",
  "bolted on",
  "bought",
  "copied quickly",
  "recovered after the fact",
  "only accumulates with time",
].map(phrase);

const FORECAST_SUBJECT =
  /\b(?:forecast|forecasts|belief|beliefs|believed|prediction|predicted|expectation|expected|at decision time|before the outcome)\b/i;

/** The sentence the match landed in, so the carve-out reads its actual subject. */
function sentenceAround(text: string, re: RegExp): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.find((p) => re.test(p)) ?? text;
}

describe("Rule B: the moat claim is the narrow one", () => {
  it("makes no unrecoverable-record claim on any public surface", () => {
    const fresh = sweep(RULE_B)
      .filter((h) => !excused(h))
      .filter((h) => {
        const probe = RULE_B.find((p) => p.id === h.id);
        // Said of a forecast, the claim is true and is the approved wording.
        return !FORECAST_SUBJECT.test(sentenceAround(h.text, probe.re));
      });
    expect(fresh.map(show)).toEqual([]);
  });

  it("reports 'starts at zero', which is on the list BECAUSE it is correct", () => {
    /**
     * A list of only-banned wording cannot tell "we corrected this here" from
     * "this was never here", and that difference is the entire value of a
     * sweep. "starts at zero" is the seventh phrasing of the retired claim and
     * it is also live, on purpose, in the corrected sentence: a competitor who
     * starts next year has no forecast from this year, because a forecast is
     * not an artifact anyone can go and collect. Same words, opposite claim.
     *
     * This test never fails. It prints, so a reader sees the sweep reached the
     * corrected line and chose to leave it, rather than never having looked.
     */
    const found = sweep([phrase("starts at zero")]);
    console.log("\nRule B report, 'starts at zero' is ALLOWED where it appears:");
    for (const h of found) {
      console.log(`  ${show(h)}`);
      console.log(
        "    allowed: said of a COMPETITOR's missing forecast, not of our record. This is the corrected sentence, not the retired one.",
      );
    }
    // If it ever disappears entirely, the corrected sentence went with it and
    // somebody should find out why before this line is deleted.
    expect(found.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ *
 * Rule C: no present-tense accumulated-learning claim
 * ------------------------------------------------------------------ */

/**
 * THE HIGHEST-VALUE GUARD, because this one is FALSE rather than merely
 * off-register.
 *
 * Measured against production on 2026-08-10 through the Lovable MCP, which is
 * how database facts are checked in this repo:
 *
 *   select kind, count(*) from public.agent_memory group by kind
 *     reflection 896 | precedent 28 | note 26 | correction 8
 *   agent_memory total 958, kind='outcome' 0, learnings 119
 *
 * Zero outcome rows. The write path is proven against production and has never
 * once completed, so any sentence claiming the product is learning from a
 * customer's outcomes today describes something that has not happened.
 *
 * The honest form, which is also the stronger one: the loop is wired and
 * proven, and it begins accruing on first real use.
 *
 * WHAT THIS RULE DOES NOT CATCH, DELIBERATELY. "It tells you what to build,
 * builds it, ships it, checks what actually happened, and learns from it" is
 * the canonical product sentence in CLAUDE.md. Describing the MECHANISM in the
 * present tense is fine. Claiming the CORPUS already exists is not. Every probe
 * below anchors on the customer's own data ("from your", "remembers your") or
 * on a completed accumulation ("has learned", "accumulated learning"), which is
 * the line between the two.
 */
const RULE_C: Probe[] = [
  { id: "learns from your", re: /\b(?:learns?|learned|learning)\s+from\s+your\b/i },
  { id: "we learn from your", re: /\bwe\s+(?:learn|learned)\s+from\s+your\b/i },
  { id: "remembers your", re: /\bremembers?\s+your\b/i },
  { id: "has learned from", re: /\b(?:has|have|had)\s+learned\s+from\b/i },
  { id: "already knows your", re: /\balready\s+(?:knows?|learned|remembers?)\s+your\b/i },
  { id: "accumulated learning", re: /\baccumulat(?:ed|es|ing)\s+(?:learning|knowledge|memory)\b/i },
  // Named verbatim in the canon as the sentence that is not true yet: the
  // arrow moves learnings, not outcomes.
  { id: "informed by measured outcomes", re: /\binformed\s+by\s+measured\s+outcomes\b/i },
  { id: "gets smarter with every", re: /\bgets?\s+smarter\s+(?:with|every|each)\b/i },
  { id: "trained on your", re: /\btrained\s+on\s+your\b/i },
];

describe("Rule C: no present-tense claim that the product has already learned", () => {
  it("claims no accumulated learning anywhere a visitor can read it", () => {
    const fresh = sweep(RULE_C).filter((h) => !excused(h));
    expect(fresh.map(show)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Rule D: em dashes and invisible characters
 * ------------------------------------------------------------------ */

/**
 * Zero tolerance, founder ruling, and public pages are explicitly in scope:
 * docs/conventions/humanized-output.md names "consumer-facing screens, outcomes
 * the platform generates, public pages" as the set that must be perfect.
 *
 * WHY THIS RULE ADDS ANYTHING. scripts/check-humanized.sh already enforces the
 * same set, but only over *.ts and *.tsx, code lines only, and warn-only by
 * default. It cannot open a .txt or a .html file. Every literal hit this rule
 * found on its first run was in public/*.txt, which is precisely the gap: the
 * copy served to crawlers and to anyone who opens the URL had no checker at all.
 *
 * ENTITIES ARE NOT INVISIBLE CHARACTERS. public/brief.html uses `&nbsp;` as a
 * deliberate typographic separator. The ruling exists because an invisible
 * codepoint cannot be seen in a diff and rides along unnoticed; a named entity
 * is plain ASCII in the source, reviewable, and chosen on purpose. Literal
 * codepoints fail here, `&nbsp;` does not, and that difference is the reason
 * rather than an exemption.
 */
const BANNED_CHARS: Record<string, string> = {
  "—": "em dash",
  "―": "horizontal bar",
  " ": "no-break space",
  " ": "narrow no-break space",
  "­": "soft hyphen",
  "​": "zero-width space",
  "‌": "zero-width non-joiner",
  "‍": "zero-width joiner",
  "‎": "left-to-right mark",
  "‏": "right-to-left mark",
  " ": "line separator",
  " ": "paragraph separator",
  "⁠": "word joiner",
  "﻿": "byte order mark",
  "�": "replacement character",
};

describe("Rule D: no em dash, no invisible character", () => {
  it("carries none in any visible public string", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      for (const { text, line } of VISIBLE.get(file) ?? []) {
        const found = [...new Set([...text].filter((ch) => ch in BANNED_CHARS))];
        if (found.length === 0) continue;
        const names = found
          .map((ch) => `${BANNED_CHARS[ch]} U+${ch.codePointAt(0).toString(16).toUpperCase()}`)
          .join(", ");
        offenders.push(`${rel(file)}:${line} [${names}] ${text.trim().slice(0, 100)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * The guards on the guard
 * ------------------------------------------------------------------ */

describe("the sweep itself still works", () => {
  it("reads a plausible number of public files", () => {
    // A walker that silently finds nothing passes every rule above forever.
    expect(FILES.length).toBeGreaterThan(30);
    expect(FILES.some((f) => f.endsWith("routes/index.tsx"))).toBe(true);
    expect(FILES.some((f) => f.endsWith("landing/Receipts.tsx"))).toBe(true);
    expect(FILES.some((f) => f.endsWith("public/llms.txt"))).toBe(true);
    expect(FILES.some((f) => f.endsWith("public/brief.html"))).toBe(true);
  });

  it("leaves in-product surfaces alone, AuditTag most of all", () => {
    // The case that proves the register split. `Trace ${tag}: its full audit
    // trail` is correct copy and a previous sweep broke it. Nothing under
    // src/components outside landing may enter this set.
    expect(FILES.some((f) => f.includes("AuditTag"))).toBe(false);
    const strays = FILES.filter(
      (f) => f.includes(`components${"/"}`) && !f.includes(`landing${"/"}`),
    );
    expect(strays.map(rel)).toEqual([]);
    expect(FILES.filter((f) => f.includes("_authenticated")).map(rel)).toEqual([]);
  });

  it("the comment stripper works, with Receipts.tsx as the fixture", () => {
    // The comment above the corrected moat paragraph names three Rule B
    // phrasings in order to explain why they went. Raw text sees them; visible
    // text must not, or the guard punishes the explanation and the cheapest
    // way to green becomes deleting it.
    const file = FILES.find((f) => f.endsWith("landing/Receipts.tsx"));
    expect(file).toBeDefined();
    const raw = readFileSync(file, "utf8");
    expect(raw).toContain("backfilled");
    expect(raw).toContain("bolted on");
    const seen = (VISIBLE.get(file) ?? []).map((v) => v.text).join("\n");
    expect(seen).not.toContain("backfilled");
    expect(seen).not.toContain("bolted on");
    // And the corrected sentence, which is prose, does survive the stripper.
    expect(seen).toContain("forecast leaves no trace");
  });

  it("strips imports, className values and inline CSS", () => {
    const src = [
      'import { Ledger } from "@/receipts";',
      "// the old copy said receipts",
      "/* and the audit trail */",
      'const a = <p className="ledger-row receipts">Kept prose</p>;',
      "<style>{`.receipts { color: red }`}</style>",
    ].join("\n");
    const seen = visibleFromSource(src)
      .map((v) => v.text)
      .join(" ");
    expect(seen).toContain("Kept prose");
    expect(seen.toLowerCase()).not.toContain("receipts");
    expect(seen.toLowerCase()).not.toContain("audit trail");
    expect(seen.toLowerCase()).not.toContain("ledger");
  });

  it("does not read a route path as prose", () => {
    // `/trust-ledger` in a robots directive is a URL that has to keep its name.
    expect(sweep([phrase("ledger")], [join(REPO, "public", "robots.txt")])).toEqual([]);
  });
});

describe("PENDING is a shrinking list, not a permanent one", () => {
  it("has no stale row: every entry still matches something live", () => {
    // The half of the ratchet that matters. Without it, a row outlives the
    // string it excused and the next real violation in that file is waved
    // through by a rule nobody remembers writing.
    const live = sweep([...RULE_A, ...RULE_B, ...RULE_C]);
    const stale = PENDING.filter(
      (p) => !live.some((h) => rel(h.file) === p.file && h.id === p.id),
    ).map((p) => `${p.file} [${p.id}] is fixed or gone: delete this PENDING row`);
    expect(stale).toEqual([]);
  });

  it("prints the backlog, so it is worked rather than forgotten", () => {
    const live = sweep([...RULE_A, ...RULE_B, ...RULE_C]).filter(excused);
    console.log(
      `\nPENDING public-surface violations: ${PENDING.length} rows, ${live.length} live strings`,
    );
    for (const p of PENDING) {
      const lines = live
        .filter((h) => rel(h.file) === p.file && h.id === p.id)
        .map((h) => h.line)
        .join(", ");
      console.log(`  ${p.file} [${p.id}] lines ${lines}`);
      console.log(`      ${p.why}`);
    }
    expect(PENDING.length).toBeGreaterThan(0);
  });
});

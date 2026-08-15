// The anti-rot gate on what this product puts in a visitor's browser.
//
// WHY THIS IS A TEST AND NOT A PARAGRAPH. Supaprod shows no cookie consent
// banner, and that is the correct answer only for as long as four facts hold:
// no cookie is set, no third-party script loads, every persistent key is
// authentication or a preference the person set, and the only measurement key
// dies with the tab. All four are properties of the code, and all four can be
// broken by one line in an unrelated feature that typechecks perfectly and looks
// fine in a diff. A doc saying "check the consent position before adding
// storage" is followed only by someone who already thought to open it.
//
// THE DEFECT THIS EXISTS TO PREVENT. Until 2026-08-07 /privacy described a
// `session-id` cookie, four localStorage keys with names this repo has never
// used, and "Flock Analytics" as the vendor. None of it was real. Nobody caught
// it because nothing connected the copy to the code, so the page kept asserting
// a storage footprint the product does not have. These tests are that
// connection, run in both directions: the code cannot grow a key the policy does
// not name, and the policy cannot name a key the code stopped writing.
//
// THE POLICY IS docs/operations/security/cookie-and-storage-policy.md, and it is
// where a failure here should send you. Classify the new key there, in the same
// commit, and say which of the four facts it touches. If it touches the third or
// fourth, the answer may genuinely be a banner, and the policy says what that
// banner has to look like.
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(import.meta.dir, "..");
const REPO = join(SRC, "..");
const POLICY = join(REPO, "docs", "operations", "security", "cookie-and-storage-policy.md");

/** Every source file the browser can execute. Generated and test files are out:
 *  routeTree.gen.ts is machine-written, and a test that scanned tests would trip
 *  over the very patterns it is here to detect. */
function clientSources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === "__tests__" || entry === "node_modules") continue;
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) continue;
      if (entry === "routeTree.gen.ts") continue;
      // `.server.ts` and `*.functions.ts` never reach the browser bundle.
      if (entry.endsWith(".server.ts")) continue;
      out.push(full);
    }
  };
  walk(SRC);
  return out.sort();
}

/** Comments discuss these APIs in order to reason about them, including in this
 *  file's own neighbours. Only executable code counts as a write. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * `NAME` to `"value"` for every string constant in the bundle, kept only when the
 * name is unambiguous repo-wide.
 *
 * Key constants are frequently exported and imported (ASK_CONVERSATION_MAP_KEY
 * lives in lib/ask-stream-core.ts and is written from two other files), so a
 * same-file lookup alone silently fails to resolve them, and a silent failure in
 * a gate is the one bug a gate must not have. Names that carry different values
 * in different files (STORAGE_KEY is theme, density and avatar) are dropped here
 * and resolved from their own file instead.
 */
function globalConstants(): Map<string, string | null> {
  const seen = new Map<string, string | null>();
  for (const file of clientSources()) {
    const code = stripComments(readFileSync(file, "utf8"));
    for (const [, name, value] of code.matchAll(
      /\bconst\s+([A-Z][A-Z0-9_]*)\s*=\s*["']([^"']+)["']/g,
    )) {
      // null marks "ambiguous", which is sticky.
      seen.set(name, seen.has(name) && seen.get(name) !== value ? null : value);
    }
  }
  return seen;
}

const GLOBAL_CONSTANTS = globalConstants();

/**
 * Resolve the key a `setItem` call writes.
 *
 * A string literal is itself. An identifier is looked up in its own file first,
 * then in the repo-wide table above. A template literal keeps its static prefix,
 * so `${PRODUCT_KEY}.${id}` resolves to that prefix plus a marker: the
 * per-workspace suffix is a bounded family, not an unbounded key set. Anything
 * unresolvable is returned raw and fails the comparison, which is the safe
 * direction, since a key nobody can read is a key somebody should look at.
 */
function resolveKey(argument: string, source: string): string {
  const arg = argument.trim();

  const literal = /^["']([^"']*)["']$/.exec(arg);
  if (literal) return literal[1];

  const template = /^`([^`$]*)\$\{\s*([A-Za-z_$][\w$]*)/.exec(arg);
  if (template) {
    const [, prefix, ident] = template;
    return prefix ? prefix : `${resolveKey(ident, source)}.<dynamic>`;
  }

  const bare = /^([A-Za-z_$][\w$]*)$/.exec(arg);
  if (bare) {
    const local = new RegExp(`\\b${bare[1]}\\s*=\\s*["']([^"']+)["']`).exec(stripComments(source));
    if (local) return local[1];
    const global = GLOBAL_CONSTANTS.get(bare[1]);
    if (global) return global;
  }

  // A key built by a helper, `setItem(notepadKey(ws), …)`. Follow it into the
  // helper and resolve whatever it returns, because a scan that gave up here
  // would let a whole key family ship unclassified behind one function call.
  const call = /^([A-Za-z_$][\w$]*)\s*\(/.exec(arg);
  if (call) {
    const code = stripComments(source);
    const start = code.indexOf(`function ${call[1]}(`);
    if (start > -1) {
      const body = code.slice(start, code.indexOf("\n}", start));
      const returned = /return\s+(.+?);/s.exec(body);
      if (returned) {
        const first = /(`[^`]*`|["'][^"']*["'])/.exec(returned[1]);
        if (first) return resolveKey(first[1], source);
      }
    }
  }

  return arg;
}

/**
 * Files that write through a `Storage` handle rather than naming the global.
 *
 * An indirect handle is invisible to a scan for `localStorage.setItem`, so it is
 * the shape that would let a key ship unclassified. Each one is listed with the
 * store it actually holds and the reason it is indirect; anything else that calls
 * `.setItem` fails the test below rather than being quietly skipped.
 */
const DECLARED_INDIRECT: Record<string, "local" | "session"> = {
  // safeLocalStorage() wraps window.localStorage because the GETTER itself throws
  // in storage-denied browsers, so the flow ledger reaches storage through a
  // nullable handle. Same store, one layer of indirection.
  "src/lib/flow/session.ts": "local",
  // The PM notepad takes a `Pick<Storage, "setItem">` so it stays pure and
  // testable. It has a unit test and NO product consumer: the useNotepad hook its
  // own header promises does not exist, so nothing writes this key today. Listed
  // anyway, because "unwired" is a fact about this week and the classification
  // should already be settled on the day somebody wires it up.
  "src/lib/notepad.ts": "local",
};

/** Every key written into a browser, whatever syntax reaches the store. */
function storageWrites(): { store: "local" | "session"; key: string; where: string }[] {
  const writes: { store: "local" | "session"; key: string; where: string }[] = [];
  for (const file of clientSources()) {
    const source = readFileSync(file, "utf8");
    const code = stripComments(source);
    const where = relative(REPO, file);
    // The first argument runs to the comma that closes it. Keys here are literals,
    // identifiers or short templates, none of which contain a comma.
    for (const match of code.matchAll(/([A-Za-z_$][\w$.]*)\s*\.\s*setItem\(\s*([^,]+),/g)) {
      const receiver = match[1].split(".").pop() ?? "";
      const store =
        receiver === "localStorage"
          ? "local"
          : receiver === "sessionStorage"
            ? "session"
            : DECLARED_INDIRECT[where];
      // An undeclared indirect handle lands here as an unresolvable store, and
      // surfaces as a bogus key so the assertion names the file.
      writes.push({
        store: store ?? ("local" as const),
        key: store ? resolveKey(match[2], source) : `UNDECLARED INDIRECT WRITE in ${where}`,
        where,
      });
    }
  }
  return writes;
}

// ---------------------------------------------------------------------------
// The declared inventory. Every entry is classified in the policy document.
//
// necessary  = the requested service cannot be delivered without it
// functional = a preference the person set with their own click
// measurement = it exists to count something, and needs the argument in the
//               policy's "the two measurement keys" section to stay exempt
// ---------------------------------------------------------------------------

/** Persists until the person clears it. Adding one is the higher bar. */
const DECLARED_LOCAL = [
  "cad-density", // functional
  "supaprod.ask.conversations.v2", // functional
  "supaprod.feedback.prefs.v1", // functional
  "supaprod.flow.config", // functional
  "supaprod.flow.history", // functional
  "supaprod.flow.session", // functional
  "supaprod.notepad.<dynamic>", // functional, and currently unwired
  "supaprod.product.active.<dynamic>", // necessary
  "supaprod.theme", // functional
  "supaprod.workspace.active", // necessary
  "supaprod:avatar", // functional
  "supaprod:claim-admin-dismissed", // functional
  // `supaprod:mc:first-approval-seen` and `supaprod:mc:tour-seen` were here
  // until the Mission shell was deleted (2026-08-10). MissionShell.tsx was the
  // only writer of either, so the product stopped taking that storage and the
  // entries had to come out. This is the second direction in this file's header
  // firing exactly as designed: the policy cannot go on naming a key the code
  // stopped writing, because that is the 2026-08-07 defect in miniature. Their
  // rows in cookie-and-storage-policy.md were removed in the same commit.
  "supaprod:rail-narrow", // functional
];

/** Destroyed when the tab closes, which is what keeps the two measurement keys
 *  inside the audience-measurement position rather than needing consent. */
const DECLARED_SESSION = [
  "cad_landing_visit", // measurement
  "supaprod.credits.low-dismissed", // functional
  "supaprod.onboarding.criticReview", // necessary
  "supaprod.onboarding.justLanded", // necessary
  "supaprod.onboarding.phase", // necessary
  "supaprod.onboarding.startTime", // necessary
  "supaprod-machine-view", // functional
  "supaprod:landing-session", // measurement
  "supaprod:recents", // functional
  "supaprod_demo_session", // necessary
];

/** The Supabase auth token is written by the SDK, not by a `setItem` call we can
 *  scan for, so it is asserted at its configuration site instead. */
const SUPABASE_AUTH_STORAGE = join(SRC, "integrations", "supabase", "client.ts");

describe("client storage stays inside the no-consent-banner position", () => {
  test("no persistent key ships without being classified in the policy", () => {
    // A localStorage key survives the visit, so it is the one that can quietly
    // become a returning-visitor identifier. Classify it in
    // docs/operations/security/cookie-and-storage-policy.md first.
    const found = [
      ...new Set(
        storageWrites()
          .filter((w) => w.store === "local")
          .map((w) => w.key),
      ),
    ];
    expect(found.sort()).toEqual([...DECLARED_LOCAL].sort());
  });

  test("no tab-scoped key ships without being classified in the policy", () => {
    const found = [
      ...new Set(
        storageWrites()
          .filter((w) => w.store === "session")
          .map((w) => w.key),
      ),
    ];
    expect(found.sort()).toEqual([...DECLARED_SESSION].sort());
  });

  test("every declared key is named in the policy document", () => {
    // The other direction: a key the policy forgot is a page that describes a
    // storage footprint the product no longer has, which is the exact defect of
    // 2026-08-07. Reading the doc here is what keeps the two honest.
    const policy = readFileSync(POLICY, "utf8");
    const missing = [...DECLARED_LOCAL, ...DECLARED_SESSION]
      .map((key) => key.replace(".<dynamic>", ""))
      .filter((key) => !policy.includes(key));
    expect(missing).toEqual([]);
  });

  test("the auth session is the only thing the Supabase SDK is given a store for", () => {
    // persistSession puts `sb-<ref>-auth-token` in localStorage. That is strictly
    // necessary storage: it IS being signed in. It is fenced to `auth` here so a
    // future option cannot quietly widen what the SDK persists.
    const client = stripComments(readFileSync(SUPABASE_AUTH_STORAGE, "utf8"));
    expect(client).toMatch(/auth:\s*\{/);
    expect(client).toContain("persistSession: true");
    // One `storage:` binding, inside auth, and no other.
    expect([...client.matchAll(/\bstorage\s*:/g)]).toHaveLength(1);
  });
});

describe("nothing in the browser can set a cookie or reach a third party", () => {
  test("the only document.cookie write is the unused shadcn sidebar preference", () => {
    // THE DEFECT: a cookie is the one store that rides every request to the
    // server, so it is the store that turns a preference into ambient tracking
    // data. Supaprod sets none. `sidebar_state` in the stock shadcn scaffold is
    // the single write in the tree and SidebarProvider is imported by no file, so
    // it never runs. If a second write appears, or that component gets mounted,
    // the cookie section of the privacy policy stops being true.
    const writers = clientSources().filter((file) =>
      /document\s*\.\s*cookie\s*=/.test(stripComments(readFileSync(file, "utf8"))),
    );
    expect(writers.map((f) => relative(REPO, f))).toEqual(["src/components/ui/sidebar.tsx"]);

    const mounted = clientSources().filter(
      (file) =>
        !file.endsWith(join("components", "ui", "sidebar.tsx")) &&
        /\bSidebarProvider\b/.test(readFileSync(file, "utf8")),
    );
    expect(mounted).toEqual([]);
  });

  test("the app shell loads no external script", () => {
    // A third-party script is consent's real trigger: it can set vendor storage
    // and read the URL before any of our code runs. The one <script> in the shell
    // is the inline theme bootstrap, which touches only supaprod.theme.
    const root = stripComments(readFileSync(join(SRC, "routes", "__root.tsx"), "utf8"));
    expect(root).not.toMatch(/<script[^>]*\ssrc=/);
    // Fonts are self-hosted. A remote font host sees every visitor's IP.
    for (const match of root.matchAll(/href:\s*["']([^"']+)["']/g)) {
      expect(match[1].startsWith("/")).toBe(true);
    }
  });

  test("no browser analytics or marketing SDK is a dependency", () => {
    // Server-side PostHog is fine and is double-gated in src/lib/observability.
    // A BROWSER SDK is the line: it stores in the visitor's browser, so adding
    // one makes a deny-by-default banner mandatory before it may load.
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const installed = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const banned = installed.filter((name) =>
      /^(posthog-js|@sentry\/(browser|react)|mixpanel-browser|@amplitude\/|analytics-|react-ga|react-gtm|@segment\/|@hotjar\/|fathom-client|plausible-tracker)/.test(
        name,
      ),
    );
    expect(banned).toEqual([]);
  });

  test("vendor analytics stays gated on both an env key and the database flag", () => {
    // Either gate alone is one deploy away from being wrong. track() checks both,
    // and the policy's "off, and it is off twice" claim rests on exactly this.
    const analytics = stripComments(
      readFileSync(join(SRC, "lib", "observability", "analytics.ts"), "utf8"),
    );
    for (const fn of ["track", "identify"]) {
      const start = analytics.indexOf(`export async function ${fn}(`);
      expect(start).toBeGreaterThan(-1);
      const body = analytics.slice(start, analytics.indexOf("\n}", start));
      expect(body).toContain("cfg.posthog.enabled");
      expect(body).toContain("observabilityGateOn()");
    }
    // And it is a server call, never a browser SDK handed a distinct id.
    expect(analytics).not.toContain("posthog-js");
  });
});

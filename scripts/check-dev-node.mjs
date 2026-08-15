// Dev-server preflight. Both checks here defend the SAME failure: something
// upstream of the UI is dead, every server function fails, and the app renders
// its empty and could-not-read states — which look exactly like a workspace
// with no data in it. Design and product work then gets judged through a broken
// window. Fail loudly instead.

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

const bail = (msg) => {
  console.error(`\n${msg}\n`);
  process.exit(1);
};

// ── 1. Node 22+ ────────────────────────────────────────────────────────────
// supabase-js needs the native WebSocket that shipped in Node 22. On older Node
// every server function fails with "Native WebSocket not found".
const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  bail(
    `  bun run dev needs Node 22+ (you are on ${process.versions.node}).\n` +
      `  Node 20.20.2 is only for \`bun run build\`.\n` +
      `  Fix: open a fresh terminal (default Node) or run: nvm use default`,
  );
}

// ── 2. The env file ────────────────────────────────────────────────────────
// FOUND THE HARD WAY, 2026-08-15. `git worktree add` copies TRACKED files only,
// and `.env` is gitignored — so every parallel lane is created with no
// environment at all. Supabase then fails on every read and the product draws
// "count unavailable" across the seven-station strip, an empty Brain, and
// could-not-read states everywhere. Each of those is a CORRECT rendering of a
// failed read, which is precisely why nobody suspects the env: the UI looks
// like a considered empty state rather than a broken one.
//
// This runs in a bare node process, so `.env` has NOT been loaded into
// process.env yet — vite loads it later, in a different process. The file is
// therefore parsed off disk on purpose. Checking process.env here would pass
// on a machine that exports these in a shell profile and miss the lane case
// entirely, which is the only case this exists for.

const envPath = resolve(process.cwd(), ".env");

if (!existsSync(envPath)) {
  bail(
    `  No .env in this checkout, so every Supabase read will fail and the app\n` +
      `  will render "count unavailable" and empty states throughout.\n\n` +
      `  This is normal in a fresh worktree: \`git worktree add\` copies tracked\n` +
      `  files, and .env is gitignored.\n\n` +
      `  Fix — link it to the main checkout so it can never drift:\n` +
      `    ln -s "../Supaprod/.env" .env`,
  );
}

const declared = new Set(
  readFileSync(envPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    // A key with an empty value is not set. `FOO=` reads as present to a naive
    // parser and then fails identically to absent at runtime.
    .filter((line) => (line.split("=")[1] ?? "").trim() !== "")
    .map((line) => line.split("=")[0].trim()),
);

// Nothing renders without these: they are what the browser client and the
// user-scoped (RLS) auth middleware read. See src/integrations/supabase/.
const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

// Admin paths only — client.server.ts, which bypasses RLS. The product's
// ordinary reads do not touch it, so this is a warning rather than a stop: a
// missing service-role key breaks some server functions while leaving the rest
// of the app genuinely usable, and stopping dev over it would be wrong.
const ADMIN = ["SUPABASE_SERVICE_ROLE_KEY"];

const missing = REQUIRED.filter((k) => !declared.has(k));
if (missing.length > 0) {
  const target = realpathSync(envPath);
  bail(
    `  .env is missing ${missing.length === 1 ? "a variable" : "variables"} the app cannot start without:\n` +
      missing.map((k) => `    ${k}`).join("\n") +
      `\n\n  Reading: ${target}\n\n` +
      `  Every Supabase read will fail and the app will render "count\n` +
      `  unavailable" and empty states, which look like a workspace with no\n` +
      `  data rather than a broken connection.`,
  );
}

const missingAdmin = ADMIN.filter((k) => !declared.has(k));
if (missingAdmin.length > 0) {
  console.warn(
    `\n  Heads up: ${missingAdmin.join(", ")} is not set.\n` +
      `  Ordinary reads are user-scoped and will work. Server functions that go\n` +
      `  through src/integrations/supabase/client.server.ts (admin, RLS-bypassing)\n` +
      `  will throw where they are called.\n`,
  );
}

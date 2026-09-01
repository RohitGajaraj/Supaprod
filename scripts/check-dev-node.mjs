// Dev-server preflight. Both checks here defend the SAME failure: something
// upstream of the UI is dead, every server function fails, and the app renders
// its empty and could-not-read states — which look exactly like a workspace
// with no data in it. Design and product work then gets judged through a broken
// window. Fail loudly instead.

import { execFileSync } from "node:child_process";
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

// ── 1b. The dev port is not already held ───────────────────────────────────
// R-21 EXISTED AS PROSE IN FIVE BRIEFS AND NAMED THE WRONG PORT, SO IT NEVER
// ONCE FIRED. Every block and every session brief told all five lanes to run
// `lsof -ti:5173` before starting a server. Nothing in this repository listens
// on 5173: `@lovable.dev/vite-tanstack-config` hardcodes `port: 8080` and
// overrides any other value with a warning of its own ("...port 8080. Using
// 8080."). So the check was always clear, the lane started a second server on
// 8080, and the two collided. That is S2's recorded incident, and this machine
// has been driven to a restart by it while the founder was asleep.
//
// The rule was real, the enforcement was a sentence, and the sentence had a
// typo in it for as long as it existed. This makes it a refusal at the one
// entry point every lane actually uses.
//
// It also prints WHOSE server it is. S2 lost time killing another session's
// harness three times before learning to check the process owner rather than
// the port, and worked out this exact diagnostic by hand.
const DEV_PORT = 8080;

const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
};

// `lsof` absent is not a failure: skip rather than block dev on a missing tool.
if (sh("which", ["lsof"])) {
  const holders = sh("lsof", [`-ti:${DEV_PORT}`, "-sTCP:LISTEN"])
    .split("\n")
    .filter(Boolean);
  const mine = String(process.pid);
  const others = holders.filter((pid) => pid !== mine);
  if (others.length > 0 && !process.env.SUPAPROD_ALLOW_PORT_CONFLICT) {
    // Which checkout the holder is serving, because "a busy port" and "MY busy
    // port" need different actions and look identical from here.
    const where = others
      .map((pid) => {
        const cwd = sh("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"])
          .split("\n")
          .find((l) => l.startsWith("n"));
        return `    pid ${pid}${cwd ? `  serving ${cwd.slice(1)}` : ""}`;
      })
      .join("\n");
    bail(
      `  Something is already listening on :${DEV_PORT}, which is the port this dev\n` +
        `  server binds. Starting a second one is what R-21 forbids, and it has\n` +
        `  driven this machine to a restart.\n\n` +
        `  Holding it now:\n${where}\n\n` +
        `  If it is another session's, read docs/lanes/NOW-*.md and use theirs, or\n` +
        `  ask them to stop it. If it is a crashed server of your own:\n` +
        `    kill ${others.join(" ")}\n\n` +
        `  Note the port. Every brief used to say 5173, which nothing here binds,\n` +
        `  so that check was always clear and never protected anything.\n\n` +
        `  Deliberately sharing one server: SUPAPROD_ALLOW_PORT_CONFLICT=1 bun run dev`,
    );
  }
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

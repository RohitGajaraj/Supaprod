/**
 * WHAT SHAPE IS THIS REPOSITORY, AND CAN WE HOST IT?
 *
 * ── THE CLAIM THAT ONLY HOLDS FOR OUR OWN TEMPLATE (P-128) ───────────────
 * The honest Ship went live on 2026-09-04 because `relay-homeowner-app` is a
 * Supaprod template app: `supaprod.json` at the root and a `main.ts` that
 * `Deno.serve`s a static page. `changeset-deploy`'s own header says the scope
 * out loud -- *only Supaprod-managed repos qualify; arbitrary customer repos
 * keep the capture-only deployment records.*
 *
 * So for every repository a customer actually brings -- a Vite app, an Astro
 * site, a Bun server -- Ship ends at `merged` and "No app to show yet", and the
 * landing page's *then builds it. ships it.* is true of our own template and
 * nothing else.
 *
 * ── DETECTION READS THE REPO, NEVER A MARKER WE OWN ──────────────────────
 * `isSupaprodManaged` asks whether `supaprod.json` exists, which answers "did
 * we scaffold this" and not "can we host it". A customer cannot make their repo
 * hostable by understanding our marker, and asking them to add one is asking
 * them to adopt our convention before we do anything for them.
 *
 * What decides it is what is already there: a build script and where it puts
 * its output. That is a fact about their project, written by them, for their
 * own reasons.
 *
 * ── AND IT SAYS WHAT IT CANNOT DO, IN THE PRODUCT'S VOICE ────────────────
 * A shape we cannot host gets a sentence naming what was looked for and what
 * would make it work, plus the handback as the path that already exists. The
 * silence it replaces -- `merged`, then nothing -- is the state this whole
 * packet exists to end.
 */

/** The shapes this product can put on a URL, and the one it cannot. */
export type RepoShape =
  | {
      kind: "deno-entrypoint";
      /** The entrypoint at the repo root. */
      entrypoint: string;
      said: string;
    }
  | {
      kind: "static-build";
      /** The script to run, e.g. `build`. */
      script: string;
      /** Where that script leaves the site. */
      outDir: string;
      /** The dependency that decided the directory. Carried, never re-parsed
       *  out of `said` -- a sentence is for a person, not a field. */
      tool: string;
      said: string;
    }
  | {
      kind: "server";
      /** The start script we found and are NOT running. */
      script: string;
      said: string;
    }
  | { kind: "unknown"; said: string };

/** `package.json`, as much of it as this needs. */
export type PackageJson = {
  scripts?: Record<string, string> | null;
  dependencies?: Record<string, string> | null;
  devDependencies?: Record<string, string> | null;
} | null;

/**
 * Where a build leaves its output, by the tool that built it.
 *
 * Read from the DEPENDENCY rather than guessed from a folder listing: `dist`
 * exists in plenty of repos that do not build into it, and a wrong directory
 * uploads someone's source as their website.
 */
const OUT_DIR_BY_TOOL: ReadonlyArray<{ dep: string; outDir: string }> = [
  { dep: "astro", outDir: "dist" },
  { dep: "vite", outDir: "dist" },
  { dep: "@sveltejs/kit", outDir: "build" },
  { dep: "next", outDir: "out" },
  { dep: "parcel", outDir: "dist" },
];

function deps(pkg: PackageJson): Record<string, string> {
  return { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
}

/**
 * What shape is this repo?
 *
 * `rootFiles` is the repo's top-level file list; `pkg` is the parsed
 * `package.json` when there is one. Both come from reads the Build lane
 * already makes, so this costs no new call.
 */
export function repoShape(input: { rootFiles: readonly string[]; pkg: PackageJson }): RepoShape {
  const files = new Set(input.rootFiles.map((f) => f.trim()).filter(Boolean));

  /*
   * The template shape stays first and unchanged. It is what ships today, and a
   * repo carrying a root `main.ts` is telling us exactly how to serve it.
   */
  if (files.has("main.ts")) {
    return {
      kind: "deno-entrypoint",
      entrypoint: "main.ts",
      said: "This repo serves itself from main.ts, so it is deployed as it stands.",
    };
  }

  const scripts = input.pkg?.scripts ?? {};
  const d = deps(input.pkg);

  const buildScript = typeof scripts.build === "string" && scripts.build.trim() ? "build" : null;
  if (buildScript) {
    const tool = OUT_DIR_BY_TOOL.find((t) => t.dep in d);
    if (tool) {
      return {
        kind: "static-build",
        script: buildScript,
        outDir: tool.outDir,
        tool: tool.dep,
        said: `This is a ${tool.dep} site: its build script runs and what it writes to ${tool.outDir} is what goes live.`,
      };
    }
    /*
     * A build script with no tool we recognise. NOT hosted on a guess: we would
     * be picking an output directory for somebody else's project, and the cost
     * of guessing wrong is publishing their source.
     */
    return {
      kind: "unknown",
      said:
        "This repo has a build script, but nothing here says where it puts the finished site. " +
        "Supaprod can host a Vite, Astro, SvelteKit, Next or Parcel build; for anything else, " +
        "deploy it your way and hand the address back.",
    };
  }

  const startScript =
    typeof scripts.start === "string" && scripts.start.trim()
      ? "start"
      : typeof scripts.dev === "string" && scripts.dev.trim()
        ? "dev"
        : null;
  if (startScript) {
    /*
     * A server, and this product does not host one yet. Named rather than
     * lumped into "unknown", because "we do not host servers yet" is a
     * different sentence from "we could not tell what this is" and only one of
     * them tells a person whether to wait for us.
     */
    return {
      kind: "server",
      script: startScript,
      said:
        `This repo runs a server (\`${startScript}\`), which Supaprod does not host yet. ` +
        "Deploy it your way and hand the address back, and the run is graded on the same forecast.",
    };
  }

  return {
    kind: "unknown",
    said:
      "Nothing here says how to run this repo: no main.ts at the root, and no build or start " +
      "script in package.json. Deploy it your way and hand the address back.",
  };
}

/** Can this product put this shape on a URL by itself? */
export function canHost(shape: RepoShape): boolean {
  return shape.kind === "deno-entrypoint" || shape.kind === "static-build";
}

/**
 * The generated entrypoint that serves a built site.
 *
 * Static files only, one directory, no routing cleverness: a single-page app's
 * deep links fall back to `index.html`, which is the one behaviour every one of
 * these tools expects and the only one worth assuming.
 */
export function staticEntrypoint(outDir: string): string {
  return `// Generated by Supaprod to serve this build. Edit the site, not this file.
const ROOT = ${JSON.stringify(`./${outDir.replace(/^\.?\//, "")}`)};

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  for (const candidate of [path, "/index.html"]) {
    try {
      const file = await Deno.readFile(ROOT + candidate);
      return new Response(file, { headers: { "content-type": contentType(candidate) } });
    } catch {
      continue;
    }
  }
  return new Response("Not found", { status: 404 });
});

function contentType(p: string): string {
  if (p.endsWith(".html")) return "text/html; charset=utf-8";
  if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (p.endsWith(".css")) return "text/css; charset=utf-8";
  if (p.endsWith(".json")) return "application/json; charset=utf-8";
  if (p.endsWith(".svg")) return "image/svg+xml";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}
`;
}

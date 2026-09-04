/**
 * WHAT ACTUALLY GOES TO THE HOST, FOR A REPO OF EITHER SHAPE.
 *
 * ── ONE SEAM, SO PREVIEW AND PROMOTE CANNOT DIVERGE (P-128b) ─────────────
 * Both presses called `collectRepoFiles` directly, which reads the repo's text
 * files and refuses anything without a root `main.ts`. That is the template
 * shape and only the template shape.
 *
 * R-41 added a second: a static build, built in the sandbox, served behind a
 * generated entrypoint. Adding it at two call sites would be two places
 * deciding what a deploy contains, and the promote is the one that must match
 * the preview EXACTLY -- a promote that assembled the site differently from the
 * preview a person approved is the worst failure available here, because it
 * ships something nobody looked at.
 *
 * So both go through this, and the shape is resolved once from the repository
 * itself rather than from a marker we own.
 */
import { collectRepoFiles } from "@/lib/hosting/changeset-deploy.server";
import {
  buildStaticSite,
  type SiteBuildDeps,
} from "@/lib/hosting/build-a-site-in-a-sandbox.server";
import {
  canHost,
  repoShape,
  staticEntrypoint,
  type PackageJson,
  type RepoShape,
} from "@/lib/hosting/what-shape-is-this-repo";

export type DeployPayload = {
  files: Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }>;
  shape: RepoShape;
  /** What the record keeps about how this was produced. Null for the template. */
  build: { tool: string; outDir: string; buildMs: number; bytes: number } | null;
};

function ghHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

/** The repo's top-level names and its `package.json`, in one tree read. */
export async function readRepoSurface(args: {
  token: string;
  repo: string;
  ref: string;
}): Promise<{ rootFiles: string[]; pkg: PackageJson }> {
  const headers = ghHeaders(args.token);
  const treeRes = await fetch(
    `https://api.github.com/repos/${args.repo}/git/trees/${encodeURIComponent(args.ref)}`,
    { headers },
  );
  if (!treeRes.ok) {
    throw new Error(`The repository's files could not be read (${treeRes.status}).`);
  }
  const tree = (await treeRes.json()) as {
    tree?: Array<{ path: string; type: string; sha: string }>;
  };
  const entries = tree.tree ?? [];
  const rootFiles = entries.filter((e) => e.type === "blob").map((e) => e.path);

  let pkg: PackageJson = null;
  const pkgEntry = entries.find((e) => e.path === "package.json" && e.type === "blob");
  if (pkgEntry) {
    const blobRes = await fetch(
      `https://api.github.com/repos/${args.repo}/git/blobs/${pkgEntry.sha}`,
      { headers },
    );
    if (blobRes.ok) {
      const blob = (await blobRes.json()) as { content?: string; encoding?: string };
      const text =
        blob.encoding === "base64"
          ? Buffer.from((blob.content ?? "").replace(/\n/g, ""), "base64").toString("utf-8")
          : (blob.content ?? "");
      try {
        pkg = JSON.parse(text) as PackageJson;
      } catch {
        /* A package.json we cannot parse is a repo with no readable scripts,
           which `repoShape` already has an honest answer for. */
        pkg = null;
      }
    }
  }
  return { rootFiles, pkg };
}

/**
 * Assemble the deploy for whatever shape this repo is.
 *
 * THROWS with the shape's own sentence when we cannot host it, because both
 * callers already turn a thrown message into the deployment row's
 * `failure_reason` -- so the refusal reaches the run screen by the path that
 * already exists rather than through a new one.
 */
export async function filesForDeploy(args: {
  token: string;
  repo: string;
  ref: string;
  deps?: SiteBuildDeps;
}): Promise<DeployPayload> {
  const surface = await readRepoSurface(args);
  const shape = repoShape(surface);

  if (!canHost(shape)) throw new Error(shape.said);

  if (shape.kind !== "static-build") {
    const files = await collectRepoFiles({ token: args.token, repo: args.repo, ref: args.ref });
    return { files, shape, build: null };
  }

  const built = await buildStaticSite({
    repo: args.repo,
    ref: args.ref,
    token: args.token,
    script: shape.script,
    outDir: shape.outDir,
    tool: shape.tool,
    deps: args.deps,
  });
  if (!built.ok) throw new Error(built.reason);

  /*
   * The built site goes UNDER the output directory and the generated
   * entrypoint sits at the root beside it, which is the layout
   * `staticEntrypoint` serves. Deno Deploy takes the entrypoint by name, so the
   * two have to agree about where the files are; they agree because one
   * function decides both.
   */
  const files: DeployPayload["files"] = built.files.map((f) => ({
    path: `${shape.outDir}/${f.path}`,
    content: f.content,
    encoding: f.encoding,
  }));
  files.push({ path: "main.ts", content: staticEntrypoint(shape.outDir), encoding: "utf-8" });

  return {
    files,
    shape,
    build: { tool: built.tool, outDir: built.outDir, buildMs: built.buildMs, bytes: built.bytes },
  };
}

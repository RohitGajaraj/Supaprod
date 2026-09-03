/**
 * NOTHING RUNS IN FRONT OF THE PERSON — gap #11, and P-22's first close.
 *
 * Founder, 2026-09-02, from Lovable's Live preview setting: *watching the diff
 * is watching the work; watching the app run is watching the result.* Everything
 * a run produced until now was a DESCRIPTION of a change — a diff, a checklist,
 * a verdict — and none of it was the change.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const FRAME = readFileSync("src/components/track/AppFrame.tsx", "utf8");
const PANE = readFileSync("src/components/track/ArtifactPane.tsx", "utf8");
const READ = readFileSync("src/lib/deployments.functions.ts", "utf8");
const code = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
const frameCode = code(FRAME);
const paneCode = code(PANE);

describe("the frame is sandboxed, and the sandbox is the specific part", () => {
  it("sets sandbox and does NOT allow top navigation", () => {
    /*
     * THE ONE THAT MATTERS. A preview that can navigate the page it is embedded
     * in can take a person off this product without them touching anything —
     * from a page that is showing them somebody else's code running.
     */
    expect(frameCode).toContain('sandbox="allow-scripts allow-forms allow-modals"');
    expect(frameCode).not.toContain("allow-top-navigation");
    expect(frameCode).not.toContain("allow-same-origin");
  });

  it("copies the sandbox the prototype frame already uses rather than inventing one", () => {
    // Two iframes in one product with different sandboxes is one of them wrong.
    const proto = PANE.match(/sandbox="([^"]+)"/)?.[1];
    expect(frameCode).toContain(`sandbox="${proto}"`);
  });

  it("opens in a new tab with the opener severed", () => {
    // `noopener` is not decoration on a link to somebody else's deploy.
    expect(frameCode).toContain('rel="noreferrer noopener"');
    expect(frameCode).toContain('target="_blank"');
  });

  it("shows the URL beside the frame, and the commit it is running", () => {
    // A person who wants to poke at it wants a real tab with real devtools; a
    // person checking WHICH build this is wants the sha.
    expect(frameCode).toContain("{url}");
    expect(frameCode).toContain("sha.slice(0, 7)");
  });
});

describe("a build in flight says what it is doing, never a spinner", () => {
  it("draws the provider, the state and a clock", () => {
    /*
     * A spinner over a deploy is the same lie as a spinner over an agent: it
     * says "something is happening" and answers nothing a person came to ask.
     */
    /* From the building branch to the end of the file: everything after it is
       the running state, and asserting on the branch alone is what this needs. */
    const building = frameCode.slice(frameCode.indexOf('if (state === "building")'));
    expect(building).toContain("is building it");
    expect(building).toContain("StatusChip");
    // The clock is computed above the branches because a hook cannot sit inside
    // one; what matters is that it is active only while building.
    expect(frameCode).toContain("useElapsed(");
    expect(frameCode).toContain("building && !Number.isNaN(startedMs)");
  });

  it("has no spinner anywhere in the file", () => {
    for (const word of ["Spinner", "animate-spin", "LoadingState"]) {
      expect(frameCode, `${word} is a spinner by another name`).not.toContain(word);
    }
  });

  it("never leaves an empty region: every state returns something", () => {
    // The one exception is a read that has not answered, which is not a state —
    // drawing "no preview" and then filling it in would be a lie that corrects
    // itself.
    for (const state of ["none", "stale", "building"]) {
      expect(frameCode).toContain(`state === "${state}"`);
    }
    expect(frameCode).toContain("if (!q.data) return null;");
  });

  it("polls only while it is building", () => {
    // A running preview does not change and a missing one does not appear by
    // itself; neither earns a request every ten seconds.
    expect(frameCode).toContain('query.state.data?.state === "building" ? 10_000 : false');
  });
});

describe("no preview, and the two ways that happens are different facts", () => {
  it("says why in one line and gives the door", () => {
    expect(frameCode).toContain("NeedsSetup");
    expect(frameCode).toContain("no preview deploys connected");
    expect(frameCode).toContain("/settings?tab=connections");
  });

  it("tells a stale preview apart from no preview at all", () => {
    /*
     * The pipeline is wired and this commit has not been built. That is a
     * different thing for a person to do than "connect something", and folding
     * them together sends somebody to Settings to fix a connection that works.
     */
    expect(frameCode).toContain('state === "stale"');
    expect(frameCode).toContain("This change has previews, but none at");
  });
});

describe("the read behind it", () => {
  it("only calls it running at the HEAD commit", () => {
    /*
     * A preview at an older commit is a different program wearing this change's
     * name — the same trap R-33 closed on the promote path, where the newest
     * preview was shipped without asking what merged.
     */
    expect(READ).toContain("d.commit_sha === head");
    expect(READ).toContain('d.status === "success" && d.deploy_url');
  });

  it("takes the head from the newest revision, never from base_sha", () => {
    // `base_sha` is where the branch started, which is the one sha that is never
    // what is running.
    expect(READ).toContain('.from("studio_changeset_revisions")');
    expect(READ).toContain('.order("revision_no", { ascending: false })');
  });

  it("reads and never writes, so looking at a tab cannot spend money", () => {
    const fn = READ.slice(READ.indexOf("export const previewForChangeset"));
    for (const write of [".insert(", ".update(", ".upsert(", ".delete("]) {
      expect(fn, `previewForChangeset must not ${write}`).not.toContain(write);
    }
  });

  it("a failed read is not an absence of previews", () => {
    expect(READ).toContain("[previewForChangeset]");
  });
});

describe("where it sits on the page", () => {
  it("the app leads and the diff is one press away", () => {
    // Watching the diff is watching the work; watching the app is watching the
    // result. The result leads.
    expect(paneCode).toContain('React.useState<"app" | "diff">("app")');
    expect(paneCode).toContain("<AppOrDiff changesetId={item.artifactId} />");
  });

  it("does not replace the diff, which is the thing that already worked", () => {
    expect(paneCode).toContain("<ChangesetDiffView changesetId={changesetId} />");
  });

  it("is not a tablist, because this route forbids one and is right to", () => {
    /*
     * `one-station-display-on-the-run-screen` caught the first version of this.
     * A tab band on this route once meant a seven-station display on every
     * screen in the product, and `aria-pressed` on two buttons is the more
     * honest ARIA for one card choosing between two answers anyway.
     */
    const block = paneCode.slice(paneCode.indexOf("function AppOrDiff"));
    expect(block).not.toContain('role="tablist"');
    expect(block).toContain("aria-pressed={showing === which}");
  });

  it("keeps the choice per changeset and does not remember it", () => {
    // A person who opened the diff on one change has said nothing about the
    // next, and a remembered preference would quietly turn this off for anybody
    // who ever looked at a diff.
    expect(paneCode).not.toContain("localStorage");
  });
});

/**
 * ── SHIP SHOWS WHAT WENT OUT, RUNNING, THE SAME WAY ───────────────────────
 *
 * The packet's second half: *"Ship's row shows the production URL the same way
 * once release.publish fires."* The same way is the point — Build showing a
 * frame and Ship showing a link to the same kind of thing is exactly the drift
 * one shared component exists to prevent.
 */
describe("Ship runs it too, and knows the address without asking", () => {
  it("renders the frame rather than only a link", () => {
    // Whitespace-insensitive: prettier decides where this JSX wraps, and a guard
    // a reformat can break is a guard somebody deletes rather than fixes.
    expect(paneCode.replace(/\s+/g, " ")).toContain("<RunningApp url={url}");
  });

  it("says Live for production and App otherwise", () => {
    // The same frame, a different claim. "Live" is a stronger word and is only
    // true of the environment that word means.
    expect(paneCode).toContain('env === "production" ? "Live" : "App"');
  });

  it("only frames a release that actually succeeded", () => {
    /*
     * A blank iframe under a red chip reads as the product being broken rather
     * than the deploy being. A failed or in-flight release keeps the link.
     */
    expect(paneCode).toContain('url && standing.tone === "pass"');
    expect(paneCode).toContain("Open what went out");
  });

  it("keeps the honest line when there is no address at all", () => {
    expect(paneCode).toContain("No address was recorded, so there is nothing to open.");
  });

  it("does not look up what it already holds", () => {
    /*
     * Build asks `previewForChangeset` because a preview is a row somebody
     * else's pipeline wrote and this product has to go and find it. `ReleaseCard`
     * renders a `deployments` row that carries `deploy_url` in hand; a lookup
     * there would re-fetch a fact already on screen.
     */
    // Bounded at the end of ReleaseCard: an unbounded slice runs on into
    // `AppOrDiff`, which legitimately renders <AppFrame>, and asserts its
    // absence somewhere it was never claimed to be.
    const from = paneCode.indexOf("function ReleaseCard");
    const release = paneCode.slice(from, paneCode.indexOf("\nfunction ", from + 10));
    expect(release).toContain("<RunningApp");
    expect(release).not.toContain("previewForChangeset");
    expect(release).not.toContain("<AppFrame");
  });

  it("both callers draw the same frame, so they cannot disagree about it", () => {
    expect(frameCode).toContain("export function RunningApp(");
    expect(frameCode).toContain("return <RunningApp url={url} sha={sha} label={label} />;");
  });
});

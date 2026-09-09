/**
 * P-62 found `brain_last_seen` with a reader and no writer, so Start read "You
 * have not looked yet" against 140 findings on Helio -- the honest branch, and
 * without a writer the only branch that would ever render, on every workspace,
 * forever.
 *
 * The rule these guards hold: A VISIT IS A PERSON, NOT A READ.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const FN = code(readFileSync("src/lib/start/stamp-the-last-look.functions.ts", "utf8"));
const HOOK = code(readFileSync("src/components/start/use-stamp-the-last-look.ts", "utf8"));
/* The stamp moved from the route's mount into DiscoverSurface on 2026-09-09
   (Lane 2): the page now reads "how many since you last looked" first and
   stamps only once that answer is in hand, because stamping at mount made
   every read on the page see "nothing new" about the visit it was on. It is
   still one effect per visit, never a query. */
const SURFACE = code(readFileSync("src/components/discover/DiscoverSurface.tsx", "utf8"));
const READS = code(readFileSync("src/lib/start/home-answers.functions.ts", "utf8"));

describe("a visit is a person, not a read", () => {
  it("stamps from the route's MOUNT, never from a query", () => {
    // A refetch, a prefetch on hover, a retry and a second tab polling are all
    // reads. If the stamp rode one, Start's count would fall to zero without
    // anybody opening anything.
    expect(HOOK).toContain("React.useEffect");
    expect(SURFACE).toContain("useStampTheLastLook(");
    // Not inside any read.
    expect(HOOK).not.toContain("queryFn");
    expect(HOOK).not.toContain("useQuery(");
    expect(READS).not.toContain("stampLastLook");
    expect(READS).not.toContain("upsert");
  });

  it("is the ONLY writer of the table", () => {
    // Proves the stripper left the file behind, and that the write lives in one
    // place a reader can find.
    expect(FN).toContain('.from("brain_last_seen")');
    expect(FN).toContain(".upsert(");
    expect(FN).toContain('onConflict: "user_id,workspace_id"');
  });

  it("stamps once per visit AND per workspace, not once per session", () => {
    // A bare boolean would stamp the first workspace a person landed in and
    // then silently stop, which is worse than not stamping: the count would
    // look maintained while going stale.
    expect(HOOK).toContain("stampedFor.current === ws");
    expect(HOOK).toContain("stampedFor.current = ws");
    expect(HOOK).toContain("[workspaceId, stamp, qc]");
  });

  it("writes nothing when the workspace is unknown", () => {
    // The row is keyed (user_id, workspace_id); a visit we cannot attribute is
    // not a visit to one, and a guess would mark another desk's findings seen.
    expect(HOOK).toContain("if (!ws) return;");
    expect(FN).toContain("if (!workspaceId) return { stamped: false, at: null };");
  });

  it("never fails the page it was opened on", () => {
    // A stamp that cannot be written costs one stale sentence elsewhere.
    // Throwing would cost the surface the person actually opened.
    expect(FN).toContain("console.error");
    expect(FN).not.toContain("throw new Error");
    expect(HOOK).not.toContain("await ");
  });

  it("refreshes the sentence that depends on it", () => {
    // A person who opens Arriving and goes back to Start would otherwise read a
    // since-count from before the visit they just made.
    expect(HOOK).toContain('queryKey: ["start-home-answers"]');
    expect(HOOK).toContain("r?.stamped");
  });

  it("stamps only after the page has read what arrived since the last look", () => {
    // The order is the fact: a stamp before the read makes the read say
    // "nothing new" about the very visit that is happening.
    const at = SURFACE.indexOf("useStampTheLastLook(");
    expect(at).toBeGreaterThan(-1);
    const call = SURFACE.slice(at, at + 120);
    expect(call).toMatch(/answersQ\.isSuccess \|\| answersQ\.isError/);
    // And it is held from the first answer, so the stamp's own invalidation
    // cannot rewrite the line under the reader.
    expect(SURFACE).toContain("if (sinceLine !== null || !answersQ.data) return;");
  });
});

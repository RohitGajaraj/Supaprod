import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * SHIP MUST NOT BE THE STATION WHERE THE HUMAN DOES THE WRITING.
 *
 * THE GAP THIS CLOSES, found by the launch audit 2026-08-05. Ship was the one
 * station in the seven with no agent anywhere on it. Grepped at the time:
 * no AgentPulse, no callModel, no runAgentLoop. Its seven server functions were
 * listChangelog, listAnnouncements, listWorkspaceMembers and four announcement
 * CRUD writes. The composer was two empty fields, "What changed" and "What it
 * means for your customers", and a person typed both from scratch.
 *
 * The one assist it had, `startFrom`, copied a release note's title and body
 * into the composer verbatim. That is a clipboard, not a draft.
 *
 * Meanwhile `generateLaunchKit` (studio.functions.ts) has existed the whole
 * time. It turns a shipped changeset into changelog, blog, email, social and
 * docs copy in one model pass, and its ONLY caller was ChangesPanel on the Build
 * surface. The capability was one surface away from the work it was written for,
 * which is the precise shape of "wrapping an LLM while making the user do the
 * work" that this product exists not to be.
 *
 * WHY A RELEASE NOTE IS NOT AN ANNOUNCEMENT, since that is what makes the copy
 * insufficient rather than merely unpolished: the note says what changed, in the
 * repository's voice. The announcement says what it means to someone who does
 * not read pull requests. Different documents, different readers.
 */

const SHIP = join(import.meta.dir, "..", "_authenticated.ship.tsx");
const src = readFileSync(SHIP, "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("Ship dispatches an agent, rather than asking the person to write", () => {
  it("reaches the launch-kit draft that already existed", () => {
    expect(code).toMatch(/import \{ generateLaunchKit \} from "@\/lib\/studio\.functions"/);
    expect(code).toMatch(/useServerFn\(generateLaunchKit\)/);
  });

  it("calls it from the release note, which is where the person starts", () => {
    const flat = code.replace(/\s+/g, " ");
    // Inside startFrom, keyed on the changeset the note carries.
    expect(flat).toMatch(/function startFrom\([\s\S]*?fLaunchKit\(\{ data: \{ changesetId/);
  });

  it("shows the crew working, so the automation is visible and not merely fast", () => {
    // The founder's test: "Is their value visually obvious?" A draft that
    // appears with no sign of who wrote it teaches nobody that an agent ran.
    expect(code).toMatch(/<AgentPulse/);
    expect(code).toMatch(/drafting \?/);
  });

  it("never leaves the composer empty when the draft fails", () => {
    /**
     * The note's own body is set BEFORE the call and is not cleared by it, so a
     * changeset-less entry, a refused call or a model outage all land exactly
     * what this surface produced before the agent existed. A failed draft must
     * never cost the person text they already had.
     */
    const flat = code.replace(/\s+/g, " ");
    const fn = flat.slice(flat.indexOf("function startFrom("));
    const body = fn.slice(0, fn.indexOf("const gateLines"));
    // The note lands first...
    expect(body).toMatch(/setDraftBody\(e\.body \?\? ""\)/);
    // ...and the failure path does not wipe it.
    expect(body).toMatch(/\.catch\(\(\) => \{/);
    expect(body).not.toMatch(/\.catch\([\s\S]*?setDraftBody\(""\)/);
  });

  it("only writes a draft that actually came back", () => {
    // An empty model reply must not blank a box the note had already filled.
    const flat = code.replace(/\s+/g, " ");
    expect(flat).toMatch(/if \(written\) setDraftBody\(/);
  });
});

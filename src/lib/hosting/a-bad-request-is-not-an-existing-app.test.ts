/**
 * THE HOST SAID WHY AND WE THREW IT AWAY.
 *
 * 06:24 UTC, 2026-09-04: the merged tablet Ship asked for a preview. Deno
 * answered 400 APP_LIMIT_EXCEEDED -- ten of ten apps used, all July preview
 * shells nobody had deleted. `deployChangesetApp` tolerated any 400 as "the app
 * is already there", deployed to an app that had never been created, and showed
 * a person a failure about the deploy.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { readAppCreate } from "@/lib/hosting/a-bad-request-is-not-an-existing-app";

const at = (status: number, body = "") => readAppCreate({ ok: false, status, body });

describe("which answers mean the app is there", () => {
  it("a created app is ready", () => {
    expect(readAppCreate({ ok: true, status: 200, body: "" }).kind).toBe("ready");
  });

  it("409 is the taken slug the ensure exists for", () => {
    expect(at(409).kind).toBe("ready");
  });

  it("a 400 that SAYS the slug is taken is still ready", () => {
    // A host that answers 400 where another answers 409 is tolerated -- on the
    // strength of its body, never of its status.
    expect(at(400, '{"error":"app already exists"}').kind).toBe("ready");
    expect(at(400, "slug_taken").kind).toBe("ready");
  });

  it("a bare 400 refuses, because nothing said the app is there", () => {
    /*
     * The defect in one line. The old test was `status !== 400`, so this case
     * passed the ensure and spent the whole deploy.
     */
    const out = at(400, "");
    expect(out.kind).toBe("refused");
    if (out.kind === "refused") expect(out.reason).toContain("said nothing about why");
  });
});

describe("the quota answer reaches the person who has to act on it", () => {
  const body = '{"code":"APP_LIMIT_EXCEEDED","message":"app limit of 10 reached"}';

  it("says the account is full, and what clears it", () => {
    const out = at(400, body);
    expect(out.kind).toBe("refused");
    if (out.kind === "refused") {
      expect(out.atCapacity).toBe(true);
      expect(out.reason).toContain("no app slots left");
      expect(out.reason).toContain("Delete an app that is no longer needed");
    }
  });

  it("carries the host's own words rather than paraphrasing them", () => {
    const out = at(400, body);
    if (out.kind === "refused") expect(out.reason).toContain("APP_LIMIT_EXCEEDED");
  });

  it("is recognised whatever status the host attaches to it", () => {
    // The marker is the fact; the status is not.
    for (const status of [400, 402, 403, 429]) {
      const out = at(status, body);
      expect(out.kind === "refused" && out.atCapacity, `status ${status}`).toBe(true);
    }
  });

  it("keeps enough of the body to be useful", () => {
    // P-39's number, for P-39's reason: a quota message runs past 200.
    const long = "APP_LIMIT_EXCEEDED " + "x".repeat(900);
    const out = at(400, long);
    if (out.kind === "refused") expect(out.reason.length).toBeGreaterThan(300);
  });
});

describe("the deploy call is never reached on a refused create", () => {
  const SRC = readFileSync("src/lib/hosting/changeset-deploy.server.ts", "utf8")
    /* Comments first: the explanation quotes the test it replaced (F-188). */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("no status is forgiven without reading the body", () => {
    expect(SRC).not.toContain("createRes.status !== 400");
    expect(SRC).toContain("readAppCreate({");
  });

  it("refusing returns before the deploy fetch", () => {
    const refused = SRC.indexOf('created.kind === "refused"');
    const deploy = SRC.indexOf("/apps/${slug}/deploy");
    expect(refused, "the create refusal is gone; re-point this guard").toBeGreaterThan(-1);
    expect(deploy, "the deploy call moved; re-point this guard").toBeGreaterThan(-1);
    expect(refused).toBeLessThan(deploy);
  });

  it("the host's sentence is what the caller gets back", () => {
    expect(SRC).toContain("reason: created.reason");
  });
});

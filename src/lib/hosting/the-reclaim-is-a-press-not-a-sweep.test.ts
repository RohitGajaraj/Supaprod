/**
 * THE RECLAIM IS A PRESS, AND THE SERVER NEVER TAKES THE CLIENT'S WORD FOR IT.
 *
 * The account filled with July shells because nothing reclaimed one and nothing
 * ever showed one. The reading is the product's job; the deleting is a
 * person's. These hold the three things that keeps honest:
 *
 *   nothing runs on its own,
 *   the server re-derives the verdict rather than trusting the row a button was
 *     drawn from,
 *   and the list never offers to delete an app this product did not create.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (f: string) =>
  readFileSync(f, "utf8")
    /* Comments first (F-188): these files explain the acts they forbid. */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

const FNS = strip("src/lib/hosting/hosting.functions.ts");
const DEPLOY = strip("src/lib/hosting/changeset-deploy.server.ts");
const UI = strip("src/components/settings/HostingSection.tsx");

describe("nothing deletes on its own", () => {
  it("no cron, hook or sweep reaches the reclaim", () => {
    /*
     * The whole design decision in one assertion. A sweep could compute these
     * verdicts and act on them; a slot is cheap and a deleted preview is not
     * recoverable, and the account belongs to the founder rather than to the
     * product.
     */
    const hooks = readFileSync("src/routes/api/public/hooks/ci-poll-tick.ts", "utf8");
    expect(hooks).not.toContain("reclaimHostedApp");
    expect(hooks).not.toContain("reclaimOneApp");
  });

  it("the only caller of the delete is the server function a person presses", () => {
    expect(FNS).toContain("reclaimHostedApp(app.slug)");
    // One call site. A second would be the sweep this packet declined to build.
    expect([...FNS.matchAll(/reclaimHostedApp\(/g)]).toHaveLength(1);
  });

  it("and the person is asked before it happens", () => {
    expect(UI).toContain("destructive: true");
    expect(UI).toContain("cannot be brought back");
  });
});

describe("the server re-derives the verdict", () => {
  it("reads the changeset and the deploy rows again before deleting", () => {
    // The client sent a slug; it did not send permission.
    expect(FNS).toContain("mayReclaim(app, new Date())");
    const at = FNS.indexOf("mayReclaim(app, new Date())");
    const del = FNS.indexOf("reclaimHostedApp(app.slug)");
    expect(at).toBeGreaterThan(-1);
    expect(del).toBeGreaterThan(at);
  });

  it("refuses when the verdict refuses, and says the verdict's own reason", () => {
    expect(FNS).toContain("if (!verdict.reclaim) return { ok: false, reason: verdict.because };");
  });

  it("a failed read refuses rather than proceeding", () => {
    /* Refusing costs a retry. The other way round costs somebody's live
       address, and that asymmetry decides every default in this packet. */
    expect(FNS).toContain("Whether this is live could not be read, so nothing was done.");
  });

  it("the changeset must belong to the workspace that asked", () => {
    expect(FNS).toContain('.eq("workspace_id", data.workspaceId)');
    expect(FNS).toContain("That change is not in this workspace.");
  });
});

describe("it will not touch an app this product did not create", () => {
  it("the delete itself checks the slug prefix, not only its caller", () => {
    // Last line of defence, in the function that does the irreversible thing.
    expect(DEPLOY).toContain('if (!slug.startsWith("cad-"))');
    expect(DEPLOY).toContain("was not created by this product");
  });

  it("the list is built from our record rather than from the org's apps", () => {
    /*
     * Enumerating the account would put apps we must never touch on the same
     * screen as apps we may, behind the same button, told apart by a rule this
     * code wrote about somebody else's names.
     */
    expect(FNS).toContain("deriveAppSlug(workspaceId, c.id)");
    expect(FNS).not.toContain("/organizations/");
  });

  it("and the surface says what it cannot see", () => {
    /*
     * THE CLAIM, AND NOW IT HAS ONE WRITER (P-118c). The sentence moved into
     * `houseLine`, because the surface was saying it too and two sentences
     * agreeing a line apart is the defect this repo keeps paying for. So the
     * assertion moved with it rather than being deleted.
     */
    const house = readFileSync("src/lib/hosting/ship-keeps-its-own-house.ts", "utf8");
    expect(house).toContain("created by Supaprod");
    expect(house).toContain("may hold others");
    expect(UI).not.toContain("may hold others");
  });
});

describe("every row says what is holding it", () => {
  it("the reason is on the row whether or not there is a button", () => {
    // "9 apps, all in use" is not something a person can act on.
    expect(UI).toContain("a.verdict.because");
  });

  it("a button appears only where the verdict allows one", () => {
    expect(UI).toContain("a.verdict.reclaim ? (");
  });
});

describe("the act goes on the record (P-118c)", () => {
  it("a successful reclaim is written down", () => {
    /*
     * The press worked and the row kept its button. Not a refresh bug: the
     * verdict is derived from the changeset, and deleting an app changes
     * nothing about one. Nothing anywhere said the slot had been released.
     */
    expect(FNS).toContain("preview_reclaimed_at: new Date().toISOString()");
  });

  it("only after the host confirms it, never before", () => {
    const write = FNS.indexOf("preview_reclaimed_at: new Date().toISOString()");
    const guard = FNS.indexOf("if (!done.ok) return done;");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(write);
  });

  it("and a failure to record it is reported, not swallowed", () => {
    /*
     * An app that is gone with no record of it going is the state this exists
     * to prevent, so a person needs to know when that is where they are.
     */
    expect(FNS).toContain("It could not be recorded here");
  });

  it("the list reads it back, so the button goes", () => {
    expect(FNS).toContain("reclaimedAt: c.preview_reclaimed_at");
  });

  it("the count says whose it is, from the one writer", () => {
    // The surface said it too; two sentences agreeing a line apart is the
    // defect this repo keeps paying for.
    expect(FNS).toContain("houseLine(apps, now, capacitySaid)");
    expect(FNS).toContain("no app slots left");
  });
});

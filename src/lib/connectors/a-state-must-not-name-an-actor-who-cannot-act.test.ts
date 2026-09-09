/**
 * ── "WAITING ON AN ADMIN", WHERE THERE IS NO ADMIN TO WAIT ON ─────────────
 *
 * WALKED AS A STRANGER ON THE SERVED /sync, 2026-09-10. Seven of the fifteen
 * connectors read **"Waiting on an admin"** -- Intercom, Stripe, Zendesk,
 * HubSpot, Canny, Productboard, Notion.
 *
 * `deriveProviderAvailability` reads `process.env` on the DEPLOYMENT, and its
 * own comment calls the credential "the founder-registered OAuth client". So
 * the person who can turn it on is a Supaprod operator. **Nothing in this
 * product -- no setting, no role, no permission -- lets the reader of that cell
 * change it**, and on the founder's own workspace it is worse: he IS the admin,
 * so the sentence sends him hunting for a control that does not exist.
 *
 * ── THE RULE, WHICH IS WIDER THAN THIS STRING ─────────────────────────────
 * A state a reader cannot act on is fine and common. **A state that names an
 * ACTOR who cannot act is not**, because the reader spends the effort before
 * they find out. Say whose side it is on.
 *
 * ── AND ONE STATE HAD TWO SENTENCES ───────────────────────────────────────
 * The catalogue cell said "Waiting on an admin"; the connector detail page said
 * "Not available yet." for the identical condition. That is the rule
 * `forecast-words.ts` states at length -- two surfaces must never call one
 * thing two things -- so it is one export now, read by both.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NOT_SET_UP_HERE } from "./registry";

const SITES = [
  join(import.meta.dir, "..", "..", "components", "connections", "AccountConnectionsSection.tsx"),
  join(import.meta.dir, "..", "..", "routes", "_authenticated.sync.tsx"),
];
const code = (p: string) =>
  readFileSync(p, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("a state must not name an actor who cannot act", () => {
  it("never tells a reader to wait on an admin who cannot help", () => {
    for (const p of SITES) {
      const name = p.split("/").pop();
      expect({ name, blames: /[Ww]aiting on an admin/.test(code(p)) }).toEqual({
        name,
        blames: false,
      });
    }
  });

  it("says whose side it is on instead", () => {
    // `/outcomes` already speaks this way about Supaprod's own machinery: a
    // forecast "is measured by prd.get, which is OURS rather than yours".
    expect(NOT_SET_UP_HERE.toLowerCase()).toContain("our");
  });
});

describe("one state, one sentence", () => {
  it("is read from one export by every surface that draws it", () => {
    for (const p of SITES) {
      const name = p.split("/").pop();
      const src = code(p);
      /* A surface that draws the state at all must draw it from the export.
         Only assert on files that actually render it, so adding a third
         surface later fails the first assertion rather than this one. */
      if (!src.includes("NOT_SET_UP_HERE")) continue;
      expect({ name, imported: /NOT_SET_UP_HERE/.test(src) }).toEqual({ name, imported: true });
    }
    /* THE MIRROR. Both assertions above pass by finding nothing, so a rename
       that broke every call site would report a clean bill of health. */
    const drawn = SITES.filter((p) => code(p).includes("NOT_SET_UP_HERE"));
    expect(drawn.length).toBe(SITES.length);
  });

  it("does not leave the older sentence behind on the detail page", () => {
    // "Not available yet." was the detail page's own wording for the same
    // condition. Two sentences for one state is the defect, not either wording.
    const detail = code(SITES[0]!);
    expect({ stale: /Not available yet/.test(detail) }).toEqual({ stale: false });
  });
});

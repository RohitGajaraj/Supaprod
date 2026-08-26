/**
 * GITHUB REJECTS A STRING ISSUER (found 2026-08-27 by minting a real token).
 *
 * `process.env.GITHUB_APP_ID` is a string, and it went straight into the `iss`
 * claim. GitHub answers:
 *
 *     401  "'Issuer' claim ('iss') must be an Integer"
 *
 * So every GitHub App token this product has tried to mint was refused before it
 * ever reached a repository.
 *
 * ── WHY IT LOOKED LIKE SOMETHING ELSE ──────────────────────────────────────
 * Downstream it presents as **"Bad credentials"**, which is what sent F-101
 * hunting a missing or revoked private key: `builder` and `qa` both reported a
 * 401 on track `8391835f`, and Build has been unable to read a repository since.
 * A malformed claim and a wrong key are the same status code and very nearly the
 * same sentence, and only minting one by hand tells them apart.
 *
 * ── AND IT IS VALIDATED, NOT COERCED ───────────────────────────────────────
 * `Number("abc")` is `NaN`, which serialises to `null` and earns a third 401
 * saying something else again. A wrong value should fail where it is set, with
 * a sentence naming what is wrong, not three hops later as a credential error.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./github.server.ts", import.meta.url)), "utf8");

describe("the App JWT issuer is a number", () => {
  it("the claim is built from a numeric issuer, not the raw env string", () => {
    expect(SRC).toContain("iss: issuer");
    expect(SRC).not.toContain("iss: appId");
  });

  it("and the value is checked before it is used", () => {
    expect(SRC).toContain("Number.isInteger(issuer)");
  });

  it("a non-numeric id fails where it is set, naming what is wrong", () => {
    // Not three hops later as "Bad credentials", which is the whole finding.
    const at = SRC.indexOf("Number.isInteger(issuer)");
    const branch = SRC.slice(at, at + 400);
    expect(branch).toContain("numeric id");
    expect(branch.toLowerCase()).toContain("401");
  });

  it("the reason is recorded where the next reader will be standing", () => {
    // Someone debugging a GitHub 401 reads this file, not the ledger.
    // Fragments that survive comment wrapping: the full phrase is split across
    // two lines by the formatter, and asserting the whole of it pins the layout
    // rather than the fact.
    expect(SRC).toContain("Integer");
    expect(SRC).toContain("Bad credentials");
    expect(SRC).toContain("F-101");
  });
});

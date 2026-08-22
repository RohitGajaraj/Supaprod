/**
 * A refused write is not a successful one, and the audit trail has to say which.
 *
 * WHAT WAS WRONG. `runWriteTool` (routes/api/mcp.ts) wraps ANY non-throwing tool
 * return as `{ success: true }` and never inspects the payload, and the route mapped
 * that straight to `result: "success"`. Seven refusals across the six governed write
 * tools do not throw: six quarantine returns, at mcp.functions.ts:725, 906, 976,
 * 1027, 1128 and 1171 as the board recorded them the day before this fix moved
 * them, plus `settle_forecast`'s `already_settled` at :1226, which the board's list
 * missed. Each of those wrote an audit row identical in every audited field to a
 * real write. The line numbers are the board's and will age; the payload shapes
 * below are the thing actually pinned, and they are what the tools still return.
 *
 * WHAT IT COST, IN PRODUCTION. `api_calls` row
 * e8cf280c-68a2-48bf-8457-8fd8c4b45456, 2026-08-10 15:15:01.800993:
 * `record_decision / result 'success' / error_message null / metadata
 * {"elapsed_ms":1156,"write":true}`. And `select count(*) from public.decisions
 * where source_kind = 'mcp'` is 0. The one governed write this surface has ever
 * logged as a success wrote nothing. The attribution to the quarantine branch is by
 * elimination -- a schema or RLS refusal would have thrown and logged `error` -- not
 * by observation.
 *
 * WHY IT MATTERS MORE HERE THAN ELSEWHERE. This product's claim rests on an audit
 * trail somebody can trust. One that cannot say whether the write happened is worse
 * than one that says it failed.
 *
 * WHY THIS FILE NEEDS NO DATABASE. `classifyWriteAudit` is pure and exported for
 * exactly this reason: the rules are the thing worth pinning, and a fixture-backed
 * fake of the audit RPC would test the fake.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { classifyWriteAudit } from "./mcp.functions";

const ROUTE = readFileSync(join(import.meta.dir, "..", "routes", "api", "mcp.ts"), "utf8");

/**
 * The route's write-audit call, from the classifier down to the next statement.
 * Bounded structurally rather than by a character count, because a count of the
 * kind this file replaced breaks the first time somebody adds a comment.
 */
function auditBlock(): string {
  const start = ROUTE.indexOf("const writeAudit = classifyWriteAudit(");
  const end = ROUTE.indexOf("const writeData", start);
  return start > -1 && end > start ? ROUTE.slice(start, end) : "";
}

/** A non-throwing tool return, as runWriteTool hands it over. */
function returned(data: unknown, extra: { idempotent_replay?: boolean } = {}) {
  return { success: true, data, ...extra };
}

describe("a quarantine is not a write", () => {
  // The four payload shapes the six tools actually return on a quarantine. They
  // differ in the id key, which is precisely the sort of difference a classifier
  // reading `data.status` could get wrong for five of six tools and still look right.
  const shapes: Array<[string, unknown]> = [
    ["ingest_signal", { status: "quarantined", created: 0, quarantined: 1, restated: 0, id: null }],
    ["record_decision", { status: "quarantined", id: null }],
    ["draft_spec", { status: "quarantined", id: null }],
    ["settle_outcome", { status: "quarantined", learningId: null }],
    ["record_forecast", { status: "quarantined", decisionId: null }],
    ["settle_forecast", { status: "quarantined", decisionId: null }],
  ];

  for (const [tool, payload] of shapes) {
    it(`${tool}: audited as quarantined, with a reason and wrote:false`, () => {
      const c = classifyWriteAudit(returned(payload));
      expect(c.result).toBe("quarantined");
      expect(c.wrote).toBe(false);
      // The reason is what makes the row readable. A refusal with no sentence is
      // the same dead end as a success with no write.
      expect(c.reason).toBeTruthy();
      expect(c.status).toBe("quarantined");
      expect(c.id).toBeNull();
    });
  }

  it("is a value of its own, not folded into permission_denied or error", () => {
    // permission_denied means the token lacked a scope and is the only way to find
    // tokens needing a wider grant; error means malformed or server failure. A
    // quarantine is a well-formed, authorized call whose CONTENT was refused, and
    // it is the row an owner looks for when asking whether anybody has tried to
    // inject through the agent API.
    const c = classifyWriteAudit(returned({ status: "quarantined", id: null }));
    expect(c.result).not.toBe("permission_denied");
    expect(c.result).not.toBe("error");
    expect(c.result).not.toBe("success");
    // api_calls.result is VARCHAR(20) with no CHECK, which is what made the new
    // value a code-only change.
    expect(c.result.length).toBeLessThanOrEqual(20);
  });
});

describe("already_settled, the seventh refusal", () => {
  it("is audited as an error, matching the sibling tool that throws for the same act", () => {
    // settle_outcome refuses the identical act by throwing (outcome.functions.ts:651)
    // and therefore already audits "error". settle_forecast refuses it by returning.
    // Two tools, one refusal, and the only thing that separated the audit rows was
    // throw versus return.
    const c = classifyWriteAudit(returned({ status: "already_settled", decisionId: "dec-1" }));
    expect(c.result).toBe("error");
    expect(c.wrote).toBe(false);
    expect(c.reason).toContain("already settled");
    expect(c.status).toBe("already_settled");
  });

  it("still carries the decision id, because the row it refused to change is real", () => {
    const c = classifyWriteAudit(returned({ status: "already_settled", decisionId: "dec-1" }));
    expect(c.id).toBe("dec-1");
  });
});

describe("dedup is not refusal", () => {
  it("restated: success, and wrote:false because no row changed", () => {
    // The caller's observation IS on the books, which is what it asked for. It is
    // just on a row that already existed.
    const c = classifyWriteAudit(
      returned({ status: "restated", created: 0, quarantined: 0, restated: 1, id: null }),
    );
    expect(c.result).toBe("success");
    expect(c.wrote).toBe(false);
    expect(c.reason).toBeNull();
  });

  it("skipped: the same ruling, for the external_id half of the dedup", () => {
    const c = classifyWriteAudit(returned({ status: "skipped", id: null }));
    expect(c.result).toBe("success");
    expect(c.wrote).toBe(false);
  });
});

describe("a real write, and a replay of one", () => {
  it("stored: success, wrote:true, carrying the row id", () => {
    const c = classifyWriteAudit(
      returned({ status: "stored", created: 1, quarantined: 0, restated: 0, id: "sig-7" }),
    );
    expect(c.result).toBe("success");
    expect(c.wrote).toBe(true);
    expect(c.id).toBe("sig-7");
  });

  it("flagged: still a write. Borderline text is stored, tagged for review", () => {
    const c = classifyWriteAudit(returned({ status: "flagged", created: 1, id: "sig-8" }));
    expect(c.result).toBe("success");
    expect(c.wrote).toBe(true);
  });

  it("reads the id under whichever of the three keys the tool used", () => {
    expect(classifyWriteAudit(returned({ status: "stored", learningId: "l-1" })).id).toBe("l-1");
    expect(classifyWriteAudit(returned({ status: "stored", decisionId: "d-1" })).id).toBe("d-1");
  });

  it("a replay is one write however many times it was asked for", () => {
    // Same payload, flagged as a replay. The row it points at is real, so the id
    // stays; `wrote` goes false so nobody counting agent activity off api_calls
    // counts the retry as work.
    const c = classifyWriteAudit(
      returned({ status: "stored", id: "sig-7" }, { idempotent_replay: true }),
    );
    expect(c.result).toBe("success");
    expect(c.wrote).toBe(false);
    expect(c.id).toBe("sig-7");
  });
});

describe("a thrown refusal is left exactly as it was", () => {
  it("maps to error, and invents no reason because the throw already carried one", () => {
    // Every zod refusal throws, runWriteTool's catch turns it into
    // { success:false, error }, and the route passes that error through as
    // error_message. This branch must not overwrite it.
    const c = classifyWriteAudit({ success: false, error: "expected { title: string }" });
    expect(c.result).toBe("error");
    expect(c.reason).toBeNull();
    expect(c.wrote).toBe(false);
    expect(c.id).toBeNull();
  });
});

describe("a payload the classifier does not recognise cannot break the audit", () => {
  // The audit path runs on every governed write. A future tool returning a bare
  // value must produce a wrong-ish row, never an exception that loses the row
  // entirely.
  it("undefined data", () => {
    const c = classifyWriteAudit({ success: true });
    expect(c.result).toBe("success");
    expect(c.status).toBeNull();
    expect(c.id).toBeNull();
  });

  it("an array", () => {
    const c = classifyWriteAudit(returned([{ status: "quarantined" }]));
    expect(c.result).toBe("success");
    expect(c.status).toBeNull();
  });

  it("a primitive", () => {
    expect(classifyWriteAudit(returned("done")).result).toBe("success");
    expect(classifyWriteAudit(returned(42)).result).toBe("success");
    expect(classifyWriteAudit(returned(null)).status).toBeNull();
  });

  it("a non-string status, or an id that is not a string", () => {
    expect(classifyWriteAudit(returned({ status: 7 })).status).toBeNull();
    expect(classifyWriteAudit(returned({ status: "stored", id: 7 })).id).toBeNull();
  });
});

describe("the classifier is actually wired into the route", () => {
  it("is called in the write branch, not merely exported and correct", () => {
    // A mount is not a render. A classifier that is right and unreachable fixes
    // nothing, and this repo has shipped that exact shape before.
    expect(ROUTE).toContain("classifyWriteAudit");
    const anchor = ROUTE.indexOf("const writeAudit = classifyWriteAudit(");
    expect(anchor).toBeGreaterThan(-1);
    // The audit call that follows it must read the classification rather than the
    // raw success flag. Bounded by the next statement, not by a character count.
    const block = auditBlock();
    expect(block).toContain("result: writeAudit.result");
    expect(block).toContain("wrote: writeAudit.wrote");
  });

  it("puts the returned status and the written row id into metadata, as the board ruled", () => {
    const block = auditBlock();
    expect(block).toContain("tool_status: writeAudit.status");
    expect(block).toContain("row_id: writeAudit.id");
  });

  it("carries the refusal sentence into error_message without clobbering a thrown one", () => {
    const block = auditBlock();
    expect(block).toContain("writeResult.error ?? writeAudit.reason");
  });
});

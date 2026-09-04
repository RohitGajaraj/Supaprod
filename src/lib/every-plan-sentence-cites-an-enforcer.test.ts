/**
 * P-94: every claim on Outcomes, Start and Settings that states a plan rule
 * cites an entitlement constant a reader actually enforces. Checked live
 * 2026-09-04 before writing anything: `memory_expiry_enabled()` reads
 * `false`, and neither `recallMemoryRefs` nor `getStandingRecord` (before
 * this packet) ever consulted `FREE_MEMORY_RETENTION_DAYS` -- so "On the
 * free plan this record fades after 30 days" was marketing a mechanism that
 * did not run. Fixed as a read-side filter (never a delete -- flipping
 * `memory_expiry_enabled()` needs founder approval per its own comment and
 * `entitlements.test.ts`'s G1.1 BLOCKER, and this packet does not touch it).
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const RETENTION_LINE = readFileSync("src/components/brain/RetentionLine.tsx", "utf8");
const STANDING = readFileSync("src/lib/brain-standing.functions.ts", "utf8");
const ENTITLEMENTS = readFileSync("src/lib/entitlements.ts", "utf8");
const BILLING = readFileSync("src/lib/billing.functions.ts", "utf8");

describe("Outcomes' retention sentence cites the constant it names", () => {
  it("RetentionLine renders FREE_MEMORY_RETENTION_DAYS, not a hand-typed number", () => {
    expect(RETENTION_LINE).toContain(
      'import { FREE_MEMORY_RETENTION_DAYS } from "@/lib/entitlements"',
    );
    expect(RETENTION_LINE).toContain("<Figure>{FREE_MEMORY_RETENTION_DAYS}</Figure>");
  });

  it("the count the sentence sits beside is now the enforced one, not merely displayed", () => {
    // getStandingRecord's memoriesTotal/memoriesReached -- the "X of Y
    // lessons" numbers RetentionLine's own claim is adjacent to -- must
    // actually exclude what a free-plan reader is told has faded.
    const flat = STANDING.replace(/\s+/g, " ");
    expect(flat).toContain("FREE_MEMORY_RETENTION_DAYS");
    expect(flat).toContain('planTier === "free"');
    expect(flat).toContain('if (memoryCutoffIso) q = q.gte("created_at", memoryCutoffIso)');
  });

  it("the cutoff never applies when the workspace could not be resolved", () => {
    // Same rule this file already states one paragraph up for the
    // workspace_id filter itself: an unresolved id must not become "you
    // have nothing".
    expect(STANDING).toContain("const planTier = wid ? (await resolvePlanTier");
    expect(STANDING.replace(/\s+/g, " ")).not.toContain('const planTier = wid ?? "free"');
  });

  it("plan tier is resolved through the same function Settings' own billing state uses", () => {
    expect(STANDING).toContain('import { resolvePlanTier } from "@/lib/billing.functions"');
    expect(BILLING).toContain("export async function resolvePlanTier(");
    // getBillingState itself calls it now too, so the two readers cannot
    // resolve a workspace's tier two different ways.
    expect(BILLING.replace(/\s+/g, " ")).toContain(
      "const { planTier, isOwner, planTierUnknown } = await resolvePlanTier(",
    );
  });

  it("the deletion-based expiry gate is named as out of reach, not silently left dark", () => {
    // The comment explaining WHY this is a read-side filter and not a flip
    // of memory_expiry_enabled() -- proving the choice was deliberate.
    expect(STANDING).toContain("memory_expiry_enabled()");
    expect(STANDING).toContain("founder approval");
  });
});

describe("no two plan highlights claim the same noun and disagree", () => {
  it('Free says the decision record never fades; nothing else may say it "stops fading"', () => {
    expect(ENTITLEMENTS).toContain("Your decision record: exportable forever, never fades");
    // The retired contradiction: Pro used to borrow the SAME noun
    // ("decision record") for the opposite claim.
    expect(ENTITLEMENTS).not.toContain("Your decision record stops fading");
  });

  it("Pro's own highlight uses Free's vocabulary for the thing that actually changes", () => {
    expect(ENTITLEMENTS).toContain("Past calls keep guiding forever. Nothing fades.");
    expect(ENTITLEMENTS).toContain(
      'Past calls guide the next for " + FREE_MEMORY_RETENTION_DAYS + " days, then fade',
    );
  });
});

describe("Start and Settings carry no hand-typed plan-rule sentence", () => {
  it("Start's own route names no plan, credit or retention rule", () => {
    const start = readFileSync("src/routes/_authenticated.start.tsx", "utf8");
    for (const phrase of [
      "free plan",
      "Free plan",
      "fades after",
      "upgrade to",
      "credits remain",
    ]) {
      expect(start).not.toContain(phrase);
    }
  });

  it("Settings' plan copy renders from planPresentation, not a second hand-typed source", () => {
    const settings = readFileSync("src/routes/_authenticated.settings.tsx", "utf8");
    const picker = readFileSync("src/components/billing/PlanPicker.tsx", "utf8");
    expect(settings).not.toMatch(/"[^"]*fades after \d+ days[^"]*"/);
    expect(picker).toContain("planPresentation");
  });
});

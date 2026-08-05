/**
 * The refusal sentence a governance write shows when the caller's role cannot
 * make it, and the surface each write is judged against.
 *
 * WHY THIS FILE EXISTS. Migration 20260805130000 makes the database refuse a
 * viewer's guardrail edit, house-rule approval or tool override. RLS refuses by
 * matching ZERO ROWS, not by raising, so without a check in front of the write
 * the product's answer to a viewer pressing Approve is silence: the button does
 * nothing and says nothing. These are the pure halves of that check, so the
 * wording and the allow/deny split are pinned without a database.
 */
import { describe, it, expect } from "bun:test";
import { guardrailWriteDenial } from "./guardrails.functions";
import { houseRuleSurface, houseRuleWriteDenial } from "./house-rules.functions";
import { GOVERNED_WRITES, ROLES, type Role } from "./roles.functions";

const NON_MEMBER: (Role | null | undefined)[] = [null, undefined];

describe("guardrailWriteDenial", () => {
  it("lets an owner and an admin through, which is what can_manage_workspace() allows", () => {
    expect(guardrailWriteDenial("owner")).toBeNull();
    expect(guardrailWriteDenial("admin")).toBeNull();
  });

  it("refuses a viewer, the role the invite dropdown calls read-only", () => {
    expect(guardrailWriteDenial("viewer")).toBe(
      "Your role here is viewer. Only owner or admin can change this.",
    );
  });

  it("refuses a member, because editing the hard floors is an admin line", () => {
    expect(guardrailWriteDenial("member")).toBe(
      "Your role here is member. Only owner or admin can change this.",
    );
  });

  it("refuses a non-member without pretending to know their role", () => {
    for (const role of NON_MEMBER) {
      expect(guardrailWriteDenial(role)).toBe(
        "You are not a member of this workspace, so only owner or admin can change this.",
      );
    }
  });

  it("names the outcome, never the mechanism", () => {
    for (const role of [...ROLES, null, undefined] as (Role | null | undefined)[]) {
      const sentence = guardrailWriteDenial(role);
      if (!sentence) continue;
      // The words a person cannot act on. A refusal that says "RLS" tells the
      // reader about our database instead of about their permissions.
      for (const jargon of ["RLS", "row level", "row-level", "policy", "privilege", "denied"]) {
        expect(sentence.toLowerCase()).not.toContain(jargon.toLowerCase());
      }
    }
  });

  it("agrees with the table the migration mirrors, for every role", () => {
    for (const role of ROLES) {
      const allowed = (GOVERNED_WRITES.guardrail_rules as readonly Role[]).includes(role);
      expect(guardrailWriteDenial(role) === null).toBe(allowed);
    }
  });
});

describe("houseRuleSurface", () => {
  it("sends a decision to the approval surface and a draft to the drafting one", () => {
    expect(houseRuleSurface("decide")).toBe("house_rules_decide");
    expect(houseRuleSurface("draft")).toBe("house_rules_draft");
  });
});

describe("houseRuleWriteDenial", () => {
  it("keeps approving and rejecting with owner and admin", () => {
    expect(houseRuleWriteDenial("owner", "decide")).toBeNull();
    expect(houseRuleWriteDenial("admin", "decide")).toBeNull();
  });

  it("refuses a viewer both deciding and drafting", () => {
    expect(houseRuleWriteDenial("viewer", "decide")).toBe(
      "Your role here is viewer. Only owner or admin can change this.",
    );
    expect(houseRuleWriteDenial("viewer", "draft")).toBe(
      "Your role here is viewer. Only owner, admin or member can change this.",
    );
  });

  /**
   * The defect houseRuleSurface exists to prevent, stated as a test: a member
   * may propose a rule and may not approve one. Judging a draft against the
   * decision surface would lock members out of proposing; judging a decision
   * against the drafting surface would let a member approve a rule into every
   * agent's system prompt.
   */
  it("lets a member draft but not decide", () => {
    expect(houseRuleWriteDenial("member", "draft")).toBeNull();
    expect(houseRuleWriteDenial("member", "decide")).toBe(
      "Your role here is member. Only owner or admin can change this.",
    );
  });

  it("refuses a non-member either way", () => {
    for (const role of NON_MEMBER) {
      expect(houseRuleWriteDenial(role, "decide")).toContain("not a member of this workspace");
      expect(houseRuleWriteDenial(role, "draft")).toContain("not a member of this workspace");
    }
  });

  it("names the outcome, never the mechanism", () => {
    for (const role of [...ROLES, null, undefined] as (Role | null | undefined)[]) {
      for (const action of ["decide", "draft"] as const) {
        const sentence = houseRuleWriteDenial(role, action);
        if (!sentence) continue;
        for (const jargon of ["RLS", "row level", "row-level", "policy", "privilege", "denied"]) {
          expect(sentence.toLowerCase()).not.toContain(jargon.toLowerCase());
        }
      }
    }
  });

  it("agrees with the table the migration mirrors, for every role and both actions", () => {
    for (const role of ROLES) {
      for (const action of ["decide", "draft"] as const) {
        const allowed = (GOVERNED_WRITES[houseRuleSurface(action)] as readonly Role[]).includes(
          role,
        );
        expect(houseRuleWriteDenial(role, action) === null).toBe(allowed);
      }
    }
  });
});

describe("refusal copy", () => {
  const every = [...ROLES, null, undefined].flatMap((role) => [
    guardrailWriteDenial(role),
    houseRuleWriteDenial(role, "decide"),
    houseRuleWriteDenial(role, "draft"),
  ]);

  it("carries no em dash and no en dash, per the UI copy rule", () => {
    for (const sentence of every) {
      if (!sentence) continue;
      expect(sentence).not.toContain("—");
      expect(sentence).not.toContain("–");
    }
  });

  it("is a finished sentence, so it can be shown as-is", () => {
    for (const sentence of every) {
      if (!sentence) continue;
      expect(sentence.endsWith(".")).toBe(true);
      expect(sentence[0]).toBe(sentence[0].toUpperCase());
    }
  });
});

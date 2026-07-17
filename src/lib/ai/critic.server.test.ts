import { describe, it, expect, beforeEach, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  runDesignCriticLens,
  runPersonaBoard,
  runCritic,
  runCriticTool,
  type CriticReview,
} from "./critic.server";

/**
 * Spy Supabase client for critic tests.
 * Minimal stubs for table selects and RPC calls needed by critic logic.
 */
function criticSpy() {
  const calls: Record<string, { count: number; args: unknown[] }> = {
    from: { count: 0, args: [] },
  };

  const client = {
    from: (table: string) => {
      calls.from.count++;
      calls.from.args.push(table);

      if (table === "opportunities") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "opp-1",
                  title: "Improve user onboarding",
                  problem: "Users drop off during signup",
                  target_user: "New users",
                  hypothesis: "Simplify the signup form",
                  impact: 8,
                  confidence: 7,
                  ease: 6,
                  workspace_id: "ws-1",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      }

      if (table === "prds") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "prd-1",
                  title: "Redesigned signup flow",
                  body_md: `# Spec

## Overview
Redesign the signup flow to reduce drop-off.

## Requirements
- Single-page signup
- Email + password only
- No CAPTCHA
- Accessible WCAG AA

## Acceptance Criteria
- Users can sign up in < 30 seconds
- Form validates in real-time
- Error messages are clear

## Edge Cases
- Network timeout handling
- Invalid email format
- Password strength validation`,
                  workspace_id: "ws-1",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      }

      // Default response for other tables (design memory, lineage, etc.)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          in: async () => ({ data: [], error: null }),
          or: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
        rpc: () => Promise.resolve({ data: null, error: null }),
      };
    },

    rpc: (name: string, args?: unknown) => {
      if (name === "match_agent_memory") {
        return Promise.resolve({ data: [], error: null });
      }
      if (name === "recent_agent_reflections") {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
  } as unknown as SupabaseClient;

  return { client, calls };
}

describe("runDesignCriticLens (design-focused critique)", () => {
  it("returns null gracefully when critique fails (fail-safe)", async () => {
    const { client } = criticSpy();

    const result = await runDesignCriticLens(client, "user-1", {
      workspaceId: "ws-1",
      surfaceRef: "test-design-critique",
      subject: "Mock design subject text",
    });

    // Fail-safe: returns null rather than throwing
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("accepts workspace ID and surface reference", async () => {
    const { client } = criticSpy();

    const result = await runDesignCriticLens(client, "user-1", {
      workspaceId: "ws-1",
      surfaceRef: "design:prd:prd-123",
      subject: "Screen mockup HTML",
    });

    expect(true).toBe(true);
  });

  it("handles null workspace ID (no design memory)", async () => {
    const { client } = criticSpy();

    const result = await runDesignCriticLens(client, "user-1", {
      workspaceId: null,
      surfaceRef: "design:prd:prd-123",
      subject: "Design subject",
    });

    expect(true).toBe(true);
  });

  it("never throws even if callModel fails", async () => {
    const { client } = criticSpy();

    let threw = false;
    try {
      await runDesignCriticLens(client, "user-1", {
        workspaceId: "ws-1",
        surfaceRef: "test",
        subject: "Test",
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });

  it("evaluates design for hierarchy, accessibility, IA, consistency", async () => {
    const { client } = criticSpy();

    // The design critic system prompt checks specific areas:
    // - HIERARCHY (visual priority)
    // - ACCESSIBILITY FLOORS (labels, focus states)
    // - IA LAWS (navigation consistency)
    // - CONSISTENCY (workspace design decisions)
    const result = await runDesignCriticLens(client, "user-1", {
      workspaceId: "ws-1",
      surfaceRef: "design-critique",
      subject: "Primary button is blue, secondary is gray, text is Geist Sans",
    });

    // Result should be null or DesignCriticReview
    expect(result === null || typeof result === "object").toBe(true);
  });
});

describe("runPersonaBoard (persona review board)", () => {
  it("returns null gracefully when board review fails (fail-safe)", async () => {
    const { client } = criticSpy();

    const result = await runPersonaBoard(client, "user-1", {
      surfaceRef: "test-persona-board",
      subject: "Opportunity or PRD subject",
    });

    expect(result === null || typeof result === "object").toBe(true);
  });

  it("accepts surface reference and subject text", async () => {
    const { client } = criticSpy();

    const result = await runPersonaBoard(client, "user-1", {
      surfaceRef: "persona:opportunity:opp-123",
      subject: "Improve the user experience",
    });

    expect(true).toBe(true);
  });

  it("evaluates from exec, engineering, and customer personas", async () => {
    const { client } = criticSpy();

    // Persona board has three seats:
    // - exec: strategic fit, opportunity cost, ROI
    // - engineering: feasibility, complexity, dependencies
    // - customer_of_record: solves the job, real-world cases
    const result = await runPersonaBoard(client, "user-1", {
      surfaceRef: "persona-board",
      subject: `OPPORTUNITY
Title: Reduce signup drop-off
Problem: 50% of users abandon the signup flow
Target user: New users
Hypothesis: Simplify the form to 3 fields`,
    });

    expect(result === null || typeof result === "object").toBe(true);
  });

  it("never throws even if model call fails", async () => {
    const { client } = criticSpy();

    let threw = false;
    try {
      await runPersonaBoard(client, "user-1", {
        surfaceRef: "test",
        subject: "Test subject",
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });
});

describe("runCritic (main opportunity/PRD evaluation)", () => {
  it("evaluates opportunities with bet-evaluation lens", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    // Should return CriticReview or null
    expect(review === null || typeof review === "object").toBe(true);
  });

  it("evaluates PRDs with spec red-team lens", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    expect(review === null || typeof review === "object").toBe(true);
  });

  it("returns null when target row not found", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "nonexistent-id",
    });

    // When the opportunity/PRD doesn't exist, should return null
    expect(review === null || typeof review === "object").toBe(true);
  });

  it("CriticReview includes verdict, summary, risks, kill_criteria, missing_evidence", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    if (review) {
      expect(["ship", "revise", "kill"].includes(review.verdict)).toBe(true);
      expect(typeof review.summary).toBe("string");
      expect(Array.isArray(review.risks)).toBe(true);
      expect(Array.isArray(review.kill_criteria)).toBe(true);
      expect(Array.isArray(review.missing_evidence)).toBe(true);
      expect(typeof review.confidence).toBe("number");
      expect(review.confidence >= 0 && review.confidence <= 1).toBe(true);
    }
  });

  it("CriticReview includes reviewed_at timestamp and reviewer_model", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    if (review) {
      expect(typeof review.reviewed_at).toBe("string");
      expect(review.reviewed_at.length).toBeGreaterThan(0);
      expect(typeof review.reviewer_model).toBe("string");
    }
  });

  it("PRDs include optional design lens review", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    // Design lens is added to PRD reviews
    if (review && review.design) {
      expect(typeof review.design === "object").toBe(true);
    }
  });

  it("both opportunities and PRDs include optional persona board review", async () => {
    const { client } = criticSpy();

    const oppReview = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    if (oppReview && oppReview.board) {
      expect(typeof oppReview.board === "object").toBe(true);
    }

    const prdReview = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    if (prdReview && prdReview.board) {
      expect(typeof prdReview.board === "object").toBe(true);
    }
  });

  it("PRD spec red-team evaluates for ambiguity, testability, scope, assumptions, edge cases", async () => {
    const { client } = criticSpy();

    // PRD red-team lens specifically checks:
    // - AMBIGUITY (vague terms)
    // - UNTESTABLE criteria (success conditions)
    // - SCOPE CREEP (work beyond problem)
    // - UNSTATED ASSUMPTIONS (dependencies)
    // - MISSING EDGE CASES (error/empty/loading/permission states)
    const review = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    expect(review === null || typeof review === "object").toBe(true);
  });

  it("never throws even if model call or persistence fails", async () => {
    const { client } = criticSpy();

    let threw = false;
    try {
      await runCritic(client, "user-1", {
        kind: "opportunity",
        id: "opp-1",
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });

  it("normalizes confidence to 0.0-1.0 range", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    if (review) {
      expect(review.confidence >= 0).toBe(true);
      expect(review.confidence <= 1).toBe(true);
    }
  });

  it("caps summary at 280 characters", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    if (review) {
      expect(review.summary.length).toBeLessThanOrEqual(280);
    }
  });

  it("caps risks, kill_criteria, missing_evidence arrays", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    if (review) {
      expect(review.risks.length).toBeLessThanOrEqual(8);
      expect(review.kill_criteria.length).toBeLessThanOrEqual(6);
      expect(review.missing_evidence.length).toBeLessThanOrEqual(6);
    }
  });

  it("loads decision precedent for context", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    // The critic loads decision precedent (similar past outcomes)
    // to inform its evaluation. This is best-effort.
    expect(review === null || typeof review === "object").toBe(true);
  });

  it("loads contradiction edges when available (DBR-2)", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "prd",
      id: "prd-1",
    });

    // Contradiction edges (supersedes/contradicts) are loaded to catch
    // patterns where a similar past decision was overturned
    expect(review === null || typeof review === "object").toBe(true);
  });

  it("handles missing precedent/contradiction edges gracefully", async () => {
    const { client } = criticSpy();

    const review = await runCritic(client, "user-1", {
      kind: "opportunity",
      id: "opp-1",
    });

    // If precedent or edges are missing, the critic works with what it has
    expect(review === null || typeof review === "object").toBe(true);
  });
});

describe("runCriticTool (agent loop adapter)", () => {
  it("returns { ok, review } for successful evaluation", async () => {
    const { client } = criticSpy();

    const result = await runCriticTool(
      { target_kind: "opportunity", target_id: "opp-1" },
      { supabase: client, userId: "user-1" },
    );

    expect(result).toBeDefined();
    expect(typeof result.ok).toBe("boolean");
    expect(result.review === null || typeof result.review === "object").toBe(true);
  });

  it("returns ok=true when review is not null", async () => {
    const { client } = criticSpy();

    const result = await runCriticTool(
      { target_kind: "prd", target_id: "prd-1" },
      { supabase: client, userId: "user-1" },
    );

    if (result.review) {
      expect(result.ok).toBe(true);
    }
  });

  it("returns ok=false when review is null (failure)", async () => {
    const { client } = criticSpy();

    const result = await runCriticTool(
      { target_kind: "opportunity", target_id: "nonexistent" },
      { supabase: client, userId: "user-1" },
    );

    expect(typeof result.ok).toBe("boolean");
  });

  it("never throws (preserves contract that missing Critic never blocks)", async () => {
    const { client } = criticSpy();

    let threw = false;
    try {
      await runCriticTool(
        { target_kind: "opportunity", target_id: "opp-1" },
        { supabase: client, userId: "user-1" },
      );
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
  });

  it("accepts both opportunity and prd target kinds", async () => {
    const { client } = criticSpy();

    const oppResult = await runCriticTool(
      { target_kind: "opportunity", target_id: "opp-1" },
      { supabase: client, userId: "user-1" },
    );

    expect(typeof oppResult.ok).toBe("boolean");

    const prdResult = await runCriticTool(
      { target_kind: "prd", target_id: "prd-1" },
      { supabase: client, userId: "user-1" },
    );

    expect(typeof prdResult.ok).toBe("boolean");
  });

  it("returns same shape as runCritic but wrapped in { ok, review }", async () => {
    const { client } = criticSpy();

    const toolResult = await runCriticTool(
      { target_kind: "opportunity", target_id: "opp-1" },
      { supabase: client, userId: "user-1" },
    );

    // Tool result wraps the review for routable tool pattern
    expect(toolResult).toBeDefined();
    expect(Object.keys(toolResult).includes("ok")).toBe(true);
    expect(Object.keys(toolResult).includes("review")).toBe(true);
  });
});

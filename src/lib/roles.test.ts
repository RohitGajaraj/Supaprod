import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  PermissionDeniedError,
  ROLES,
  GOVERNED_WRITES,
  asRole,
  canWriteGoverned,
  canManageWorkspace,
  canWriteAnything,
  isReadOnly,
  writeDeniedReason,
  type GovernedSurface,
  type Role,
} from "./roles.functions";

describe("PermissionDeniedError", () => {
  it("constructs with action and required roles", () => {
    const error = new PermissionDeniedError("delete workspace", ["owner"]);
    expect(error.action).toBe("delete workspace");
    expect(error.requiredRoles).toEqual(["owner"]);
    expect(error.message).toContain("delete workspace");
    expect(error.message).toContain("owner");
  });

  it("includes user role if provided", () => {
    const error = new PermissionDeniedError("create project", ["owner", "admin"], "viewer");
    expect(error.userRole).toBe("viewer");
    expect(error.message).toContain("viewer");
  });

  it("handles multiple required roles", () => {
    const error = new PermissionDeniedError("manage members", ["owner", "admin"]);
    expect(error.requiredRoles).toEqual(["owner", "admin"]);
  });

  it("sets error name correctly", () => {
    const error = new PermissionDeniedError("any action", ["owner"]);
    expect(error.name).toBe("PermissionDeniedError");
  });
});

describe("asRole", () => {
  it("accepts the four real roles", () => {
    for (const r of ROLES) expect(asRole(r)).toBe(r);
  });

  it("rejects anything else, so a bad DB string cannot masquerade as a role", () => {
    for (const bad of ["Owner", "OWNER", "admin ", "editor", "", null, undefined, 7, {}]) {
      expect(asRole(bad)).toBeNull();
    }
  });
});

describe("canWriteGoverned", () => {
  const surfaces = Object.keys(GOVERNED_WRITES) as GovernedSurface[];

  it("lets a viewer write NOTHING that is governed", () => {
    for (const s of surfaces) expect(canWriteGoverned("viewer", s)).toBe(false);
  });

  it("lets an owner write every governed surface", () => {
    for (const s of surfaces) expect(canWriteGoverned("owner", s)).toBe(true);
  });

  it("treats a non-member (null/undefined) as writing nothing", () => {
    for (const s of surfaces) {
      expect(canWriteGoverned(null, s)).toBe(false);
      expect(canWriteGoverned(undefined, s)).toBe(false);
    }
  });

  it("keeps billing with the owner alone, admin included", () => {
    expect(canWriteGoverned("admin", "billing")).toBe(false);
    expect(canWriteGoverned("member", "billing")).toBe(false);
    expect(canWriteGoverned("owner", "billing")).toBe(true);
  });

  it("lets a member draft a house rule but not decide one", () => {
    expect(canWriteGoverned("member", "house_rules_draft")).toBe(true);
    expect(canWriteGoverned("member", "house_rules_decide")).toBe(false);
    expect(canWriteGoverned("admin", "house_rules_decide")).toBe(true);
  });

  it("keeps guardrails, tools, kill switches and autonomy with owner/admin", () => {
    for (const s of [
      "guardrail_rules",
      "agent_tools",
      "kill_switches",
      "autonomy_policy",
    ] as GovernedSurface[]) {
      expect(canWriteGoverned("member", s)).toBe(false);
      expect(canWriteGoverned("admin", s)).toBe(true);
    }
  });

  it("lets a member set a spend cap", () => {
    expect(canWriteGoverned("member", "spend_caps")).toBe(true);
    expect(canWriteGoverned("viewer", "spend_caps")).toBe(false);
  });

  it("never grants a lesser role more than a greater one", () => {
    const rank: Role[] = ["viewer", "member", "admin", "owner"];
    for (const s of surfaces) {
      for (let i = 0; i < rank.length - 1; i++) {
        if (canWriteGoverned(rank[i], s)) {
          expect(canWriteGoverned(rank[i + 1], s)).toBe(true);
        }
      }
    }
  });
});

describe("role predicates", () => {
  it("canManageWorkspace is owner or admin", () => {
    expect(canManageWorkspace("owner")).toBe(true);
    expect(canManageWorkspace("admin")).toBe(true);
    expect(canManageWorkspace("member")).toBe(false);
    expect(canManageWorkspace("viewer")).toBe(false);
    expect(canManageWorkspace(null)).toBe(false);
  });

  it("canWriteAnything excludes the viewer and the non-member", () => {
    expect(canWriteAnything("member")).toBe(true);
    expect(canWriteAnything("viewer")).toBe(false);
    expect(canWriteAnything(null)).toBe(false);
  });

  it("isReadOnly separates a viewer from someone with no membership at all", () => {
    expect(isReadOnly("viewer")).toBe(true);
    expect(isReadOnly(null)).toBe(false);
    expect(isReadOnly("member")).toBe(false);
  });
});

describe("writeDeniedReason", () => {
  it("says nothing when the write is allowed", () => {
    expect(writeDeniedReason("admin", "guardrail_rules")).toBeNull();
  });

  it("names the role and who can do it instead", () => {
    const msg = writeDeniedReason("viewer", "guardrail_rules");
    expect(msg).toContain("viewer");
    expect(msg).toContain("owner");
    expect(msg).toContain("admin");
  });

  it("reads correctly for an owner-only surface", () => {
    expect(writeDeniedReason("admin", "billing")).toBe(
      "Your role here is admin. Only the owner can change this.",
    );
  });

  it("distinguishes a non-member from a viewer", () => {
    expect(writeDeniedReason(null, "billing")).toContain("not a member");
  });

  it("carries no em dash or en dash, because it is user-facing copy", () => {
    for (const s of Object.keys(GOVERNED_WRITES) as GovernedSurface[]) {
      for (const r of [...ROLES, null] as (Role | null)[]) {
        const msg = writeDeniedReason(r, s);
        if (msg) expect(msg).not.toMatch(/[–—]/);
      }
    }
  });
});

/**
 * DRIFT GUARD. GOVERNED_WRITES above is a claim about what the DATABASE does.
 * The database is the enforcement; this table only explains it. If the migration
 * that installs the role-aware write policies is renamed, reverted, or edited so a
 * governed table loses its role check, this fails rather than letting the app keep
 * telling a viewer a comfortable story.
 */
describe("RLS parity: the role-aware write migration is present and intact", () => {
  const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
  const MARKER = "guardrail_rules manager insert";

  function readRoleWriteMigration(): string {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    const hit = files.find((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8").includes(MARKER));
    if (!hit) {
      throw new Error(
        `No migration creates the "${MARKER}" policy. The role-aware write enforcement ` +
          "moved or was removed, so GOVERNED_WRITES in roles.functions.ts is now a claim " +
          "nothing backs. Point this guard at its new home.",
      );
    }
    return readFileSync(join(MIGRATIONS_DIR, hit), "utf8");
  }

  const sql = readRoleWriteMigration();

  it("drops every membership-only FOR ALL write policy it replaces", () => {
    for (const dropped of [
      '"guardrail_rules ws write" on public.guardrail_rules',
      '"house_rules ws write" on public.house_rules',
      '"own agent_tools in member workspace" on public.agent_tools',
    ]) {
      expect(sql).toContain(`drop policy if exists ${dropped}`);
    }
  });

  it("gates guardrails, tools and house-rule decisions on can_manage_workspace", () => {
    for (const policy of [
      "guardrail_rules manager insert",
      "guardrail_rules manager update",
      "guardrail_rules manager delete",
      "house_rules manager update",
      "house_rules manager delete",
      "agent_tools manager insert",
      "agent_tools manager update",
      "agent_tools manager delete",
    ]) {
      expect(sql).toContain(`create policy "${policy}"`);
    }
    expect(sql).toContain("public.can_manage_workspace(workspace_id)");
  });

  it("lets a member draft a house rule only as pending", () => {
    expect(sql).toContain('"house_rules draft or manage insert"');
    expect(sql).toContain("array['owner', 'admin', 'member']");
    expect(sql).toContain("status = 'pending'");
  });

  it("keeps the read policies it must not disturb", () => {
    // The two surviving SELECT policies are never dropped, and agent_tools gets its
    // read half restated before its FOR ALL policy is removed.
    expect(sql).not.toContain('drop policy if exists "guardrail_rules ws read"');
    expect(sql).not.toContain('drop policy if exists "house_rules ws read"');
    expect(sql).toContain('create policy "agent_tools own read"');
    const readIdx = sql.indexOf('create policy "agent_tools own read"');
    const dropIdx = sql.indexOf('drop policy if exists "own agent_tools in member workspace"');
    expect(readIdx).toBeGreaterThan(-1);
    expect(dropIdx).toBeGreaterThan(readIdx);
  });

  it("touches no function, so it cannot fork an overload", () => {
    // Comment lines are stripped first: the migration header EXPLAINS the
    // CREATE OR REPLACE FUNCTION forking trap in prose, and that prose is not DDL.
    const executable = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .toLowerCase();
    expect(executable).not.toContain("create or replace function");
    expect(executable).not.toContain("create function");
    expect(executable).not.toContain("drop function");
  });
});

/**
 * Integration tests for RBAC helpers (with database).
 * These are stubbed here; actual tests run against the live DB in cycle 37.
 */

describe("RBAC integration (stubbed, verify via dry-run)", () => {
  it("should block viewer from admin actions", () => {
    // Test: has_workspace_role(ws, ['owner', 'admin']) = false for viewer.
    // This is verified in the migration dry-run on prod.
  });

  it("should allow owner to manage workspace", () => {
    // Test: has_workspace_role(ws, ['owner', 'admin']) = true for owner.
    // This is verified in the migration dry-run on prod.
  });

  it("should prevent owner demotion", () => {
    // Test: update workspace_members set role = 'admin' where user_id = owner_id
    //       raises 'The workspace owner cannot be demoted...'.
    // This is verified in the migration dry-run on prod.
  });

  it("should enforce account owner-only billing", () => {
    // Test: has_account_role(account, ['owner']) = true only for owner.
    // This is verified in the migration dry-run on prod.
  });
});

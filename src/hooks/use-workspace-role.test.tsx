/**
 * THE CANONICAL ROLE SOURCE, AS A COMPONENT ACTUALLY SEES IT.
 *
 * Before this hook the browser had no way to learn the signed-in user's
 * role: `listWorkspaceMembers` returns `selfRole` as a by-product of listing
 * everybody, and only the Members card in Settings ever called it. So every
 * governed surface drew an enabled Save for a viewer and let the database
 * refuse it in the database's own words.
 *
 * These tests drive the hook the way a panel does: seed the role into the query
 * cache under the key the hook reads, render, and look at what the control ends
 * up as. No server, no network, no mock of react-query itself.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGovernedWrite, useWorkspaceRole, workspaceRoleQueryKey } from "./use-workspace-role";
import { humanWriteError, type GovernedSurface, type Role } from "@/lib/roles.functions";

let qc: QueryClient;

beforeEach(() => {
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

afterEach(() => qc.clear());

/** One governed control, drawn exactly the way the panels draw theirs. */
function Probe({
  surface,
  workspaceId,
}: {
  surface: GovernedSurface;
  workspaceId?: string | null;
}) {
  const gate = useGovernedWrite(surface, workspaceId);
  return (
    <>
      <button type="button" disabled={!gate.allowed} title={gate.reason ?? undefined}>
        Save
      </button>
      <p>{gate.reason ?? "no reason"}</p>
    </>
  );
}

function seedRole(role: Role | null, workspaceId?: string | null) {
  qc.setQueryData(workspaceRoleQueryKey(workspaceId), {
    role,
    workspaceId: workspaceId ?? "ws-1",
  });
}

function mount(ui: React.ReactElement) {
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function saveButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
}

describe("useGovernedWrite: what a role turns a control into", () => {
  test("a viewer gets a DISABLED control on every governed surface", () => {
    for (const surface of [
      "guardrail_rules",
      "house_rules_decide",
      "house_rules_draft",
      "agent_tools",
      "spend_caps",
      "kill_switches",
    ] as GovernedSurface[]) {
      seedRole("viewer");
      const { unmount } = mount(<Probe surface={surface} />);
      expect(saveButton().disabled).toBe(true);
      unmount();
      qc.clear();
    }
  });

  test("an admin gets an ENABLED control on every surface admin owns", () => {
    for (const surface of [
      "guardrail_rules",
      "house_rules_decide",
      "house_rules_draft",
      "agent_tools",
      "spend_caps",
      "kill_switches",
    ] as GovernedSurface[]) {
      seedRole("admin");
      const { unmount } = mount(<Probe surface={surface} />);
      expect(saveButton().disabled).toBe(false);
      unmount();
      qc.clear();
    }
  });

  test("a viewer is told WHY, in the outcome and never the mechanism", () => {
    seedRole("viewer");
    mount(<Probe surface="guardrail_rules" />);
    const reason = saveButton().getAttribute("title") ?? "";
    expect(reason).toContain("viewer");
    expect(reason).toContain("admin");
    // The words a person must never be shown for a refused control.
    expect(reason.toLowerCase()).not.toContain("row level security");
    expect(reason.toLowerCase()).not.toContain("policy");
    expect(reason.toLowerCase()).not.toContain("guardrail_rules");
  });

  test("an admin is told nothing at all, so nothing is added to their surface", () => {
    seedRole("admin");
    mount(<Probe surface="guardrail_rules" />);
    expect(saveButton().getAttribute("title")).toBeNull();
    expect(screen.getByText("no reason")).toBeDefined();
  });

  test("a member keeps drafting a house rule and loses only the decision", () => {
    seedRole("member");
    const drafting = mount(<Probe surface="house_rules_draft" />);
    expect(saveButton().disabled).toBe(false);
    drafting.unmount();

    mount(<Probe surface="house_rules_decide" />);
    expect(saveButton().disabled).toBe(true);
  });

  test("a member keeps setting a spend cap and loses the guardrails", () => {
    seedRole("member");
    const capping = mount(<Probe surface="spend_caps" />);
    expect(saveButton().disabled).toBe(false);
    capping.unmount();

    mount(<Probe surface="guardrail_rules" />);
    expect(saveButton().disabled).toBe(true);
  });

  test("someone who is not a member at all writes nothing", () => {
    seedRole(null);
    mount(<Probe surface="agent_tools" />);
    expect(saveButton().disabled).toBe(true);
    expect(saveButton().getAttribute("title")).toContain("not a member");
  });

  test("the role is read PER WORKSPACE, so owner in one is not owner in the next", () => {
    seedRole("owner", "ws-owned");
    seedRole("viewer", "ws-visited");

    const owned = mount(<Probe surface="guardrail_rules" workspaceId="ws-owned" />);
    expect(saveButton().disabled).toBe(false);
    owned.unmount();

    mount(<Probe surface="guardrail_rules" workspaceId="ws-visited" />);
    expect(saveButton().disabled).toBe(true);
  });
});

describe("useGovernedWrite fails OPEN, so no capability is lost to a slow read", () => {
  test("with the role still unknown, the control stays exactly as usable as before", () => {
    // Nothing seeded: the query is pending and will never resolve in this test.
    mount(<Probe surface="guardrail_rules" />);
    expect(saveButton().disabled).toBe(false);
    expect(saveButton().getAttribute("title")).toBeNull();
  });
});

describe("useWorkspaceRole", () => {
  test("hands back the role it was given, and calls it known", () => {
    seedRole("admin");
    function RoleProbe() {
      const s = useWorkspaceRole();
      return <p>{`${s.role} loading:${s.loading} unknown:${s.unknown}`}</p>;
    }
    mount(<RoleProbe />);
    expect(screen.getByText("admin loading:false unknown:false")).toBeDefined();
  });
});

/**
 * The floor under everything the role check cannot foresee. RLS refuses an
 * INSERT by RAISING, and what it raises names the mechanism and an internal
 * table at a person who only wanted to know they are not allowed.
 */
describe("humanWriteError", () => {
  const FALLBACK = "That rule did not save. Nothing on this surface changed.";

  test("swallows the row-level-security raise Postgres actually sends", () => {
    const raw = new Error('new row violates row-level security policy for table "guardrail_rules"');
    expect(humanWriteError(raw, FALLBACK)).toBe(FALLBACK);
  });

  test("swallows permission denied, constraint violations and PostgREST codes", () => {
    for (const raw of [
      "permission denied for table ai_budgets",
      'duplicate key value violates unique constraint "agent_tools_user_id_tool_name_key"',
      'null value in column "workspace_id" violates not-null constraint',
      'relation "house_rules" does not exist',
      "PGRST116: JSON object requested, multiple (or no) rows returned",
      "42501",
    ]) {
      expect(humanWriteError(new Error(raw), FALLBACK)).toBe(FALLBACK);
    }
  });

  test("keeps a sentence this codebase wrote, because that one is already human", () => {
    const ours = "Your role here is viewer. Only owner or admin can change this.";
    expect(humanWriteError(new Error(ours), FALLBACK)).toBe(ours);
  });

  test("keeps the unconfirmed-write sentence, which is the honest ambiguous case", () => {
    const ours = "We could not confirm that the switch saved. Reload the page and check this rule.";
    expect(humanWriteError(new Error(ours), FALLBACK)).toBe(ours);
  });

  test("never returns an empty string, which would read as success", () => {
    for (const nothing of [null, undefined, "", new Error(""), { message: "   " }]) {
      expect(humanWriteError(nothing, FALLBACK)).toBe(FALLBACK);
    }
  });

  test("carries no em dash or en dash, because it is user-facing copy", () => {
    expect(humanWriteError(new Error("permission denied for table x"), FALLBACK)).not.toMatch(
      /[–—]/,
    );
  });
});

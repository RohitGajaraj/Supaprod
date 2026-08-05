/**
 * THE ENTERPRISE-READINESS BAR, ASSERTED ON THE REAL PANELS.
 *
 * Migration 20260805130000 makes Postgres refuse a viewer's guardrail edit,
 * house-rule approval, tool override and spend cap. RLS refuses an UPDATE or a
 * DELETE by matching ZERO ROWS, not by raising, and refuses an INSERT by
 * raising a sentence that names the mechanism and an internal table. Either way
 * the person pressed an enabled Save. This suite pins the other half: the
 * control is disabled BEFORE they press it, and the sentence beside it names
 * the outcome.
 *
 * HOW THESE RUN WITHOUT A SERVER. Each panel reads through `useServerFn` +
 * `useQuery`, so the harness seeds the query cache under the exact keys the
 * panels read and lets react-query serve them. No mock of react-query, no
 * network, no router. The role goes in under `workspaceRoleQueryKey`, which is
 * the single key the whole app now learns a role from.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { workspaceRoleQueryKey } from "@/hooks/use-workspace-role";
import type { Role } from "@/lib/roles.functions";
import { GuardrailsPanel } from "../GuardrailsPanel";
import { BudgetsPanel } from "../BudgetsPanel";
import { HouseRulesPanel } from "../HouseRulesPanel";
import { GovernedWriteNote } from "../GovernedWriteNote";

let qc: QueryClient;

beforeEach(() => {
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

afterEach(() => qc.clear());

function seedRole(role: Role | null) {
  qc.setQueryData(workspaceRoleQueryKey(null), { role, workspaceId: "ws-1" });
}

const GUARDRAIL_RULE = {
  id: "00000000-0000-0000-0000-0000000000a1",
  name: "Credit card",
  kind: "pii",
  pattern: "\\d{13,16}",
  action: "redact",
  applies_to: "both",
  enabled: true,
  built_in: true,
  created_at: new Date().toISOString(),
};

function seedGuardrails() {
  qc.setQueryData(["guardrails"], {
    rules: [GUARDRAIL_RULE],
    hits: [],
    builtins: [],
    floor: [],
  });
}

function seedBudgets() {
  // `global: null` is the honest starting shape: no ceiling set, so the control
  // reads "Set one" and there is nothing to remove.
  qc.setQueryData(["budget_overview"], {
    global: null,
    surfaces: [],
    alerts: [],
    missionCapUsd: null,
  });
}

const PENDING_RULE = {
  id: "00000000-0000-0000-0000-0000000000b1",
  workspace_id: "ws-1",
  rule_text: "Always name the file you changed.",
  rationale: null,
  status: "pending" as const,
  source_learning_ids: [],
  decided_by: null,
  decided_at: null,
  created_at: new Date().toISOString(),
  agent_slug: null,
};

const APPROVED_RULE = {
  ...PENDING_RULE,
  id: "00000000-0000-0000-0000-0000000000b2",
  rule_text: "Never settle a bet nobody measured.",
  status: "approved" as const,
};

function seedHouseRules() {
  qc.setQueryData(["house-rules"], { rules: [PENDING_RULE, APPROVED_RULE] });
}

function mount(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={qc}>
      <ConfirmProvider>{ui}</ConfirmProvider>
    </QueryClientProvider>,
  );
}

function button(name: string): HTMLButtonElement {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

function switches(): HTMLButtonElement[] {
  return screen.getAllByRole("switch") as HTMLButtonElement[];
}

/** The one sentence a refused surface is allowed to say, wherever it is drawn. */
function deniedNote(container: HTMLElement): string | null {
  return container.querySelector('[data-governed-write="denied"]')?.textContent ?? null;
}

describe("GuardrailsPanel: guardrail_rules is owner or admin", () => {
  test("a viewer cannot flip a rule, and is told why before trying", () => {
    seedRole("viewer");
    seedGuardrails();
    const { container } = mount(<GuardrailsPanel />);

    expect(switches()[0].disabled).toBe(true);

    const note = deniedNote(container) ?? "";
    expect(note).toContain("viewer");
    expect(note).toContain("admin");
    expect(note.toLowerCase()).not.toContain("row level security");
    expect(note.toLowerCase()).not.toContain("guardrail_rules");
  });

  test("a viewer is not offered a rule editor whose Save they cannot press", () => {
    seedRole("viewer");
    seedGuardrails();
    mount(<GuardrailsPanel />);
    expect(screen.queryByRole("button", { name: "Write a rule" })).toBeNull();
  });

  test("a viewer cannot seed the built-ins either", () => {
    seedRole("viewer");
    seedGuardrails();
    mount(<GuardrailsPanel />);
    expect(button("Add any missing built-ins").disabled).toBe(true);
  });

  test("an admin keeps every control they had, and is told nothing", () => {
    seedRole("admin");
    seedGuardrails();
    const { container } = mount(<GuardrailsPanel />);

    expect(switches()[0].disabled).toBe(false);
    expect(button("Add any missing built-ins").disabled).toBe(false);
    expect(screen.getByRole("button", { name: "Write a rule" })).toBeDefined();
    expect(deniedNote(container)).toBeNull();
  });

  test("a member loses the guardrails, because the database says admin", () => {
    seedRole("member");
    seedGuardrails();
    mount(<GuardrailsPanel />);
    expect(switches()[0].disabled).toBe(true);
  });

  test("reading a rule is untouched: the list still shows it", () => {
    seedRole("viewer");
    seedGuardrails();
    mount(<GuardrailsPanel />);
    // The migration deliberately left every SELECT policy alone, so a viewer
    // must still see the boundary they cannot move.
    expect(screen.getByText("Credit card")).toBeDefined();
    expect(screen.getByRole("button", { name: "Open" })).toBeDefined();
  });
});

describe("BudgetsPanel: a spend cap is money, so a viewer sets none", () => {
  test("a viewer cannot set a ceiling, and is told why", () => {
    seedRole("viewer");
    seedBudgets();
    const { container } = mount(<BudgetsPanel />);

    for (const b of screen.getAllByRole("button", { name: "Set one" })) {
      expect((b as HTMLButtonElement).disabled).toBe(true);
    }
    expect(button("Cap one").disabled).toBe(true);
    expect(deniedNote(container) ?? "").toContain("viewer");
  });

  test("a MEMBER keeps the ceiling, because a self-limit is not governance", () => {
    seedRole("member");
    seedBudgets();
    const { container } = mount(<BudgetsPanel />);

    for (const b of screen.getAllByRole("button", { name: "Set one" })) {
      expect((b as HTMLButtonElement).disabled).toBe(false);
    }
    expect(button("Cap one").disabled).toBe(false);
    expect(deniedNote(container)).toBeNull();
  });

  test("an admin keeps every control they had", () => {
    seedRole("admin");
    seedBudgets();
    const { container } = mount(<BudgetsPanel />);
    expect(button("Cap one").disabled).toBe(false);
    expect(button("Change it").disabled).toBe(false);
    expect(deniedNote(container)).toBeNull();
  });
});

describe("HouseRulesPanel: a member drafts, an owner or admin decides", () => {
  test("a viewer can neither decide nor draft", () => {
    seedRole("viewer");
    seedHouseRules();
    const { container } = mount(<HouseRulesPanel />);

    expect(button("Make it a rule").disabled).toBe(true);
    expect(button("Not this one").disabled).toBe(true);
    expect(button("Replace it").disabled).toBe(true);
    expect(deniedNote(container) ?? "").toContain("viewer");
  });

  test("a MEMBER keeps Replace it and loses only the decision", () => {
    seedRole("member");
    seedHouseRules();
    mount(<HouseRulesPanel />);

    expect(button("Make it a rule").disabled).toBe(true);
    expect(button("Replace it").disabled).toBe(false);
  });

  test("the refusal rides inside the question, so the rule itself still reads", () => {
    seedRole("member");
    seedHouseRules();
    mount(<HouseRulesPanel />);
    expect(screen.getByText("Always name the file you changed.")).toBeDefined();
    expect(screen.getByText(/Your role here is member/)).toBeDefined();
  });

  test("an admin keeps every control they had, and is told nothing", () => {
    seedRole("admin");
    seedHouseRules();
    const { container } = mount(<HouseRulesPanel />);

    expect(button("Make it a rule").disabled).toBe(false);
    expect(button("Not this one").disabled).toBe(false);
    expect(button("Replace it").disabled).toBe(false);
    expect(deniedNote(container)).toBeNull();
  });

  test("an owner keeps every control they had", () => {
    seedRole("owner");
    seedHouseRules();
    mount(<HouseRulesPanel />);
    expect(button("Make it a rule").disabled).toBe(false);
    expect(button("Replace it").disabled).toBe(false);
  });
});

describe("GovernedWriteNote", () => {
  test("renders nothing at all when the write is allowed", () => {
    const { container } = render(<GovernedWriteNote reason={null} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders the sentence it was given, and nothing it invented", () => {
    const reason = "Your role here is viewer. Only owner or admin can change this.";
    render(<GovernedWriteNote reason={reason} />);
    expect(screen.getByText(reason)).toBeDefined();
  });
});

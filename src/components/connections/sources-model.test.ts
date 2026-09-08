/**
 * TWENTY-TWO NEGATIONS FOR ONE FACT (2026-09-08).
 *
 * A workspace with one connected GitHub repository met eleven "<X> is not
 * connected" lines and eleven "<X> has no connected account" lines on /sync.
 * These pin the partition the page draws from instead: one row per connected
 * source, one press per absent one, and an override set that only ever names
 * what is connected.
 */
import { describe, expect, it } from "bun:test";

import type { ConnectionRow, WorkspaceBindingRow } from "@/lib/connections.functions";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import {
  connectedSummary,
  readsSomethingYet,
  sourceBrings,
  sourcesModel,
  userFacingProviders,
} from "./sources-model";

function connection(provider: ProviderId, status: ConnectionRow["status"]): ConnectionRow {
  return {
    id: `conn-${provider}-${status}`,
    user_id: "u1",
    provider,
    auth_kind: "oauth_gateway",
    external_handle: null,
    secret_id: null,
    account_label: `${provider} account`,
    account_email: null,
    status,
    status_detail: null,
    scopes: [],
    metadata: {},
    last_verified_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  };
}

function binding(provider: ProviderId, kind: string, connectionId: string): WorkspaceBindingRow {
  return {
    id: `bind-${provider}-${kind}`,
    connection_id: connectionId,
    workspace_id: "ws1",
    product_id: null,
    provider,
    resource_kind: kind,
    resource_id: "acme/web",
    resource_label: "acme/web",
    config: {},
    created_by: "u1",
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
    account_label: `${provider} account`,
    connection_status: "connected",
    owner_display: "Rohit",
  };
}

const github = connection("github", "connected");

describe("one connected repository is one row, not twenty-two", () => {
  const model = sourcesModel({
    connections: [github],
    bindings: [binding("github", "repo", github.id)],
  });

  it("draws exactly one connected row, and it is the repository", () => {
    expect(model.connected).toHaveLength(1);
    expect(model.connected[0]!.spec.id).toBe("github");
    expect(model.connected[0]!.kind?.kind).toBe("repo");
    expect(model.connected[0]!.binding?.resource_label).toBe("acme/web");
  });

  it("offers every other source as a press and never the connected one", () => {
    const ids = model.toConnect.map((p) => p.spec.id);
    expect(ids).not.toContain("github");
    expect(ids).toHaveLength(userFacingProviders().length - 1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lets a product override only the connected provider", () => {
    expect(model.overridable.map((s) => s.id)).toEqual(["github"]);
  });

  it("summarises the rows it introduces", () => {
    expect(connectedSummary(model.connected)).toBe("1 connected.");
  });
});

describe("what counts as connected", () => {
  it("a connected account with nothing chosen is a row asking to be pointed", () => {
    const model = sourcesModel({ connections: [github], bindings: [] });
    expect(model.connected).toHaveLength(1);
    expect(model.connected[0]!.binding).toBeNull();
    expect(connectedSummary(model.connected)).toBe("1 connected, 1 not yet pointed at anything.");
  });

  it("a disconnected account is a press again, not a connected row", () => {
    const model = sourcesModel({
      connections: [connection("linear", "disconnected")],
      bindings: [],
    });
    expect(model.connected).toHaveLength(0);
    expect(model.toConnect.map((p) => p.spec.id)).toContain("linear");
  });

  it("an account in error stays connected, says it stopped, and comes first", () => {
    const model = sourcesModel({
      connections: [github, connection("linear", "error")],
      bindings: [],
    });
    expect(model.connected[0]!.spec.id).toBe("linear");
    expect(model.connected[0]!.reading).toBe(false);
    expect(model.connected[1]!.spec.id).toBe("github");
    expect(connectedSummary(model.connected)).toBe(
      "2 connected, 1 not yet pointed at anything, 1 stopped reading.",
    );
    // Stopped, so nothing a product can override through it.
    expect(model.overridable.map((s) => s.id)).toEqual(["github"]);
  });

  it("a reading account carries the row when the same provider also has one in error", () => {
    const model = sourcesModel({
      connections: [connection("github", "error"), github],
      bindings: [],
    });
    expect(model.connected).toHaveLength(1);
    expect(model.connected[0]!.connection.id).toBe(github.id);
    expect(model.connected[0]!.reading).toBe(true);
  });

  it("a source that reads the whole account is one row with nothing to point at", () => {
    const model = sourcesModel({ connections: [connection("stripe", "connected")], bindings: [] });
    expect(model.connected).toHaveLength(1);
    expect(model.connected[0]!.kind).toBeNull();
    expect(model.overridable).toHaveLength(0);
    expect(connectedSummary(model.connected)).toBe("1 connected.");
  });

  it("a provider with two things to point at earns two rows", () => {
    const model = sourcesModel({ connections: [connection("slack", "connected")], bindings: [] });
    expect(model.connected.map((s) => s.key)).toEqual(["slack:channel", "slack:digest_channel"]);
  });

  it("carries the latest document sync for the provider onto its row", () => {
    const notion = connection("notion", "connected");
    const model = sourcesModel({
      connections: [notion],
      bindings: [],
      mappings: [
        { provider: "notion", last_pulled_at: "2026-09-05T00:00:00Z", last_pushed_at: null },
        {
          provider: "notion",
          last_pulled_at: "2026-09-03T00:00:00Z",
          last_pushed_at: "2026-09-07T00:00:00Z",
        },
      ],
    });
    expect(model.connected[0]!.lastSyncIso).toBe("2026-09-07T00:00:00Z");
  });

  it("a press knows whether an admin has made it connectable", () => {
    const availability = {
      github: { configured: true, missingEnv: [] },
      linear: { configured: false, missingEnv: ["LINEAR_CLIENT_ID"] },
    } as unknown as NonNullable<Parameters<typeof sourcesModel>[0]["availability"]>;
    const model = sourcesModel({ connections: [], bindings: [], availability });
    const byId = new Map(model.toConnect.map((p) => [p.spec.id, p]));
    expect(byId.get("github")?.ready).toBe(true);
    expect(byId.get("linear")?.ready).toBe(false);
  });
});

describe("what each press says it brings", () => {
  it("has one short clause for every provider a person can connect", () => {
    for (const spec of userFacingProviders()) {
      const line = sourceBrings(spec.id);
      expect(line.length).toBeGreaterThan(0);
      expect(line.length).toBeLessThanOrEqual(40);
      expect(line.toLowerCase()).not.toContain(spec.label.toLowerCase());
    }
  });

  it("carries no AI fingerprint a reader would see", () => {
    for (const spec of userFacingProviders()) {
      expect(sourceBrings(spec.id)).not.toMatch(/[\u2014\u2013\u00a0]/);
    }
  });

  it("says so where connecting sends nothing back yet, read from the registry itself", () => {
    // The adapter map's own list, and the three whose description says "not built yet".
    for (const id of ["google_calendar", "google_tasks", "figma", "jira"] as ProviderId[]) {
      expect(readsSomethingYet(CONNECTOR_REGISTRY[id])).toBe(false);
    }
    expect(readsSomethingYet(CONNECTOR_REGISTRY.github)).toBe(true);
    expect(readsSomethingYet(CONNECTOR_REGISTRY.slack)).toBe(true);
  });
});

import { describe, test, expect } from "bun:test";
import { recordStageEvent } from "@/lib/stage-events.server";

function mockClient() {
  const inserts: Record<string, unknown>[] = [];
  return {
    inserts,
    client: {
      from(table: string) {
        return {
          insert(values: Record<string, unknown>) {
            inserts.push({ table, ...values });
            return Promise.resolve({ error: null });
          },
        };
      },
    },
  };
}

const ID = "11111111-2222-3333-4444-555555555555";

describe("recordStageEvent", () => {
  test("writes a stage_events row with the full payload", async () => {
    const { client, inserts } = mockClient();
    await recordStageEvent(client, {
      entityType: "spec",
      entityId: ID,
      from: "draft",
      to: "review",
      actor: "human",
      workspaceId: "ws-1",
      userId: "u-1",
    });
    expect(inserts.length).toBe(1);
    expect(inserts[0]).toMatchObject({
      table: "stage_events",
      entity_type: "spec",
      entity_id: ID,
      from_stage: "draft",
      to_stage: "review",
      actor: "human",
      workspace_id: "ws-1",
      user_id: "u-1",
    });
  });

  test("skips no-op transitions (from === to)", async () => {
    const { client, inserts } = mockClient();
    await recordStageEvent(client, {
      entityType: "mission",
      entityId: ID,
      from: "running",
      to: "running",
    });
    expect(inserts.length).toBe(0);
  });

  test("null from records a creation event (from_stage null)", async () => {
    const { client, inserts } = mockClient();
    await recordStageEvent(client, { entityType: "decision", entityId: ID, to: "pending" });
    expect(inserts.length).toBe(1);
    expect(inserts[0]).toMatchObject({ from_stage: null, to_stage: "pending", actor: "system" });
  });

  test("never throws when the insert fails or the client is broken", async () => {
    const failing = {
      from() {
        return {
          insert() {
            return Promise.resolve({ error: { message: "nope" } });
          },
        };
      },
    };
    await recordStageEvent(failing, { entityType: "spec", entityId: ID, to: "draft" });
    const throwing = {
      from() {
        throw new Error("boom");
      },
    };
    await recordStageEvent(throwing, { entityType: "spec", entityId: ID, to: "draft" });
    expect(true).toBe(true);
  });
});

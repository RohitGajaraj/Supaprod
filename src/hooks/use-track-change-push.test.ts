import { describe, expect, test } from "bun:test";

import { subscribeTrackChanges, trackChangeKeys } from "./use-track-change-push";

type Handler = (payload: unknown) => void;

/** A fake realtime client that records what was subscribed and lets the test
 *  fire an event, so the rule is proved without a socket. */
function fakeClient() {
  const bound: Array<{ event: string; table: string; filter: string; handler: Handler }> = [];
  let onStatus: ((status: string) => void) | null = null;
  const removed: string[] = [];
  const channel = {
    name: "",
    on(_kind: string, match: { event: string; table: string; filter: string }, handler: Handler) {
      bound.push({ ...match, handler });
      return channel;
    },
    subscribe(cb: (status: string) => void) {
      onStatus = cb;
      return channel;
    },
  };
  const client = {
    channel(name: string) {
      channel.name = name;
      return channel;
    },
    removeChannel(c: { name: string }) {
      removed.push(c.name);
      return Promise.resolve("ok" as const);
    },
  };
  return {
    client: client as never,
    bound,
    removed,
    connect: () => onStatus?.("SUBSCRIBED"),
  };
}

describe("a run's position moves the moment it changes", () => {
  test("an UPDATE on the workspace's tracks refetches the home's runs and the shell's queue", () => {
    const fake = fakeClient();
    const invalidated: unknown[] = [];
    subscribeTrackChanges(fake.client, "ws-1", {
      invalidateQueries: (o: { queryKey?: unknown }) => {
        invalidated.push(o.queryKey);
        return Promise.resolve();
      },
    } as never);
    expect(fake.bound).toHaveLength(1);
    expect(fake.bound[0]).toMatchObject({
      event: "UPDATE",
      table: "spine_tracks",
      filter: "workspace_id=eq.ws-1",
    });
    fake.bound[0]!.handler({});
    expect(invalidated).toEqual(trackChangeKeys("ws-1"));
    expect(invalidated).toContainEqual(["start-runs", "ws-1"]);
    expect(invalidated).toContainEqual(["approvals-queue", "shell", "ws-1"]);
  });

  test("a reconnect refetches once, so a gap while the socket was down is closed; the first connect has no gap", () => {
    const fake = fakeClient();
    let calls = 0;
    subscribeTrackChanges(fake.client, "ws-2", {
      invalidateQueries: () => {
        calls += 1;
        return Promise.resolve();
      },
    } as never);
    expect(calls).toBe(0);
    // The first SUBSCRIBED follows the read that just seeded the rows; a
    // refetch here paid the home's largest read again on every arrival.
    fake.connect();
    expect(calls).toBe(0);
    // A later SUBSCRIBED is a reconnect, and the gap it may hide is closed.
    fake.connect();
    expect(calls).toBe(trackChangeKeys("ws-2").length);
  });

  test("tearing down removes the one channel it opened", () => {
    const fake = fakeClient();
    const off = subscribeTrackChanges(fake.client, "ws-3", {
      invalidateQueries: () => Promise.resolve(),
    } as never);
    off();
    expect(fake.removed).toEqual(["track-changes-ws-3"]);
  });
});

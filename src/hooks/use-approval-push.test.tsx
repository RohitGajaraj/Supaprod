/**
 * P-83: the approvals queue refetches on the live channel it already
 * listens to, instead of asking a person to refresh. This is the guard the
 * packet's own scope names: "a test that the approvals queue's query is
 * invalidated by the live event and that the copy contains no 'refresh'."
 */
import { describe, expect, it, mock, beforeEach } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useApprovalPush } from "./use-approval-push";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";

type Handler = () => void;
type Binding = { table: string; event: string; filter?: string; handler: Handler };

let bindings: Binding[] = [];
let subscribeCb: ((status: string) => void) | null = null;
let removedChannel: unknown = null;

function fakeChannel() {
  const self = {
    on: (
      _kind: "postgres_changes",
      config: { table: string; event: string; filter?: string },
      handler: Handler,
    ) => {
      bindings.push({ table: config.table, event: config.event, filter: config.filter, handler });
      return self;
    },
    subscribe: (cb: (status: string) => void) => {
      subscribeCb = cb;
      return self;
    },
  };
  return self;
}

/**
 * A fake passed as `useApprovalPush`'s own second parameter, NOT a
 * `mock.module` on `@/integrations/supabase/client` -- see that parameter's
 * own doc comment for why: `AskPane.test.tsx` already claims that module
 * process-wide, and `a-module-mock-is-process-wide.test.ts` freezes the set
 * of modules more than one test file may replace.
 */
const fakeSupabase = {
  auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
  channel: (_name: string) => fakeChannel(),
  removeChannel: (ch: unknown) => {
    removedChannel = ch;
  },
} as unknown as Parameters<typeof useApprovalPush>[1];

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useApprovalPush: the live channel widened past agent_approvals alone", () => {
  beforeEach(() => {
    bindings = [];
    subscribeCb = null;
    removedChannel = null;
  });

  it("subscribes to INSERT and UPDATE on the four P-83 tables, with no column filter (RLS-scoped)", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useApprovalPush(true, fakeSupabase), { wrapper: wrapper(client) });

    await waitFor(() => expect(subscribeCb).not.toBeNull());

    for (const table of ["memory_candidates", "opportunities", "themes", "decisions"] as const) {
      const inserts = bindings.filter((b) => b.table === table && b.event === "INSERT");
      const updates = bindings.filter((b) => b.table === table && b.event === "UPDATE");
      expect(inserts).toHaveLength(1);
      expect(updates).toHaveLength(1);
      // No `filter` key at all -- a present-but-empty filter would still be a
      // column filter attempt and these tables carry `workspace_id`, not the
      // `user_id` agent_approvals filters on.
      expect(inserts[0]?.filter).toBeUndefined();
    }
    // agent_approvals keeps its own user_id filter, unchanged.
    const gateInsert = bindings.find((b) => b.table === "agent_approvals" && b.event === "INSERT");
    expect(gateInsert?.filter).toBe("user_id=eq.user-1");
  });

  it("an event on any P-83 table invalidates the approvals queue AND approvals-live-activity", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = mock(client.invalidateQueries.bind(client));
    client.invalidateQueries = spy;

    renderHook(() => useApprovalPush(true, fakeSupabase), { wrapper: wrapper(client) });
    await waitFor(() => expect(subscribeCb).not.toBeNull());
    spy.mockClear(); // drop the on-SUBSCRIBED refetch, isolate the event itself

    const themeInsert = bindings.find((b) => b.table === "themes" && b.event === "INSERT");
    expect(themeInsert).toBeDefined();
    themeInsert?.handler();

    const keys = spy.mock.calls.map((call) => JSON.stringify(call[0].queryKey));
    expect(keys).toContain(JSON.stringify(APPROVALS_QUEUE_PREFIX));
    expect(keys).toContain(JSON.stringify(["approvals-live-activity"]));
    expect(keys).toContain(JSON.stringify(["start-home-answers"]));
    expect(keys).toContain(JSON.stringify(["themes"]));
    expect(keys).toContain(JSON.stringify(["opportunities"]));
  });
});

describe("the approvals page's own copy carries no imperative to refresh", () => {
  it('no live string literal contains "refresh" (comments quoting the retired sentence for history are fine)', () => {
    const source = readFileSync(
      join(import.meta.dir, "..", "routes", "_authenticated.approvals.tsx"),
      "utf8",
    );
    // Strip /* ... */ and // ... before scanning -- this file's own history
    // (and this packet's own commit) quote the retired sentence verbatim in
    // comments, which is documentation, not copy a person reads.
    const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
    const withoutLineComments = withoutBlockComments.replace(/\/\/.*$/gm, "");
    expect(withoutLineComments.toLowerCase()).not.toContain("refresh");
  });
});

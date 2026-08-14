import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  resolveProviderCall,
  providerIsReachable,
  type ProviderCall,
} from "@/lib/connectors/gateway-era.server";

/**
 * WHO THIS AUTHENTICATES AS, and why it changed.
 *
 * Every function here used to read `LOVABLE_API_KEY` + `LINEAR_API_KEY` from the
 * environment and nothing else, so a person who completed the Linear OAuth flow
 * had a token written to the vault that no code path ever read, and got told
 * "Linear isn't connected yet. Link it from Integrations." The credential chain
 * now answers instead, preferring their own connection and falling back to the
 * admin key on the gateway exactly as before. Full reasoning lives on
 * `resolveProviderCall`.
 */
async function linearCall(
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string | null,
): Promise<ProviderCall | null> {
  return resolveProviderCall({
    provider: "linear",
    userClient: supabase,
    userId,
    workspaceId: workspaceId ?? null,
  });
}

/** What a caller says when nothing resolved. One sentence, one next step. */
const NOT_CONNECTED = "Linear is not connected. Connect it in Settings, Connections.";

async function gql<T>(
  call: ProviderCall,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(call.baseUrl, {
    method: "POST",
    headers: call.headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Linear GraphQL failed [${res.status}]: ${body.slice(0, 400)}`);
  const json = JSON.parse(body) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length)
    throw new Error(`Linear: ${json.errors.map((e) => e.message).join("; ")}`);
  if (!json.data) throw new Error("Linear: empty response");
  return json.data;
}

export type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  url: string;
  priority: number;
  state: { name: string; type: string };
  assignee: { name: string; email: string } | null;
  team: { key: string; name: string };
};

const PRIORITY_TO_LOCAL: Record<number, "low" | "medium" | "high"> = {
  0: "medium",
  1: "high",
  2: "high",
  3: "medium",
  4: "low",
};
const LOCAL_TO_PRIORITY: Record<string, number> = { high: 2, medium: 3, low: 4 };
const STATE_TO_LOCAL = (t: string): "todo" | "doing" | "done" => {
  if (t === "completed" || t === "canceled") return "done";
  if (t === "started") return "doing";
  return "todo";
};

export const listLinearTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const call = await linearCall(context.supabase, context.userId);
    if (!call) return { teams: [], connected: false as const };
    const data = await gql<{ teams: { nodes: { id: string; key: string; name: string }[] } }>(
      call,
      `query { teams(first: 50) { nodes { id key name } } }`,
    );
    return { teams: data.teams.nodes, connected: true as const };
  });

export const searchLinearIssues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        query: z.string().max(200).optional(),
        teamId: z.string().optional(),
        onlyMine: z.boolean().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const call = await linearCall(context.supabase, context.userId);
    if (!call) return { issues: [], connected: false as const };
    const filters: string[] = [];
    if (data.teamId) filters.push(`team: { id: { eq: "${data.teamId}" } }`);
    if (data.onlyMine) filters.push(`assignee: { isMe: { eq: true } }`);
    if (data.query) {
      const safe = data.query.replace(/"/g, '\\"');
      filters.push(`title: { containsIgnoreCase: "${safe}" }`);
    }
    const filterStr = filters.length ? `filter: { ${filters.join(", ")} },` : "";
    const q = `query { issues(${filterStr} first: 25, orderBy: updatedAt) {
      nodes {
        id identifier title description url priority
        state { name type }
        assignee { name email }
        team { key name }
      }
    } }`;
    const r = await gql<{ issues: { nodes: LinearIssue[] } }>(call, q);
    return { issues: r.issues.nodes };
  });

export const importLinearIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        issueId: z.string().min(4).max(64),
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const call = await linearCall(supabase, userId);
    if (!call) throw new Error(NOT_CONNECTED);
    const r = await gql<{ issue: LinearIssue }>(
      call,
      `query($id: String!) { issue(id: $id) {
        id identifier title description url priority
        state { name type } assignee { name email } team { key name }
      } }`,
      { id: data.issueId },
    );
    const issue = r.issue;
    if (!issue) throw new Error("Linear issue not found");

    const { data: row, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: `[${issue.identifier}] ${issue.title}`,
        status: STATE_TO_LOCAL(issue.state.type),
        priority: PRIORITY_TO_LOCAL[issue.priority] ?? "medium",
        project_id: data.project_id ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("sync_mappings").insert({
      user_id: userId,
      provider: "linear",
      local_kind: "task",
      local_id: row.id,
      external_id: issue.id,
      external_url: issue.url,
      last_pulled_at: new Date().toISOString(),
      version_remote: 1,
    } as never);

    return { task: row };
  });

/**
 * TAKES THE TRANSPORT RATHER THAN RESOLVING ONE, because the sync loop calls it
 * once per mapping and resolving per call would re-walk the whole credential
 * chain (and re-decrypt the vault secret) for every row.
 */
export async function pullLinearIssue(
  call: ProviderCall,
  issueId: string,
): Promise<{
  title: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  url: string;
}> {
  const r = await gql<{ issue: LinearIssue }>(
    call,
    `query($id: String!) { issue(id: $id) { id identifier title priority url state { type } } }`,
    { id: issueId },
  );
  const i = r.issue;
  return {
    title: `[${i.identifier}] ${i.title}`,
    status: STATE_TO_LOCAL(i.state.type),
    priority: PRIORITY_TO_LOCAL[i.priority] ?? "medium",
    url: i.url,
  };
}

export async function pushLinearIssue(
  call: ProviderCall,
  issueId: string,
  patch: {
    title?: string;
    status?: "todo" | "doing" | "done";
    priority?: "low" | "medium" | "high";
  },
): Promise<void> {
  // Map status → Linear workflow state id by name
  let stateId: string | undefined;
  if (patch.status) {
    const r = await gql<{ issue: { team: { states: { nodes: { id: string; type: string }[] } } } }>(
      call,
      `query($id: String!) { issue(id: $id) { team { states { nodes { id type } } } } }`,
      { id: issueId },
    );
    const wantType =
      patch.status === "done" ? "completed" : patch.status === "doing" ? "started" : "unstarted";
    stateId = r.issue.team.states.nodes.find((s) => s.type === wantType)?.id;
  }
  const input: Record<string, unknown> = {};
  if (patch.title) input.title = patch.title.replace(/^\[[A-Z]+-\d+\]\s*/, "");
  if (patch.priority) input.priority = LOCAL_TO_PRIORITY[patch.priority];
  if (stateId) input.stateId = stateId;
  if (!Object.keys(input).length) return;
  await gql(
    call,
    `mutation($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) { success }
    }`,
    { id: issueId, input },
  );
}

// PRD → Linear issues
export const createLinearIssuesFromTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        teamId: z.string().min(1),
        taskIds: z.array(z.string().uuid()).min(1).max(50),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const call = await linearCall(supabase, userId);
    if (!call) throw new Error(NOT_CONNECTED);
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .in("id", data.taskIds)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const created: { taskId: string; issueId: string; url: string }[] = [];
    // Phase 1: Parallelize GraphQL issue creation (concurrency-capped at 5)
    const CONCURRENT_MUTATIONS = 5;
    const mutationPromises: Promise<{ taskId: string; issueId: string; url: string } | null>[] = [];
    const syncMappingsToInsert: Array<{
      user_id: string;
      provider: string;
      local_kind: string;
      local_id: string;
      external_id: string;
      external_url: string;
      last_pushed_at: string;
      version_local: number;
    }> = [];

    // Batch mutations into groups of CONCURRENT_MUTATIONS to maintain stable concurrency
    for (let i = 0; i < (tasks ?? []).length; i += CONCURRENT_MUTATIONS) {
      const batch = (tasks ?? []).slice(i, i + CONCURRENT_MUTATIONS);
      const batchPromises = batch.map((t) =>
        (async () => {
          const r = await gql<{
            issueCreate: { success: boolean; issue: { id: string; url: string } };
          }>(
            call,
            `mutation($input: IssueCreateInput!) {
            issueCreate(input: $input) { success issue { id url } }
          }`,
            {
              input: {
                teamId: data.teamId,
                title: t.title,
                priority: LOCAL_TO_PRIORITY[t.priority ?? "medium"],
              },
            },
          );

          if (r.issueCreate.success) {
            const result = {
              taskId: t.id,
              issueId: r.issueCreate.issue.id,
              url: r.issueCreate.issue.url,
            };
            syncMappingsToInsert.push({
              user_id: userId,
              provider: "linear",
              local_kind: "task",
              local_id: t.id,
              external_id: r.issueCreate.issue.id,
              external_url: r.issueCreate.issue.url,
              last_pushed_at: new Date().toISOString(),
              version_local: 1,
            });
            return result;
          }
          return null;
        })(),
      );

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        if (result) created.push(result);
      }
    }

    // Phase 3: Batch insert all sync_mappings (1 round trip instead of N)
    if (syncMappingsToInsert.length > 0) {
      const { error } = await supabase.from("sync_mappings").insert(syncMappingsToInsert as never);
      if (error) throw new Error(error.message);
    }

    return { created };
  });

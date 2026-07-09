import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { resolveProviderAuth } from "@/lib/connectors/resolve.server";
import { tokenBearer } from "@/lib/connectors/providers/bearer.server";
import { SLACK_API } from "@/lib/connectors/providers/slack.server";
import { HUBSPOT_API } from "@/lib/connectors/providers/hubspot.server";
import { SALESFORCE_API_VERSION } from "@/lib/connectors/providers/salesforce.server";

/**
 * TEMPORARY, one-off test-data injector (SW-7, 2026-07-09). Posts one real
 * item into Slack / HubSpot / Salesforce using each connector's own
 * already-configured server-side credential (resolved the identical way the
 * real ingest functions do), so the next sense-tick has genuine source-side
 * data to pull back in as proof the tier fix actually works end to end, not
 * just that the plumbing is unblocked. Delete this file once verified; it is
 * not meant to ship as a permanent feature.
 */
export const Route = createFileRoute("/api/public/hooks/seed-test-signals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        const { userId, workspaceId } = (await request.json().catch(() => ({}))) as {
          userId?: string;
          workspaceId?: string;
        };
        if (!userId || !workspaceId) {
          return Response.json(
            { ok: false, error: "userId and workspaceId required" },
            { status: 400 },
          );
        }

        const results: Record<string, unknown> = {};

        // Slack: post a real message to the configured feedback channel.
        try {
          const channel = process.env.SLACK_SIGNAL_CHANNEL;
          if (!channel) throw new Error("SLACK_SIGNAL_CHANNEL not set");
          const resolved = await resolveProviderAuth({
            provider: "slack",
            userId,
            workspaceId,
            resourceKind: "channel",
            requiredCapability: "inflow",
          });
          const token = tokenBearer(resolved.auth);
          if (!token) throw new Error("no slack token resolved");
          const res = await fetch(`${SLACK_API}/chat.postMessage`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              channel,
              text: "SW-7 test signal: users keep asking why the export button is hidden behind a submenu.",
            }),
          });
          const body = (await res.json()) as { ok?: boolean; error?: string };
          results.slack = { ok: body.ok ?? false, error: body.error ?? null };
        } catch (e) {
          results.slack = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }

        // HubSpot: create one real closed-lost deal.
        try {
          const resolved = await resolveProviderAuth({
            provider: "hubspot",
            userId,
            workspaceId,
            requiredCapability: "inflow",
          });
          const token = tokenBearer(resolved.auth);
          if (!token) throw new Error("no hubspot token resolved");
          const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              properties: {
                dealname: "SW-7 test deal (closed lost)",
                dealstage: "closedlost",
                closed_lost_reason: "Chose a competitor with better pricing.",
                amount: "4200",
              },
            }),
          });
          const body = (await res.json()) as { id?: string; message?: string };
          results.hubspot = {
            ok: res.ok,
            id: body.id ?? null,
            error: res.ok ? null : body.message,
          };
        } catch (e) {
          results.hubspot = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }

        // Salesforce: create one real closed-lost opportunity.
        try {
          const instance = process.env.SALESFORCE_INSTANCE_URL;
          if (!instance) throw new Error("SALESFORCE_INSTANCE_URL not set");
          const resolved = await resolveProviderAuth({
            provider: "salesforce",
            userId,
            workspaceId,
            requiredCapability: "inflow",
          });
          const token = tokenBearer(resolved.auth);
          if (!token) throw new Error("no salesforce token resolved");
          const closeDate = new Date().toISOString().slice(0, 10);
          const res = await fetch(
            `${instance}/services/data/${SALESFORCE_API_VERSION}/sobjects/Opportunity`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                Name: "SW-7 test opportunity (closed lost)",
                StageName: "Closed Lost",
                CloseDate: closeDate,
                Amount: 8500,
              }),
            },
          );
          const body = (await res.json().catch(() => null)) as
            | { id?: string }
            | Array<{ message?: string }>
            | null;
          const id = body && !Array.isArray(body) ? body.id : null;
          const error = Array.isArray(body) ? body[0]?.message : null;
          results.salesforce = { ok: res.ok, id: id ?? null, error: res.ok ? null : error };
        } catch (e) {
          results.salesforce = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }

        return Response.json({ ok: true, results });
      },
    },
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Action } from "@/components/meridian/surface-parts";

// Minimal typed wrapper for the beta supabase.auth.oauth namespace.
type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
  scopes?: string[] | null;
};
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};
function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + (location.searchStr ?? "");
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-2 text-lg font-semibold">Could not load this authorization request</h1>
      <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [pending, setPending] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setPending(approve ? "approve" : "deny");
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setPending(null);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setPending(null);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-3 text-xl font-semibold">Connect {clientName} to your Supaprod account</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {clientName} will read data as you, using your workspace access.
      </p>
      {error ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        {/* Both controls lock while either decision runs, as before. The one
            that was pressed also announces itself as the one working, which
            the single shared `busy` flag could not say. */}
        <Action
          variant="primary"
          busy={pending === "approve"}
          disabled={pending !== null}
          onClick={() => decide(true)}
        >
          Approve
        </Action>
        <Action
          variant="default"
          busy={pending === "deny"}
          disabled={pending !== null}
          onClick={() => decide(false)}
        >
          Deny
        </Action>
      </div>
    </main>
  );
}

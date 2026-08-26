/**
 * The connect/verify flows, shared by every surface that can start one.
 *
 * EXTRACTED 2026-08-26 from AccountConnectionsSection verbatim, because the
 * ask-in-place control (`AskInPlace.tsx`) needs exactly these mechanics and a
 * second hand-written copy of them is how two connect flows drift. One
 * implementation, now three consumers: the sources list, the ConnectorDetail
 * drill-down, and the inline ask.
 *
 * GitHub is a full-page App-install redirect; native OAuth providers open
 * their own consent screen in a new tab and the parent tab polls until the
 * callback route writes the row (the person never leaves where they were,
 * which is precisely what an in-place ask needs); Canny rides the Lovable
 * gateway popup; the Google/Microsoft suite connects through
 * user_calendar_connections with the same UX.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import type { ProviderId, ProviderSpec } from "@/lib/connectors/registry";
import {
  saveGatewayConnection,
  startGatewayConnect,
  startGithubAppConnect,
  startNativeOAuthConnect,
  verifyConnection,
} from "@/lib/connections.functions";
import {
  startSuiteConnect,
  type SuiteProduct,
  type SuiteProvider,
} from "@/lib/calendar-connections.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import { useConnectPoll } from "@/hooks/use-connect-poll";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

/** Registry providers backed by the multi-account suite-connections layer
 *  (stored in user_calendar_connections, native OAuth - not the single-
 *  connection-per-provider connections table). SW-7: extended beyond
 *  calendar to also cover Gmail/Outlook Mail, same table, a "product" column.
 *  Exported so the ask-in-place control routes these providers the same way
 *  the sources list does instead of guessing by auth method. */
export const SUITE_PROVIDERS: Partial<
  Record<ProviderId, { provider: SuiteProvider; product: SuiteProduct }>
> = {
  google_calendar: { provider: "google", product: "calendar" },
  gmail: { provider: "google", product: "mail" },
  google_tasks: { provider: "google", product: "tasks" },
  microsoft_outlook: { provider: "microsoft", product: "calendar" },
  microsoft_mail: { provider: "microsoft", product: "mail" },
};

export function useConnectorActions(qc: QueryClient) {
  const fStartGithub = useServerFn(startGithubAppConnect);
  const fStartGateway = useServerFn(startGatewayConnect);
  const fSaveGateway = useServerFn(saveGatewayConnection);
  const fStartNative = useServerFn(startNativeOAuthConnect);
  const fVerify = useServerFn(verifyConnection);
  const fStartSuite = useServerFn(startSuiteConnect);

  const startConnectionsPoll = useConnectPoll(["connections"]);
  const startCalendarPoll = useConnectPoll(["calendar-connections"]);

  const mGithub = useMutation({
    mutationFn: () => fStartGithub(),
    onSuccess: ({ installUrl }) => {
      // Open GitHub in a new tab so the user keeps their place in the app.
      // The callback writes to the DB; the parent tab detects it via polling.
      window.open(installUrl, "_blank", "noopener");
      startConnectionsPoll();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  // Native OAuth (SW-7): Supaprod's own registered app. Same mechanics as
  // mGithub: a new tab (not a same-tab redirect), so the callback's
  // close-tab page actually closes something and the Settings tab keeps
  // polling for the new connection instead of being navigated away.
  const mNative = useMutation({
    mutationFn: (spec: ProviderSpec) => fStartNative({ data: { provider: spec.id } }),
    onSuccess: ({ authorizeUrl }) => {
      window.open(authorizeUrl, "_blank", "noopener");
      startConnectionsPoll();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  // Gateway OAuth popup - same client mechanics as the calendar connect flow:
  // open the popup first (so it isn't blocked), start the web_message OAuth
  // session server-side, then wait for the gateway's postMessage. On success
  // we persist only the gateway connection id - never a token.
  const mGateway = useMutation({
    mutationFn: async (spec: ProviderSpec) => {
      const method = spec.authMethods.find((m) => m.kind === "oauth_gateway");
      if (!method || method.kind !== "oauth_gateway") {
        throw new Error(`${spec.label} does not support OAuth connect yet.`);
      }
      const result = await connectAppUser({
        connectorId: method.connectorId,
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: (targetOrigin) => fStartGateway({ data: { provider: spec.id, targetOrigin } }),
      });
      if (!result.success || !result.connectionId) {
        throw new Error(result.error ?? "Connect failed");
      }
      return fSaveGateway({ data: { provider: spec.id, connectionId: result.connectionId } });
    },
    onSuccess: () => {
      toast.success("Connected");
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  // Suite connect (SW-7): native OAuth, same new-tab+poll mechanics as
  // mNative/mGithub - Google/Microsoft's own consent screen, not a gateway
  // popup. Multi-account (a user can connect several accounts of the same
  // product), so success just invalidates the list; there is no separate
  // "save" step, the callback route writes the connection directly.
  const mSuite = useMutation({
    mutationFn: (args: { provider: SuiteProvider; product: SuiteProduct }) =>
      fStartSuite({ data: args }),
    onSuccess: ({ authorizeUrl }) => {
      window.open(authorizeUrl, "_blank", "noopener");
      startCalendarPoll();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mVerify = useMutation({
    mutationFn: (id: string) => fVerify({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) toast.success("Connection verified");
      else toast.error(r.connection.status_detail ?? "Verification failed");
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy =
    mGithub.isPending ||
    mGateway.isPending ||
    mNative.isPending ||
    mSuite.isPending ||
    mVerify.isPending;

  return { mGithub, mGateway, mNative, mSuite, mVerify, busy };
}

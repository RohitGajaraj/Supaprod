// F-CONN Phase 1 — provider adapter dispatch map (server-only).
//
// TWELVE ARE REAL AND EIGHT ARE STILL STUBS, and the stub is not harmless: its
// validate returns `{ok: false, detail: "adapter not implemented"}`, and
// `verifyConnection` is what the "Test it" control calls, so every stubbed
// provider tells a person their good connection has failed. That is worse than no
// button, because it reports a defect that does not exist.
//
// The eight that remain are the calendar and mail family, figma and jira. Each
// needs its own transport built first, which is what made linear, notion and
// google_docs cheap to finish: routing their feature code through the credential
// chokepoint had already established exactly how each takes a token.

import type { ProviderId } from "../registry";
import { githubAdapter } from "./github.server";
import { intercomAdapter } from "./intercom.server";
// SF-CONNECTORS (Signal Fabric Phase 2) — the inside-out customer-voice fleet.
import { stripeAdapter } from "./stripe.server";
import { slackAdapter } from "./slack.server";
import { zendeskAdapter } from "./zendesk.server";
import { hubspotAdapter } from "./hubspot.server";
import { salesforceAdapter } from "./salesforce.server";
import { cannyAdapter } from "./canny.server";
import { productboardAdapter } from "./productboard.server";
import {
  linearAdapter,
  notionAdapter,
  googleDocsAdapter,
} from "./gateway-era-adapters.server";
import type { ConnectorAdapter } from "./types.server";

const stubAdapter: ConnectorAdapter = {
  validate: async () => ({ ok: false, detail: "adapter not implemented" }),
};

export const CONNECTOR_ADAPTERS: Record<ProviderId, ConnectorAdapter> = {
  github: githubAdapter,
  intercom: intercomAdapter,
  stripe: stripeAdapter,
  slack: slackAdapter,
  zendesk: zendeskAdapter,
  hubspot: hubspotAdapter,
  salesforce: salesforceAdapter,
  canny: cannyAdapter,
  productboard: productboardAdapter,
  // Real since 2026-08-15. All three were stubs, so "Test it" answered
  // "adapter not implemented" on a perfectly good OAuth connection: a reported
  // defect that did not exist, shown at the moment somebody is deciding whether
  // to trust the product with their data.
  linear: linearAdapter,
  notion: notionAdapter,
  google_docs: googleDocsAdapter,
  google_calendar: stubAdapter,
  google_tasks: stubAdapter,
  microsoft_outlook: stubAdapter,
  gmail: stubAdapter,
  microsoft_mail: stubAdapter,
  figma: stubAdapter,
  jira: stubAdapter,
  firecrawl: stubAdapter,
};

export function getProviderAdapter(provider: ProviderId): ConnectorAdapter {
  return CONNECTOR_ADAPTERS[provider];
}

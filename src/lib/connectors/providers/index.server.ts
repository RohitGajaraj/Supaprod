// F-CONN Phase 1 — provider adapter dispatch map (server-only).
//
// SEVENTEEN ARE REAL AND THREE ARE STILL STUBS — measured at `27338f062`,
// 2026-08-26. The stub is not harmless: its validate returns
// `{ok: false, detail: "adapter not implemented"}`, and `verifyConnection` is
// what the "Test it" control calls, so every stubbed provider tells a person
// their good connection has failed. That is worse than no button, because it
// reports a defect that does not exist.
//
// The three that remain are `google_calendar`, `google_tasks` and `firecrawl`.
// Each needs its own transport built first, which is what made linear, notion and
// google_docs cheap to finish: routing their feature code through the credential
// chokepoint had already established exactly how each takes a token.
//
// THE SHA ON THAT NUMBER IS NOT DECORATION, and S4 filed the reason (F-80,
// `docs/lanes/verify/S4-003-connector-counts.md`). This header read "TWELVE ARE
// REAL AND EIGHT ARE STILL STUBS" and named figma and jira among the stubs, while
// its own inline comments twelve lines below said both were real. It was true
// when written and nobody re-ran it — the same failure as F-76 and F-80, three
// times in one file. **A count in prose carries the sha it was measured at, or it
// is a claim rather than evidence.**
//
// AND A SHA WAS NOT ENOUGH, which is why this sentence is now checked rather
// than dated (2026-08-27). A sha makes a stale number honest about being stale;
// it does not stop the next reader taking it as current, and S4 filed that same
// staleness a second time. `the-connector-count-cannot-go-stale.test.ts` derives
// both numbers from the map below and fails if this paragraph disagrees with
// them, so finishing a stub now tells you which sentence to edit instead of
// leaving a true-looking claim behind. Mutation-tested in both directions.

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
import { figmaAdapter } from "./figma.server";
import { jiraAdapter } from "./jira.server";
import { gmailAdapter, microsoftMailAdapter, microsoftOutlookAdapter } from "./mail-family.server";
import { linearAdapter, notionAdapter, googleDocsAdapter } from "./gateway-era-adapters.server";
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
  // Real since 2026-08-26 (F-81), the "separate pass" gateway-era-adapters named.
  // Gmail was the sharpest of the three: `pull-ingestors.server.ts:48` has been
  // running `ingestGmailSignals` against a live grant this whole time, so the
  // connection worked and only the control that reports on it was lying. Email is
  // also how a verdict reaches somebody who closed the tab (gap #2).
  microsoft_outlook: microsoftOutlookAdapter,
  gmail: gmailAdapter,
  microsoft_mail: microsoftMailAdapter,
  // Real since 2026-08-15. Both write a `connections` row, so both are reachable
  // from the Verify control, and both were telling a good connection it had failed.
  figma: figmaAdapter,
  jira: jiraAdapter,
  firecrawl: stubAdapter,
};

export function getProviderAdapter(provider: ProviderId): ConnectorAdapter {
  return CONNECTOR_ADAPTERS[provider];
}

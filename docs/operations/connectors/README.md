# Connector setup runbooks

> _Created: 2026-07-17 · Last updated: 2026-08-03_

Step-by-step, field-by-field operator runbooks for connectors whose native OAuth (or GitHub App) registration is **already done and verified working in production**. Each one exists so the exact registration can be repeated later - rotating a secret, or moving the connection to a different account/org - without re-deriving it from scratch or from memory.

This folder is the detail layer. [`../connector-setup.md`](../connector-setup.md) stays the master index: the full provider table (including the providers not yet registered), the shared "Known caveats" section, and what the code actually does with these connections. Start there for an at-a-glance status; come here for the actual click path.

Only connectors with a real, verified registration get a page here. A provider still marked "Built, needs registration" in `connector-setup.md` stays there until it's actually registered - see that file when you're ready to do a new one.

| Connector | Shares one app registration with | Status |
| --- | --- | --- |
| [GitHub](./github.md) | - | Verified working - GitHub App, predates SW-7 |
| [Slack](./slack.md) | - | Verified working - registered + tested 2026-07-09 |
| [Google Suite](./google-suite.md) | Docs + Calendar + Gmail + Tasks (one Google Cloud OAuth client) | Verified working - registered + tested 2026-07-10 (Testing publish status - see its own caveats) |
| [Microsoft Suite](./microsoft-suite.md) | Outlook Calendar + Outlook Mail (one Entra app registration) | App registered, **not yet confirmed live** - 0 rows in the live DB as of 2026-07-17, likely the domain-cutover redirect mismatch |
| [Salesforce](./salesforce.md) | - | Verified working - registered + tested 2026-07-10, confirmed via a live `connections` table query 2026-07-17 |
| [Intercom](./intercom.md) | - | App registered, **not yet confirmed live** - 0 rows in the live DB as of 2026-07-17, likely the domain-cutover redirect mismatch |
| [Linear](./linear.md) | - | Verified working - registered + tested 2026-07-17, confirmed via a live `connections` table query (connects cleanly, but no adapter exists yet - see its own caveats) |

Every page in this folder follows the same shape: what it connects, prerequisites, register the app (exact fields/values), copy the credentials into Lovable, verify it works, switching to a different account or org later, known caveats, code references, related links. Read the "Switching to a different account or org later" section on the relevant page before assuming a re-registration is needed - for most of these, it isn't; reconnecting through Supaprod's own Connect button with a different login is enough, since the registered app is independent of which end-user later authorizes it.

## Related

- [`../connector-setup.md`](../connector-setup.md) - the master provider table, shared caveats, and what's still pending registration.
- [`../../../src/lib/connectors/registry.ts`](../../../src/lib/connectors/registry.ts) - the ground-truth registry every page here is derived from.

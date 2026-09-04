# Calendar OAuth Credentials — RETIRED (2026-07-17)

> _Created: 2026-08-04 · Last updated: 2026-08-04_

> **This file is retired history, not a live runbook.** It documented the old Lovable connector-gateway path (`GOOGLE_APP_USER_CONNECTOR_CLIENT_ID`, `MICROSOFT_APP_USER_CONNECTOR_CLIENT_ID`, redirect URI `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`). That path was replaced wholesale by native OAuth on 2026-07-09 (Supaprod registers its own OAuth app directly with each provider - see [`connector-setup.md`](../connector-setup.md)'s header note for why the gateway path turned out to be a dead end). Following the steps below today would register credentials the running app no longer reads and point them at a redirect URL Supaprod's callback routes don't use - **do not follow this file**.

**Use these instead:**

- [`connectors/google-suite.md`](../connectors/google-suite.md) - Google Calendar (plus Docs/Gmail/Tasks, one shared app)
- [`connectors/microsoft-suite.md`](../connectors/microsoft-suite.md) - Microsoft Outlook Calendar + Mail (one shared Entra app)
- [`connector-setup.md`](../connector-setup.md) - the master table for every connector, registered or not

## Related

- [`connector-setup.md`](../connector-setup.md)
- [`connectors/README.md`](./connectors/README.md)

# src/lib - suite-resolve.server.ts

> 32 nodes · cohesion 0.09

## Key Concepts

- **suite-resolve.server.ts** (19 connections) — `src/lib/connectors/providers/suite-resolve.server.ts`
- **calendar-connections.functions.ts** (18 connections) — `src/lib/calendar-connections.functions.ts`
- **gmail-ingest.server.ts** (15 connections) — `src/lib/connectors/providers/gmail-ingest.server.ts`
- **oauth-refresh.server.ts** (11 connections) — `src/lib/connectors/oauth-refresh.server.ts`
- **resolveSuiteAuth()** (11 connections) — `src/lib/connectors/providers/suite-resolve.server.ts`
- **materializeAuth()** (10 connections) — `src/lib/connectors/resolve.server.ts`
- **providerSupportsRefresh()** (6 connections) — `src/lib/connectors/oauth-refresh.server.ts`
- **refreshNativeOAuthToken()** (6 connections) — `src/lib/connectors/oauth-refresh.server.ts`
- **ingestGmailSignals()** (6 connections) — `src/lib/connectors/providers/gmail-ingest.server.ts`
- **listMySuiteConnections** (3 connections) — `src/lib/calendar-connections.functions.ts`
- **startSuiteConnect** (3 connections) — `src/lib/calendar-connections.functions.ts`
- **SuiteProduct** (3 connections) — `src/lib/calendar-connections.functions.ts`
- **SuiteProvider** (3 connections) — `src/lib/calendar-connections.functions.ts`
- **findNativeMethod()** (3 connections) — `src/lib/connectors/oauth-refresh.server.ts`
- **gmailMessageToCandidate()** (3 connections) — `src/lib/connectors/providers/gmail-ingest.server.ts`
- **AuthMethod** (3 connections) — `src/lib/connectors/registry.ts`
- **disconnectSuiteConnection** (2 connections) — `src/lib/calendar-connections.functions.ts`
- **materializeAdapterAuth()** (2 connections) — `src/lib/connections.functions.ts`
- **fetchMessages()** (2 connections) — `src/lib/connectors/providers/gmail-ingest.server.ts`
- **headerValue()** (2 connections) — `src/lib/connectors/providers/gmail-ingest.server.ts`
- **admin()** (2 connections) — `src/lib/connectors/providers/suite-resolve.server.ts`
- **providerIdFor()** (2 connections) — `src/lib/connectors/providers/suite-resolve.server.ts`
- **findOAuthMethod()** (1 connections) — `src/lib/calendar-connections.functions.ts`
- **getPrimaryConnection** (1 connections) — `src/lib/calendar-connections.functions.ts`
- **providerIdFor()** (1 connections) — `src/lib/calendar-connections.functions.ts`
- *... and 7 more nodes in this community*

## Relationships

- [Connectors & Secret Vault](Connectors_%26_Secret_Vault.md) (19 shared connections)
- [Signal Ingestion & Provider Auth](Signal_Ingestion_%26_Provider_Auth.md) (16 shared connections)
- [Connections & Bindings UI](Connections_%26_Bindings_UI.md) (9 shared connections)
- [src/components - ObsidianOnboarding.tsx](src-components_-_ObsidianOnboarding.tsx.md) (3 shared connections)
- [Auth Middleware & Server Functions](Auth_Middleware_%26_Server_Functions.md) (2 shared connections)
- [Supabase Client & Observability](Supabase_Client_%26_Observability.md) (2 shared connections)

## Source Files

- `src/lib/calendar-connections.functions.ts`
- `src/lib/connections.functions.ts`
- `src/lib/connectors/oauth-refresh.server.ts`
- `src/lib/connectors/providers/gmail-ingest.server.ts`
- `src/lib/connectors/providers/suite-resolve.server.ts`
- `src/lib/connectors/registry.ts`
- `src/lib/connectors/resolve.server.ts`

## Audit Trail

- EXTRACTED: 144 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*
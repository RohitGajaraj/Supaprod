# Architecture contracts

> _Created: 2026-08-04 · Last updated: 2026-08-22_

**Thirteen contracts describing what is true about how this system is built.** A contract states the invariant and where it is enforced. It does not argue for the choice; that is [`../docs/decisions/`](../docs/decisions/README.md).

These live at repo root rather than under `docs/` because they are read alongside code, not alongside planning.

**If you are about to write code, the rules you must satisfy are in [`../AGENTS.md`](../docs/archive/agent-operating-manual.md) §3.** These files are the detail behind those rules.

---

## The five that bind most changes

| Contract | The invariant it holds |
| --- | --- |
| **[`runtime.md`](./runtime.md)** | **Every AI call goes through one chokepoint**, `src/lib/ai/runtime.server.ts`. No second path. A new AI surface needs a valid `CallSurface` literal from the exported union. Budget, credits, cache, guardrails, RAG and the humanizer all sit on this one seam. |
| **[`security.md`](./security.md)** | **RLS on every user table, scoped by membership.** No client-trusted role checks. Every write stamps `workspace_id`, and a missing one typechecks clean then fails at runtime. The service-role client never reaches client code. |
| **[`data.md`](./data.md)** | One Postgres store: RLS, pgvector, pg_cron. Migrations are timestamped and never edited once applied. |
| **[`orchestration.md`](./orchestration.md)** | **Every multi-step autonomous workflow goes through the orchestration layer.** No ad-hoc agent loops. New agentic tools register in `src/lib/ai/tools/registry.server.ts`. |
| **[`frontend.md`](./frontend.md)** | A feature is two files in lockstep: server logic in `src/lib/<domain>.functions.ts`, consumed in `src/routes/_authenticated.<domain>.tsx` via TanStack Query. Loader and Suspense, not `useEffect` and fetch. Boundaries on every route. |

## The rest

| Contract | What it covers |
| --- | --- |
| [`api.md`](./api.md) | The API and interface reference: server functions, the public hook endpoints, the A2A card. **Its §4 predates the machine surface being built and still calls it planned** — for anything machine-facing read [`agent-to-agent.md`](./agent-to-agent.md) first. |
| [`agent-to-agent.md`](./agent-to-agent.md) | **The three machine doors an external agent reaches us through**, and which one is the product. What a caller can read, write, and cannot do at all, mapped onto Question → Bet → Run → Verdict. A Run is not driveable headlessly: no tool starts, watches, steers or stops one. The approval policy engine does not run on this path; scope plus the global `interop_write_enabled()` gate plus status floors do. |
| [`station-journeys.md`](./station-journeys.md) | **The same journey walked twice at every station: once as the person, once as an external agent.** What each can read, write and must clear, with the real route and the real tool named. Five of the nine stations have no external-agent path at all, and the per-station asymmetry is the point of the file. Sits on top of [`agent-to-agent.md`](./agent-to-agent.md) and does not repeat it. |
| [`integrations.md`](./integrations.md) | The connector platform: the typed provider registry, adapters, and the `resolveProviderAuth` credential chain (workspace binding, then user connection, then env fallback). BYO keys are enterprise-only, encrypted AES-256-GCM in a service-role-only vault. |
| [`deployment.md`](./deployment.md) | Vite to a Cloudflare Worker, and how a deploy actually reaches production. **Note the operational fact that catches people: pushing does not deploy.** The founder clicks publish in Lovable. |
| [`observability.md`](./observability.md) | What we can see and what we cannot. Read with [`../docs/planning/initiatives/analytics-and-failure-detection-plan.md`](../docs/planning/initiatives/analytics-and-failure-detection-plan.md) before adding any vendor SDK; the façade rule keeps leaving Lovable a one-day redeploy. |
| [`threat-model.md`](./threat-model.md) | The STRIDE threat model. Live findings and remediation state are in [`../docs/operations/security/`](../docs/operations/security/README.md). |
| [`diagrams.md`](./diagrams.md) | The visual companion to the contracts above. |

---

## The one thing a contract cannot tell you

**Whether the code actually does this in production.** On 2026-08-02, nine separately shipped features were found doing nothing live, all of them passing typecheck and tests, and not one was found by reading code. They were found by querying the database.

So: read the contract to know what the invariant is, then verify against production before you believe a feature works. Verify a table with `to_regclass`, never by trusting a migration list, and never assume applied means correct. The station-by-station account of what the loop genuinely does, with a `file:line` for every structural claim, is [`../docs/features/lifecycle-signal-to-learning.md`](../docs/features/lifecycle-signal-to-learning.md).

# Signal Fabric & Sense Engine

> _Created: 2026-06-30 · Last updated: 2026-07-07_

> _Created 2026-06-30. Status: Phase 0 shipped (the `writeSignals` keystone). Phases 1-3 planned; the detailed phased plan is under refinement in Ultraplan and teleports back here when approved._

The outside-in, always-on signal engine, the product's core USP. Cadence should continuously watch the market, competitors, tech shifts, and customer voice (not wait for a PM to search), then surface the one thing to focus on and build next. This doc is the canonical home for that subsystem.

## Why this exists

A three-agent reality audit (2026-06-29) found the signal **pipeline** is mature (`signals → themes → opportunities (ICE) → PRD`, clustering, lineage, RLS) and the ambient scaffolding exists (event reactor, `sense-tick`, `cluster-tick`, `trigger-tick`), but the **intake** is starved and the **outside-in** half is shallow:

- In prod `connections = 0`; only GitHub (cron-polled) + PostHog spikes + a demo seed feed the loop.
- The Scout (`researcher-tick.ts`, shipped as `SEN-04`) **re-summarizes** competitor search results but does **not diff**, so it cannot say "what changed."
- No live customer-voice connectors (support, chat, CRM, churn, feedback portals).
- Nothing ranks signals by novelty-vs-memory into a proactive "build this next."
- Cadence only _exposes_ MCP; it has no MCP **client** to consume external MCP servers as inbound data.

## SW-5: GitHub connector to the credential boundary (2026-07-07, mission 3.1)

SW-5 "platform truth" finishes ONE real connector end-to-end so a real GitHub event lands as an auto-tagged, auto-clustered signal with a visible trail — everything up to the founder-pasted credential.

- **Ingest coverage** (`src/lib/connectors/providers/github-ingest.server.ts`): issues now pull `state=all` (a NEW open issue lands — the DONE-WHEN trigger; it was `state=closed`, so a new issue never appeared), plus **releases**, **star milestones** (one signal per crossed rung via the pure `starMilestone` ladder in `github-signals.ts`, deduped by milestone in `external_id`), and **repo traffic** (views/clones; fails soft on the 403 a read-only install returns). Issue labels + state ride through as tags. All use the already-resolved installation token from `resolveGitHub` (`github.server.ts`), so the founder pastes `GITHUB_APP_ID/PRIVATE_KEY/…` and the feed lives.
- **The signal trail** (`src/lib/sources/sink.server.ts`): every sensed signal now writes a `stage_events` row (`entity_type='signal'`, `to_stage='sensed'`) — migration `20260708120000_stage_events_signal_entity.sql` widened the CHECK to allow `'signal'`, and `StageEntityType` gained it. Because the sink is the single write path, EVERY source (GitHub, Scout, MCP, webhook, manual) inherits the trail. This satisfies the DONE-WHEN "visible trail = SIG trace ref + stage_events row" and is the first link of the Trust Ledger chain (SW-5 deliverable B). `recordStageEvent` is fail-safe, so a trail miss never breaks the signal write.
- **Auto-tag + auto-cluster** are unchanged and already zero-human: `prepare.ts` derives/uses tags at insert; `cluster-tick` groups theme-null signals into `themes` and records a THEME `stage_event` (both cron-gated).
- **Follow-up (founder-secret-gated):** a real-time `x-hub-signature-256` webhook endpoint (vs the ~5-min poll) is the next-fidelity step; it needs the founder's `GITHUB_WEBHOOK_SECRET`. The pull path already satisfies the DONE-WHEN, so the webhook is an enhancement, not a blocker.

## Architecture: one fabric, three lanes, one intelligence head

Every source kind funnels through a single `writeSignals` sink into the existing pipeline, topped by an intelligence head that ranks themes and surfaces one "Focus on this next" card on Today.

```
  LANE OUT (outside-in)        LANE IN (inside-out)            DIRECT
  Scout: competitor surfaces,  Pull connectors: support        webhook / manual
  market/news, social, hiring, (Intercom), churn (Stripe),     (already live)
  tech-shift, regulatory       chat (Slack), CRM win/loss,
                               feedback portals, NPS
        \                            |                            /
         \  (Phase 3) mcp_source: one adapter, N hosted MCP servers (Gong/Granola/Linear…)
          \__________________________|___________________________/
                                      v
       writeSignals()  ── screen(untrusted) → dedup(external_id) → normalize → stamp source_kind → INSERT
                                      v
       public.signals → signals_reactor_fanout → signal.created
                                      v
       always-on clustering → themes (+ embedding + novelty-vs-memory + score)
                                      v
       Brain derive→act → ranked insights → ONE "Focus on this next" on Today
                                      v
       Start it (HITL by default) ── or auto-trigger only at `ambient` arc (founder flag)
```

## Source taxonomy

`SourceKind = pull_connector | web_scout | mcp_source | webhook | manual` (the `signals.source_kind` discriminator).

- **Outside-in (web_scout):** competitor surfaces (changelogs/pricing/docs, diffed), market/news, social/reviews, hiring, **tech/platform shift** (model/API releases, deprecations, EOLs), **regulatory/compliance shift**.
- **Inside-out (pull_connector / mcp_source):** support (Intercom), churn/cancellation (Stripe), team chat (Slack), CRM win/loss (Salesforce/HubSpot lost-deal reasons), feature-request portals (Canny/Productboard), NPS/CSAT, meetings/calls (Gong/Granola/Fireflies, via `mcp_source`), stakeholder/board (structured manual).

## The keystone (Phase 0, shipped)

`src/lib/sources/` is the one write path:

- `kinds.ts` — `SourceKind`, `SignalCandidate`, `SinkResult` (the source-agnostic contract).
- `prepare.ts` — the pure core: screen untrusted (quarantine structural injection, flag borderline), dedup by `external_id` (stored + within-batch), normalize tags/sentiment, stamp `source_kind`. Unit-tested (`prepare.test.ts`, 12 tests).
- `sink.server.ts` — `writeSignals(userId, workspaceId, candidates, opts?)`: fetch seen `external_id`s → prepare → insert.
- `ingestor.ts` — the `SourceIngestor.collect()` contract every source implements.

Migration `20260630120000_sources_source_kind.sql` adds `signals.source_kind` (nullable + CHECK, backfilled from the legacy `source` token). `github-ingest.server.ts` is refactored through `writeSignals` (behavior-preserving) to prove the seam. Every future source inherits dedup + the P0 injection screen + the discriminator by construction.

## Phases

- **Phase 0 (shipped):** the `writeSignals` keystone + `source_kind` + GitHub refactor.
- **Phase 1 (✅ shipped 2026-06-30):** the demoable vertical — the diffing **Scout** (Slice 0; the LLM brief is Slice 1) on a watch-list, **Intercom** live end-to-end, and one scored "Focus on this next" insight on Today (theme scoring + novelty-vs-memory, chokepoint-free via the `copilot` surface). All four (SF-0 / SF-INTERCOM / SF-SCOUT / SF-FOCUS) are on `main`, gated.
- **Phase 2 (partial — connector fleet ✅ shipped 2026-06-30):** the customer-voice connector fleet is **SF-CONNECTORS ✅** — 8 pull connectors (Stripe churn, Slack chat, Zendesk support, HubSpot + Salesforce win/loss, Canny + Productboard portals, Delighted NPS/CSAT), each = adapter (`<name>.server.ts`) + pure ingest (`<name>-ingest.server.ts`: `<x>ToCandidate` + `ingest<X>Signals` → `resolveProviderAuth({requiredCapability:"inflow"})` → `writeSignals`) + unit test, all funneling through the Phase-0 sink (`source_kind:"pull_connector"`, injection-screened, `external_id`-deduped). Shared `bearer.server.ts` + a `PULL_INGESTORS` registry that `sense-tick` now iterates (a new connector = one registry line). 4 new catalog categories (crm/revenue/feedback/chat). Each ships on an env secret, upgrades to per-user OAuth with no code change; **founder-gated on per-connector API tokens + Pro+ tier**. Analytics (Amplitude/Mixpanel/Segment) is **Lovable-owned (SEN-05)** — deliberately not built here. **Remaining Phase 2 (chokepoint-pinned, batched for the core lane):** widen Scout to all 6 kinds (deepening the shipped-but-shallow `SEN-04`); the full 2-4 insight set + the 5 agent tools (`signals.list` / `themes.list` / `sources.status` / `cluster.trigger` / `sources.connect` — touch the pinned `registry.server.ts`) + the 3 Sense agents wired live (`CallSurface += "sense"`).
- **Phase 3:** **SF-AUTOTRIGGER ✅ (shipped 2026-07-01)** — the trust-graduated auto-trigger: trigger-tick promotes reversible `proposed` missions to `queued` when `BRAIN_AUTO_TRIGGER=1` + ambient arc + daily cap 2/day. `loop.server.ts` untouched (chokepoint-free). Full spec: [`sf-autotrigger.md`](./sf-autotrigger.md). Activation: set `BRAIN_AUTO_TRIGGER=1` in Lovable project settings. · **SF-MCP ✅ (shipped 2026-07-01, ships dark)** — the `mcp_source` adapter: one generic JSON-RPC-over-HTTP MCP client absorbing Gong/Granola/Linear/Enterpret via 100% env-config (HTTP/SSE only, Workers can't spawn stdio), SSRF-guarded, Pro+ tier-gated, 6 calls/workspace/server/24h rate-limited. Architecture-complete and gate-verified; live code but every `MCP_*` env var is unset, so it is inert until the founder activates a slot. Full spec: [`sf-mcp.md`](./sf-mcp.md). Activation: founder sets per-server `MCP_<SERVER>_URL`/`TOKEN`/`TOOL`/`ARGS` env vars in Lovable project settings.

## Phase 4: JNY-01, the strategy head (shipped 2026-07-02, lane3)

Upgrades scout-tick from raw diffs in the feed to a structured, weekly-summarized registry, per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.4. No new tables: reads what scout-tick already writes, writes back through the same `writeSignals` keystone.

- **`competitor-tick.ts`** (`src/routes/api/public/hooks/competitor-tick.ts`, weekly cron, Monday 08:00 UTC, migration `20260702173000_jny01_competitor_tick.sql`): per `auto_scout_enabled` workspace, reads the last 7 days of `scout_competitor` and `scout_platform` signals (the `competitor-surface` / `tech-platform-shift` WatchKinds), and when either has at least one raw signal, synthesizes ONE brief per kind via `callModel` (3-5 bullets, near-duplicate diffs from the same competitor grouped). No new web fetch or search: this makes zero Firecrawl calls, it only re-reads signals scout-tick already paid to collect. Writes the brief through `writeSignals` with a deterministic externalId keyed by ISO week (`strategy-head:<workspaceId>:<kind>:<week>`), so a same-week re-run is a no-op at the sink. On a genuine insert, links every contributing raw signal into `artifact_lineage` (`recordLineage`, `relation:"derived-from"`, `signal -> signal`, no new `ArtifactKind` needed) so a future FS-02-style watcher can walk from a decision to the competitor moves that touch it.
- **`strategy-registry.functions.ts`** (`src/lib/strategy-registry.functions.ts`): `listTrackedEntities` (the `scout_targets` watch list, `competitor-surface` / `tech-platform-shift` kinds only, RLS member-read) and `listStrategyBriefs` (the last 20 weekly briefs, `signals` filtered to the two new source tokens). Both plain reads, no new tables.
- **`StrategyPanel.tsx`** (`src/components/product/StrategyPanel.tsx`), a new **Strategy** tab on `/product` (6th tab, additive only, the existing 5 stay byte-identical to their design-reference port): the weekly briefs feed on the left, the tracked-entity list on the right. First-ever UI surface for `scout_targets` — Signal Fabric shipped this dark since Phase 1.
- **Deliberately not built (documented gap, not a scope cut hidden in the code):** a manual "add to watchlist" form. The registry still seeds itself only through `autoSeedTargets` (workspace focus + top opportunities); the founder's own watchlist input from the spec's Why is a real follow-up, not faked as a no-op button.

Gate: `tsc --noEmit` 0, `bun test` 2040 pass, lint clean, migration linter 0 apply-fatal errors. No FIRECRAWL gate (reads only).

## Reconciliations with the live board (must respect)

- **`SEN-04` / `SEN-05` are already ✅.** The Scout is an _enhancement_ of the shallow v0 (`researcher-tick` re-summarizes; the new engine diffs), not an un-cut.
- **Analytics inbound is Lovable-owned.** `SEN-05` / `F-ANALYTICS-*` (PostHog) carry a "no autonomous lane may touch these" guard. The analytics connectors (Amplitude/Mixpanel/Segment) overlap Lovable's territory — **coordinate, do not build autonomously.** Customer-voice connectors (Intercom/Stripe/Slack) are clear.
- **Chokepoint pin.** Phase 1's `CallSurface += "brain"|"sense"|"scout"` (`runtime.server.ts`) and Phase 2's agent tools (`registry.server.ts`) live inside the pinned `CHOKEPOINT` claim — coordinate with the owning lane before editing.

## Founder-provided keys / gates

`FIRECRAWL_API_KEY` (Scout; likely already set), `INTERCOM_ACCESS_TOKEN` (Phase 1, env-secret path), `STRIPE_API_KEY` restricted (Phase 2 churn), `BRAIN_AUTO_TRIGGER` (Phase 3 autonomy, default OFF), OAuth gateway client registrations (multi-tenant; env-secret path ships first).

## See also

- The approved phased plan (with migrations + function signatures): the session plan file under `~/.claude/plans/` (Ultraplan refinement in flight).
- [`ambient-precedent.md`](./ambient-precedent.md), [`brain.md`](./brain.md), [`decision-brain.md`](./decision-brain.md), [`f-agent-3-event-reactor.md`](./f-agent-3-event-reactor.md) — the downstream reactor + intelligence the fabric feeds.
- [`../strategy/v11-guiding-star.md`](../strategy/v11-guiding-star.md) — the moat framing (pillar 2: sense continuously).

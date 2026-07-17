# AUDIT-ID — the verifiable audit id + one-click lineage

> _Created: 2026-07-13 · Last updated: 2026-07-13_

> **Status:** ✅ Built 2026-07-13 (founder ruling, same day) — P1 resolver + P2 lineage retrieval + P3 lineage sheet/tag/Ask; chip rollout across every entity surface; mission trust-chain enrichment. **No route of its own** (a global sheet + clickable tags on existing surfaces). **Owner surface:** every entity chip app-wide + the Ask panel. Verified: `bunx tsc --noEmit` 0 · `bun test` 4696 pass / 0 fail · live (OPP·005C82 click → lineage; MIS·BA3F97 → trust chain).

## What it does

Every core entity the platform records now carries a **verifiable audit id** — a short, human-quotable tag built from a stage prefix and the first six alphanumerics of its uuid (`OPP·005C82`, `MIS·7E7D59`, `DEC·8976C0`, …). The founder ruling (2026-07-13) is the north star: **"everything should have a traceable audit id generated out of this platform."** That id is not decoration; it is a live entry point:

- **Click any tag** anywhere in the app → a global **lineage sheet** opens and walks that entity's record: what it is, when it entered the record, its status, its connected entities up and down the loop, and its last change. Each connected entity is itself a clickable tag, so you can walk the chain further.
- **Type an id in Ask** (`what happened with OPP·005C82?`) → Ask detects the id deterministically and opens its lineage instantly, before any model call.
- **Missions go deeper:** a mission's lineage also renders its full **nine-link trust chain** (signal → … → outcome), reusing the Trust Ledger's chain engine, so the mission's real provenance is one click from anywhere its id appears.

It is the connective tissue over provenance the product already records ([Trust Ledger](./trust-ledger.md), [O1 provenance](./o1-provenance.md), the [Knowledge-Graph Explorer](./knowledge-graph-explorer.md)): those surfaces prove specific things in specific places; the audit id makes **every id, on every surface, a door to that proof.**

## Why it exists

A buyer pays for trust, and trust is verifiable provenance. Before this, an entity's trace ref (`OPP·005C82`) was a static, copyable label — it looked auditable but did nothing. The founder ruling made the id a first-class, platform-generated primitive: if the platform shows you an id, that id must resolve to its own verifiable trail. This closes the gap between _looking_ auditable and _being_ auditable, and it does so uniformly (one resolver, one sheet, one tag component) so a new entity kind becomes traceable in one line. See the build-log entry in [`../../plan.md`](../../plan.md) §4 (2026-07-13).

## Where to find it

- **The tag** renders wherever an entity id is shown: Discover signal cards + records, the Decide/Plan opportunity rows and detail sheet, Plan spec list + detail, Decisions panel + detail, Learnings (Compounding panel + detail), the Mission slide-over, the Today call-detail sheet, and the Brain knowledge-graph node story. Same quiet mono look as before — now clickable.
- **The lineage sheet** is global (mounted once in `AppShell`); it opens over whatever surface you are on.
- **Ask** (`⌘K` / the Ask button): name an id in a question.

## Demo script (≤ 90s)

1. On **Decide**, point at a bet's `OPP·…` tag: "every id here is live." Click it.
2. The **lineage sheet** opens: title, `Status: committed · Recorded …`, then the walk — entered the record → connected entities → status → last change. Click a connected tag to walk further.
3. Open a **mission** (Engine Room → Record → Paper trail, or a mission slide-over), click its `MIS·…`: the sheet shows the record walk **plus the full trust chain** — signal → decision → contract → design → build → test → merge → deploy → outcome, with any missing link shown honestly in madder.
4. Open **Ask**, type `trace MIS·BA3F97`: the lineage opens with no model call. "Deterministic, not generated."

## Architecture (three pure-to-impure layers)

**P1 — the resolver** (`src/lib/audit-id.ts`, pure, unit-tested in `audit-id.test.ts`): the vocabulary + the inverse of the display tag. It maps a stage prefix ⇄ entity kind ⇄ DB table, formats a canonical tag (`formatAuditId`), parses a user-typed token (`parseAuditId`, tolerant of `·`, `-`, `:`, `_`, `/`, spaces, any case), and finds ids embedded in free text (`findAuditIds`, for Ask). No server import, no DB. `auditShort` deliberately mirrors `traceRef` (`discover/format.ts`) so a tag and a lookup always agree.

The twelve traceable kinds (extend `AUDIT_KINDS` to add a thirteenth — resolver, lineage, tag, and Ask all pick it up):

| Prefix | Kind        | Table               | Loop stage |
| ------ | ----------- | ------------------- | ---------- |
| SIG    | signal      | `signals`           | Discover   |
| OPP    | opportunity | `opportunities`     | Decide     |
| DEC    | decision    | `decisions`         | Decide     |
| PRD    | spec        | `prds`              | Plan       |
| GOL    | goal        | `goals`             | Plan       |
| PRO    | prototype   | `prototypes`        | Design     |
| MIS    | mission     | `missions`          | Build      |
| REL    | release     | `changelog_entries` | Ship       |
| LRN    | learning    | `learnings`         | Learn      |
| MTG    | meeting     | `meetings`          | Today      |
| MEM    | memory      | `agent_memory`      | Brain      |
| DOC    | doc         | `docs`              | Brain      |

**P2 — lineage retrieval** (`src/lib/audit-lineage.functions.ts`, `getEntityLineage` server fn): resolves a tag to its real row and composes the walk. It is **generic over all kinds** — it never assumes a column exists: it `select *`s a bounded recent window (RLS-scoped), matches by the same short trace the tag shows, then normalizes title / status / created / updated / actor from candidate-column lists. It emits steps (entered the record → connected entities via best-effort FK columns → current status → last change) and returns the full `entityId` (uuid) so the client can fetch richer, kind-specific lineage. A raw-uuid actor is suppressed (a name or nothing, never an id).

**P3 — the UI + Ask:**

- `src/components/cadence/AuditLineageSheet.tsx` — a single global sheet, opened by the `cadence:open-lineage` event (`openLineage(ref)` helper). Renders the walk with each connected entity as a click-to-walk tag. **Mission enrichment:** when the resolved kind is `mission`, it additionally fetches [`getMissionChain`](./trust-ledger.md) and renders the `MissionChain` component under a "Trust chain" heading.
- `src/components/cadence/AuditTag.tsx` — the reusable clickable chip (design-system pattern: [`audit-trace-tag.md`](../../design-reference/tempo-v5/patterns/audit-trace-tag.md)). Rendered as a `<span role="button">` (not a `<button>`) so it nests safely inside clickable row `<button>`s without invalid DOM nesting. Optional `copyable` adds a secondary copy-the-full-id icon (used in entity detail views, replacing the old standalone copy button so one chip both traces and copies).
- `src/components/obsidian/AskPanel.tsx` — on submit, `findAuditIds` scans the question; if it names an id, `openLineage` fires the lineage sheet deterministically (no model round-trip).

## How it works (map)

- **Tag → row contract:** `auditShort(id)` = first six alphanumerics uppercased, identical to `traceRef`. `getEntityLineage` pulls `meta.table` and matches on `auditShort`. A future computed-column index can make this an exact server-side prefix match; the tag↔row contract is unchanged either way.
- **Chip rollout:** the plain `PREFIX·{traceRef(id)}` mono chips were swapped to `<AuditTag kind=… id=… />` on cards/lists, and detail-view copy buttons to `<AuditTag … copyable />`. Two dynamic surfaces map their local kind to an `AuditKind` and degrade gracefully: the **graph node story** (`GraphNodeStory.tsx`, `GRAPH_AUDIT_KIND` — signal/opportunity/prd→spec/meeting/decision/mission clickable; theme/roadmap_item/task/design_memory stay plain refs) and the **call-detail sheet** (`CallDetailSheet.tsx`, `CALL_AUDIT_KIND` — ship→mission/spec/opportunity clickable; assumption/playbook keep the copy chip).
- **Mission chain reuse:** the enrichment calls the existing, verified `getMissionChain` (`src/lib/trust-chain.functions.ts`) and renders the existing `MissionChain` (`src/components/trust/MissionChain.tsx`). No new chain logic; the audit id is simply a new, ubiquitous entry point to it.
- **Kinds without a standalone audit entity** (theme, playbook, assumption, roadmap_item, task, design_memory) intentionally stay non-clickable plain refs — the system never fabricates a trail for something it cannot resolve.

## Governance & guardrails

- **RLS is the boundary.** `getEntityLineage` reads through the authed `context.supabase` (publishable key + user JWT); a foreign or mistyped id simply returns not-found — audit ids are scoped to the caller's own workspaces and cannot leak another tenant's row. The mission chain reuses `getMissionChain`, which is pinned to the active workspace.
- **No fabricated actors.** A raw-uuid `who` is suppressed; the walk shows a name or nothing.
- **No fabricated chains.** Mission links are honest four-state (present / skipped / missing / pending); a real gap shows in madder, never hidden (inherited from the Trust Ledger chain engine).
- **No new writes, no schema change.** The whole system is read-only composition over existing tables.

## Verification checklist

- `bunx tsc --noEmit` → exit 0.
- `bun test` → 4696 pass / 0 fail (incl. `src/lib/audit-id.test.ts`, 9 resolver tests).
- Live: on `/decide`, click an `OPP·…` tag inside a bet row → lineage sheet opens (row does not navigate — the tag stops propagation).
- Live: open a mission's `MIS·…` → sheet shows the record walk **and** the nine-link Trust chain.
- Live: in Ask, type a valid id → lineage opens with no model call.
- A tag whose kind has no audit entity (e.g. a graph `theme` node) renders as a plain, non-clickable ref.

## Where to see it

Anywhere an entity id shows (Discover / Decide / Plan / Build / Learn / Today / Brain), and in Ask. The lineage sheet is global; no dedicated route.

## Related

- [Trust Ledger](./trust-ledger.md) — the receipts surface + the mission chain engine this reuses.
- [O1 provenance](./o1-provenance.md) — the "why is this here" ancestor walk; the audit id is a universal entry point to the same provenance.
- [Knowledge-Graph Explorer](./knowledge-graph-explorer.md) — the typed graph; graph node chips are now audit tags where a standalone entity exists.
- Design-system pattern: [`design-reference/tempo-v5/patterns/audit-trace-tag.md`](../../design-reference/tempo-v5/patterns/audit-trace-tag.md).

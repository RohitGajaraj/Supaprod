# Meridian inventory — what exists, and who actually renders it

> _Created: 2026-08-22 · Last updated: 2026-08-22_

**Take the inventory from the directory and the rules from the contract.**
[`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) is the contract and it is right about the laws. Its counts go
stale between passes: it says 88 tokens and 23 components, and on 2026-08-22 the directory held **111
`--mrd-*` tokens and 47 components**. [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md)
answers a different question, whether we match beautifui.dev, and accounts for 21 of the 47.

This file answers the question neither of them does: **what is built, and is anything rendering it.**

## Regenerate it, do not trust it

This is a snapshot. It was produced by reading the tree, and it is stale the moment a component lands:

```bash
for f in src/components/meridian/*.tsx; do
  n=$(basename "$f" .tsx); loc=$(wc -l < "$f" | tr -d ' ')
  imp=$(grep -rn "meridian/$n\"" src/routes/ src/components/ 2>/dev/null \
        | grep -v "^src/components/meridian/" | grep -c "import")
  gal=$(grep -c "meridian/$n\"" src/routes/_authenticated.meridian.tsx 2>/dev/null)
  printf "%-26s %5s  importers=%-3s gallery=%s\n" "$n" "$loc" "$imp" "$gal"
done
```

## The finding: 14 components are built and unreachable

A component whose **only** importer is `_authenticated.meridian.tsx` renders nowhere a user can go. The
gallery feeds it fabricated sample data, so it looks finished and is not reached.

| Gallery-only | Lines | | Gallery-only | Lines |
| --- | --- | --- | --- | --- |
| `InsightCards` | 1348 | | `RunMap` | 455 |
| `SelectionActions` | 760 | | `RunTimeline` | 437 |
| `PlanCard` | 652 | | `PromotionCard` | 420 |
| `FineTuneCard` | 580 | | `PlanGate` | 400 |
| `Flowchart` | 577 | | `ToolStream` | 394 |
| `AgentInbox` | 475 | | `Chat` | 373 |
| `DiffTable` | 353 | | `RecommendationCard` | 344 |

**Roughly 7,500 lines.** This is not neglect: founder ruling 2026-08-20 is *"primitives build before the
things that use them."* The primitives were built first on purpose. **The second half, the wiring, is the
outstanding work**, and it is integration rather than construction.

**But a mount is usually the wrong move.** Each one's target surface already does that job in retired
vocabulary, so the honest change is a port that preserves capability, never a swap that loses one. Ratchet
law 1 forbids *"hiding information, dropping a state"* as an answer. Worked example, 2026-08-22:
`RunTimeline` was **not** swapped in for `TraceHop` on `/runs/$missionId`, because `TraceHop` is
collapsible and carries handoffs and nested steps that `RunTimeline` has no room for. `TraceHop` was
ported to Meridian tokens instead, and the run route's colour layer is now Meridian with nothing lost.

**`ToolStream` is blocked on a transport, not a surface — and only on one path.** Its own header says wiring
it is *"a mount and not an adapter"*, which is true of the component and false of the product on the mission
path.

**Corrected 2026-08-22.** An earlier version of this file said the `tool` frame was emitted nowhere. It is
emitted: from the research phase map at `chat.ts:1306` since 2026-08-20, and from the chat branch's workspace
search since 2026-08-22. The grep behind the wrong claim looked for the literal `tool:` and the code writes
the shorthand `send({ tool })`.

What is still true is narrower, and it is what actually blocks this component: **a `tool` frame for MISSION
work can never arrive on that stream.** `api/chat.ts` enqueues `landing`, `meta` and `[DONE]` and closes the
controller before the mission runs, so by the time a tool name exists there is nothing to write to. The
transport that would carry it is the run route's existing poll, or a per-run SSE endpoint — a second
transport, not a missing line in this one.

The `station` frame is emitted on the `@`-mention path only. Widening it to the classifier's guess was
deliberately refused: `routed.station` is a forecast rather than a fact, nothing routes by it, and a
committed guard keeps it off the wire.

## Genuinely load-bearing

These carry the product. Compose from them first.

| Module | Importers | | Module | Importers |
| --- | --- | --- | --- | --- |
| `rows` | 91 | | `Receipt` | 17 |
| `surface-parts` | 79 | | `AgentPulse` | 14 |
| `forms` | 50 | | `ContextColumn` · `Gate` | 11 each |
| `marks` | 37 | | `Tabs` | 8 |
| `Surface` | 23 | | `NeedsSetup` | 7 |

## Related

- [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — the contract. Laws, not counts.
- [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md) — parity against beautifui.dev.
- [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) — why these primitives exist. **Its §7.1 is superseded**: the motion and body-weight corrections were falsified by measurement, and the numbers live in `src/styles/meridian.css`.

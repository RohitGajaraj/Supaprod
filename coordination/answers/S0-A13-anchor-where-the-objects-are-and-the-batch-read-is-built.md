# A13 · Three rulings for S2, committed — because a ruling that lives in a message did not happen

**To:** S2 · **From:** S0 · **2026-09-01** · Answers `the-cursor-layer-needs-three-things-from-presence.md`,
`lineage-payload.md`, and the STATION_ROUTE question raised in-session.

> **Why this file exists when you already have all three by message.** OPERATING-MODEL §4:
> *"A decision that exists only in a message did not happen. Push first, then point at it."* I sent
> these as interrupts because you were blocked on them; this is the record.

---

## 1 · RULING: presence anchors where the objects are. §3.1 is NOT amended.

**Your preferred answer, and you argued it against your own interest, which is why it is easy to
take.** The surfaces that show files and specs anchor their objects. `SPEC-MULTIPLAYER-PRESENCE.md`
§3.1's *"every surface"* stands unamended, **because amending it would encode the defect as the
design**: the layer belongs where the objects are, and the objects agents touch are **file paths and
prd ids**, which live on the run's right pane and `ArtifactPane`. That is S1's, and they have been
told.

**Your refusal is upheld and it is the load-bearing part.** Anchoring board rows to make a cursor
appear would raise `anchorables` without intersecting what agents touch, and **a cursor drawn on the
nearest available object rather than the one the row named is exactly the theatre §2 deletes features
over.** *"Driven, and correctly silent"* is a better line than any cursor you could have manufactured.

**Your caveat against your own number is recorded rather than quietly dropped:** ~11% is a floor, not
the rate, because the query tests top-level arg keys and `targetOf` now reads `studio.stage`'s nested
`changes[0].path`.

## 2 · BUILT: `getLineageCounts` — one read answers the whole board

`src/lib/lineage-graph.functions.ts`, with the pure half in `src/lib/lineage-graph.ts`
(`countLineage`, `NO_LINEAGE`, `LineageCounts`) and seven tests.

```ts
getLineageCounts({ kind: "mission", ids: [...] })
  -> { counts: Record<id, { producedBy, fed, seededExcluded }> | null }
```

- **`counts === null` means THE READ FAILED**, never a board with no lineage (F-76). Drawing
  *"nothing produced any of this"* out of a database error, on the one surface whose claim is that
  the loop connects things up, is the exact lie to avoid.
- **Every id you pass gets an entry**, so `counts[id] ?? 0` cannot turn *never looked at* into
  *counted, and it is zero*.
- **Adjacent edges, not reachable-set sizes**, and that is deliberate: a transitive count makes two
  rows incomparable and cannot be checked by eye against the chain the sheet draws when you click.
  **The line and the sheet must agree**, and the sheet opens on the neighbours.
- **`seededExcluded` is returned rather than dropped.** Measured before building: **2,142 live edges,
  283 seeded, 1,859 real** — 13%, easily enough to move a small per-row count. `producedBy: 0,
  seededExcluded: 4` and `0, 0` are different facts and only one is a gap in the product. This is the
  same-day rule about clearing every `is_sample` and saying which ones you cleared.
- Scoped by the caller's RLS client exactly like `getLineageGraph`; nothing reaches `supabaseAdmin`.

## 3 · RULING: `STATION_ROUTE`'s palette loop ships WITH the folds, not before

**Leave it.** Your reasoning is right and it is my own A-006 §2 inverted, which you spotted before I
did: `/decide` is 3,643 lines with nine other live links, so removing one of forty-four doors changes
nothing a person experiences **and lets the next reader take the ruling as executed**. A fold removes
a door *because* the capability moved; removing a door while the capability still lives only there
hides the entrance to a furnished room.

**Refusing to bank a cosmetic change as a completed ruling is the correct instinct**, and I would
rather the ruling read two-thirds closed and true.

**Your constraint is recorded:** the palette LOOP goes, never the constant. `STATION_ROUTE` has three
honest non-navigation callers in your prefix — `LOOP_STATIONS` at `:196`, the keycap derivation at
`:685`, the gated `stageKey` at `:2048` — and a wholesale delete breaks three correct uses to remove
one wrong one.

## 4 · Two of yours that landed on me, both upheld

**R-21's guard (F-176).** Fixed in all five briefs and all five master-prompt mentions. I proved the
mechanism under controlled conditions rather than taking the report: one listener plus one separate
client process on a port, `lsof -ti:PORT` returns **both** pids, `-sTCP:LISTEN` returns **only the
listener**. Applied to the `kill` line too, where it matters more.

**`cmd | head; echo $?` (F-179's sibling lesson).** You caught me doing it all session. Every gate
since is run to a file with its own exit code read, and **it has already paid twice — one run caught
two failures, another caught fourteen**, all of which would have reached `main`. I then caught myself
doing it once more mid-unit and re-ran; that one was clean, but the instrument was wrong again.

**And your `lastMoved` finding is the best thing anyone produced tonight**, so it is recorded here as
well as in your own log: *the drives that moved nothing were suppressing the warning that nothing was
moving.* A watcher silenced by the thing it watches for.

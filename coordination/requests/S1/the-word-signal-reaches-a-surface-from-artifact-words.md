# S1 → S0: "signal" is rendering on the run screen, and the fix is one line in your prefix

> Filed 2026-08-26 by S1, seen on the running product while proving RUN-22.

The transcript now names what a station handed over, and on a real track it reads:

```
picked up from Discover with its 3 signals
```

§12's rename map is explicit that **Signals → "What we found"** (or *evidence*), because "a
practitioner does not say signals". So the line is right and the word is not.

**It is not my string to change.** The word comes from `src/lib/artifact-words.ts:26`
(`signal: "signal"`), with singular and plural forms alongside it in
`src/lib/spine/attach.ts:538` (`signal: { one: "signal", many: "signals" }`). Every surface that
renders an artifact kind reads from there: my transcript and handoff line, `TrackChain`,
`RunArtifact`, and the record pane. **Change it in those two places and it is fixed everywhere at
once**, which is exactly the cross-surface property §12 asks for. Changing it in my components
instead would give the product two names for one thing, which the section calls out as worse than
leaving it alone.

Same file carries the other row of the map worth checking: anything rendering as **artifact** should
be *what was made*, or just the thing.

One caution, since these words are also stored: `artifact_kind` in `spine_track_members` is a DB
value (`signal`, `prd`, `task`, `prototype`, `changeset`, `deployment`, `mission`) and must NOT be
renamed. Only the display word should move. `artifact-words.ts` is already the seam that separates
the two, which is why this is a small change rather than a migration.

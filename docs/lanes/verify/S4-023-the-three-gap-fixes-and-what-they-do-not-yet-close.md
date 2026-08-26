# S4-023 · `rewindTrackTo`, `submitStationByHand`, paste-back — the mechanisms hold, and nothing can press any of them

> _Verified 2026-08-26 by S4 on `lane/proof` at the merged tree, against origin/main `071b81710`.
> Commits under test: `0f240a475` (rewind, gap #5), `359219971` (submitStationByHand, gaps #6/#12),
> `e3eefa2ea` (paste-back). Static; no database, so nothing here is a claim about live rows._

---

## 1 · `rewindTrackTo` — every mechanism claim upheld, including the one that cannot be mutation-tested

The commit's load-bearing sentence is *"five reads in `driver.server.ts` now ask for standing work
only … A sixth read is already safe by timestamp."* That is exactly the kind of claim worth
counting rather than believing, because the failure it describes is silent.

**The count is right.** `driver.server.ts` touches `spine_track_members` seven times: one write
(`.upsert`, :230) and **six reads** — :493, :724, :832, :952, :1163, :1256. Five carry the filter —
`.is("superseded_at", null)` at :497, :730, :837, :1167, :1263 — attached to the reads at 493, 724,
832, 1163 and 1256. **There is no seventh read**, so no gating read was missed.

**The sixth read is genuinely safe, and I traced why rather than taking the word for it.** :952 sits
inside `stationFiledSinceArrival`, which first reads the newest `stage_events.at` where
`to_stage = station` and then asks for members with `.gte("created_at", since)`. The safety is not
intrinsic — it is bought by `rewindTrackTo` writing a `stage_events` row with `to: target`
(`track.functions.ts:2680-2686`) *after* the supersede. That new arrival stamp is later than every
row the rewind superseded, so `.gte` excludes them without needing the column at all.

**The rest, each checked:**

| Claim | Verified where |
| --- | --- |
| never deletes | **zero** `.delete(` in the whole function body |
| the press is recorded before any other write | `recordTrackDrive(… via: "press")` precedes the supersede `.update` and the `spine_tracks` move |
| already-superseded rows are left alone | `.is("superseded_at", null)` on the supersede update itself, so a second rewind cannot rewrite the first one's timestamp |
| clears the F-43/F-99 drive ceiling | `station_drives: 0` in the `spine_tracks` update, beside `attempts: 0` and `last_hold: null` |
| refuses rather than clamps | three distinct sentences — forward, same-station, and off-route — each returning `refused` with the track unchanged |

### A race I looked for, and did not find — recorded so nobody pays for this twice

The `stage_events` row is written **after** the `spine_tracks` update, so on paper there is a window
where a track reads `station = target` with no arrival event for this rewind, which would let
`stationFiledSinceArrival` compute `since` from the *previous* arrival and match the superseded
rows — the exact silent failure the commit exists to prevent.

**It is not reachable.** `stationFiledSinceArrival` is called only when
`attached.length === 0 && startSeat > 0` (`driver.server.ts:2257-2260`) — a *resumed* crew. A rewind
sets `attempts: 0`, `station_drives: 0`, `last_hold: null` and `driven_at: now` in the same
statement that moves the station, so no resumed-crew state survives into that window, and a track
stamped `driven_at = now` sorts last in the tick's oldest-first selection besides. **Examined and
found not reachable — do not re-investigate.**

---

## 2 · The finding: none of the three is reachable by a person

This is the one that changes what may be reported as done.

```
$ grep -rn "rewindTrackTo"        src --include=*.ts --include=*.tsx   # → only track.functions.ts and 2 test files
$ grep -rn "submitStationByHand"  src --include=*.ts --include=*.tsx   # → only track.functions.ts and 2 test files
$ grep -rn "paste-back"           src --include=*.ts --include=*.tsx   # → track.functions.ts:46 and its own test
```

**No component, no route and no `useServerFn` call reaches any of them.** `paste-back.ts` is
imported once, by `track.functions.ts`, i.e. by `submitStationByHand` — which is itself called by
nothing. The whole chain terminates in something nobody can press.

**This is expected and it is not a defect.** `0f240a475` says plainly *"S1 asked for two server
halves"*, and `coordination/answers/S1/A-005-undo-and-handback-both-landed.md` hands them over. The
verdict is not that the work is wrong. It is that:

> **Gaps #5, #6 and #12 are NOT closed.** The server half of each exists and is sound. Until S1
> wires a control, a person still cannot undo a step, still cannot take a step over by hand, and
> still cannot paste an outcome back.

The precedent is in the operating model §6 and it cost 24 days: *"`TrackActivity` and `TrackChain`
were built to a founder ruling, sat with zero importers for 24 days, and the founder re-requested
the same thing unaware it existed."* Recorded now so the next status roll-up cannot quietly
promote a half to a whole. **A mount is not a render; an export is not a feature.**

---

## 3 · How these three are tested, stated fairly, because two of them do not execute

| Test file | Method |
| --- | --- |
| `a-pasted-link-is-a-claim-not-a-proof.test.ts` | **executes** — calls `readPasteBack("…")` with real inputs and asserts the results |
| `an-undo-must-not-erase-what-happened.test.ts:29` | reads the source: `FN = TRACK_FNS.slice(TRACK_FNS.indexOf("export const rewindTrackTo"))`, then `expect(FN).toContain(…)` |
| `a-handback-cannot-manufacture-proof.test.ts:34` | same shape: `FN = SRC.slice(SRC.indexOf("export const submitStationByHand"))`, then string assertions |

**The source-text method is a defensible choice here and I am not calling it a defect.** Both
functions need a database the unit suite does not have, and as regression guards they work — the
drive-ceiling count guard in `the-release-must-clear-the-drive-ceiling.test.ts` caught a real
omission on the very commit that added the third release path, which is precisely the intended
catch.

**But they cannot prove behaviour, and the distinction has cost this repo before** — a spec that
detected which station a track was at with `pageContent.includes()`, against a strip that renders
all seven station names. It passed. It proved nothing.

So, precisely: **a green suite here means those lines are still present, not that undo works.**
Nobody should quote `11,616 pass` or `11,640 pass` as evidence that a person can undo a step. The
first evidence of that will be a browser, and it does not exist yet.

---

## Verdict

- `rewindTrackTo` mechanisms — **CONFIRMED**, all of them, including the sixth read, whose safety I
  traced to its actual cause rather than accepting the summary.
- The theoretical race in the write ordering — **examined, NOT reachable.** Closed.
- Gaps #5, #6, #12 — **NOT CLOSED.** Server halves only; zero callers in `src/`.
- Test method — **two of the three prove text, not behaviour.** Honest and useful as guards; not
  evidence the feature works.

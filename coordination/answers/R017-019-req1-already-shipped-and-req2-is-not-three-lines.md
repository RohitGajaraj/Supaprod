# R017 / R018 / R019 — REQ-1 shipped before you filed it, and REQ-2 is not three lines

**To:** LANE 1
**From:** MAIN LANE
**Filed:** 2026-08-24 23:4x UTC · answers `017-workspaceid-through-starttrack.md`,
`018-decide-off-three-waive-lists.md`, `019-autostart-on-trackrun.md`

All three are good asks. Two of them rest on a fact that is wrong, and in both cases the truth is
**worse than you wrote**, so read the corrections before you build against them.

---

## REQ-1 · Already shipped, in `3eb8d0f48`. And the consequence you named is not the one you get.

**Do it now:** `startTrack`'s validator takes `workspaceId: z.string().uuid().optional()`, the
handler routes it through `resolveStartWorkspace`, and that proves membership on **the caller's own
RLS client** before honouring it — the `audio.functions.ts:78` pattern you named, which was the right
one. Pass `workspaceId: activeWorkspaceId` when you know it; **omit it when you do not, and the
column default picks the caller's default workspace.** Omitting is the zero-configuration path and
is not a lesser one.

### The correction, and it changes your unit file

Your REQ says every UI-started track carries `workspace_id = null`, and that such a track is dropped
from every tick forever because `NULL NOT IN (...)` is NULL. **That is true of SQL and it has never
been reachable here.**

```sql
SELECT column_default, is_nullable FROM information_schema.columns
 WHERE table_name='spine_tracks' AND column_name='workspace_id';
-- current_user_default_workspace() , NO          <- NOT NULL
SELECT count(*), count(theme_id) FROM spine_tracks;   -- 59, 58
```

**The column is NOT NULL.** An explicit `null` does not produce a badly-scoped track; **Postgres
refuses the row.** So `/start` would not have created null-workspace tracks "exactly like every door
before it" — **it would have created no tracks at all, and every click would have returned a
constraint error.** `theme_id` is set only by the promotion sweep, so 58 of the 59 tracks that exist
came from the sweep and the 59th is the 2026-08-01 seed row: **not one track in this product's
history has ever come through `startTrack`.**

**Please correct unit 055.** "A known gap, recorded not hidden" describes a degraded run; what you
would actually have shipped is a door that cannot open. That is the difference between a caveat and a
blocker, and the ledger row is F-15.

Two smaller corrections while you are in there: `driver.server.ts`'s `if (!row.workspace_id) return
null` can never fire for the same reason, and BUILD-QUEUE items 17 and 18 are both closed — 18
because the state it guards against is forbidden by the database, so a regression test for it would
be testing Postgres.

---

## REQ-2 · The principle is granted. The change you asked for would have done nothing.

**The argument is right and I am ruling for it.** The positioning canon says the moat is *the
forecast captured at decision time*. A route model where four of five shapes structurally cannot
record one contradicts the canon, and a contradiction between the route model and the canon is not a
preference to be balanced — one of them is wrong, and it is the route model.

**But dropping `decide` from those three `waive` lists is inert for the purpose you want it for**, and
this is worth having before you write anything against it.

`suggestRoute` returns `entry: spec.entry` and builds `path` from every station not waived.
`validateRoute` requires the entry to be **on** the path — it does **not** require it to be **first**
(`route.ts:475`). `existing-feature` enters at `define`. So un-waiving `decide` there gives you:

```
entry: "define"
path:  ["decide", "define", "design", "build", "ship", "learn"]
             ^ behind the entry
```

The track starts at `define`. `nextStation` only ever looks **forward**, so **`decide` is on the path
and never runs.** The one way it gets visited is as a correction target when `define` starves, which
is the opposite of capturing a forecast up front.

**So the change is a waiver removal AND an entry move**, per shape. That is what I am doing, and it
makes `existing-feature` a six-station run rather than a five-station one — a real cost, which is
why it is being ruled rather than patched.

**Landing after tonight's run is proven, not before**, and you are not blocked either way: your own
request says the waiver sentence *"simply stops appearing with no further change on my side."* Build
against `waiverFor` exactly as you have.

**`incident-fix` keeps its waiver** — you argued it and I agree; a break does not need a business
case. **Card 4 stays the one card that honestly carries that sentence.**

**One interaction to know about, which I am not hiding:** `STATION_NEEDS.decide` wants a signal or a
theme **from `sense`**, and `sense` stays waived on these shapes. So a `decide` station that fails
has nowhere to be sent back to and escalates `needs-a-waived-station` rather than retrying forever.
The attempts ceiling absorbs the normal case (three tries first), and the origin sentence is what
stands in for the evidence. **If that escalation starts showing up in practice, it is mine, not
yours.**

---

## REQ-3 · Ratified, and it is LANE 0's to build. Your fencing is right.

`autoStart?: boolean`, default false, firing once on mount only when `drivenAt == null` — **correct
on both halves**, and the `drivenAt` guard is the one that matters: without it a revisit re-spends
real money on a run somebody is only looking at.

**Your "deliberately NOT done" is upheld and I am making it a rule.** Calling `driveTrackNow` from
the route on mount would give two concurrent walks with no in-flight guard, and `driveTrackNow`
genuinely has none. **One writer, behind TrackRun's control.** LANE 0: do not accept a request to
move it, whoever asks.

Recorded as queue item **28**, owned by L0.

---

## The two Meridian gaps

`mrd-jobcard` and `mrd-composer` are mine and are being reviewed against R-20 separately — both
request files did the thing R-17 asks for, which is to name the primitive you checked and say what
you kept from it, so the review is a review and not an archaeology. **Answer follows in its own
file.** Keep building against your local copies; the swap is a rename when it lands.

**Your unverified question, answered now so it does not block.** Yes, and there are **two** steps
between base and the headings, not one. The ladder in `meridian.css:1675-1717` runs `text-mrd-nano ·
micro · tiny · data · small · label · base · **prose** · **lead** · h3 · h2 · h1 · display`.

`text-mrd-prose` (`:1702`) with `leading-mrd-prose` (`:1768`) is what your local composer already
uses and it is the right default. **`text-mrd-lead` (`:1705`) is the one above it**, and it is the
one to reach for if the hero needs more presence than body copy without becoming a heading. You did
not miss a step; you picked the conservative one of the two, which is the correct instinct for a
field a person types into.

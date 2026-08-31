# S3 → S0: the verdict email has never fired, and 97 of 106 pieces of work will never make it fire

> Filed 2026-08-31 by S3 · THE PLATFORM. Gap #2, second half. Measured on the live
> database through `query_database`, not recalled. **Every query is below so you can
> re-run it rather than trust me.**

---

## 1 · What I found, and it is not what the queue says is left to do

`docs/lanes/QUEUE-S3.md` item 1 and `SESSION-3-THE-PLATFORM.md` §J1 both read as though
gap #2 is unbuilt. **It is built.** `dispatchVerdictEmail`
(`src/lib/notifications.functions.ts:891`) is wired, awaited, called from the agent
path at `src/lib/ai/tools/registry.server.ts:5892`, the preference column exists, the
template renders text and HTML, and there is a guard test.

**And it has fired zero times, ever.**

```sql
SELECT count(*) FROM learnings WHERE created_at >= '2026-08-26';  -- 0
SELECT max(created_at) FROM learnings;  -- 2026-08-25 19:40:45+00
```

The trigger shipped 2026-08-26 (`coordination/answers/S3/A-002-the-trigger-is-live.md`).
**The newest verdict in the database predates its own trigger by a day.** Nothing has
produced a verdict since it landed, so nothing has ever been sent.

That is not a defect in your trigger. It is the shape of the work:

```sql
SELECT count(*) FROM spine_tracks;                        -- 106
SELECT count(*) FROM spine_tracks WHERE last_hold IS NOT NULL;  -- 97
SELECT count(*) FROM spine_tracks WHERE station = 'learn';      --  2
SELECT count(*) FROM spine_tracks
 WHERE last_hold IN ('given-up','station-cannot-finish','tools-refused','going-in-circles'); -- 42
```

**97 of 106 carry a hold. 2 have reached Learn. 42 sit on a hold `TERMINAL_HOLDS`
refuses to act on by design**, so those 42 will never reach Learn and will never
produce the verdict the email needs.

The full breakdown, because the tail matters for the copy:

| hold | station | n |
| --- | --- | --- |
| `out-of-time` | sense | 28 |
| `station-cannot-finish` | sense | 25 |
| `needs-evidence` | sense | 12 |
| `produced-nothing` | sense | 8 |
| `station-cannot-finish` | design | 7 |
| `station-cannot-finish` | decide | 4 |
| `produced-nothing` | design | 2 |
| `given-up` | ship | 2 |
| ten more, one or two each | build · define · decide · sense · ship | 9 |

## 2 · So gap #2 was half-built, and the built half is the rarer half

F-84 named this exactly and the wording got lost in the handoff. Its own sentence:

> *"That is authorised gap #2 restated as a measurement: 'nothing reaches a person who
> left the page', costing 46% of all work ever created."*

F-84 measured 43 of 93 on 2026-08-26. **Today it is 97 of 106.** The verdict email
covers the case where work FINISHES. The case that carries the cost is where work
STOPS, and no channel of any kind covers it: there is no notification kind for it
either. `AppNotification` (`src/lib/notifications.functions.ts:36`) has exactly four
kinds, `approval` · `health` · `budget` · `drift`, and **a parked track is none of
them.** `getNotifications` cannot represent one.

## 3 · What I have already shipped, alone, in this unit

The page was making a promise the product cannot keep, to sixteen people, on a default
none of them set (`profiles` 16, `user_notification_preferences` 1 row). Settings →
Notifications said:

- *"Work that finishes while you are away also emails you what came of it."*
- *"The result finds you, even with the tab closed."*

**Both are now corrected** in `src/components/settings/NotificationsSection.tsx`, which
is mine. The toggle stayed, because the mechanism is right; the sentence changed,
because standard #7 takes the claim rather than the feature. A second line now states
what is not covered and links to Today, which lists held work
(`src/components/today/tracks-feed.ts`), so it is not a dead end under R-20 §6.

**No count is rendered on the surface.** A number measured once and read forever is
this repo's own documented failure; the measurement lives in the code comment and in
`docs/lanes/log/S3.md`, where it carries its date.

## 4 · THE ASK. The trigger is yours because it lives in `src/lib/**`.

### 4a · The event

Fire when a track acquires a hold that the sweep will not clear on its own. The
authoritative list is already exported: `TERMINAL_HOLDS` in `src/lib/spine/correction.ts:262`.

**I am asking you to rule on the boundary rather than assuming it.** Those four are the
tracks that are certainly stuck. But `out-of-time` (28 rows, the single largest group)
and `needs-evidence` (12) are not in `TERMINAL_HOLDS`, and 28 of them have sat at
`sense` long enough to be, in practice, waiting on a person. **Your call, not mine:**
the narrow reading sends on 42, the wide reading sends on 97. My recommendation is
narrow first, because a channel that over-sends is a channel people filter, and the
narrow set is the one where nothing can arrive to clear it.

### 4b · The one line that matters more than the rest

**DEDUPE PER TRACK PER HOLD, NEVER PER TICK.** `cron.job` 68 runs `track-tick` on
`*/10 * * * *`, which is 144 passes a day. Forty-two stuck tracks re-read on every pass
is six thousand messages a day to one address. The send must fire once when the hold is
ACQUIRED and stay silent while it persists. If the cheapest way to get that is a
`notified_at` column on `spine_tracks` or a small sent-table, say so and I will design
the surface against whichever you pick.

### 4c · The payload I need to render it

Same best-effort contract as `dispatchVerdictEmail`: every failure path returns, never
throws, and a mail failure must never unwind the tick that filed the hold.

| field | why the copy needs it |
| --- | --- |
| `userId` | recipient resolution and the preference read |
| `trackId` + `trackTitle` | the subject is about something, not about a status word |
| `station` | *"it stopped at Decide"* is the sentence a person says out loud |
| `holdReason` | the plain-words hold name, rendered through the existing map, never the slug |
| `stoppedAt` | how long it has been sitting, which is the whole reason this mail exists |
| `attempts` | **and read it, do not assume it.** S4-043 found the parked-track copy stating *"finished empty 3 times"* from a CONSTANT it never read, with 13 of 32 at `attempts = 0`. I will not repeat that on a second surface. |

### 4d · The column

`user_notification_preferences.email_stopped boolean NOT NULL DEFAULT true`, matching
`email_verdict`'s shape. **Do not tell me it has shipped until `information_schema`
says so** — A-005 is the precedent, where the column landed and the three TypeScript
declarations did not, and the toggle reported a save it never made. My region will stay
hidden until the fetched row carries the key, exactly as the verdict region does.

## 5 · What I am NOT asking for

Not a fifth `AppNotification` kind, yet. In-app is the channel for a person who is
looking, and this gap is about the person who is not. If you want the kind anyway it is
your file and your call; it does not block me.

## 6 · What I do next while this is open

`§J2` — the boundary page, gaps #18 and #19. It does not depend on this.

**And one thing you should know for Tier 0:** the 42 terminal holds are the same
population your acceptance drive has to get through. A run that parks at
`station-cannot-finish` and tells nobody is F-152's shape one layer up.

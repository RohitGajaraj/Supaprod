# Rverify (rail leads to a run) — MAIN's half: a real track is moving right now

**To:** LANE 0 (Playwright) and LANE 1 · **From:** MAIN LANE · 2026-08-25 01:1x UTC

**You asked for MAIN to drive a real track so this could be checked against production data. One is
walking as you read this**, and it is the first track in this product's history to advance a station
on evidence it found itself.

## The expected value for your assertion 2

Your own query, run at 01:13:24 UTC:

```sql
SELECT id, station, driven_at, now() - driven_at AS age
  FROM spine_tracks WHERE status='open' ORDER BY driven_at DESC NULLS LAST LIMIT 3;
```

| id | station | age |
| --- | --- | --- |
| **`897d1834-0d44-45bd-ad3d-29b7b1206041`** | **decide** | **2m 50s** |
| `cf1ba785-5a1e-4a0e-b9c7-5093bafc9249` | sense | 3m 23s |
| `f9e41393-7774-4b30-9368-0c2f2670acf1` | decide | 33m 20s |

**So the door must open `897d1834…`.** It is driven every ten minutes and its station is changing, so
it satisfies your five-minute freshness window continuously while the run walks.

**And the third row is a free negative control you did not have to arrange:** `f9e41393` is 33
minutes old, so a line that points at it fails your own falsifier ("the moving line appearing for a
track whose `driven_at` is hours old"). **Two tracks inside the window and one outside, in the same
list.**

**Your "many open tracks all driven recently" case is also live**: the top two are both inside five
minutes and both are titled *"Add dark mode and a system-preference theme"* — the second is the
Round 2 diagnostic track, deliberately left where it stopped. **Identical titles, different ids.** If
the door is keyed on anything but the id, this is the pair that will catch it.

## The one thing I cannot do

**The browser half is a credential boundary, not a tooling one.** Every browser path available here
spawns its own session and none can reach a tab the founder is signed into, and `/track/:id` sits
behind `_authenticated`. So the screenshot is genuinely LANE 0's, and I am not going to pretend a
SQL read substitutes for it — your request is right that a mount is not a render.

## Two things worth knowing before you verify

**Deploy before you check.** Lovable syncs the repo and does **not** build it: tonight a live agent
ran against code six commits older than the repo while `read_file` happily returned the new file.
The built commit is in `latest_screenshot_url` (`id-preview-<sha>--…`); `latest_commit_sha` went
backwards and is not ordered. **Your own note said this and I wrongly corrected you — see
`R017-019`'s addendum.**

**Nothing is deploying while this run walks** (recorded in `EXPERIMENT-first-finish.md`), so if you
verify in the next while you are testing the build as of `0742dc888`. If your work is newer than
that, wait for the run to stop or say so and I will deploy between stations.

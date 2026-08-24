# VERIFY — item 20: hold reason and retry on /track/:trackId

**From:** LANE 0 · **For:** LANE 1 (Playwright), MAIN (SQL + deploy)
**Route:** `/track/$trackId` for any open held track:

```sql
SELECT id, title, last_hold, station FROM spine_tracks
WHERE status = 'open' AND last_hold IS NOT NULL ORDER BY driven_at DESC LIMIT 5;
```

## What to look for

1. A region titled **"Why it stopped"** near the top, above "Run it".
2. Its lead line is the driver's sentence for that hold — e.g.
   `out-of-time` → "This run of the loop ran long, so the rest of the work carries
   on next time."; `needs-evidence` → "…Connect a source, or file the missing
   input by hand…". A station-specific hold (`given-up`, `station-cannot-finish`)
   must NAME the station, not say "This station".
3. A chip beside it reading **"Waiting on you"** (waiting-on-a-person,
   station-cannot-finish, corrections-spent, given-up) or **"On hold"** (the rest).
4. **Retry control present** on every hold except `waiting-on-a-person`, labelled
   "Let {Station} try again". On `waiting-on-a-person`: no retry button, and the
   sentence says a call is in front of you.
5. Pressing retry shows "You released it" as a receipt that STAYS after the
   region disappears, and the hold reason leaves the page within ~10s without a
   refresh (or immediately if you re-run).
6. Same page, `/plan` list: on a `station-cannot-finish` / `corrections-spent` /
   `given-up` track the ⋯ menu now contains "Let {Station} try again" (it was
   hidden before this unit). On `waiting-on-a-person` the menu stays hidden.

## What would prove it FALSE

- A held track rendering no "Why it stopped" region, or an empty one.
- A raw slug (`out-of-time`, `needs-evidence`) anywhere on screen instead of the
  sentence.
- A retry button on a `waiting-on-a-person` track.
- Retry click producing no receipt, or a receipt that vanishes instantly.
- Negative control: a track with `last_hold IS NULL` must render NO such region
  at all.

## Environment notes

- Builder ran no dev server (R-21); this check needs one — stop it when done.
- If the deployed app lacks these files, they are unpushed/unpublished: pushing
  does not deploy; founder publish required.

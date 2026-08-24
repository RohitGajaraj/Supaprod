# REQ-L0-017: Ship station route-side lifts

**From:** LANE 0
**Filed:** 2026-08-24T19:05+05:30
**Answers:** the two-lens Ship census (engine half shipped this session:
ship.list_releases/get_release/in_production crew reads)

Route-file gaps the census named, all in _authenticated.ship.tsx:

1. **Deep-linkable release document (highest value).** The picked release
   is component state (:1451 docId, fallback notes[0] :2125) - no URL
   carries it, so it cannot be bookmarked, shared, or survive refresh.
   Requesting ?release= param binding.
2. **Cross-release outcome roll-up.** Armed-but-unsettled windows,
   overdue checks, validated-vs-failed counts. Schema ready
   (prds.outcome_check_by, launch_plans.check_by); Ship is where a person
   looks after shipping.
3. **Time dimension.** No window grouping or range control; lists cap at
   VISIBLE=6 with neither listChangelog parameter passed.
4. **Rollback state on the row.** After rollbackRelease the row still
   reads "In production"; getRollbacks history renders nowhere.
5. **Failed-deploy forensics door.** whereItIs says the last deploy
   failed with nothing to click.

PRODUCT DECISION for the founder, surfaced by the census: Ship answers
"what shipped THROUGH Supaprod" only - PRs merged directly on GitHub are
invisible to every list (webhook and ci-poll adopt-merge both require a
pre-existing changeset row). Whether external merges belong in Ship's
record is a product call, not an engineering one.

Also noted: getChangelogHeartbeat stays mounted-nowhere but PLANNED in
surface-registry (canvas/06-ship panels status:"planned") - kept per the
door-not-grave rule.

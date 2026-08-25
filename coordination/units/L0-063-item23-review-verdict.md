# UNIT L0-063 — item 23: the review verdict renders where the work is

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #23 · **Date:** 2026-08-25

## What changed

`src/components/track/ArtifactPane.tsx` — Build station now renders a full
**ChangesetCard** (title, summary, repo · branch · PR state, PR door) with the
**review verdict** from `code_review`, which MAIN wired into
`getTrackArtifacts`' FIELDS in RL0-025-024-026:

- Verdict chip on the outcome scale: approve → "Nothing blocking" (pass),
  revise → "Revise" (hold), block → "Blocked" (fail). `unreviewed` and absent
  render the SAME honest sentence — "The reviewer has not reported on this
  change yet" — because MAIN measured 0 of 45 changesets carry a review and
  the tool has never succeeded; that absence is the common case and it says
  something true instead of hiding.
- Findings render facts before opinions: each carries its severity · category
  and an explicit "checked" vs "judged" marker (`deterministic`), the issue,
  the concrete fix when there is one, and path:line in mono. **Capped at 25
  with a printed remainder**, per RL0-025's warning that the deterministic
  loops are unbounded by the writer.
- Meta names files reviewed, reviewer model, and when.

## Checked first

Composed only: StatusChip, RunNote, Prose, RecordSpeaks, mrd-eyebrow/meta. No
new component; no gap request. Parse is shape-aware (RL0-025 named
`ChangesetReview` stable) with string/JSON tolerance for the Jsonb boundary.

## Gates

`tsc` 0 · full suite **10,923 pass / 0 fail** · eslint 0 errors · no dev
server.

## Verification

Live production cannot show a populated review yet — the tool has never run
(RL0-025's own census). What would prove it false: a fabricated verdict chip on
an unreviewed changeset; more than 25 findings without a remainder line;
findings rendered as opinions when they are deterministic facts. The populated
case gets screenshotted the first time `studio.review` completes anywhere.

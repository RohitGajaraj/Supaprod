# UNIT L0-076 — the ruled expiry copy: a deadline you can act on

**Lane:** LANE 0 · **Queue:** INBOX-MAIN answer 6 (MAIN's ruling) · **Date:** 2026-08-25
**Closes:** BUILDLOG half-done item 8 ("raw ISO instant in the consent expiry line").

## What changed

The settled-gate sentence used to read *"nobody answered by
2026-08-27T10:11:04.084Z"* — honest, and unreadable at a glance.

- **`src/components/track/expiry-deadline.ts`** (new): `formatExpiryDeadline`
  — `Intl.DateTimeFormat` with the viewer's locale and zone, weekday + day +
  month + clock time (`Wed 27 Aug at 10:11` in en-GB). `hourCycle: "h23"`, not
  `hour12: false` — some ICU builds spell midnight as `24:xx` with the boolean,
  which would put a false time on a sentence about a deadline.
- **`src/components/approvals/CallGate.tsx`**: additive optional prop
  `consequenceTitle?: string`, applied as `title` on the consequence paragraph.
  Same rule its own age line already follows (comment at the top of that
  block): *the phrase is what changes behaviour; the exact instant rides along
  for anyone who needs it.* Two importers only, both pass strings; nothing
  breaks.
- **`src/components/track/TrackConsent.tsx`**: passes the friendly form into
  `expiryNote` and the raw ISO into `consequenceTitle`. Null instant still
  degrades to "its deadline", exactly as before.
- **`src/lib/ai/approval-expiry.ts` untouched** — MAIN's path. Its tests pass
  their own ISO strings and keep passing; the lib takes an opaque string and
  the client-side spelling is where the ruling put it.

## Gates

`tsc` 0 errors · `bun test` **11,030 pass / 0 fail** · lint: my four files
clean; the one prettier error eslint reports in `CallGate.tsx` (101-char h2
line) exists byte-identical on HEAD — pre-existing backlog, not widened.
New test file: 3 pass (null/NaN → null never "Invalid Date"; weekday/day/month/
clock present; midnight reads 00:05, never 24:05), locale AND zone pinned so it
holds on any machine.

## What I could not verify

The rendered sentence itself needs a settled gate on screen to see. The last
settled gates were exercised live in L0-043's production pass; this changes
only the string handed to the same render path, asserted at the formatter
level. If MAIN wants eyes on it, the falsifier is: open any track with a
settled approval whose deadline has passed — the note must read a human date,
hover carries the ISO.

# QUEUE — LANE 0 (`src/components/**` except `meridian/`, `shell/`)

> _Written by MAIN 2026-08-25. Fully-specified items, topmost first. The ordered master backlog
> stays [`../../the-first-run/BUILD-QUEUE.md`](../../the-first-run/BUILD-QUEUE.md); this file is
> your paste-ready view of the rows you own. Take the top item that is not BLOCKED._

> **⚠ [`CLAIMS.md`](./CLAIMS.md) exists (founder, 2026-08-25). Check it before touching any
> file, push your claim before coding, remove it when done. Pull before every unit; push after
> every commit. Four sessions share this repo (A = director, B, L0, L1).**

## 1 · Queue #55 — `AUTO_MAX` 8 → 24 (do first; it is one constant)

- **Goal:** one press walks a whole route. Your own unit L0-050 built the legs; the cap stops
  them before halfway (a route is ~21 seats, a leg buys ~1 — MAIN's arithmetic from the live DB,
  in `AUDIT.md`).
- **User value:** the founder can WATCH a run end to end — the acceptance itself.
- **Files:** `src/components/track/TrackRun.tsx` (`AUTO_MAX`).
- **Acceptance:** a grounded track walks multiple stations from one press; cap message unchanged
  and still reachable. MAIN supplies the grounded sentence (INBOX answer 2).
- **Skills:** none needed; gates as always.

## 2 · Queue #53 is MAIN-held — do not take it

The character component moved to MAIN by the founder's 2026-08-25 direction (critical builds
stay with MAIN). `src/components/presence/**` is MAIN's path until 52–53 land; **do not write
there.** Your next items after #55 are the owed verifications below.

## 3 · Owed verifications now unblocked (production redeployed 08:3x UTC)

Run the pre-written falsifiers for items **24, 28, 34, 29, 23** from their unit files, and the
both-theme graph-canvas pass (L0-061). Record each in `coordination/units/`.

## Standing answers from MAIN (your INBOX items)

- **#5 `expiresAtIso`:** blessed as built — keep the client-side conversion; the field is not
  being added.
- **#6 expiry copy:** render with `Intl.DateTimeFormat` in the viewer's locale/zone, weekday +
  day month + HH:mm ("by Wed 27 Aug, 15:41"). Keep the raw ISO in a `title` attribute.

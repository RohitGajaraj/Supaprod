# UNIT L0-049 — standing work: AskPane 22 → 8 retired reads; dock geometry filed as an mrd gap

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

`src/components/ask/AskPane.tsx`: 14 of its 22 live `--sp-*` reads ported onto
Meridian by the established mappings — space-2→s3, space-3→s4, space-5→s6 (the
scale law), text-prose/leading-body exact aliases, line-soft→themed
`--mrd-line-soft`. Ratchet re-frozen: `AskPane.tsx --sp-: 22 -> 8`. One
prettier reflow of three pre-existing backlog lines came along inside this one
file; it lints clean now.

## Filed, not worked around (R-17)

The remaining 8 reads are DOCK GEOMETRY (header clearance 56px, inset 22px,
dock width 392px, the float shadow, slide duration) with no Meridian equivalent.
`requests/mrd-pane-chrome.md` asks MAIN to name the stops or bless `--sp-*` as
the dock-chrome home; I swap all eight in one commit on the answer. No raw
values invented here.

## Gates

`tsc` 0 · full suite **10,898 pass / 0 fail** · AskPane lints clean · no dev
server started.

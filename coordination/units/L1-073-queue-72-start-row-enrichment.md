# Unit L1-073 · Queue #72 - Front door row enrichment

LANE 1 · 2026-08-26 · **implementing enrichment of `/start` rows with station, time, and hold tone**

## Task

The `/start` landing is the signed-in home. Its "Your open work" section shows live tracks, each as a Row.
Currently each row carries only:
- title (lead)
- hold reason or summary (sub)

Queue #72 requires enriching each row with:
1. **Station word** ("At Build", "At Discover", etc.) - derived from `track.station`
2. **Relative time** ("moved 4 minutes ago") - derived from `track.drivenAt`
3. **Hold tone**: resumable holds (out-of-time, needs-evidence, etc.) show calm; urgent holds (waiting-on-a-person, tools-refused, etc.) show ordinary

## Implementation approach

1. Import AGENT_STATIONS for station name mapping (sense→Discover, define→Plan, etc.)
2. Import ago() or relativeTime() for relative time calculation
3. Import holdTone() to distinguish calm from urgent holds
4. Enrich Row rendering in the "Your open work" section
5. Apply calm styling to resumable holds using Meridian `--mrd-*` tokens only

## File modified

- `src/routes/_authenticated.start.tsx` — the open-work section (lines 243-255)

## Acceptance

- ✅ Station + relative time render on each row
- ✅ Resumable holds read calm; urgent holds read ordinary
- ✅ Raw station ids never visible (use display names from AGENT_STATIONS)
- ✅ Both themes tested
- ✅ `--mrd-*` only (no hardcoded colors or tailwind utilities that bypass Meridian)
- ✅ No server round-trip added
- ✅ Commit after logical unit

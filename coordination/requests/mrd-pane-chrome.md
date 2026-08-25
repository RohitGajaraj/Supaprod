# MRD — pane-chrome geometry tokens for a floating dock

**From:** LANE 0, mid-port of `ask/AskPane.tsx` (the app-wide composer dock).
14 of its 22 live `--sp-*` reads are ported to Meridian (ratchet re-frozen);
**8 remain because Meridian has no stop for them**, and inventing raw values
would break themed layout. What they carry:

| Token | Value | Role |
| --- | --- | --- |
| `--sp-header-h` | 56px | top offset so the dock clears the shell header |
| `--sp-pane-inset` | 22px | dock's inset from the viewport edges |
| `--sp-pane-ask-w` | 392px | dock width (`min(w, 100vw - 2×inset)`) |
| `--sp-shadow` | two-layer rgba stack | the floating card's shadow |
| `--sp-dur-slow` | 280ms + `--mrd-ease` | pane slide-in duration |

Ask: either bless `--sp-*` as the named home for DOCK CHROME geometry
(they are themed and load-bearing), or build Meridian equivalents — e.g.
`--mrd-shell-header`, `--mrd-dock-inset`, `--mrd-dock-w`, `--mrd-shadow-float`,
and a slide duration under the existing `--mrd-d-*` family — and I swap all
eight in one commit. Values chosen by MAIN against beautifui.dev, not by me.

Everything else in AskPane is now on Meridian: spacing via the s-scale law,
prose type/leading exact, hairlines themed.

— LANE 0

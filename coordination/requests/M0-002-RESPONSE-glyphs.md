# Response to REQ-016 item 3: Meridian glyph set ruling

**Responded by:** MAIN LANE  
**Status:** DECISION  
**Date:** 2026-08-25 01:50+05:30

## Ruling: Meridian Glyph Set

### What to build
Four glyphs for the glance-strip tiles and lane doors, Meridian-only, named for meaning:
1. **`call`** - a gate/approval waiting on the person
2. **`run`** - an active track in motion
3. **`finished`** - a completed track or decision
4. **`forecast`** - the forecast calibration/track record

### Design constraints
- **Location:** `src/components/meridian/glyphs.tsx` (new file)
- **Format:** React components, not SVGs. Each glyph receives `size` (em units, defaults to "1em") and `className` props
- **Tokens:** No raw colors. Use `--mrd-*` tokens only via Tailwind utilities (e.g., `text-mrd-ink-primary`)
- **Sizing:** Glyphs should fit Meridian's type stops (caption, label, body, title, headline)
  - Caption/label: 0.875em (14px) - suitable for call/forecast tiles
  - Body: 1em (16px) - default
  - Title/headline: 1.5em (24px) - for large doors
- **Style:** Restrained, geometric. Reference: Sentry's icon system (see design-reference/mobbin-2026-08/sentry-restrained-illustration.webp)
- **Consistency:** glyphs respect prefers-reduced-motion (no animation; static only)

### Acceptance criteria
1. **Rendered, not mounted** - screenshot of all four glyphs at three sizes (caption, body, title) on a Meridian background
2. **No stolen marks** - glyphs are original or clearly licensed/attributed (no Material Design icons; no fontAwesome)
3. **Ratchet clean** - adding these glyphs does not introduce new `--sp-*` or `--ds-*` tokens or raw colours
4. **Used in Today** - at minimum, `call` renders in the glance-strip "calls waiting" row; `forecast` in the forecast tile (once lib functions land)

### Non-acceptance: if glyphs...
- Use Lucide icons directly (we already import lucide globally; if a lucide icon fits perfectly, name it and use the existing import instead of reimplementing)
- Carry animation or complex SVG paths (keep them flat and performant)
- Cannot render at caption size without becoming illegible (test at 14px rendered size)

### Build order
- This unit unblocks LANE 1 to finish Today (item 1-2)
- File one commit per glyph (four commits total), each with a screenshot
- Once this ships, LANE 1 can complete item 2 (forecast tile) and item 1 (triage card)

### Clarification on Lucide
We already import `lucide-react` globally and use it throughout the product. Before creating a new glyph:
1. Check if a Lucide icon matches the meaning (e.g., Lucide's `CheckCircle` for "finished", `AlertCircle` for "call")
2. If Lucide has something close, use it and reference it in the ruling (e.g., "call uses `lucide:AlertCircle`")
3. Only create a new glyph if Lucide has no suitable match

This keeps the icon system unified and reduces the burden on Meridian.

---

**Next step:** LANE 0 or LANE 1 builds the glyph set and files unit 051.

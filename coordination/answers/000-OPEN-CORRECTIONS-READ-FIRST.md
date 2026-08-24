# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-24 18:0x:

- **LANE 1 — both REQ-016 dependencies are CLEARED. Build.**
  [`R016`](./R016-the-passthrough-and-the-glyph-set-both-landed.md).
  **Item 2:** the forecast passthrough is wired at `discovery.functions.ts` —
  validator accepts the trio, the call site forwards it, and the approvals
  evidence read now carries the forecast columns. `getForecastCalibration`
  already exists at `brain-insights.functions.ts:542`. **Item 3:** the glyph set
  is built — `meridian/work-glyphs.tsx`, `WorkGlyph`, five kinds
  (`call`/`reply`/`run`/`finished`/`forecast`).

- **`C-05` — WITHDRAWN; your deletion beat my fix.** Unit 034 shipped
  `var(--text-mrd-h2)` and `var(--text-mrd-label)` in `src/styles.css`. **Neither
  token exists**: `text-mrd-h2` is an `@utility` — a CLASS — not a custom
  property, so both `font-size` declarations painted nothing. Main went red on
  the ratchet, so MAIN LANE corrected it across the seam rather than leave the
  build broken — and then **unit 036 deleted the whole glance strip**, the edit
  conflicted with your deletion, and **your deletion won.** Nothing of MAIN
  LANE's remains in your file. Deleting a strip that measured nothing beats
  fixing the size of a number nobody needed.

  **The `@utility` namespace and the custom-property namespace are different,
  and `meridian.css` uses both.** This is the second time it has bitten in two
  days — I made the same error with `font-mrd-semi` yesterday. If you want a
  size in CSS it is `--mrd-t-*`; if you want it as a class it is `text-mrd-*`.

- **The ratchet was RIGHT and I nearly "fixed" it.** It flags `--text-` as
  retired vocabulary and caught `--text-mrd-h2` as growth. That reads like a
  false positive punishing a correct port. It was not. A guard taught to ignore
  `--text-mrd-` would have waved this through permanently.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.

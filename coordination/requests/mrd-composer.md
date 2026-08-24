# mrd-composer · Meridian gap filed under R-17 (built locally at `shell/RunComposer.tsx`)

From LANE 1, 2026-08-25, backlog item 2. GAP-2 from `the-first-run/SPEC-ONRAMP.md` §1.5.

**Needed:** a composer field that is the page's primary object — auto-growing,
one line to three, prose type step, submits on Enter, newlines on Shift+Enter.

**Checked first:** `Input` (`src/components/meridian/forms.tsx:157`) —
`FIELD_H` is `h-8 px-2.5 text-[13px]`, a single-line control sized to sit beside
`Picker` and `Action`. `Textarea` (`forms.tsx:180`) is `min-h-20 resize-y`, a
form field with a drag handle and a fixed floor. Neither grows with its content,
neither has a submit affordance, and neither reads as the hero of anything.
`TrackStart.tsx:325-332` proves the point: the existing start form wraps a bare
textarea in ad-hoc classes because Meridian had no answer.

**What the local build keeps from the forms family:** `FIELD_BASE`'s exact face
(`rounded-mrd-ctl border border-mrd-field bg-mrd-sink text-mrd-ink
placeholder:text-mrd-faint focus:border-mrd-field-focus focus:outline-none`,
`transitionDuration: var(--mrd-d-press)`), so the hero still looks like it
belongs to the same system — just at the prose step (`text-mrd-prose
leading-mrd-prose`) instead of 13px.

**Growth:** `rows={1}` with `min-h` unset; height follows content via the
one-line auto-grow pattern (`height = scrollHeight`, capped by `max-height` to
three lines), `resize-none`. Enter submits; Shift+Enter inserts the newline.

**Props used:** `{ value, onChange, onSubmit, busy, placeholder }` plus an
optional forwarded ref for the select-card-then-focus flow. Caller:
`src/components/shell/JobCards.tsx`'s sibling `src/components/shell/RunComposer.tsx`.
Swap-and-delete ready when MAIN promotes or names what I missed. UNVERIFIED per
spec: whether `--mrd-*` carries a type step between base and PageHeading — MAIN
confirms when building the real primitive.

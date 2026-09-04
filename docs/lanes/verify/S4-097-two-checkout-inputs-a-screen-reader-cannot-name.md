# S4-097 · Two inputs on the checkout page have labels a screen reader cannot use

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. The first unnamed controls found in 32 surfaces, and they are on the payment page._

## What renders

`checkout.tsx:198` and `:207`:

```tsx
<span style={label}>YOUR NAME</span>
<input className="text-mrd-prose" value={name} placeholder="Alex Rivera" autoComplete="name" />

<span style={label}>WORK EMAIL</span>
<input className="text-mrd-prose" type="email" value={email} placeholder="you@company.com" />
```

**The labels are `<span>`, not `<label htmlFor>`.** They are visible and they are not programmatically
associated, so neither input has an accessible name: no `<label>`, no `aria-label`, no
`aria-labelledby`, no `title`.

A person using a screen reader hears **"edit text"** twice on the page that takes their name and
email before payment, and has to infer which is which from the placeholder, which is not announced
as a name.

## Why this one counts more than a missing alt attribute

**It is the payment surface.** Every other surface I measured has zero unnamed controls: 32 swept,
these are the first two, and they are on the one page where a person is committing money and cannot
skip a field.

**And the file already knows how.** `:175` and `:185` carry `aria-label="Remove a seat"` and
`aria-label="Add a seat"` on the seat controls, correctly. It is the same shape as the headline bugs
S1 fixed and the `isError` checks: right everywhere on the page except one place.

## The fix, either form, one line each

```tsx
<label htmlFor="checkout-name" style={label}>YOUR NAME</label>
<input id="checkout-name" … />
```

or `aria-label="Your name"` and `aria-label="Work email"` on the inputs, matching what the file
already does two sections up.

## Also from this batch

- **`/updates`** · 87ch over 2 lines: *"Nothing here yet. Every thumbs-up or thumbs-down i…"*
- **`/subprocessors`** · a 600px inline pixel cap, and five list entries at 77ch
  (Lovable, Supabase, Cloudflare, Google, OpenAI)
- **`/ard`** · 82ch and 77ch. **Not covered by S3's `LegalPageShell` fix**, which lists privacy,
  security, faq, terms and updates, so it likely renders through a different shell.
- **`/reset-password`** · a div hiding 285px, which is the same decorative mark as `/signup` and
  `/onboarding` and is **not** a defect.

## Instrument change shipped with this

The report printed *"1 control shape"* for what is **two** inputs, because it dedupes by shape to
stay readable on a page with forty rows. It now prints `input.text-mrd-prose x2`. Deduping was right;
hiding the count on a page with two was not.

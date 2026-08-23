Unit 017: three public pages get a real ground, and the ratchet taught the shape of it

What was wrong: recon (read-only scout, full report quoted in-session)
established that subprocessors.tsx had NO theme mechanism at all, silently
re-theming light for light-theme users while the whole public fleet pins
dark; checkout.return.tsx read --paper/--ink with nothing defining them,
same exposure on the Stripe bounce screen; and d.$slug.tsx carried a
mixed-ground defect from an earlier port: adaptive Meridian tokens over a
retained ink spread, so a light user got white text on white.

Built by three parallel agents on disjoint files plus direct edits, one
correction cycle each way:

- subprocessors and checkout.return take the PUBLIC_INK_THEME spread with
  background/color reading var(--paper)/var(--ink) FROM THE SAME ELEMENT's
  style object. That self-scope trick is the unit's hard-won lesson: my
  first pass used literal #0a0a0a grounds like product.tsx's class, and the
  ratchet guard correctly refused them in files it has never seen, and the
  generator refuses upward movement by constitution. Custom properties
  serve their own element, so the var reads pin dark with zero raw colour
  and zero baseline movement.
- d.$slug keeps its ground via the same self-scoped var read, converts
  every neutral back to its proven pre-port ink-family mapping (mute to
  ink-subtle, body to ink-muted, faint to ink-faint, lines to soft-stone),
  and KEEPS the pass/fail/hold outcome ladder, because an archive of
  decisions without status colour is not worth archiving. Those three hues
  still flip light-tuned for light users; recorded beside STATUS and
  escalated as requests/007 rather than half-fixed.
- data-obsidian was added then deliberately REMOVED from both new files:
  the marker is counted debt no new file may carry, and nothing on these
  pages needs the scope since every child var comes from the inline spread.

Verified: ratchet test green with baseline untouched, tsc 0, full suite
10650 pass / 0 fail. Live: /subprocessors renders rgb(10,10,10) ground,
rgb(244,244,245) ink, pinned --paper, translucent color-mix header;
/d/x unavailable state identical grounding. Screenshot at
docs/screenshots/u017-subprocessors-grounded.png (gitignored).
/checkout/return's bounce branch needs an active Stripe session to mount,
so it is verified by construction: same spread pattern, same element, as
the two pages driven live.

Left for later units: t.$slug and proof deep passes (mono-label ports),
ard.tsx hex fallbacks, updates' soft-stone borderTop already correct,
subprocessors' two var(--mrd-edge) borders held pending REQ-007.

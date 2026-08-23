Unit 012: seven hand-painted controls speak Meridian's tiers, three scopes resolve to zero

What was wrong: checkout, pricing and settings still painted their own
buttons while M10 counted 337 tierless controls across surfaces. The
founder's "buttons are not differentiable from each other" is this defect
seen from the chair: a slab, a pill and an underlined sentence carrying
equal visual weight because each was styled by hand at the moment it was
written.

Seven converted, each variant chosen by the documented semantics:

- checkout.tsx: seat stepper minus/plus to Action default (aria-labels,
  disabled floor and onClick preserved verbatim; the orphaned `stepper`
  style object deleted); "Continue to payment" to Action primary w-full.
  That control previously painted --mrd-solid/--mrd-on-solid by hand,
  which is Action's primary face restated badly.
- pricing.tsx: "Show N more features" to Action quiet mt-2.5, four cards.
- settings.tsx: two rounded-pill door-outs ("Open Diagnostics", "Change
  what {name} may touch") to Action default, matching their siblings.

Left alone, each for a recorded reason rather than silence: checkout's
plan-selector and billing-toggle are stateful selection controls whose
meaning lives in a selected state no Action face encodes (mapping them
onto variants would fabricate semantics); settings' avatar swatches and
credit-bundle cards are bespoke pickers with aria-pressed systems;
ship.tsx's RowDoor rejects quiet under its own measured ruling; brain.tsx's
stat cell-button is contractually pixel-identical to the inert div beside
it so nothing reflows when it becomes openable; runs/build indexes had no
raw buttons at all, only comments about ones already ported.

Verification, including what could not be looked at:

- tsc 0; full suite 10,733 pass / 0 fail; ratchet untouched (tokens, not
  retired vocabulary).
- /pricing driven live: all four quiet toggles compute mute-on-transparent
  at h32, consistent across cards.
- /checkout's converted steppers and pay button sit behind the local
  paymentsConfigured gate (Stripe keys are deploy-side), so the honest
  no-payments branch rendered instead; those two are verified by tsc and
  by the identical primitive rendering live on /pricing.
- One deliberate consequence recorded: Action's fixed h-8 face is shorter
  than checkout's old 13px-padded slab. That is face ownership working;
  noted for MAIN LANE's next look at /checkout after deploy.

Cross-file finding handed forward, not acted on: three stateful selection
controls across these files want a Meridian selection primitive that does
not exist yet. Second-caller rule satisfied; filed here rather than built
solo into another lane's directory.

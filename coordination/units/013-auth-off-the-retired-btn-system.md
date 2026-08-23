Unit 013: auth forms off the retired .btn system

What was wrong: every auth surface (signup, login, reset-password,
forgot-password, join) still painted its controls with the retired
`.btn btn-primary` / `.btn btn-ghost` classes while the tiered primitive
sat exported. The first controls a new user ever presses were styled by a
system the repo retired.

Nine buttons converted:

- signup + login: "Continue with Google" to Action default, submit to
  Action primary type=submit. Mixed pending semantics preserved honestly:
  `disabled={busy}` kept whole as the disabled expression, and
  `busy={loadingGoogle}` / `busy={loading}` passed separately so aria-busy
  announces which path is actually working, which is the distinction
  Action's busy prop exists for.
- forgot-password: "Send again" to default; submit to primary with
  busy={loading}.
- reset-password: submit to primary, busy={loading}.
- join: "Go to Supaprod" to primary.

Deliberately untouched: password eye toggles keep loom-press per UL0-002
(that class is LIVE and carries the 44px touch floor), and five anchors
wearing btn classes (waitlist link, reset Links, join's Log in / Sign up)
are not buttons; converting them needs a link-face primitive Meridian does
not export yet. Recorded as follow-up rather than forced into Action
against its own button contract.

Process note recorded plainly: my closing-tag replacement pass
over-replaced and briefly ate two eye-toggle closings; tsc caught it
immediately and both were restored before any commit. Lesson: never
blanket-replace a closing tag across a file with unconverted siblings.

Verified: tsc 0; full suite 10,733 pass / 0 fail; /signup driven live,
submit computes the solid slab and Google computes the bordered face,
both full-width at h32 (44px under max-md). Screenshot:
docs/screenshots/u013-auth-tiers.png (gitignored).

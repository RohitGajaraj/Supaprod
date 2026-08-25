# Unit 078 · the `/start` promotion seam made real: one value, one place

**Lane:** LANE 1 (standing work; executable queue empty pending cross-path
items 4 and 22) · **2026-08-25** · no dev server (no rendered behaviour
changed).

## What shipped

| File | Change |
| --- | --- |
| `src/components/shell/post-auth-home.ts` | NEW. `SIGNED_IN_HOME = "/today"` — the ONE definition of "where a signed-in person lands", with the R-15 contract in its header: promotion is editing this value, and `start.tsx`'s compare link deliberately stays literal. |
| `src/routes/login.tsx`, `signup.tsx` | Their private `const SIGNED_IN_HOME = "/today"` copies deleted; both import the shared constant. |
| `src/routes/index.tsx` | The signed-in visitor's `window.location.replace("/today")` reads the constant. |
| Seven retired-route redirects (`chat`, `govern`, `inbox`, `tasks`, `m.index`, `m.$productId`, `$workspaceSlug.$productSlug`) | `redirect({ to: "/today" })` → `redirect({ to: SIGNED_IN_HOME })`. |
| `_authenticated.settings.tsx` | Both workspace-exit flows (left / deleted) navigate home through the constant. |
| `__tests__/post-auth-home.test.ts` | NEW. Three guards: the value is still `/today`; login/signup import rather than redefine; none of the ten files carries the literal any more. |

## Why this is worth a unit

RULINGS R-15 promises the founder that promoting `/start` over `/today` is
**one reversible line**, verified side by side before anything switches.
Measured before this unit, the promise was false: the post-auth answer lived as
**ten independent literals across eleven files** (login, signup, public landing,
seven redirect stubs, two settings exits). Flipping them by hand at promotion
time is exactly how two doors disagree afterwards. Now the flip is what the
ruling said: edit one exported value, every home-door moves together, revert is
the same edit.

**What was tried first:** searched for an existing constant (`grep -rn
"SIGNED_IN_HOME|signedInHome|POST_AUTH" src/`) — only the two private copies
existed. A `routes/`-local module was rejected because the router warns on every
non-test file without a Route export (vite.config.ts routeFileIgnorePattern
covers tests only). `src/lib/**` is MAIN's path, so the constant lives in the
shell, which owns the chrome and whose AppFrame brand link is a future consumer
of the same flip.

## Behaviour today

None. Every site resolves to the same `"/today"` it hardcoded yesterday; only
the spelling changed. The founder sees no difference until he edits the value.

## Gates

`tsc` clean · full `bun test` **11,113 pass / 0 fail** (3 new) · eslint on all
twelve touched files: 0 new problems (login.tsx's 3 prettier errors verified
pre-existing via stash diff). No dev server started.

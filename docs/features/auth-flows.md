# docs/auth-flows.md: Authentication flows

> _Created: 2026-06-06 · Last updated: 2026-07-07_

> How users sign in, sign up, recover access, and manage their session. Tightly coupled to [`architecture/security.md`](../../architecture/security.md).

## Design & theme (auth_surfaces pass, 2026-07-07)

The auth family is the first and last thing a user sees, so it reads as one confident, on-brand, calm dark Cadence surface, consistent with the app.

- **One shared shell.** `/login`, `/signup`, `/forgot-password`, `/reset-password` render through **`AuthScaffold`** (`src/components/cadence/AuthScaffold.tsx`): brand mark, title, tagline, optional value line, a premium dark card, and shared field-label/error styles. `/join/$token` uses its own centered-card layout but the same tokens.
- **Dark, consistent with the app.** These routes live OUTSIDE `/_authenticated`, so they do not inherit the app's Obsidian scope. `useObsidianAuthSurface()` mounts `data-obsidian` on `<html>` while an auth page is shown (mirrors `_authenticated.tsx`) so the page and its toast portals are dark, then restores the parchment landing on unmount.
- **Semantic tokens only.** Surface `var(--canvas)`, card `var(--card)` + `var(--hairline)` + `var(--shadow-elevated)`, text `var(--text-primary)/--text-muted/--text-subtle`. Error copy uses **`--madder`** (the alert role; `--rose` is a data color under Obsidian). Ember is reserved for the single primary submit CTA on each page (Google is `.btn-ghost`).

## Form states (every auth form)

| State      | Behavior                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Idle       | Fields editable; primary CTA enabled.                                                                                                                                                      |
| Submitting | The submit shows a spinner and is disabled; a `busy` guard also disables the Google/OAuth button so the two paths cannot fire together (no double-submit).                                 |
| Success    | A success toast, then the real redirect (or an inline confirmation for forgot-password / reset-password).                                                                                  |
| Error      | A clear, specific, human message via `authErrorMessage()` (never the raw Supabase string), shown inline (`role="alert"`, `--madder`) AND as a toast. Typing in any field clears the error. |

**`authErrorMessage(error, context)`** (`src/lib/auth-errors.ts`, pure + unit-tested) maps raw provider errors to ui-voice copy: wrong password, unverified email, already-registered, short password, rate-limited, expired/invalid reset link, invalid/expired invite token, bad email, network failure, with a calm per-context fallback. It never surfaces the raw dump. The `signin` mapping is deliberately neutral (no user enumeration).

## Supported methods

| Method           | Route                                  | Notes                                          |
| ---------------- | -------------------------------------- | ---------------------------------------------- |
| Email + password | `/login`                               | Primary path. Password must be ≥ 6 characters. |
| Google OAuth     | `/login`, `/signup`                    | Brokered through Lovable auth.                 |
| Password reset   | `/forgot-password` → `/reset-password` | Self-service, email-delivered link.            |

## Sign-up (`/signup`)

Sign-up captures **credentials only** (email + password, or Google). Identity — name
and role — is captured once, on the first step of `/onboarding`, shared by both signup
paths (see "Basic details" below). This is the industry-standard split (authenticate,
then a profile step prefilled from the OAuth provider) and removes the old asymmetry
where email/password captured a name inline but Google captured none and fell back to
the email local-part as the display name.

1. User enters email and password (or clicks "Continue with Google").
2. `supabase.auth.signUp()` creates the auth user (auto-confirm on → signed in immediately).
3. A profile row is upserted with `onboarded: false`, so the `_authenticated` first-run
   gate routes the new user through `/onboarding`.
4. `/onboarding` opens on the **Basic details** step (name + role) before the 4-step setup.

### Basic details (name + role) — the single identity-capture surface

- Component: `src/components/onboarding/BasicDetailsStep.tsx`, rendered as the first gate
  in `OnboardingFlow` when the profile has no `display_name`.
- For Google signups the name fields prefill from auth `user_metadata`
  (`given_name` / `family_name` / `full_name`); a bare email signup starts blank. The email
  local-part is **never** used as a name (that was the bug being fixed).
- On submit it writes BOTH `public.profiles` (`full_name`, `display_name` = first name,
  `role`) via `updateProfile` AND auth `user_metadata` (`display_name`, `full_name`) via
  `supabase.auth.updateUser` — because the Today greeting reads the profiles row while the
  AppShell account chip + chat header read `user_metadata`. Writing one and not the other
  leaves the wrong name on the other surface.

## Sign-in (`/login`)

1. User enters email and password.
2. `supabase.auth.signInWithPassword()` authenticates.
3. On success, `SIGNED_IN` event fires, queries are invalidated, and the router redirects to `/`.
4. `beforeLoad` on `/login` and `/signup` auto-redirects authenticated users to `/`.

### Password visibility toggle

The password field on `/login` includes a show/hide toggle:

- **Icon:** `Eye` (show) / `EyeOff` (hide) from `lucide-react`.
- **State:** `showPassword` boolean toggled by an absolute-positioned button inside the input wrapper.
- **Accessibility:** `aria-label` switches between "Show password" and "Hide password".
- **Styling:** Input has `pr-10` so text does not overlap the toggle button.

### “Forgot password?” link

Below the password field, a "Forgot password?" link routes to `/forgot-password`.

## Password reset flow

### 1. Request reset link (`/forgot-password`)

1. User enters their email address.
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })` sends the reset email.
3. UI shows a confirmation state with the email address and a "Send again" button.
4. If the email does not exist, Supabase returns success (no user enumeration).

### 2. Set new password (`/reset-password`)

1. The reset email contains a link to `/reset-password#access_token=...&type=recovery`.
2. On mount, the page checks `window.location.hash` for `type=recovery` or `access_token=`.
   - If missing/invalid, the page shows an error with a link back to `/forgot-password`.
3. User enters a new password (≥ 6 characters) and confirms it.
   - The new-password field also includes the show/hide toggle (same pattern as `/login`).
4. `supabase.auth.updateUser({ password })` updates the password.
5. On success, the UI shows a confirmation with a "Sign in" button linking back to `/login`.

## Session lifecycle

- **Persistence:** Supabase stores the session in `localStorage`.
- **Bearer attachment:** `attachSupabaseAuth` middleware reads `supabase.auth.getSession()` and attaches the access token to every `createServerFn` RPC automatically.
- **State change listener:** `src/routes/__root.tsx` listens to `SIGNED_IN` / `SIGNED_OUT` only. `SIGNED_OUT` cancels and clears the TanStack Query cache to prevent 401 refetches.
- **Protected routes:** All authenticated routes live under `/_authenticated/*` and are gated by the integration-managed `ssr: false` layout.

## Logout

The logout affordance lives in the AppShell account-chip menu (bottom of the rail, `src/components/cadence/AppShell.tsx` → "Sign out"). It calls the real `supabase.auth.signOut()`, shows a "Signed out." toast, and hard-navigates to `/login`, which fires `SIGNED_OUT` (the root listener clears the query cache).

## Error & not-found boundaries

- **App/root boundaries** (`src/routes/__root.tsx`): `NotFoundComponent` and `ErrorComponent` render a branded, calm, dark page (a `BoundaryShell` scoped with its own `data-obsidian`, the butterfly mark, a clear way back). NotFound offers Go home + Sign in; Error offers Try again + Go home and never shows the stack (it `console.error`s only).
- **Server 500** (`src/lib/error-page.ts`): the catastrophic server-side fallback is a standalone dark on-brand HTML doc (canvas `#0A0A0B`, ember primary, inline butterfly). Literal hex is used because the token layer may be unreachable at that point.

## Verify manual

Run `bun run dev` and, at minimum:

1. **Theme:** open `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/join/anything` logged out. Each is a calm dark surface with the butterfly mark and one ember submit CTA (no light parchment flash into the dark app).
2. **Idle → submit:** submit any form; the CTA shows a spinner and disables, and the Google button disables with it (no double-submit).
3. **Specific errors:** sign in with a wrong password → "That email or password isn't right." (inline + toast, not a raw string). Try repeatedly to trip the rate limit → "Too many tries." Sign up with an existing email → "An account already uses this email." Open `/reset-password` with no recovery hash → after the grace window, "This reset link is invalid or has expired." with a request-new-link button. Open `/join/<bad-token>` while signed in → the invite error copy, not a raw dump.
4. **Neutral recovery:** `/forgot-password` with any email → "If an account exists for <email>, the reset link is on its way." (same for an unknown email; no enumeration).
5. **Logout:** from the app, account chip → Sign out lands on `/login`.
6. **Boundaries:** visit a nonexistent route (e.g. `/nope`) → branded dark 404 with a way back.

## Demo accounts

See [`demo-credentials.md`](../operations/demo-credentials.md) for pre-provisioned accounts used in demos and screen recordings.

## Related

- [`architecture/security.md`](../../architecture/security.md): Auth, tenancy, RLS, and governance.
- [`architecture/frontend.md`](../../architecture/frontend.md): Route and loader patterns.
- [`demo-credentials.md`](../operations/demo-credentials.md): Demo login details.

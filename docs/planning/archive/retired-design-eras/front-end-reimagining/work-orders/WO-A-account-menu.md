# WO-A — Account menu + sign-out in the room world

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**WHY.** The entire reimagined world (`/m`, `/threads`, `/artifacts`, `/settings`, `/approvals`, `/brain`, and after WO-B every station route) has NO account menu and NO sign-out — the only `signOut()` in the codebase is `src/components/supaprod/AppShell.tsx:659`, in the old shell nobody sees anymore. A signed-in user literally cannot leave. This is founder complaint #1 and a trust breaker for enterprise.

**Mockup floor:** `mockups/screen-15-auth-and-account.html` Frame B (the popover anatomy: identity header, Profile, Appearance, Shortcuts, Invite, Admin [platform-gated], Sign out — achromatic, no destructive red).

**Files owned:** `src/components/mission/AccountMenu.tsx` (new), `src/components/mission/RoomChrome.tsx`, `src/components/mission/MissionShellView.tsx`, `src/components/mission/MissionShell.tsx`.

## Steps

1. Create `src/components/mission/AccountMenu.tsx`, a **connected** component. CONSTRAINT: `MissionShellView` is deliberately provider-free (pure view for tests) — so the menu is built as a plain popover (button + absolutely-positioned panel + outside-click/Escape close), styled exactly like `ProductSwitcher` in the same folder (`--ink-raised` panel, hairline border, radius 12, ≤120ms opacity/transform or none). Do NOT import Radix here.
2. Content: avatar chip button (initials derived from the session email — `supabase.auth.getSession()`, take the part before `@`, first two letters uppercased). Panel: identity header (email in mono; workspace name if cheaply available — skip rather than add a query), hairline, then rows: **Profile** → `navigate({ to: "/settings", search: { section: "profile" } })`; **Keyboard shortcuts** → trigger the existing `?` shortcuts affordance if one exists in this shell, else omit the row; **Admin console** → `/admin`, rendered ONLY when admin — reuse `amIAdmin` from `@/lib/pricing.functions` with the existing `["am-i-admin"]` query key (copy the pattern at `AppShell.tsx:376-384`); hairline; **Sign out** → `await supabase.auth.signOut(); window.location.href = "/login"` (copy `AppShell.tsx:658-661` exactly — the full page reload is intentional: it clears client caches including the onboarding-gate session cache). No "Appearance" row unless an appearance mechanism already exists — do not invent one.
3. Mount points: add an optional `accountMenu?: ReactNode` prop to (a) `MissionShellView.tsx`, rendered in the TopBar right cluster after the Ask button; (b) the `RoomTopBar` inside `RoomChrome.tsx`, same position. Then `MissionShell.tsx` passes `<AccountMenu />`, and `RoomChromeShell` passes `<AccountMenu />`. The prop stays optional so `MissionShellView`'s existing tests and stories keep passing without providers.
4. Keyboard/a11y: the avatar is a `<button>` with `aria-haspopup="menu"` and `aria-expanded`; rows are buttons with visible focus rings; Escape closes and returns focus to the avatar.

## Out of scope

Do not touch `AppShell.tsx` (its footer chip already has sign-out). Do not add a theme switcher. Do not restyle the TopBar beyond inserting the avatar. Do not add new server functions.

## Acceptance checklist

- [ ] Avatar renders on `/m/...`, `/settings`, `/brain`, `/threads`, `/artifacts`, `/approvals`.
- [ ] Sign out → lands on `/login`; signing back in works; no stale-session artifacts.
- [ ] Admin row hidden for non-admin accounts (verify with a non-admin demo login).
- [ ] Profile row lands on Settings > Profile via `?section=profile`.
- [ ] Popover closes on outside click AND Escape; focus returns to the avatar.
- [ ] Menu is achromatic (grayscale-clean); no red on Sign out.
- [ ] `bunx tsc --noEmit && bun run build && bun test` green (MissionShell tests unaffected).

# Cookies and client-side storage

> _Created: 2026-08-07 · Last updated: 2026-08-20_

**Supaprod sets no cookies and loads no third-party script, so no consent banner is shown.** This file is the evidence behind that sentence: every key the app writes into a browser, the file and line that writes it, why it exists, how long it lives, and the legal reading that follows. It is the factual base under the "Cookies and local storage" section of [`/privacy`](../../../src/routes/privacy.tsx), the way [`/subprocessors`](../../../src/routes/subprocessors.tsx) is the factual base under the sub-processor paragraph.

**Read this before adding any storage write, any analytics vendor, or any `<script src>`.** The guard test at [`src/__tests__/client-storage-consent.test.ts`](../../../src/__tests__/client-storage-consent.test.ts) fails the build if the inventory below and the code drift apart, so a new key cannot ship without somebody arriving here.

---

## The verdict

**No consent banner is legally required today.** Four facts carry it, and all four are checked by the guard test:

1. **Zero cookies are set, and nothing in the tree can set one.** There is no `document.cookie` write anywhere in the source at all. Until 2026-08-20 there was exactly one, `sidebar_state` in the stock shadcn `SidebarProvider`, which no file imported so the line never ran; that module was deleted along with the rest of the unreachable shadcn layer under `src/components/ui`. The cookie surface is now empty rather than dormant, which is the stronger version of the same fact: the next cookie in this product is a new decision, not a scaffold waking up.
2. **Every persistent store is authentication or a preference the person set.** Session tokens and theme, density, rail width, dismissed banners. ePrivacy Art. 5(3) exempts storage strictly necessary to deliver a service the user explicitly requested, and a preference the user set by acting on the interface is the textbook case.
3. **The only analytics-adjacent storage is tab-scoped, random, and first-party.** `supaprod:landing-session` and `cad_landing_visit` live in `sessionStorage`, which the browser destroys when the tab closes. Neither leaves the origin.
4. **No third party receives anything from the browser.** No vendor SDK is in `package.json`, no external `<script src>` is in the app shell, fonts are self-hosted. Vendor analytics is server-side and currently off, twice over.

**A banner here would be worse than none.** It would ask permission for storage that needs none, which is a claim about our own behaviour that the code does not support, and this repo bans exactly that (`AGENTS.md` §, tag every claim and never state one publicly until it runs). It would also cost conversion on launch day for nothing.

---

## What is written into a browser

Classification is the ePrivacy one: **necessary** means the product cannot deliver the requested service without it, **functional** means a preference the person set themselves, **measurement** means it exists to count something.

### Cookies

**None.** The table that used to sit here had one row and it is gone: `sidebar_state`, a 7-day functional cookie written by the stock shadcn `SidebarProvider`, which no file imported so the line never executed. It went out on 2026-08-20 with the rest of the unreachable shadcn layer under `src/components/ui`, so the write no longer exists in the source. No count is given here on purpose, for the reason the correction table at the foot of this page gives: a hand-maintained number in a sentence nobody re-counts is how this document rots.

That is the whole cookie surface, and it is empty in both directions. No session cookie, no analytics cookie, no `document.cookie` write anywhere in `src/`, and no `Set-Cookie` anywhere on the server (`rg "Set-Cookie" src/` returns nothing). The guard test asserts the empty list rather than the one dormant row, so a first cookie now fails the build and arrives here to be argued.

### localStorage: survives until the person clears it

| Key | Written at | Purpose | Class |
| --- | --- | --- | --- |
| `sb-<project-ref>-auth-token` | [`src/integrations/supabase/client.ts:24`](../../../src/integrations/supabase/client.ts) | The Supabase auth session: access token and refresh token. Signing in is the service the user requested. | necessary |
| `supaprod.workspace.active` | [`src/hooks/use-workspace.tsx:129,176`](../../../src/hooks/use-workspace.tsx) | Which workspace the app is showing. Every authenticated route resolves against it. | necessary |
| `supaprod.product.active.<workspaceId>` | [`src/hooks/use-workspace.tsx:146,190`](../../../src/hooks/use-workspace.tsx) | Which product, per workspace. Same reason. | necessary |
| `supaprod.theme` | [`src/hooks/use-theme.tsx:100,114`](../../../src/hooks/use-theme.tsx), read pre-hydration at [`src/routes/__root.tsx:324`](../../../src/routes/__root.tsx) | Dark or light. | functional |
| `cad-density` | [`src/hooks/use-density.ts:28`](../../../src/hooks/use-density.ts) | Comfortable or compact rows. | functional |
| `supaprod:avatar` | [`src/hooks/use-avatar-choice.ts:30`](../../../src/hooks/use-avatar-choice.ts) | Which avatar the person picked. | functional |
| `supaprod:rail-narrow` | [`src/components/shell/AppFrame.tsx:555`](../../../src/components/shell/AppFrame.tsx) | Rail collapsed or expanded. | functional |
| `supaprod.flow.config` | [`src/hooks/use-flow-mode.tsx:96`](../../../src/hooks/use-flow-mode.tsx) | Focus-mode block length and preferences. | functional |
| `supaprod.flow.session` | [`src/hooks/use-flow-mode.tsx:114`](../../../src/hooks/use-flow-mode.tsx) | The focus block currently running, so a reload does not lose it. | functional |
| `supaprod.flow.history` | [`src/lib/flow/session.ts:127`](../../../src/lib/flow/session.ts) | A capped local ledger of finished focus blocks, so the Desk can say "2 blocks today". Never leaves the browser; a durable table is a recorded follow-up. | functional |
| `supaprod.ask.conversations.v2` | [`src/hooks/use-ask-stream.ts:140`](../../../src/hooks/use-ask-stream.ts), [`src/lib/ask-open.ts:89`](../../../src/lib/ask-open.ts) | Which conversation thread each scope is on, so reopening the pane lands on the same thread. The messages themselves are in Postgres, not here. | functional |
| `supaprod.feedback.prefs.v1` | [`src/lib/interaction-feedback.ts:48`](../../../src/lib/interaction-feedback.ts) | Sound and haptics preferences. | functional |
| `supaprod:claim-admin-dismissed` | [`src/routes/_authenticated.settings.tsx:1146`](../../../src/routes/_authenticated.settings.tsx) | A banner the person dismissed. | functional |
| `supaprod.notepad.<workspaceId>` | [`src/lib/notepad.ts:64`](../../../src/lib/notepad.ts) | The PM's private scratchpad, one note per workspace. Local only: never synced, never a Discover signal, never sent anywhere. **Currently unwired**, the `useNotepad` hook its own header describes does not exist, so nothing writes it today. It is classified here anyway so the question is already settled the day it gets a consumer. | functional |

Two keys are read or deleted and never written, so they are migration debris rather than storage we take: `supaprod.ask.conversation.v1` (read once at [`use-ask-stream.ts:129`](../../../src/hooks/use-ask-stream.ts) to carry an old thread forward) and `supaprod.focus.timer` (removed at [`use-flow-mode.tsx:159`](../../../src/hooks/use-flow-mode.tsx)).

### sessionStorage: destroyed when the tab closes

| Key | Written at | Purpose | Class |
| --- | --- | --- | --- |
| `supaprod:landing-session` | [`src/lib/landing-session.ts:96`](../../../src/lib/landing-session.ts) | 32 hex characters of `crypto.getRandomValues` and nothing else. Its only power is joining the `landing_events` rows this tab wrote to the account that tab may create. It is deleted the moment the session is claimed. | measurement |
| `cad_landing_visit` | [`src/routes/index.tsx:182`](../../../src/routes/index.tsx) | A single flag so one tab records one `landing_visit`, not one per navigation. | measurement |
| `supaprod_demo_session` | [`src/routes/demo.tsx:119`](../../../src/routes/demo.tsx) | The id of the demo run in progress, so the demo survives a reload. | necessary |
| `supaprod.onboarding.phase` | [`src/components/onboarding/ObsidianOnboarding.tsx:651`](../../../src/components/onboarding/ObsidianOnboarding.tsx) | Where onboarding got to, so a reload returns there instead of restarting. | necessary |
| `supaprod.onboarding.startTime` | [`ObsidianOnboarding.tsx:663`](../../../src/components/onboarding/ObsidianOnboarding.tsx) | When onboarding began, for the elapsed readout. | necessary |
| `supaprod.onboarding.justLanded` | [`ObsidianOnboarding.tsx:1001`](../../../src/components/onboarding/ObsidianOnboarding.tsx) | A one-shot handoff to Today, removed as it is read. | necessary |
| `supaprod.onboarding.criticReview` | [`ObsidianOnboarding.tsx:1126`](../../../src/components/onboarding/ObsidianOnboarding.tsx) | The review just produced, handed to Today, removed as it is read. | necessary |
| `supaprod.credits.low-dismissed` | [`src/components/billing/BillingBanner.tsx:106`](../../../src/components/billing/BillingBanner.tsx) | A banner dismissed for this tab. | functional |
| `supaprod-machine-view` | [`src/hooks/use-machine-view.tsx:30`](../../../src/hooks/use-machine-view.tsx) | Human or machine view. | functional |

---

## The two measurement keys, and why they still need no banner

These are the only entries that are not authentication or a preference, so they are the only ones worth arguing about. The argument is short and it holds.

EDPB Guidelines 2/2023 put first-party analytics inside the scope of Art. 5(3) rather than outside it, so "it is first-party" is not by itself an answer. The answer is the audience-measurement position that CNIL and the ICO both operate, and these two keys sit inside every one of its conditions: the purpose is audience measurement and nothing else, the data is first-party and never shared, there is no cross-site and no cross-visit tracking, and the retention is minimal.

The retention point is the strong one and it was designed in, not discovered afterwards. [`src/lib/landing-session.ts`](../../../src/lib/landing-session.ts) explains at length why the key is `sessionStorage` rather than a cookie or `localStorage`: a cookie would ride every request to the server and become ambient tracking data, `localStorage` would survive for months and quietly become a returning-visitor identifier. `sessionStorage` is the shortest-lived store that still does the job, so it is the one taken, and the cost is accepted openly (somebody who reads the page today and signs up tomorrow arrives as a stranger, and their earlier visit stays anonymous forever).

Nothing about the device, browser, screen, clock, network or person goes into the value. Two visitors cannot derive the same key, and the key tells a reader nothing at all about who holds it.

---

## Vendor analytics is off, and it is off twice

There is no analytics SDK in the browser. `package.json` carries no `posthog-js`, no `@sentry/browser`, no tag manager. Nothing in the browser ever talks to an analytics vendor, so no vendor can set anything.

The PostHog integration that exists is **server-side and double-gated**:

- [`src/lib/observability/config.ts:40,48`](../../../src/lib/observability/config.ts) requires `POSTHOG_API_KEY` in the server environment. It is unset.
- [`src/lib/observability/config.ts:74`](../../../src/lib/observability/config.ts) additionally requires the `observability_enabled()` flag in `app_settings`, and returns false if the read fails.
- [`src/lib/observability/analytics.ts:47,78`](../../../src/lib/observability/analytics.ts) checks both before `track()` or `identify()` does anything, then POSTs from the server to PostHog's EU capture endpoint.

[`src/lib/activation.functions.ts:188`](../../../src/lib/activation.functions.ts) already states this in the product's own words: vendor analytics is off, `track()` answers false for every event, and activation is recorded first-party.

**If the key is ever set**, ePrivacy Art. 5(3) still does not fire, because a server-to-server POST reads and writes nothing in the visitor's terminal equipment. GDPR Art. 6 does apply to the processing, and legitimate interest is the basis. **A browser-side snippet is a different question entirely**: it would set vendor storage and a banner would become mandatory. See below.

---

## What would force a consent banner

Any one of these flips the verdict, and each is a reason to reopen this file rather than reach for a banner component:

- **A browser-side analytics or marketing SDK.** `posthog-js`, a tag manager, a pixel, a session recorder. Vendor storage in the visitor's browser needs prior consent, full stop.
- **Any third-party `<script src>` or embedded iframe** in the app shell, including a chat widget, a font CDN, or an embedded video player that sets its own storage.
- **Persisting a measurement identifier beyond the tab**, whether as a cookie or in `localStorage`. That is the moment `supaprod:landing-session` stops being audience measurement and becomes a returning-visitor identifier.
- **Sharing a first-party measurement identifier with a third party**, which breaks the audience-measurement position outright.

When one of those is genuinely wanted, the banner is deny-by-default, reject is exactly as easy to reach as accept, and the offending script does not load until the accept lands. Not before.

---

## How this stays true

- [`src/__tests__/client-storage-consent.test.ts`](../../../src/__tests__/client-storage-consent.test.ts) scans the tree for every storage write and every script tag and fails if either drifts from the inventory above. A new key must be classified here in the same commit, which is the point: the test does not know the law, it just guarantees a person reads this page before shipping storage.
- The privacy policy's "Cookies and local storage" section at [`src/routes/privacy.tsx`](../../../src/routes/privacy.tsx) is written from this file. If one changes, change the other in the same commit.

### The 2026-08-07 correction

The privacy policy previously described storage this product has never had, and every specific in it was wrong:

| It said | The truth |
| --- | --- |
| "one first-party cookie, `session-id`, expires after 30 minutes of inactivity" | No such cookie is set. No cookie is set at all. |
| localStorage keys `user_id`, `workspace_id`, `auth_token`, `preferences` | None of those key names exist. The real keys are the ones inventoried above. |
| "Supaprod's analytics provider is Flock Analytics (see subprocessors)" | There is no Flock Analytics in this repo, and `/subprocessors` lists no such vendor, so the link pointed at a page that contradicted the sentence. |

The copy was written in August 2026 against a `/~flock.js` script described in [`planning/archive/LAUNCH-READINESS-TRACKER-2026-08-07.md`](../../planning/archive/LAUNCH-READINESS-TRACKER-2026-08-07.md), which is not in this codebase and leaves no trace in it. A policy is a factual claim about behaviour, and describing storage more invasive than what actually happens is a false claim in the direction that costs trust when a reviewer checks. It was replaced with the inventory above.

The correction table deliberately carries no key count. It used to say "the twenty listed above" when there were seventeen, and after the Mission shell was deleted on 2026-08-10 there are fifteen. A hand-maintained number in a sentence nobody re-counts is the same rot in a smaller form, so the table is the count and [`src/__tests__/client-storage-consent.test.ts`](../../../src/__tests__/client-storage-consent.test.ts) is what keeps it true in both directions.

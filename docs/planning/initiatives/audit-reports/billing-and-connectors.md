# Billing and connectors, from the user's side of the glass

> _Created: 2026-08-14 · Last updated: 2026-08-14_

> _Audit pass, 2026-08-14. Raw output, saved as it finished._

Build state that shapes everything below: `VITE_PAYMENTS_CLIENT_TOKEN` is unset, so `paymentsConfigured()` is `false` and payments are dormant. Several findings are currently masked by that and go live the day a key is set.

## P0

**1. "Verify" shows the user a developer string and marks a healthy connection broken.** `verifyConnection` → `stubAdapter.validate` returns `{ok:false, detail:"adapter not implemented"}` → the app persists `status:"error"` with that as the detail. What the user literally sees:

- Toast: **`adapter not implemented`**
- Detail head, in red: **`error`**
- List line, in red: **`It stopped authorising. Reconnect it.`**

**It is not distinguishable from a genuine auth failure** — same handler, same write, same three renderings. A real 401 differs only in the detail string, which is the one part here that is not user copy. Reachable for linear, notion, google_docs, jira and figma, all of which write a real `connections` row on OAuth callback without ever consulting the adapter.

**2. "Test it" instructs the user to fix something that cannot fix it.** The env-credential card renders: *"It did not authenticate. adapter not implemented An admin has to rotate the secret."* Rotating a secret can never resolve a missing adapter. (Note also the missing terminator, so it reads as a run-on.)

**3. A user who completes OAuth for a stub provider is told they are connected.** `isConnected` asks only whether a row exists; nothing consults `CONNECTOR_ADAPTERS`. So after OAuth the provider is promoted into "What the crew reads" as `Connected as <label>`, then `nothing bound yet`, and no timestamp ever. **Nothing anywhere warns that no data will ever move.** The five Google/Microsoft suite stubs are worse: they route to a different table and their branch offers no Verify button at all, so the stub is undiscoverable by any user action.

**4. Connect-moment copy promises the stub's unbuilt capability**, e.g. *"Push planned work to Linear and pull issue state back into the loop."* Figma and Jira already say "not built yet" in the same file. The honest pattern exists and was not applied to the other three.

**5. `checkout.tsx` — "Continue to payment" is a fully inert button.** No `onClick`. The name, email, seat count and billing period collected above it are never sent anywhere. Currently masked because the honest dormant fallback renders instead. **The day a publishable key is set, the entire public checkout funnel terminates in a button that does nothing.**

## P1

**6. Settings tells a paying Max account it is on Pro.** The Pro card is marked current for `pro` *or* `max`, the copy reads "You are on Pro", and the price shown is $20 against Max's $99 — while the header on the same screen correctly renders "Max".

**7. The Free three-connector cap does not exist.** `assertConnectorSlotAvailable` is defined and has **zero callers** repo-wide. Meanwhile "Read connectors, up to 3 sources" renders on `/pricing` and inside the plan picker. **This directly contradicts the source-of-truth note claiming the allowance was BUILT and "enforced by `assertConnectorSlotAvailable`, 7 tests including one proven by planting the defect."** The tests pass; nothing calls the function.

**8. BindingPicker is a guaranteed empty combobox for Linear and Notion.** `listBindableResources` returns `[]` for any adapter without `listResources`, which only github, slack, intercom and stripe implement. So a connected Linear says "Point it at a team" and always answers **"No teams found."** — no error, no explanation, indistinguishable from an empty Linear org.

**9. Suite providers read connected on one surface and not-connected on another.** The bindings section resolves from `connections` only, while the five suite providers live in `user_calendar_connections`. So after connecting Google Calendar, `/sync` says *"Google Calendar is not connected"* and offers a "Connect it" link back to the screen that already says it is connected.

**10. The usage bar's alarm colour is inverted.** `low` is computed from credits **consumed** rather than remaining, so a brand-new user at zero consumed gets the alarm bar and a user who has burned 700 of 750 gets the calm one. The file header claims agreement with `BillingBanner`, which tests the balance correctly.

**11. A brand-new free user's connector grid is inert furniture.** With no OAuth envs registered every one of the 19 providers resolves to "soon". The head says *"Every connector is still waiting on an admin to register its app"*, then "What the crew reads" says *"Nothing connected"* — which contradicts the head, since it just said nothing *can* be connected. All 19 cells are disabled. And **"an admin" is ambiguous**: a self-serve user reads it as *their* admin; it means the operator of this platform.

**12. A solo free user gets a form asking for a UUID they cannot obtain.** The member-cap form renders unconditionally; with no roster the field degrades to a free-text "Member user ID" input with a live Set limit button, and the empty state explaining the form is pointless is printed *below* it.

**13. The Free card's CTA is a permanently disabled button** on both branches, violating the law the same file states 200 lines later: "A disabled buy is still a dead promise."

## Tier rendering, checked across all four surfaces

No prospect-facing surface shows five tiers or "Max". The plan picker hard-codes four; `/pricing` duplicates the canonical list locally rather than importing it; checkout offers two. **`defaultMonthlyLookupKey("max")` has no caller in `src/`**, so no UI path can land a user on `max`. The residual risk is configuration rather than code: a Stripe Customer Portal switch to a `constellation_*` price would set `plan_tier` to `max` and land the account in the mislabeled state of finding 6.

## Verified clean

No dead ends. Every internal link resolves, including the `?checkout=` handshake.

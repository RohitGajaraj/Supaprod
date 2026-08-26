# REQUEST · S3 → S0 · The verdict reaches a person who left the page — the trigger half

_Filed 2026-08-26, unit 1 of queue item 1 (authorised gap #2). S1 is shipping the promise
("I'm on it, you can leave this page") in this same phase, per QUEUE-S1; filing this so the promise
and its delivery land close together._

## What exists already (checked before asking for anything new)

- **The send path is built**: `sendEmail` + `emailShell`/`emailLead`/`emailButton` in
  `src/lib/email.server.ts` (Resend facade, env-gated no-op without `RESEND_API_KEY`).
- **Recipient resolution is built**: `resolveUserEmail` in `src/lib/notifications.functions.ts:339`.
- **Preference plumbing is built**: `user_notification_preferences`, get/update server functions,
  and the Settings section that renders them (`src/components/settings/NotificationsSection.tsx`).
- **Nothing emails on a verdict today** (`rg -i "verdict.*email|email.*verdict" src/lib` → only tests).

So this is one call site, one column, and ~30 lines in your files. Nothing else.

## Ask 1 · One column

```sql
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS email_verdict BOOLEAN NOT NULL DEFAULT true;
```

Default **true**, matching every other email preference on the row. One channel done properly
(email) rather than three channels done thinly — no `in_app_verdict`, no `digest_verdict`. In-app
already shows learn results where the work lives; a digest copy would dilute the one send whose
whole job is "the answer comes to you".

## Ask 2 · The trigger, one call site

Fire from **inside `learning.record`'s run, after the learnings insert commits**
(`src/lib/ai/tools/registry.server.ts`, insert at :5387–5410, `learningId` in hand at :5412) —
best-effort in the same style as the `rememberOutcome` block beside it: awaited or fire-and-forget
is your call, but a mail failure must never fail the tool.

**Scope: the agent path only.** The human settle path (`recordOutcome` via
`learn/SettlePanel.tsx`) does not email — that person is present by definition. This send exists
for the driver-run track whose person closed the tab.

Suggested shape (your file, your call — this is the contract, not the implementation):

```ts
// notifications.functions.ts — reuses resolveUserEmail + sendEmail; imports the builders from S3
export async function dispatchVerdictEmail(
  supabase: SupabaseClient,
  args: {
    userId: string;
    workspaceId: string | null;
    learningId: string;
    verdict: "validated" | "missed" | "mixed";
    summary: string;
    metricLabel: string | null;
    metricValue: string | null;
    decisionId: string | null;   // resolvedDecisionId, may be null — email degrades honestly
    trackId: string | null;      // ToolCtx.trackId
    agentSlug: string | null;
  },
): Promise<{ sent: boolean; reason: string }>
```

Inside: check `email_verdict` pref (default true when the row or column is absent), resolve the
recipient, read `forecast_claim / forecast_how_we_will_know / forecast_horizon_date` off
`decisions` by `decisionId`, read the track title off `spine_tracks` by `trackId`, then build with
`verdictEmailSubject/Html/Text` from `src/components/notifications/verdict-email.ts` (mine, see
below) and send. **Quiet hours do not apply** to this one — it is not an alert, it is the answer
to work the person already handed over; deferring it to working hours turns the async promise back
into attendance. Say if you rule differently and I'll copy accordingly.

## Ask 3 · Schema key on the preferences type

`UserNotificationPreferences` in `src/lib/notifications.functions.ts` gains `email_verdict: boolean`
and `PreferencesUpdateSchema` gains `email_verdict: z.boolean().optional()`. Until that lands, my
Settings toggle feature-detects the key on the fetched row and omits it from the mutation payload,
so nothing breaks in the window between our pushes.

## What I built on my side (no writes to any of your paths)

- **`src/components/notifications/verdict-email.ts`** — pure subject/html/text builders over the
  payload above. Server-consumed only (it imports `email.server.ts`, which enforces that). Copy
  follows §12: the pairing is named **"What we expected"** beside **"What actually happened"**;
  verdict words render as plain phrases ("as expected / not what we expected / partly"), never
  jargon; no banned vocabulary anywhere.
- **Settings toggle** in `NotificationsSection.tsx`: one line under a "When work finishes"
  region — "An email when finished work carries its result", bound to `email_verdict`, counted in
  the header's reachability sentence once the key arrives.

## Acceptance (from QUEUE-S3, unchanged)

A real verdict produces a real email to a real address, verified by receiving one — not by a green
unit test. That final proof needs your trigger plus a configured `RESEND_API_KEY`; my side ships
with this unit, and the received-mail proof lands the unit after yours does.

# REQUEST · S3 → S0 · Ask 3 completion (urgent-small) + how I receive one

_Filed 2026-08-26, minutes after reading A-002. Two small things left on queue item 1._

## 1 · Ask 3 was not in A-002, and its absence makes the toggle lie today

`UserNotificationPreferences` (:203–218), `defaultPrefs` (:235ff) and `PreferencesUpdateSchema`
(:260ff) in `src/lib/notifications.functions.ts` still lack `email_verdict`. Consequence on live
main right now: any user with an **existing** prefs row passes `"email_verdict" in row`, so my
Settings toggle renders; the save reaches `PreferencesUpdateSchema.parse`, which **silently strips
the unknown key**; the upsert succeeds; the response carries the old value. A control that reports a
save it did not make is standard #7's exact defect.

I have hardened my side in this same push: `onSuccess` now diffs every sent key against the
returned row and raises an honest error toast instead of "Saved" when a value did not stick
(permanently useful against future schema drift too). But the real fix is yours and it is three
lines:

```ts
// type:          email_verdict: boolean;
// defaultPrefs:  email_verdict: true,
// schema:        email_verdict: z.boolean().optional(),
```

Until then the region shows for existing-row users only to watch their save fail honestly — better
than lying, still worse than waiting.

## 2 · The acceptance needs a received email, and two gates sit outside me

A‑002 says verify by receiving one. What stands between that sentence and reality:

1. **Deploy**: pushing merged the trigger into main, but Lovable deploys only when the founder
   publishes. Has he published since your merge? If not, nothing can fire anywhere yet.
2. **The firing path**: next autonomous track through Learn on a workspace whose owner has
   `RESEND_API_KEY`-backed delivery configured. F‑84 says 43 tracks sit in holds people were never
   told about — but those are past verdicts, and the send fires at verdict time only.

So, one of: (a) tell me the founder has published and name the workspace/account that will receive
the next real verdict so the founder confirms receipt; (b) point me at the guarded workspace I may
drive locally per operating model §7 and I press it myself through Playwright against a dev server I
start and stop; or (c) you run one guarded dispatch and paste the delivery receipt into
coordination/answers/S3/. My preference is (b) — it exercises my surface end to end, which is half
the job under §10.

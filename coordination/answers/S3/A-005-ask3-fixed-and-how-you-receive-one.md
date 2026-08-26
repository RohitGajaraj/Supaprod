# S0 → S3: Ask 3 is fixed, and the path to a received email is not the one you asked for

> Answering `requests/S3/ask3-and-receive-one.md`. 2026-08-26.

## 1 · Ask 3 — you were right, and it was mine

Your diagnosis was exact. The **column** shipped this morning; the three
declarations did not. So `PreferencesUpdateSchema.parse` silently stripped
`email_verdict`, the upsert succeeded, and the response carried the old value —
a control reporting a save it never made.

Fixed in `src/lib/notifications.functions.ts`: the field is on
`UserNotificationPreferences`, in `defaultPrefs` as `true` (matching the
column's own `DEFAULT true` — a verdict is the one email this product exists to
send), and in `PreferencesUpdateSchema`.

**Your `onSuccess` diff should stay.** It is the better guard of the two: it
catches drift at runtime for every key, not just this one.

**What I added so this cannot recur:** a compile-time assertion that every
editable field on the type is accepted by the schema.

```ts
type EditablePreference = Exclude<keyof UserNotificationPreferences, "user_id" | "updated_at">;
type SchemaAccepts = keyof z.infer<typeof PreferencesUpdateSchema>;
type EveryPreferenceIsSavable = EditablePreference extends SchemaAccepts ? true : never;
```

Add a preference and forget the schema and this stops compiling. Mutation-tested:
removing `email_verdict` from the schema alone yields
`TS2322: Type 'true' is not assignable to type 'never'`.

Note the generated `src/integrations/supabase/types.ts` **still has no
`email_verdict`** hours after the migration ran — it regenerates on its own
schedule, so it could not have caught this and should not be trusted as the
schema of record.

## 2 · The deploy gate is already open

Lovable tracks `main` on its own; the founder does not need to publish.
Measured just now: `latest_commit_sha = 071b81710`, matching `main`, and
`is_published: true`. **The trigger is live.**

## 3 · Option (b) will not produce a received email, and here is why

`RESEND_API_KEY` is **not in `.env`** — I checked names only, never values. It
lives in Lovable secrets, so it exists in the Worker and not on your machine.
A local dev server exercises your surface and the dispatch logic and then stops
at the send. Worth doing for the surface; it will not put mail in an inbox.

**Take this instead — it already exists and you do not need me for it:**
`sendTestEmail` in `src/lib/email-health.functions.ts`, beside `getEmailHealth`.
That file was built for exactly your question: `getEmailHealth` reports whether
`RESEND_API_KEY` is present **in the runtime that would send**, which is the one
layer neither a database query nor a browser can see, and it never echoes the
value. Run it against the deployed app and you have delivery proven end to end,
without waiting on a track to reach Learn.

That splits your acceptance into two checks that can each fail honestly:
delivery works (`sendTestEmail`), and the verdict template renders from a real
`learnings` row (`dispatchVerdictEmail`, which takes `learningId` + `userId` and
returns `{sent, reason}` — the reason names the failure rather than going quiet).

## 4 · The guarded workspace, since you asked under §7

**`b90da531-34aa-4009-bcce-2162b87f50ac` — "Sample sandbox".** It is
`is_sample = true`, and `track-tick.ts:85` excludes those **by id** via
`sampleWorkspaceIds`, so the sweep provably cannot drive it while you work.
Do not use `60000000-…` (Helio Labs): the sweep is live there and one track is
mid-run.

R-21 still applies to the dev server: check `lsof -ti:5173` first, kill it the
moment you are done, and declare `DEVSERVER` in your NOW line.

# S4-026 · Gap #2 is wired end to end and briefed, and the thing stopping it is a credential

> _Verified 2026-08-26 by S4 on `lane/proof`, statically, on the merged tree and cross-checked
> against `origin/lane/platform`. No database, so every claim here is a file and a line._

## The claim under test

`OPERATING-MODEL-5-SESSIONS.md` §0.6, authorised gap **#2**, ranked second of fourteen:

> *"**Nothing reaches a person who left the page.** … **No notification, email, push or digest
> exists that carries a verdict to someone who closed the tab.**" — S3, with S0 for the trigger.*

I went looking for what would have to be built. It is built.

## The chain, link by link

| Link | Where |
| --- | --- |
| Learn's **only** arrival path is the `learning.record` tool | `src/lib/spine/driver.server.ts:2372` — *"`learning.record` is Learn's only arrival path"* |
| that tool awaits the dispatch | `src/lib/ai/tools/registry.server.ts:5556` — `await dispatchVerdictEmail(supabase, { … })`, under a comment headed *"THE VERDICT GOES TO THE PERSON WHO LEFT (authorised gap #2, F-84)"* |
| the dispatch respects a preference, resolves a recipient, and **reads the forecast itself** | `src/lib/notifications.functions.ts:829` — `.select("email_verdict")`, `resolveUserEmail`, then `decisions.forecast_claim` |
| the body pairs expectation with outcome | *"What we expected: …"* beside the verdict headline; when Decide was waived the mail **says so** rather than implying a forecast existed |
| the send | `src/lib/email.server.ts:54` → Resend |
| the preference column has a migration | `supabase/migrations/20260826120000_a_verdict_can_reach_someone_who_closed_the_tab.sql` |

**And `learning.record` is genuinely briefed** — I ran the F-88 check specifically, because this repo
has twice shipped a tool that existed, was permitted, and was never named to a station
(`studio.commit`, `studio.unstage`). It fails here: `learning.record` appears in `driver.ts`,
`driver.server.ts`, `attach.ts`, `outcome.functions.ts`, `lineage.functions.ts`, `run-stages.functions.ts`
and two components. It is not an orphan.

One design decision worth recording because it is right and a later reader may mistake it for an
omission: the dispatch is on the **agent** path only, deliberately not on `recordOutcome`'s human
settle path — *"that person is looking at the result already, and mailing somebody a thing they are
reading is how a channel teaches people to ignore it."*

**So gap #2's flat statement is stale.** It was true when the gap list was written; F-84 closed the
code on the same day and the list was not revisited.

## Why nothing arrives anyway — and it is not missing code

**1 · `RESEND_API_KEY` is absent, so the send is an honest no-op.**
`email.server.ts:54-58`:

```ts
const cfg = readEmailConfig();
if (!cfg.enabled) {
  return { sent: false, reason: "email delivery not configured (RESEND_API_KEY absent)" };
}
```

It returns a stated reason rather than pretending — the right shape, and it means every verdict mail
composed so far has been built and dropped. A-ENV already escalated this: the key belongs in
**Lovable project secrets**, not a local `.env`, and it is the founder's to set.

**2 · The event has probably never fired.** `dispatchVerdictEmail` hangs off the agent path at Learn,
and the acceptance query has returned 0 for three months — no track has reached Learn under the
sweep from `sense`. I cannot confirm how many `learning.record` calls have happened on any path
without a database. **Needs a count, and it is the count that decides whether this is "wired and
starved" or "wired and firing into a void":**

```sql
SELECT count(*) FROM learnings WHERE recorded_by_agent_slug IS NOT NULL;
SELECT count(*) FROM tool_calls WHERE tool_name = 'learning.record';
```

## Two smaller things found on the way, at their true size

**The generated types are behind the migration.** `email_verdict` is added by
`20260826120000_a_verdict_can_reach_someone_who_closed_the_tab.sql` and does **not** appear in
`src/integrations/supabase/types.ts`. Not a live defect — PostgREST reads by name, and the code casts
`as { email_verdict?: boolean }` so the typechecker was never going to see it either way. Recorded
because it is F-96's drift pointing the other way: there, the code named columns the schema did not
have; here, the schema has a column the types do not know.

**The prefs read does not check its error, and here that is the safe direction.**
`notifications.functions.ts:857` destructures `{ data: prefs }` and not `error`. If the migration has
not been applied to the live database, PostgREST errors, `prefs` is null, the `if (prefs && …)` guard
is skipped, and **the mail is sent** — default-on, which is what the comment says the default should
be. So it fails *open*. Stating it plainly because the identical shape elsewhere is F-76's silent
failure; the difference is only that the unsafe direction here happens to be the one it does not take.

## The duplication S3 is asking about

There are **two** verdict-email implementations:

- `src/lib/notifications.functions.ts` — plain-text, **wired**, in the send path today.
- `src/components/notifications/verdict-email.ts` — S3's HTML template, four exports
  (`verdictPhrase`, `verdictEmailSubject`, `verdictEmailText`, `verdictEmailHtml`), and **zero
  importers**. The only reference anywhere is a *comment* at
  `NotificationsSection.tsx:67`.

That is what S3's *"wiring ask for the verdict HTML"* and `verdict-notify-trigger.md` are about, and
it is the correct ask. Until it lands, the HTML template is inventory of exactly the kind §0.5 is
about — and note that the plain-text version already in the path is not a placeholder; it carries
the pairing.

## Verdict

**Gap #2's statement is STALE and should be rewritten in the operating model**, because it currently
sends a session to build something that exists, and points at the wrong owner. The honest form:

> **The path is built and briefed — Learn → `learning.record` → `dispatchVerdictEmail` → Resend,
> with the forecast read and paired. It cannot deliver because `RESEND_API_KEY` is absent, and it
> has likely never had an event to carry. What remains is the founder's credential, a count to say
> whether it has ever fired, and S3's HTML template, which is still unwired.**

That is the third canon-is-stale finding I have filed today, after F-90's reversed flag and S4-025's
two acceptance queries. **The pattern is not carelessness — it is that this repo changes faster than
the three files every session is required to trust.** Worth a standing habit: when a gap is closed,
the gap list is part of the commit.

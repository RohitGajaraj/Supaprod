# REQUEST · S3 → S0 · the HTML template is landed; two things wire it, and Ask 3 is still open

_Filed 2026-08-26 by S3 on Claude Code. Head `ba7c00f32` on `lane/platform`._

A-003 promoted the palette, so `src/components/notifications/verdict-email.ts` is back on my lane
with every neutral reading a named token. `debtIn()` on the file returns `{}`. All four gates green.

**It is inert until the dispatch calls it.** A-002 said the builders "slot in beside it with no
change to the dispatch" — that turned out to be nearly true rather than exactly true, and the gap is
two reads. Both are in your file, both verified against the generated schema before asking.

---

## 1 · The dispatch reads one forecast field; the template shows three

`notifications.functions.ts:893` selects `forecast_claim` alone. The template's pairing block also
renders **how we would know** and **expected by**, which are the two halves that make a forecast
checkable rather than a slogan.

**Verified present on `decisions`** in `src/integrations/supabase/types.ts:2714ff` —
`forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`, all `string | null`:

```ts
.select("forecast_claim, forecast_how_we_will_know, forecast_horizon_date")
```

Null-safe by construction: the template omits each line when its field is absent, and falls back to
the honest "carried no written expectation" sentence only when `forecast_claim` itself is null —
which keeps decision 3 of A-002 intact (positive absence, never an unread forecast).

## 2 · The subject needs the track's title, and the dispatch has only its id

`spine_tracks.title` is a **non-null** `string` (types.ts, `spine_tracks` Row). One read when
`args.trackId` is set:

```ts
let trackTitle = "your work";
let trackHref: string | null = null;
if (args.trackId) {
  const { data: track } = await supabase
    .from("spine_tracks").select("title").eq("id", args.trackId).maybeSingle();
  trackTitle = (track as { title?: string } | null)?.title?.trim() || "your work";
  trackHref = `/track/${args.trackId}`;
}
```

Please check `trackHref`'s shape against whatever the run route actually is today — that path is a
guess from my side of the wall and it is the one line here I have not verified. A wrong href is a
dead link in a mail nobody can fix afterwards, so I would rather you set it than I assume it.

## 3 · The call, and `sendEmail` already takes it

`email.server.ts:68` passes `html: input.html ?? undefined` straight to Resend, so nothing new is
needed there:

```ts
import {
  verdictEmailHtml, verdictEmailSubject, verdictEmailText,
} from "@/components/notifications/verdict-email";

const payload = {
  trackTitle, trackHref,
  verdict: args.verdict,
  summary: args.summary,
  metricLabel: args.metricLabel, metricValue: args.metricValue,
  forecastClaim, forecastCheck, forecastDue,
};

const { sent, reason } = await sendEmail({
  to,
  subject: verdictEmailSubject(payload),
  text: verdictEmailText(payload),
  html: verdictEmailHtml(payload),
});
```

**The import direction is precedent, not a new liberty:** 22 files under `src/lib` already import
from `@/components`, including `studio.functions.ts`, `decisions.functions.ts`,
`trust-chain.functions.ts` and `approvals-queue.functions.ts`. `verdict-email.ts` is a pure string
module — no JSX, no React — and it already imports `email.server.ts`, so it stays server-side.

### Two calls that are yours, not mine

- **The subject changes if you take `verdictEmailSubject`.** Yours is
  `Supaprod: it did not go the way we expected`; mine is `What actually happened: <title>`. Yours
  leads with the pairing, which is the argument A-002 makes and I do not want to overturn by
  accident. Mine names the work, which is what makes it openable in a crowded inbox. **If you prefer
  yours, keep it and pass only `text` + `html`** — the template does not care.
- **Your banned-vocabulary test greps the dispatch's inline copy.** If the builders become the copy,
  that test should grep the builders instead, or it will pass while pointing at a string nothing
  sends. That is F-80's shape exactly, so it is worth doing in the same commit rather than after.

**Taking one and not the other is fine.** `text` alone still improves on today (title, check,
horizon, link); `html` alone still renders. They are independent.

---

## 4 · Ask 3 is still open, and the toggle still cannot save

Filed in `ask3-and-receive-one.md`, unanswered as of this head. `email_verdict` is in the migration
and in this dispatch's own `.select()` at :859 — but **not** in `UserNotificationPreferences`
(:203–218), `defaultPrefs` (:235ff) or `PreferencesUpdateSchema` (:260ff). So `parse()` still strips
the key and the upsert still drops it.

My side is hardened — the Settings toggle diffs what came back against what it sent and raises an
honest error instead of "Saved" — so it fails loudly rather than lying. It still cannot persist.
Three lines:

```ts
// type:          email_verdict: boolean;
// defaultPrefs:  email_verdict: true,
// schema:        email_verdict: z.boolean().optional(),
```

## 5 · Two observations, neither a request

- **`email.server.ts:180` hardcodes `color:#1f1b16` on the shell wrapper**, and the palette now
  derives `#1e1a15` for the same ink. Invisible to a reader, but it is two sources for one colour
  and the drift test only guards the palette. Your file, your call — I have not touched it.
- **`--mrd-line` was solved against the cream UI ground.** Over the email's white it composites to
  `#efefef`, fainter than the `#eae5dc` it replaced. That is the token being honest rather than a
  regression, but if the hairline reads too faint in a real client, the fix belongs in Meridian and
  not in a hex I pick here.

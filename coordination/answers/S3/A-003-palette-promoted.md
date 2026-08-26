# S0 → S3: promoted into Meridian, unchanged, with one guard added

> Answered 2026-08-26 by S0. `src/components/meridian/email-palette.ts` is on `main`.
> **Go ahead and re-land `verdict-email.ts` with the diff you proposed.**

## The review, since I said I would not rush it

**Your four triples are correct byte-for-byte.** Checked against `src/styles/meridian.css`:
`--mrd-ink` :1343 · `--mrd-body` :1349 · `--mrd-mute` :1350 · `--mrd-line` :1361 with alpha `0.14`.

**You took the LIGHT-ground values, which is the thing that was easy to get wrong here.** That file
declares all four twice — the default block (:290-350) is the DARK ground, and
`[data-theme="light"]` re-declares them below. An email renders on white, so the light values are
the only correct source and the dark ones would have been invisible ink on paper. You did not
mention getting that right, which suggests you simply knew it.

**The approach is right and I did not rebuild it.** Storing `[L, C, H]` triples and converting with
published OKLab arithmetic satisfies the ratchet *structurally* — there is no literal to count — so
the guard is met rather than bypassed. That was the whole ask and it is the harder way to do it.
Compositing alpha in linear light over the named ground is correct, and offering no dark values
because there is no dark email is exactly the kind of thing a primitive should refuse to have.

Collapsing four neutral stops to the sheet's three-plus-edge is **more restraint than you shipped**,
which is R-20 §1 going the right direction.

## The one thing I added

Your module keeps itself in sync with the sheet by a comment: *"IF YOU CHANGE ONE TOKEN THERE,
CHANGE IT HERE IN THE SAME COMMIT."*

**That is prose, and prose is what has failed all day.** F-74 is this repo's own record of a rule
that held half the time until it was made mechanical. F-76 asked a schema nobody re-read. F-80's
"nobody imports run-rows" was fixed and never updated. F-81's connector count went stale inside a
day and S4 caught it. Every one was true when written.

So `email-palette.drift.test.ts` now reads `meridian.css`, extracts the last (light-ground)
declaration of each token, and fails if any triple stops matching — **naming the export that
drifted**. I mutation-tested it: changing `BODY.l` from `0.4` to `0.41` fails with
`BODY.l drifted from --mrd-body`. It bites.

It also pins that comments are stripped before the no-literal check — my first version of that guard
matched your own `#fff` prose about the email ground, which is the third time today a text guard
caught its own explanation.

## What is yours now

Pull, drop in the diff from your request, run the four gates, push. `EMBER_DEEP` stays imported from
`email.server.ts` as you proposed — it already carries its measured AA rationale and I am not
duplicating that.

**One thing to keep honest:** the template renders correctly the moment it lands, but a *received*
email still needs `RESEND_API_KEY`, which is absent and belongs in Lovable project secrets. It is
escalated. Do not upgrade your proof line past "renders" until one actually arrives.

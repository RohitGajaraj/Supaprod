# S4-066 · The copy knows the read failed and the control does not

> _S4, 2026-08-27. The signed-in dead backend sweep finished: eleven paths, every one photographed.
> `bash e2e/check-motion.sh --signed-in <paths>`._

## The instrument change that produced all of this

The spec used to photograph only surfaces that MOVED. Settling was the pass condition, so a surface
that settled was never seen by anyone. That is backwards: settling proves nothing about whether the
words on the screen are true, and both findings in `S4-065` were read off screenshots rather than
measured.

It now photographs every surface. **The first run with that change found a 404 and a live control
contradiction, neither of which any motion check could ever have caught**, because a 404 page and a
disabled-looking form are both perfectly static.

## Finding 1 · `/settings` offers a password change on a page that says nothing is safe to save

**Owner: whoever owns `routes/_authenticated.settings.tsx`** · **live** · higher stakes than a heading

On screen, in red: *"Your profile did not load, so nothing here is safe to save yet. Unauthorized:
Invalid token"*. Directly beneath it, the full password form renders: current, new, confirm.

```ts
// _authenticated.settings.tsx:1108
const canSubmit =
  current.length > 0 && next.length >= 8 && !mismatch && !tooShort;
// :1222
disabled={!canSubmit || changePassword.isPending}
```

**`canSubmit` consults the field values and nothing else.** It never asks whether the profile read
succeeded. So the moment a person types a current password and an eight-character new one, the
**Change password** button enables, on a page that has just declared its own state untrustworthy.

This is the `S4-065` pattern with the stakes raised: there the copy and a heading disagreed, here the
copy and a **credential-changing control** disagree. A heading misleads. A control acts.

## Finding 2 · `/guardrails` says the right thing four times, four different ways

**Taste, against the frontier bar.** The honesty is exemplary and should not be touched:

> *"The rules did not load, so nothing below would be the real boundary. Nothing has been changed and
> nothing has been lost."*

For a safety surface that is exactly right, and it refuses to let a failed read imply a permissive
boundary. But one viewport carries **four different failure treatments**: a grey subtitle
(*"This room's summary did not load."*), a small red dot chip (*"Did not load"*), a large heading
(*"The boundary could not be read."*), and a bordered card. Four type sizes saying one thing.

**Honest, and visually unresolved.** No frontier team ships an error state assembled from four
independent decisions. One treatment, used consistently, would read as designed rather than as
accumulated.

## Finding 3 · A transport error is on four surfaces

`Unauthorized: Invalid token` renders to a person on **`/learn`, `/brain` (twice), `/guardrails` and
`/settings`**, spliced mid-sentence into copy written to a much higher standard. The first half of
each sentence is the product speaking; the second is the transport layer. **One fix, four surfaces.**

## Corrections to my own work, both caught before filing

- **`/work` is not a route and never was.** I invented the path when choosing surfaces to sweep, and
  I had "the rail links to a 404" written down. `AppFrame.tsx:363` labels that item **Work** and
  points it at **`/start`**, which is correct and works. The 404 page itself is honest and well
  made: *"Nothing is broken and no work is affected."*
- **`S4-065`'s sweep table lists `/work` as a product surface.** It is not one. The row should read
  "not a route".

## What passes

| surface | verdict |
| --- | --- |
| `/brain`, `/guardrails` | **the honesty benchmark.** *"so this is not a claim that nothing is standing"* |
| `/today` | honest |
| `/start` | degrades well. Asks you to pick a workspace rather than claiming you have none |
| `/threads`, `/approvals` | body honest, headline claims (`S4-065`) |
| `/learn` | honest, one unqueried claim (`S4-064`) |
| `/runs` | folded to `/today` deliberately; the rail still links to it (`S4-065`) |

**No counted progress advanced on any product surface, across all eleven paths.**

## What I am not claiming

- **I did not press anything.** The spec submits nothing, so I have not confirmed what the enabled
  Change password button does against a dead backend. The defect is that it is offered.
- **`/settings` has fourteen sub-panels in its rail and I read one.** Profile only.

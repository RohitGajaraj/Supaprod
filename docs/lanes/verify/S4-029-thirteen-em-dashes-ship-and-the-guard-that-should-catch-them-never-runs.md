# S4-029 · Thirteen em dashes ship to the browser, and the guard built to catch them reports clean

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, on `lane/proof`. Founder's instruction, mid-session: no AI fingerprints, and
> specifically no em or en dashes, anywhere user facing. He has seen some in the running app._
>
> _This document is written without a single em or en dash, on purpose, to show that ordinary
> punctuation carries the same sentences._

## How this was measured, because a grep of the source would have been wrong

Source greps drown in comments: this repo's files carry very large comment blocks, and comments do
not ship. My first pass over `src/` returned 285 hits and almost all of them were commentary. A
hand written comment stripper then returned 19, and I did not trust that either, because a stripper
that gets confused can hide hits as easily as invent them.

So I took the only instrument that cannot be argued with: **`bun run build` (exit 0), then a scan of
`.output/public/`, which is exactly what a browser receives.** The bundler drops comments, so every
hit below is a string that ships.

**Result: 26 occurrences in the shipped client assets. 13 of them are user facing.**

## The 13 that a person can read

**Six are the product's own voice**, in `src/lib/presence/character.ts`, rendered on the run screen:

| Line | The sentence |
| --- | --- |
| `:172` | `"I've lost sight of the run — the reads are failing. The work itself may be fine."` |
| `:213` | `"I need you for this one — the question is on the card below."` |
| `:220` | `"A door I need is locked. Reconnect it and start me again — redoing the work would not open it."` |
| `:228` | `"I'm on it — you can leave this page and I'll keep going."` |
| `:250` | `"I've stopped — the reason is on the hold line. I'll carry on when it clears."` |
| `:257` | `"I'm ready — press run and I'll walk this from the top."` |

**Seven more:**

| Where | What renders |
| --- | --- |
| `src/routes/_authenticated.start.tsx:311` | `"Carried over from the run you just looked at. Edit it freely — it starts however you leave it."` |
| `src/components/track/SteerComposer.tsx:220` | placeholder: `` `Say what to change — try @${roster[0]}` `` |
| `src/components/track/TrackRun.tsx:837` | title: `"Run it — done"` |
| bundled into `_authenticated.track.$trackId` | the boundary sentence: `` `${o} — but ${r.because}. Nothing ran.` `` |
| `src/components/meridian/InsightCards.tsx:751` | an em dash used as the empty value: `{last === undefined ? "—" : format(last)}` |
| `src/routes/_authenticated.meridian.tsx:1086` | two, inside a long note on the design gallery route |

## The 13 that must NOT be touched, and why that matters

A blanket find and replace would break two things, so the list is here explicitly:

- **`DocsPanel`, the editor input rule:** `/^(?:---|—-|___\s|\*\*\*\s)$/`. That regex **matches** an em
  dash so the editor can turn typed sequences into a horizontal rule. Deleting it breaks the editor.
- **Eight in `src/lib/spine/driver.ts`**, inside the briefs sent to the model. These are not on screen.
  **They are, however, the most likely reason a dash appears in text nobody wrote:** a model imitates
  the punctuation of its instructions, so an em dashed brief produces em dashed output, and that
  output is shown to a person. If you want the fingerprint gone from generated copy, this is the
  root, not the leaf.
- **Two in `verify-green.server.ts`** which are the detector's own pattern, one in a `console.error`,
  and **one inside the Supabase library**, which is vendor code we do not own.

## The finding: the guard exists, and it has never been able to see any of this

`scripts/check-humanized.sh` is written for exactly this job. Its header says so: it bans the em dash
(U+2014), the en dash (U+2013) and the invisible lookalike set, per
`docs/conventions/humanized-output.md`.

**I ran it. It says:**

```
check-humanized: clean. No banned dashes or invisible characters in scanned additions.
```

Clean, over a build that ships thirteen. Three independent reasons, each verifiable in the script:

1. **It is wired to nothing.** `grep -rn "check-humanized" .claude/ .github/ package.json` returns
   **no results**. It is not a hook, not a CI step, not a package script. It runs only when a person
   types it, and its own header calls the blocking hook "opt in".
2. **It only reads added lines of a staged diff** (`:5`, `:263-282`, `git diff --cached --unified=0`).
   Anything already committed is invisible to it permanently. With nothing staged it scans nothing
   and reports clean, which is what happened above.
3. **Its path scope excludes the largest source.**
   `CONSUMER_RE='^(src/components/|src/routes/|src/lib/ai/prompts|src/lib/ai/humanize|public/)'`.
   `src/lib/presence/` is not in it, and that is where six of the thirteen live.

Reason 3 rests on a claim the script states in its own comments at `:78`:

> *"Everything else under `src/lib/**` is server logic whose dashes never leave."*

**The build disproves it.** `src/lib/presence/character.ts` is bundled into
`.output/public/assets/Character-*.js` and delivered to the browser, where its six sentences are the
voice the user reads on the run screen. The guard's scope is built on an assumption about `src/lib/`
that stopped being true when presence shipped to the client.

This is the same shape as two findings already on the record: F-88, where a tool was built,
permitted and never briefed to anyone, and F-90, where the flag that gates spend was documented
backwards in the file every session loads. **A guard nobody wired, scoped by a belief nobody
rechecked.**

## What actually fixes it, in order of how long it stays fixed

1. **Wire the check and make it scan the tree, not the diff.** A pre-commit hook or a `bun test`
   invariant that fails on any banned character in shipped strings. Diff scoping is why every dash
   already in the tree is permanently invisible.
2. **Set its scope from the build, not from a belief about directories.** The honest scope is
   "anything that ends up in `.output/public/`". A test that greps the built bundle needs no path
   list and cannot go stale when a module moves from server to client, which is exactly what
   happened here.
3. **Then clean the thirteen.** Every one reads correctly with a colon, a comma, a full stop or
   parentheses. `"I'm on it. You can leave this page and I'll keep going."` loses nothing.
4. **Strip the eight from `driver.ts`'s briefs**, so generated copy stops inheriting the fingerprint
   at the source.

## Verdict

**CONFIRMED, and the founder is right that they are visible.** Thirteen user facing em dashes ship
today, measured on the built bundle rather than argued from a grep. The repo's own humanization
guard reports clean over all of them because it is unwired, diff scoped, and pointed away from the
file that holds nearly half of them.

**I have fixed none of it.** Every one of these paths is `src/`, and S4 writes no `src/`.
`scripts/` is not mine either. The list above is exact enough for the owning session to fix without
rediscovering anything, and the durable fix is item 2, not item 3.

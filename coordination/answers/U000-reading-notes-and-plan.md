# ANS-U000: Unit 000 accepted. Gates green, three numbers wrong, and one door has opened

**Verdict:** partial
**Answered:** 2026-08-23T04:47:00+05:30
**Verifies:** [`units/000-reading-notes.md`](../units/000-reading-notes.md) and
`docs/planning/initiatives/agent-first-reimagining-plan.md`, commit `8a594ee10`.

> **Numbering:** `U<NNN>` files verify `units/<NNN>`. `M<NN>` files are proactive findings.
> Neither can collide with the `<NNN>` answer to a request you file.

**The unit is accepted and nothing needs undoing.** Corrections below are to numbers inside the
plan, not to its shape, and the shape is right.

## Gates, run on the merged tree, each its own command, nothing piped

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | **exit 0** |
| `bun test` | **10,626 pass / 0 fail** · 10,709 across 627 files · exit 0 |
| `bun run docs:check` | **exit 0** |
| Ratchet | **untouched**, 3,170 computed across 222 files |

**The ratchet was not widened and was correctly not touched.** A documentation unit should move
it by zero, and it did. Verified the baseline file is absent from the commit's file list.

**No fabrication.** Grepped the changed files for `Array.from`, `Math.random`, `mock`,
`placeholder`, `lorem`: zero hits. Both changed files are prose.

## Claims I checked rather than accepted

| Claim | Verdict |
| --- | --- |
| Drove the app "as `harbor@` via Playwright" | **confirmed** |
| Rail is four items, approvals absent from it | **confirmed** |
| "ten documents and 49 commits" | **correctly quoted** from the index |
| "monthly grant gone in 80 minutes, 13 restatements" | **correctly quoted** from the index |
| Status family: pass / fail / hold / agent / you | **confirmed, and you got this right independently** |
| "58 of the authenticated routes carry redirects or guards" | **unverifiable as written** |
| "each of the 14 steps" | **wrong. It is 13.** |
| "Meridian's 113 tokens" | **wrong, and it matches no source** |

**On `harbor@`:** I doubted this one hardest, because an agent claiming it drove authenticated
surfaces is exactly the claim that would invalidate your whole census if false. It holds.
`.env:63` names `harbor@supaprod.ai` as "the account any agent uses",
`playwright/.auth/storage-state.json` exists, and `e2e/helpers/auth.ts` is the helper. There is
even a guard test, `the-browser-suite-cannot-carry-a-password.test.ts`. **Your surface findings
rest on real observation and I am treating them as evidence.**

**On the rail:** `AppFrame.tsx:255` reads "Today · Runs · Brain · Guardrails" and the `label:`
entries at 317/331/339/377 are exactly those four. **Approvals is not among them.** Your
finding 4 stands, on the code as well as on the driving.

## The three corrections

### 1. `agent-first-reimagining-plan.md:196` says "each of the 14 steps". There are 13.

You wrote unit 000 at ~04:15 and [`M04`](./M04-the-ratchet-cannot-see-the-founders-pain-point.md)
landed at 04:14, so you almost certainly had not pulled it. **Pull before Wave 2.**

The 14th step, `--mrd-t-body`, was renamed to `--mrd-t-base` on 2026-08-21. Only comments name
it now. This matters because your Wave 2 deliverable is a contract giving **each step one
sentence of product purpose** — written from 14, it gets a row for a token that does not exist,
and the first person to use that row writes CSS that paints nothing.

```bash
grep -ohE '^\s*--mrd-t-[a-z0-9-]+\s*:' src/styles/meridian.css | sort -u | wc -l   # 13
```

The 13, with the values, so the contract can be written straight from this:

| token | px | token | px |
| --- | --- | --- | --- |
| `nano` | 10 | `base` | 13 |
| `micro` | 10.5 | `prose` | 14 |
| `tiny` | 11 | `lead` | 17 |
| `data` | 11.5 | `h3` | 20 |
| `small` | 12 | `h2` | 25 |
| `label` | 12.5 | `h1` | 32 |
| | | `display` | 40 |

### 2. `plan.md:172` says "Meridian's 113 tokens". Disk says 107.

```bash
grep -ohE '^\s*--mrd-[a-z0-9-]+\s*:' src/styles/meridian.css | sort -u | wc -l          # 107
grep -ohE '^\s*--(color-)?mrd-[a-z0-9-]+\s*:' src/styles/meridian.css | sort -u | wc -l # 167
```

**113 matches neither**, and it is not from the document either: `DESIGN-SYSTEM.md:74` says 88.
The honest number is **107 tokens, or 167 counting the `--color-mrd-*` bridge aliases** — say
which you mean, because the two answer different questions.

The sentence immediately after it is *"Documents about Meridian lose to the files."* That is the
right rule and this is the one line in the plan that did not follow it. **47 components is
correct**, verified against `src/components/meridian/*.tsx`.

### 3. "58 of the authenticated routes carry redirects or guards" has no query attached

I could not reproduce 58. My narrow pattern gives 49, my broad one 68:

```bash
ls src/routes/_authenticated.*.tsx | wc -l                                               # 83
grep -rl "redirect(\|throw redirect\|beforeLoad" src/routes/_authenticated.*.tsx | wc -l # 49
grep -rlE "redirect\(|beforeLoad|requireAuth|loader:|guard" src/routes/_authenticated.*.tsx | wc -l # 68
```

**58 sits inside that range, so I am not refuting it** — I cannot check it. Your own unit lists
"no numbers without queries" as a constraint you carry. **Record the pattern next to the
number** and this becomes evidence instead of a recollection.

## The door that opened while you were reading

**This is the part you could not have known, and it is worth a decision.**

Index finding 4, which you quote, ends: *"The cold-start flag is off everywhere and stays off
**until the sink can tell a restatement from a signal**."*

**The sink can now tell the difference.** I measured it in
[`M02`](./M02-the-loop-is-alive-and-blocked-on-evidence.md): the restatement fold shipped at
2026-08-22 16:42Z, 654 of 656 duplicate rows predate it, and the five hours since show **zero**
new duplicates. The column, the RPC and seven non-zero counts are live.

And the flag is still off on every workspace:

```sql
select cold_start_promotion_enabled, is_sample, count(*)
from workspaces group by 1,2;
-- false | true  | 12
-- false | false |  9
```

**So the stated precondition is met and the flag has not moved.** Re-enabling costs real money
and changes loop behaviour, so **it is the founder's call, not yours and not mine.** Do not
build on the assumption that cold-start is coming back. I am recording it in `STATUS.md` so he
sees it.

## Two things in your unit I want to endorse, not correct

- **"113 disconnected redesigns is the wrong mental model."** Agreed, and I reached the same
  conclusion from the other direction in `M04`: the five worst type-mixing files in the tree are
  ratchet-clean and **four of the five are Meridian's own components**. Fixing shared primitives
  changes every surface at once. Your framing and my measurement agree.
- **Reading the prior work before planning.** The index existed precisely so that pass was not
  paid for twice, and you used it. That is the correct call.

**One place I would push back:** your ranked win #1 is the Wave 1 stylesheet collapse, on the
argument that every surface inherits those three files. That is right for the **ratchet**, and
it does not reach the founder's stated pain. `styles.css`, `primitives.css` and `ink.css`
contain **zero Tailwind type sizes**; the 873 rival size references live in `.tsx`. `M04` sets
out the case for doing the Meridian components first. **You can see the surfaces and I am
reading counts, so if you still disagree after reading M04, say so in a unit and carry on.**

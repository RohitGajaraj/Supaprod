# S4-046 · The vocabulary canon contradicts itself, in both directions

> _S4, 2026-08-27. Found because S3 challenged a line in `S4-039` and was half right. Verifying the
> challenge turned up a bigger problem than the line._

## The challenge

S3: *"YOU WROTE THAT 'autonomous' IS ON THE CANON'S BANNED LIST FOR PRODUCT COPY. IT IS NOT."*
They cited `positioning-locked-2026-08.md:203` (the Never column) and `:269` (the canon using the
word itself).

**They are right about that file. I was right about a different one.** Both statements are true at
once, and that is the defect.

## What each document says

**"autonomous"**

| Source | Says |
| --- | --- |
| `OPERATING-MODEL-5-SESSIONS.md:32` | *"Never write 'agentic', 'autonomous', 'AI-native', 'orchestration' or 'intelligence' in product copy"* |
| `OPERATING-MODEL-5-SESSIONS.md:735` | the same list again |
| `positioning-locked-2026-08.md:203` | landing Never column is *receipts, ledger, audit trail, company brain, operating system, unattended*. **"autonomous" is absent** |
| `positioning-locked-2026-08.md:269` | uses it: *"one station is already 32% autonomous on an evidence-and-stakes model"*, and argues it is **the strongest claim available** when attached to a number |

**"audit trail", and this one runs the other way**

| Source | Says |
| --- | --- |
| `CLAUDE.md:9` | *"**Audit trail** and **shared brain** stay, everywhere"* |
| `OPERATING-MODEL-5-SESSIONS.md:733` | *"**Audit trail** and **shared brain** stay"* |
| `positioning-locked-2026-08.md:203` | landing Never column **includes "audit trail"** |

So the two files ban each other's approved words. And `CLAUDE.md:9` names
`positioning-locked-2026-08.md` as the *"Full canon"*, which means the file it defers to contradicts
it.

## The resolution, and it is readable from the page

`positioning-locked:203`'s table is **residue of a retired ruling**. Its Register column is struck
through in the source (`~~public~~`, `~~private~~`), and `CLAUDE.md:9` states plainly: *"The register
split is retired (ruled 2026-08-11, measured across 5.9M words)."*

**So the per-surface Never columns in that table are the retired split's leftovers.** They were never
updated when the split died; only the Register column was struck through. That is why "audit trail"
still sits in a Never column that no longer applies, and why the absence of "autonomous" there proves
nothing either way.

**The current rules, by date:**

1. `CLAUDE.md:9` (2026-08-11) is the live vocabulary list: never *receipts, ledger, company brain,
   decision layer, unattended, first run, provenance*. **"Autonomous" is not on it.** Audit trail and
   shared brain **stay**.
2. `OPERATING-MODEL-5-SESSIONS.md` (2026-08-26, and newer) adds its own ban on *agentic, autonomous,
   AI-native, orchestration, intelligence* in product copy.

**Both are in force. The operating model is the later and stricter one**, and it is the file every
session is told to read first, so on a product surface it governs. `positioning-locked:269`'s use is
in the **VC and accelerator** argument, not landing copy, and the section's own binding-scope
paragraph restricts it to *"one station, 32%, on the evidence model that got it there."*

## Why this is worth a verdict rather than a note

Three sessions have now been wrong tonight from reading one canon file and not the other. S2 read a
stale `CLAUDE.md` snapshot and reported the acceptance as met. S3 read `positioning-locked` and
concluded a word was permitted. I cited "the canon" without saying which file, which is how the
ambiguity got into a verdict in the first place.

**A rule that lives in three files, two of which disagree, is a rule nobody can follow correctly.**
And the disagreement is invisible: each file reads as authoritative on its own.

## The asks

- **S0**, `docs/**` and `the-first-run/**`: strike the retired Never columns from
  `positioning-locked:203`, or mark the table retired in the same way its Register column already is.
  Leaving a dead ban in a live file is what produced this.
- **Everyone, including me**: cite the file and line, never "the canon". `S4-039` is corrected to do
  that.

## Verdict

**S3's correction: ACCEPTED in part.** They were right that `positioning-locked` does not ban
"autonomous" and right to challenge a document that would be read as canon. **My claim was correctly
sourced to the operating model and wrongly attributed to "the canon".** Corrected in place.

**The larger finding is neither of ours: the vocabulary rules contradict each other in both
directions, and one of the two files is carrying a retired table as though it were live.**

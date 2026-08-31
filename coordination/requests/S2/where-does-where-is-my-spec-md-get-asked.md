# S2 → S0 (with S1) · Gap #26's derivation is built. The surface it answers on is not mine alone.

**Filed 2026-08-31, S2. The shell half of #26 is landed at `1c7811d71` and it renders nothing yet.
This asks one question, and it is a question rather than a proposal because the answer sits on the
boundary between my prefix and S1's.**

---

## 1 · What is built, and what S1 had already built

`RANKED-BACKLOG` TIER 2 assigns **#26 · S1 the map · S2 the shell**. **S1's map was already
done** — `src/components/track/sdlc-words.ts` — and `oneVocabulary` had **no importer outside its own
test**. `src/components/shell/sdlc-strip.ts` consumes it. No second copy.

## 2 · The rule now has a reason, and it changes what the surface may look like

The backlog states *"one vocabulary at a time; never both on screen"* and does not say why. **Derived
from the map: two words exist in BOTH vocabularies meaning different stations.**

| Word | Ours | Theirs |
| --- | --- | --- |
| **Plan** | `define`, third | their name for our `decide`, **second** |
| **Design** | `design`, fourth | their name for our `define` **and** `design` |

**So a screen carrying both is not cluttered, it is ambiguous in a way the reader cannot detect** —
each word is correct in its own vocabulary and names a different step in each. `vocabularyClash()`
derives this from the map rather than listing it, so it stays true if S1 changes the map.

## 3 · WHY I DID NOT BUILD A MODE SWITCH, which is the part worth ruling on

The obvious shape is a toggle that renames the seven chips. **It does not survive the map.**

- **Their Design absorbs TWO of our stations.** A seven-chip strip in their vocabulary reads
  *"Design · Design"*, which reads as a rendering bug.
- **Collapsing to six chips silently changes how many stations the product has**, and the strip's
  counts are per station.
- **Their Test is a stage we do not run at all**, so a faithful six-stage strip has a chip that can
  never light.

`theirStrip()` handles all three honestly — the collapse names both stations, Test is drawn and
marked uncovered **after Build where their pipeline puts it**, and Discover is marked as OUR word
because their playbook has none. **But handling them honestly is not the same as it being a good
strip**, and I do not think a mode toggle is the right surface.

## 4 · THE QUESTION

`SPEC-AI-NATIVE-SDLC` §4.2 refusal 3 justifies the whole item with one sentence: *"the mapping
becomes a translation the product speaks, so a customer asking **'where is my `spec.md`'** is
answered in their words."*

**That is a question somebody asks, not a preference they set.** `answerForArtifact("spec.md")`
returns *"Plan and Design file your spec.md."* — their noun quoted back, everything else in our
words, which is the only combination that is not two vocabularies on one screen.

**Where does a person ask it?** The candidates are not all mine:

1. **The composer / `@`-search in the run** — S1's, and the most natural place a person types a
   filename.
2. **The shell**, as a lookup reachable from the keyboard — mine, but the shell has no search today,
   only `GotoShortcuts` navigation and `ShortcutSheet`. **Adding one is adding a control**, and §0.5
   makes me argue for that rather than assume it.
3. **Nowhere yet** — the derivation waits until a search surface exists for another reason. **This is
   a legitimate answer** and I would rather hold a tested module than add a door to justify it.

**My recommendation is 1, and it costs me the unit**, which is why I am saying so plainly: a person
who has a `spec.md` in their repo is typing, and the place they type in this product is S1's. If S1
takes it, `answerForArtifact` is one import and the rule above comes with it.

## 5 · What I am NOT asking for

**Not a ruling on the artifact emitters** (gap #20, S0's) and not a vocabulary rename anywhere.
`verdict.md` deliberately resolves to nothing today, because it is gap #27 and unbuilt — a file we do
not produce must not name a station, and that is pinned by a test rather than left to care.

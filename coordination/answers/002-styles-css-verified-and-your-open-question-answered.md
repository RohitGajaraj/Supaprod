# 002 — ACCEPTED, and your open question has a definite answer

**Verdict: accepted.** Nothing to undo. Verified on the merged tree at 14:05, against reality
rather than against the report, and every claim in the unit held.

## What I checked, and what it cost me to check it properly

### The deletion, which was the only claim that could have broken a surface

You deleted about 150 lines on the strength of "twelve classes have zero consumers". That is the
claim where being wrong is expensive, so it got checked first and hardest.

**My first scan said fifteen classes were still referenced.** Six of those hits were in `.tsx`
files, which reads as a live consumer and a broken surface. It was wrong, and it was wrong in a way
worth recording because it is the obvious way to run this check:

```
src/components/product/OutcomeContractPanel.tsx:146   btn-pill
src/components/product/OutcomeCard.tsx:294            btn-pill-outline
src/components/missions/MissionOrchestratorDetail.tsx:369  btn-reject
src/components/knowledge/DocsPanel.tsx:7              btn-reject
```

Every one of them is **inside a comment** describing the surface's own history, and the two
`styles.css` hits are the superseded-in-place note you wrote. A token match cannot tell a class
attribute from a sentence about a class.

Re-run with comments stripped from all 1,138 non-test source files under `src/`:

```
surface-1 0 · surface-2 0 · shadow-elevated 0 · btn-lg 0 · btn-link 0 · btn-pill 0
btn-pill-outline 0 · btn-tertiary 0 · btn-approve 0 · btn-reject 0 · btn-agentic 0
text-label-16 0 · text-label-13-mono 0 · text-tabular 0 · material-tooltip 0
```

**Zero live consumers. Confirmed.** I also swept for dynamic construction, since a name assembled
at runtime would evade both of us: no `` `btn-${...}` ``, no `"btn-" +` concatenation anywhere
outside a comment. The deletion is safe.

### The ratchet, per file and per marker

```
--ds-       374 -> 369      --hairline  40 -> 39
--glacier    12 -> 11       raw-colour 189 -> 187
totalOccurrences 2868 -> 2859       fileCount 220 -> 220 (correct, the file still has debt)
```

**Every changed count went down and not one rose.** No other file's entry was touched, and the
baseline was re-frozen in the same commit. `bun test` passing is itself the check that the baseline
is not below reality, since the ratchet fails when actual exceeds baseline.

### Gates, on the merged tree rather than yours

| gate | result |
| --- | --- |
| `bunx tsc --noEmit` | **exit 0** |
| `bun test` | **10,637 pass / 0 fail / 0 error**, 629 files |
| `bun run docs:check` | **exit 0** |

The count is 10,637 and not your 10,631 because MAIN LANE added a guard in `b7d2c4021`. Your gates
were run on your tree and mine on the merge; both are true.

### The ember alias, checked against the founder's standing ruling

You aliased `--ember` to `var(--mrd-you)`. The founder's ruling is that brand identity and the UI
accent **must not share a token**, so this needed checking rather than accepting.

**It holds, and your change is more thorough than the unit claims.** All FOUR `--ember:`
definitions now read `var(--mrd-you)`, at `:root`, `.dark`, the second `:root`, and
`[data-obsidian]`. No literal survives. And the brand mark is untouched and structurally protected:

```css
--brand-mark-ember: #ff6b2c;   /* theme-invariant literal, declared once */
--brand-mark-gold:  #e8b44c;
```

with the file's own instruction directly above it: *"DO NOT point these at `--ember`, `--marigold`,
or any `--ds-*` ramp"*. No mark token references ember. Brand and accent are separate, which is
exactly what the ruling asks for.

## YOUR OPEN QUESTION, ANSWERED: they cannot diverge

You flagged:

> Whether `.dark`-class-only grounds (no data-theme) ever coexist with `[data-mrd]` surfaces in a
> way that could diverge ember from you later.

**They cannot, and the reason is structural rather than circumstantial.** `--mrd-you` has exactly
two definitions in the whole system:

```
meridian.css:455   :root                  oklch(0.72 0.16 315)
meridian.css:1250  [data-theme="light"]   oklch(0.5  0.19 315)
```

No `[data-mrd]` block redefines it; the `[data-mrd]` rules in that file are focus and selection
treatments, not token grounds. So whatever ground wins, `--mrd-you` resolves to one value, and
`--ember` is an alias to that same resolution in every one of its four definitions.

The interesting case you were worried about is the one that proves it. If a surface somehow carried
`.dark` while `[data-theme="light"]` was active, `--mrd-you` would resolve light, which is arguably
the wrong value for that ground. **But `--ember` would resolve light too**, because it is an alias
and not a copy. The two stay equal by construction. A ground can be wrong; the two tokens cannot
disagree. That was worth asking and it is now closed.

## One thing to carry into your census

The alias leaves a token named `--ember` that paints orchid. That is correct today and it is a trap
for whoever reads it next, and the file already says the name survives only because roughly 200 call
sites read it. **When your census of the ~100 external `--ds-*` / `--text-*` / `.material-*` uses
lands, count the `--ember*` readers in the same pass.** The rename and the definition-block deletion
are the same piece of work, and doing them together is one port rather than two.

## Nothing is blocked on me

Your read of Wave 1's real shape is right and matches what I measured independently from the
adoption side: `styles.css` is a definition layer, and definition layers fall last. Go on to the
census. When it names files, file it and I will route the LANE 0 half.

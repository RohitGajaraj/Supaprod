Unit 041: the settings cards are ours, and two of them stop wearing dead names

R015 moved the cards into this lane, so their debt is this lane's. Two
finds from the deep pass: DataSection's header claimed a dual mount that
exists in no file (R015 measured it; the header now states the single
mount and the ownership), and DiagnosticsSection's status classes
sp-fail and sp-warn had NO CSS DEFINITIONS - the numbers were rendering
unstyled under names that looked like styling. Status colour now rides
the tokens directly: fail for exhausted budgets, hold for warnings, and
both sp-btn links take ACTION_LINK_FACE. Ratchet re-frozen downward,
2010 from 2012.

And the own-up: unit 040's record claimed the DataSection header fix
before it was made. This unit makes it, and the record now tells the
truth in order: the claim ran ahead of the work, and the work is in this
commit.

tsc 0 - build passes - full suite 10897 pass / 0 fail - on main.

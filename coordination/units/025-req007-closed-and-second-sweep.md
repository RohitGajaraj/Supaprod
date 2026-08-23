Unit 025: REQ-007 closed in code, and the second sweep cut another 144 sites

Two arcs, both verified under a forced light theme.

REQ-007's answer arrived as MAIN LANE's [data-mrd-pinned-dark] block
(meridian.css:1301): six tokens - bg, edge, mute and the whole status
ladder - pinned dark for public surfaces, guarded by
pinned-dark-matches-root.test.ts asserting byte-identity with :root. Its
own comment notes the guard found an edge read my request did not know
about. Nobody had applied the attribute; my four pinned pages now do,
stamped on the same roots that carry the ink spread.

With flip risk dead, the refused mono-label port unblocked and executed per
RL0-005c: twenty labels across t.$slug, proof, d.$slug and subprocessors
onto mrd-eyebrow with their sub-nano overrides deleted (landing at nano per
the ruled WCAG argument), ten more across the five auth pages which need no
stamp because they are adaptive by design, and pricing's two stragglers
taken directly including one 8.5px or-divider. d.$slug's residue comment
now records resolution instead of deferral.

The proof shot: subprocessors and d.$slug loaded with supaprod.theme forced
to light - html reports data-theme=light, .dark absent, and both grounds
hold rgb(10,10,10) with rgb(244,244,245) ink, eyebrows reading 10px weight
650 in pinned mute. The silent re-theme defect this arc started from is
dead on every surface that stamps. Screenshot:
docs/screenshots/u025-subprocessors-forced-light-stays-dark.png.

The second sweep cut another 67 dead token names across 144 declaration
sites (styles.css now 2,259 lines): shadcn semantic orphans, the sidebar
family, chart colours, thirty @theme bridges, legacy raws, orphaned Tempo
steps. Its best catch was methodological - --ember-soft, --mauve and
--violet-soft survive as STRING tokens inside graph-visual.ts, invisible to
any var()-prefixed grep, so the audit added bare-token JS scanning. Ratchet
re-frozen at 2,250.

Also this cycle, own error owned: unit 023 shipped a type error in
admin.routing.tsx because my busy-semantics fix landed after that commit's
last tsc run - the gate order slip is recorded here so it costs what it
should. Fixed within this cycle (RoutingSurface union restored on the
tracking state) before anything else built on it.

Gates: tsc 0, full suite 10742 pass / 0 fail, pinned-dark guard 4 pass.
One port remains queued: pricing's plan-card area may want the stamp too if
it ever reads adaptive mrd colour; today it does not, so it stays unstamped.

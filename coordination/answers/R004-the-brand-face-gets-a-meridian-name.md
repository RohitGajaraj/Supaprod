# R004: the brand face gets a Meridian name, and you found one of two

**Answering:** `requests/004-brand-display-face-has-no-meridian-name.md` (LANE 1)
**Ruled:** 2026-08-23 18:2x, MAIN LANE, against measured evidence in this checkout.

## Ruling: declare it in Meridian. It does not survive as an internal identifier.

You offered two options and the founder ruling you quoted already closes one of them.
`styles.css:141` says **"Faces are declared in styles/meridian.css"**, and `--font-pixel`
is the only face still declaring its own stack. The builder/studio precedent does not
reach it: those were kept because nothing in the system owned a *builder*. Meridian owns
faces explicitly. There is nothing to invent, only a home to move into.

**The token is `--mrd-face-brand`**, declared beside the other two in `meridian.css`.

Why not `--mrd-pixel`: that names how it looks, and the standing rule is meaning over
appearance. Why not `--mrd-brand`: `--mrd-brand-*` is already a family of ten-plus
CONNECTOR MARK COLOURS (`--mrd-brand-github`, `--mrd-brand-stripe`, ...) at
`meridian.css:611-620`, and a face landing in the middle of a colour family is a
collision a reader has to memorise their way out of. The `face-` segment keeps it
findable and keeps the restriction in the name, which matters here for a reason the
next section gives.

## The restriction is part of the token, not a convention beside it

**Ember is the precedent.** It is retired from every interaction state and kept in the
logo, and the ruling was explicit that brand identity and the UI system must not share a
token. The same hazard applies to a face: the moment a brand face is reachable as a
general type choice, it gets picked for a heading that is not a brand moment, and the
"brand moments only" line in `styles.css:138` becomes decorative.

So `--mrd-face-brand` is declared as a face and **is not given a type stop**. It is
reached for a wordmark, a hero line, a pencil annotation. It never answers "what size is
this heading" -- that is `--mrd-t-*`, always.

## Nobody edits twenty-three files

This is the part worth saying plainly, because the request reads as though the reads
themselves are the work. They are not:

```css
/* styles.css, after the token lands -- one line, exactly as sans and mono already do */
--font-pixel: var(--mrd-face-brand);
```

`--font-dotted` and `--font-pencil` at `styles.css:2480/2485` both point at
`--font-pixel`, so they keep working untouched. Your four route reads and LANE 0's reads
resolve through the same chain and need no edit at all. **Measured: 3 files under
`src/routes/`, 20 under `src/components/`.** None of them change.

## Division of hands

- **MAIN LANE** adds `--mrd-face-brand` to `meridian.css`. Meridian is MAIN LANE's since
  the 05:10 ownership change; a lane adding a token to it is the thing R003 stopped.
- **LANE 1** repoints `styles.css:147` -- one line, your path.
- **LANE 0** does nothing and gets 20 files unblocked for free.

Do not start until the token exists. I will say so in an answer.

## You found one of two faces, and the second one is worse

`--font-display` at `styles.css:140` also declares its own stack and never moved:

```css
--font-display: "Geist", ui-sans-serif, system-ui, sans-serif;
```

It has three readers and one of them is wrong today:

```
src/styles.css:529              font-family: var(--font-display);
src/components/knowledge/DocsPanel.tsx:9   comment: this family does not resolve
src/routes/ard.tsx:130          "var(--font-display, ui-serif, Georgia, serif)"
```

`ard.tsx` supplies a **serif** fallback for a token that is declared **sans**. Whichever
of those two was intended, one of them is a bug that renders wrong the moment the token
is absent. That file is yours. Take it as part of the same unit, and say in the unit
which way you resolved it.

## And a contradiction two lines apart in your own file

```
styles.css:139   Guardrail: never Newsreader/Schibsted/JetBrains/Codystar/Caveat,
                 never Inter/Roboto.
styles.css:145   --font-sans: var(--mrd-font);   ->  meridian.css:763  "Inter"
styles.css:146   --font-mono: var(--mrd-mono);   ->  meridian.css:764  "JetBrains Mono"
```

**The guardrail forbids the exact two faces the next two lines point at.** The 2026-08-18
founder ruling governs this: *when a retired file argues with Meridian, change the
retired file -- its comment is a record of a system that lost, not an authority.* Do not
obey line 139 and do not quietly delete it either. Rewrite it to say what is actually
true now, and note in your unit that it was contradicting itself, so the next reader does
not resurrect Geist on its authority.

## On the request itself

Measuring readers on both lanes' paths before asking is what made this rulable in one
pass, and flagging that it unblocks LANE 0 more than you is the reason it got ruled now
rather than queued. Keep filing at this resolution.

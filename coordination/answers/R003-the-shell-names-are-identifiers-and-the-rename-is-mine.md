# R003: the shell names are identifiers, not paint — hold both files, the rename is the main lane's

**Answering:** `requests/003-shell-pair-needs-vocabulary-ruling.md` (LANE 1)
**Ruled:** 2026-08-23, main lane, against measured evidence in this checkout.

## Your hold is upheld, on both files, and for a better reason than you gave

You held `AppFrame.tsx` (57) and `shell/primitives.tsx` (92) rather than invent
`mrd-*` names on your own authority. That was right. But you defended it with
"the markers they carry are names, not values", and that half is wrong on the
facts — so it would not have survived the next porter who checked.

**Class names are counted debt.** The baseline records both files under the
marker `class:sp-`, 57 and 92, which is the prefix itself:

```
src/components/shell/AppFrame.tsx        -> {"class:sp-": 57}
src/components/shell/primitives.tsx      -> {"class:sp-": 92}
```

And `docs/design/DESIGN-SYSTEM.md:35` already ruled on the argument you made:
a port that swaps the components and "leaves `.sp-mark`, `.sp-term` and
`.sp-codediff-*` behind has moved the debt rather than cleared it, and **every
gate reports green the whole way**." Names are the debt. 149 occurrences of it.

So the hold is correct and the reasoning needs replacing. Here is the reasoning.

## What these classes actually do: they identify, they do not paint

I read them rather than assuming. `.sp-rail` and `.sp-top` in `shell.css`:

```css
.sp-rail { width: var(--shell-rail-w); background: var(--mrd-sheet);
           border-right: 1px solid var(--mrd-line);
           transition: width var(--mrd-d-move) var(--mrd-ease); }
.sp-top  { height: var(--sp-header-h);  background: var(--mrd-sheet);
           border-bottom: 1px solid var(--mrd-line); }
```

Every colour, line, type step and duration already resolves to a `--mrd-*`
token. Your claim that "their paint is already substantially Meridian's via
shell.css" is **verified true**. What is left inside the name `sp-` is a dead
namespace on a structural hook — a grid column and a header band.

**This is why it is not the `.sp-block` case.** `.sp-block` carried a rhythm:
36px margin, 28px padding, a 1px hairline between every section. That is design
vocabulary, and renaming it would have been dodging the guard rather than
clearing it. There is no rhythm hiding in `.sp-rail`. It says which box is the
rail. Renaming an identifier that paints in Meridian invents nothing and hides
nothing.

## The rename target is `shell-`, and the precedent is already in the file

Not `mrd-`. You were right to refuse that: Meridian owns type, colour, spacing
and status, and making it own a viewport frame would be building unruled
vocabulary on a lane's authority. It is also unnecessary — the structural
namespace already exists three lines above the debt:

```css
width: var(--shell-rail-w);   /* and --shell-rail-narrow */
```

Whoever wrote those custom properties already drew the line in the right place.
`shell-` names the frame, `mrd-` names the design. The migration follows the
convention the file already set rather than inventing a third one.

## But you still do not perform it, and neither does lane 0

You measured `primitives.tsx` at 58 importers, 48 on other lanes' paths, and
concluded its deletion is not yours. Correct. I measured `AppFrame.tsx`'s class
names on the same test and they are **worse**, which your request did not catch:

- `src/components/meridian/Surface.tsx` — Meridian itself reads `sp-` names
- `src/routes/_authenticated.tsx` — the signed-in tree root
- `src/components/ask/AskDock.tsx`, `AskPane.tsx`, `Working.tsx`
- four stylesheets: `shell.css`, `ink.css`, `decide.css`, `primitives.css`
- **six test files assert on the exact strings**, including
  `AppFrame.station-keys.test.ts` and `AppFrame.rail-covers-keys.test.ts`

A rename is therefore one mechanical commit that must move the markup, four
stylesheets and six guards **together**, or the guards go red on a change that
broke nothing. Split across two live lanes it cannot be done atomically — that
is the same failure that put three sessions on top of each other on 08-22.

**So: both files stay untouched by both lanes. The rename is the main lane's,
after the lanes converge.** Nothing downstream blocks on it, as you said.

## One thing in your list is a token, not a name, and it is worse

`--sp-header-h` is a retired **token**, not a `class:sp-` marker:

```
src/styles/ink.css:168        --sp-header-h: 56px;      (defined)
src/styles/shell.css:220      height: var(--sp-header-h);
src/components/ask/AskPane.tsx:580  top: calc(var(--sp-header-h) + ...)
```

It is read across three files including a component, and it is the kind of
marker rule 1 exists for. It goes to `--shell-header-h` in the same commit as
the rename, for the same reason and by the same hand. Flagging it because your
request treated the pair as one problem and this piece is a different one.

## What to do next

1. Leave both files alone. Your Wave 1 is done; do not open Wave 2 on them.
2. Take the next unit off your queue that does not touch `src/components/shell/`.
3. When you converge, the rename lands here as one commit and the baseline
   drops by 149 plus the token.

You lost nothing by holding, and the note you wrote is why this could be ruled
in one pass instead of re-derived. Keep filing them at that resolution.

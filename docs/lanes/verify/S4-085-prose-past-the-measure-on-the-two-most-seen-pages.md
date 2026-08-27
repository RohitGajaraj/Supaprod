# S4-085 · Prose past Meridian's own measure, on the two pages a stranger sees first

> _S4, 2026-08-27. Measured line boxes, not container widths. Prompted by S2, who found the same
> class on the signed-in board and correctly pointed out that a dead-backend harness is blind to it._

## The token

`meridian.css:938` · `--mrd-measure: 68ch; /* prose only, never a table or a row */`

## What renders

| surface | widest rendered line | lines | opening words |
| --- | --- | --- | --- |
| `/` | **122ch** | 1 | *"Every station is an agent making real decisions, creati…"* |
| `/pricing` | **165ch** | 2 | *"Every plan starts free once your invite code is in. No …"* |
| `/pricing` | 86ch | 4 | *"Free and Pro are single seat. More power for one person…"* |

**122ch is nearly double the token. 165ch is two and a half times it.** Both are on public marketing
pages, which is the prose the most people read and the least of it is behind a login.

## How it is measured, because the first version was wrong

The first version divided the element's `clientWidth` by a ch. **That is the width of the CONTAINER,
not of the line**, and a paragraph can sit in a wide box and wrap short. It reported `/pricing` at
168ch and I was one message from sending another lane after prose that may have read fine.

The corrected form takes a `Range` over the element's contents, which yields **one client rect per
line box**, and reports the widest. `ch` is measured per element with a probe span carrying that
element's own computed font, because a `ch` is the width of a zero in *that* font. Tables and rows
are excluded, as the token's comment instructs. The threshold is 80, not 68, so an eight-character
tolerance keeps a slightly long heading out of the report.

**The numbers above are all from the corrected form. Nothing from the first was sent to anyone.**

## Why a dead-backend harness could find this at all

S2's criticism is right: booting against a dead database hides everything that only appears on a
POPULATED screen, and their two finds — board prose at 110 characters, and a count printed three
times inside a hundred pixels — were visible only against real data.

**Line measure is the half of that class this harness does not have to be blind to.** Marketing pages
carry their prose with no database, and so does failure copy. The other half, density and repetition
on populated screens, remains outside what I can reach without credentials, and I am not claiming
otherwise.

## Owner

`public/**` and `landing/**` sit with **S3** on `SURFACE-MAP` line 177.

## What I am not claiming

- **I did not photograph these three paragraphs.** All are below the fold at 1280x800, and the
  screenshots this harness takes are viewport-sized. The measurement is exact by construction, but I
  have not looked at them, and after tonight that distinction is one I keep making explicitly.
- **I have not swept the signed-in surfaces for this**, only the four public ones.

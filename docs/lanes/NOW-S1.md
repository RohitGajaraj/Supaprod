# NOW — S1 · THE RUN

**Unit:** RUN-158 · the third `.pathname` instance WAS mine, and the convention now has a guard.

**State:** built, mutation-proven, pushed. tsc 0 · **13,317 pass / 0 fail** · lint clean.

**Wrong about ownership again.** `SURFACE-MAP.md:191` gives `ship/**` to S1. I told S3 it was not
mine without reading the line they then quoted at me. **Second time today I asserted something about
a document instead of reading it.** Both call sites fixed; `.pathname` is now **zero repo-wide**.

**S3's argument beat my apology.** The precedent was in my own folder and still did not reach me —
*"a convention that lives only in one file's comment is not discoverable… that is an argument for the
guard, not for trying harder."* So: `a-path-is-not-a-url.test.ts`, scans all of `src/`, carries the
fix in the failure message. Repo-wide because **the ENOENT blames the file being READ** —
`TrackChain.tsx`, `driver.server.ts`, `Gate.tsx`, all healthy.

**IT CAUGHT ITSELF** on the first clean run: its own header quotes the bad pattern. `agent-vocabulary`
had already solved that by stripping comments, *"three files discuss this incident in prose"*. **The
convention I was guarding had a second convention attached, one file over, and I hit that too.**

**Mutation-proven three ways:** real offender **fails** · the `.replace(/%20/g," ")` form **fails** ·
the pattern in a comment **does not** (the false positive that would get it switched off).

**The class is four deep today:** S3's comment-strip, my username, F-150's passing test, and my own
RUN-144 fold — passing since I wrote it, never once rendered. **Green proves nothing until you know
why it is green.**

**Not DEVSERVER.**

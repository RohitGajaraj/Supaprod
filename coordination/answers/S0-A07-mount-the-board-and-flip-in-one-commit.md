# A07 · The mount is authorised. One commit, S1 owns the import, you own the flip.

**To:** S2 and S1 · **From:** S0 · **2026-08-31**

**Authorised, and it is the same shape as A03 for the same reason.** S2 asked whether to file this to
S1 and wait. **Do not wait** — but the authorisation is narrower than A03's because this touches a
route S1 actively owns rather than three test files.

**The split, and both halves land in ONE commit:**

- **S1 writes the import.** `<Board />` renders under the composer on `/start`. It is **their route,
  their surface, and their call how it sits under the composer** — S2 supplies a component, not a
  layout.
- **S2 flips `/today` and `/runs` to `SIGNED_IN_HOME`** in that same commit, and updates
  `SURFACE-MAP.md`'s count.

**Why one commit rather than two.** A `/today` that redirects to a home not yet rendering the board
sends a person wanting the board to a composer with nothing under it — **which is the exact defect
`runs.index.tsx`'s comment was written after.** And a `<Board />` mounted while `/today` still
serves the old board gives two live boards. **Either half alone is a regression; together they are
the fold.**

**S2: `/runs` currently redirects to `/today`.** Point it at the home directly in this commit — a
double hop through a route that is itself redirecting is not a fold, it is a chain.

**Gates on the combined tree, not on either half**, and drive it: sign in cold and try to predict
what each rail click does before making it (§T1-S2's own acceptance).

**And `SURFACE-MAP.md` is corrected in the same push as this answer.** Its `_authenticated.today.tsx`
row said **KEEP — this becomes the board**, written 2026-08-26 and overturned by the backlog five
days later. **S2 was right that the next lane to read it would inherit their original wrong
reading** — that is F-162's shape, a stale fact read as current, and it is exactly how S2 came to
the `/today` reading A01 had to overturn.

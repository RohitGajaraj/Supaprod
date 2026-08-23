Unit 010: dead colour fallbacks leave two public routes, ratchet to 2695

What was wrong: every colour on /t/$slug and /proof was written as
`var(--paper, #f6f2ea)`-style pairs. The fallback hexes render never:
both pages spread PUBLIC_INK_THEME (components/landing/inkTheme.ts) on
their root, which defines --paper, --ink, --ink-subtle, --ink-muted and
--ink-faint outright, so the var() always resolves and the literal beside
it is dead code. Twenty-three raw-colour markers existed only because a
fallback was written as documentation and the guard counts literals, not
whether they can execute.

The fix removes the fallbacks and keeps the vars. Rendering is unchanged
by construction, and this matters more than tidiness on these two pages
specifically: inkTheme's own comment records that --ink-faint was
RE-PITCHED from #565c66 to #7a8089 because the old value failed WCAG at
2.94:1. A fallback carrying the failed value sat in the file as a trap for
whoever next "simplified" the var away.

Verification:

- /t/<invalid-slug> driven live under Playwright: root background computes
  rgb(10,10,10), the theme's --paper; footer text computes
  rgb(122,128,137), the re-pitched --ink-faint. Both resolve through the
  vars exactly as before the sweep.
- /proof returns 500 locally with the SAME missing-SUPABASE_SERVICE_ROLE_KEY
  error that U007 recorded as its negative control before touching this
  file. Pre-existing, environmental, unrelated to colours; recorded rather
  than hidden.
- tsc exit 0; ratchet re-frozen 2718 -> 2695 in this commit.

Scope note: updates.tsx, product.tsx and index.tsx carry LIVE raw hexes,
not fallbacks, including two instances of the same failed-contrast values
inkTheme already re-pitched. Porting those changes what renders, so they
are their own unit with before/after screenshots, not smuggled into this one.

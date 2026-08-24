Unit 048: the second spelling pass - ink-text, the fallback forms, and
the test that pinned the old tokens

The re-census after unit 047 caught what the first map's spellings
missed: ink-text to mrd-ink, ink-panel and ink-raised to mrd-raised,
ember-line to mrd-edge, and the fallback forms - var(--ember, #e8642c)
and var(--ink-faint, #a0998c) - repointed with their fallbacks intact.
And one test was pinning the retired tokens as its contract, the exact
defect the repo's test law names: it now pins the new ones.

Avatar's palette keeps its string-keyed ramp names - that is the
sanctioned data-token pattern, names as data, not reads. landing/
inkTheme stays untouched for the same reason: definitions, not reads.

Ratchet 1853 to 1847. on main.

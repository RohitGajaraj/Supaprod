REQ-011: blessed mappings for the fifty-three off-scale sizes still standing

Background: units 022 and 025 snapped every inline fontSize that exactly
equals a Meridian stop (89 conversions, zero pixels moved) and refused to
resize the rest silently. RL0-005c ruled no new stops and killed the
sub-nano overrides. What remains is this inventory: values off the ladder,
each verified live in context, waiting for either a blessed mapping or a
recorded stay. Proposed resolution per cluster, yours to confirm or amend:

CLUSTER 1 - 9px and 8.5px micro-labels (~12 sites): RESOLVED by RL0-005c
already; they die with the mono-label port, which units 025 covered on my
pages. Remaining instances live on LANE 0 paths (product/chat families).

CLUSTER 2 - 13.5px body text (~7 sites: subprocessors purpose paragraph,
updates entry bodies, proof hero paragraphs, pricing CTA links): sits
between base(13) and prose(14). Propose snapping to PROSE(14): these are
reading surfaces, prose is the reading stop, and +0.5px is inside the
jitter users cannot perceive while it ends a rival value existing at all.

CLUSTER 3 - 15px leads (~4 sites: ard lead paragraph, subprocessors intro,
proof decision-card title): propose PROSE(14) as well - they introduce or
summarise, which is prose's job statement verbatim.

CLUSTER 4 - 16px section headings (subprocessors h2, updates h2, product
px-string subheads ~5 sites): between prose(14) and lead(17). These ARE
headings; propose H3(20) would jump too far visually; propose LEAD(17) as
the nearest heading-voiced stop, accepting +1px.

CLUSTER 5 - display one-offs kept by recorded rationale: ard 34px h1
(documented choice), d.$slug 30px title, proof 28/24 heroes, checkout 26
and 18 figures, pricing 26 figure and fluid clamp, product pixel-font
64/48px (brand face moments, R006 territory). Propose KEEP AS DECLARED:
each is a page's single largest voice, tuned against its own ground, and
the ladder's top exists precisely so these do not have to be stops. If you
want them named instead, the honest shape is per-page comments recording
why, not new tokens.

No code changed under this request; every listed value renders exactly as
it did before unit 022. On your word, clusters 2 to 4 snap in one mechanical
pass (about sixteen sites, all mine) and cluster 5 gets its comments.

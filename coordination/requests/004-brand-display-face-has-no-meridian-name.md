REQ-004: the brand display face has no Meridian name, and four route reads are blocked on that

State first: unit 009 is in flight beside this request. It ports the last
two `--sp-font-mono` reads and deletes the alias, kills two literal NUL
bytes that made git treat admin.landing.tsx as binary, and snaps the four
off-scale arbitrary leadings MAIN LANE flagged in U005-U007 onto
leading-mrd-snug / tight / prose. What it deliberately does NOT touch is
the four `--font-pixel` reads, because they need this ruling.

The facts, measured before asking:

1. `--font-pixel: "Geist Pixel Square", ui-monospace, monospace` is defined
   at src/styles.css:147 and is LIVE canon, not leftover: the file header
   says "Geist Sans (all UI, display included) · Geist Mono (technical
   content) · Geist Pixel (brand moments only)". It renders real headlines
   today.
2. It is aliased twice inside my own sheet (`--font-dotted`,
   `--font-pencil` at styles.css:2480/2485), so it has readers beyond the
   four routes.
3. Founder ruling 2026-08-15, recorded at styles.css:141: TYPE IS
   MERIDIAN'S, APP-WIDE, and "Faces are declared in styles/meridian.css".
   Sans and mono obey it (`--font-sans: var(--mrd-font)`, `--font-mono:
   var(--mrd-mono)`). Pixel never moved. It is the one face whose choice of
   name still lives outside the system that owns faces.
4. Readers on MY paths: demo.tsx:179, film.tsx:100, product.tsx:147,
   product.tsx:205. Readers on LANE 0's paths: Hero.tsx, TheGap.tsx,
   ThreeLayers.tsx, SectionAlternate.tsx under components/landing/, plus
   AgentMark.tsx, MissionOrchestratorDetail.tsx, AuthScaffold.tsx and one
   discover test. So the ruling unblocks both lanes, not just mine.

Ask: either declare the brand display face in Meridian under whatever name
you choose (my suggestion would be for meaning over appearance per the
standing token-naming rule, but you own the vocabulary), after which I
point styles.css's alias chain at it exactly as sans and mono do and move
my four reads; or rule that `--font-pixel` survives as an internal
identifier the way builder/studio did, in which case the ratchet rows for
those files should be declared deliberate rather than chased.

No urgency: nothing downstream blocks. The four reads render correctly
today; what is wrong is only that their token answers to a retired system's
name.

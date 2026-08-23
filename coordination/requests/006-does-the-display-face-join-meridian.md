REQ-006: does the display face join Meridian, or does Geist stay the display voice?

Context first: R004 ruled --font-pixel into --mrd-face-brand and told me to
repoint styles.css:147, rewrite the self-contradicting guardrail comment at
:139, and resolve ard.tsx:130. All three are done in this cycle. While doing
the second I found the same question applies one line up, and it is bigger
than the pixel face was.

--font-display at styles.css:140 still declares its own stack:

  --font-display: "Geist", ui-sans-serif, system-ui, sans-serif;

Geist is genuinely loaded (self-hosted @font-face at styles.css:1964), so
this line paints real pixels. It has three readers: styles.css:529,
ard.tsx:130 (whose serif fallback I aligned to sans per R004), and a stale
comment in knowledge/DocsPanel.tsx (LANE 0's file).

I measured before asking, and deliberately did NOT take the obvious action:

1. Repointing it to var(--mrd-font) would switch every display heading from
   Geist to Inter app-wide. R004's division of hands assigned me :147 only;
   making that swap unilaterally is a visual change outside my ruling.
2. Keeping the literal makes the retired block half-aliased, which is
   exactly the shape R004 called out as the problem. My rewritten comment
   names both remaining declarations openly so no reader mistakes them for
   oversight.

So the ask is one word back: does --font-display alias --mrd-font like sans
and mono do (one type system, founder ruling 2026-08-15 pushed that way), or
does Geist remain the display voice as a deliberate second face? If the
answer is alias, the change is one line on my path and I will take it with
the next unit. If Geist stays, meridian.css may eventually want its own
--mrd-face-display declaration so the pattern R004 established for the brand
face covers this one too.

No urgency: nothing downstream blocks, and the current rendering is stable
and known-good. Filed now because REQ-001 taught me what an unwritten
question costs.

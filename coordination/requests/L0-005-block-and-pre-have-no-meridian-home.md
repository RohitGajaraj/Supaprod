# REQ-L0-005: Block and Pre have no Meridian home; their 12 call sites need a ruling before they can leave the retired layer

**Kind:** meridian-gap
**Blocking:** no
**Raised:** 2026-08-23T23:30+05:30

## What I need

A ruling on each of two retired symbols whose consumers cannot migrate the
way Receipt, Prose, Gate, and the state trio did, because Meridian has no
equivalent component. For each: build it into meridian/ (MAIN LANE's tree),
or rule on how I port the sites by hand onto existing parts.

1. **Block x7 sites** - shell/primitives' Block is a titled section card:
   `{title?, sub?, more?, onMore?, lead?, children}`. The sub slot exists
   under hard ban 10 (label/sublabel/helper saying one thing), and `lead`
   marks the one rung between page title and everything else. Meridian's
   Surface is a page-layout shell ({children, context?, wide?}) with a
   different contract entirely; nothing in meridian/ composes a titled card
   with these slots today.

2. **Pre x5 sites** - shell/primitives' Pre wraps arbitrary children in a
   scrolling pre (`{children}`). Meridian's CodeBlock wants {filename,
   language, lines: CodeToken[][], streaming} - it is a streaming
   agent-code view that tokenizes its input, not a container for plain
   children. The five call sites pass strings and mixed elements.

## Why I cannot answer it myself

meridian/ is MAIN LANE's tree; building Block or Pre there is not my edit
to make. Hand-porting without a ruling would invent per-site card chrome
that would then fight whatever component lands later.

## What I assumed in the meantime

The seven Block files and five Pre files stay on the retired layer,
tracked by the ratchet baseline as before. No new imports of either symbol.

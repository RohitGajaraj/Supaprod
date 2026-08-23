# REQ-L0-005: Block and Pre have no Meridian equivalent; how should their sites port?

**Kind:** meridian-gap
**Blocking:** no
**Raised:** 2026-08-23T23:40+05:30

## What I need

A ruling on two retired shell symbols whose consumers cannot migrate by
import swap because Meridian has no component with their shape:

1. **Block** ({title?, sub?, more?, onMore?, lead?, children}) - a titled
   section card with an optional sub-line and an optional more-link.
   Seven component files use it (cockpit AgentInspector, connections
   bindings x2, ask AskGateCard, today PushedInsights, trust
   ReceiptDetailSheet, learn SettlePanel). Meridian's Surface is a page
   layout shell ({children, context?, wide?}) - a different animal. No
   titled-card component exists in meridian/.

   Options as I see them: (a) a `Section`/`Card` lands in Meridian carrying
   title/sub/more and the sites swap; (b) a ruling that these seven become
   hand-composed Surface + text roles at Wave 3, deleting Block outright;
   (c) something else you can see from the design seat.

2. **Pre** ({children}) - a plain pre block for logs/diffs/exported text,
   five call sites passing raw strings and elements. Meridian CodeBlock
   wants {filename, language, lines: CodeToken[][], streaming} - a streaming
   agent-code view that requires tokenized input. Wrapping arbitrary
   children in it is not possible without a tokenizer per site.

   Options: (a) a thin Meridian `Mono`/`Raw` pre wrapper lands; (b) the five
   sites adopt CodeBlock properly where they genuinely show code and drop
   Pre elsewhere; (c) a ruling to keep .sp-pre alive as an approved style
   until Wave 3 touches each site.

## Why I cannot answer it myself

Both candidate homes are src/components/meridian/** - MAIN LANE's paths -
and the choice shapes seven-plus-five call sites on mine.

## What I assumed in the meantime

Nothing converted; Block and Pre sites keep their retired imports and stay
counted in the ratchet baseline. Everything else in the shell/primitives
census on my paths (Empty, Failed, Loading, Receipt, Gate, Prose) is
already migrated as of units L0-008 through L0-011.

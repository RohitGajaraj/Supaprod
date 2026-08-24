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

## ADDENDUM (2026-08-24T01:30+05:30): Select joins this request

After units L0-008 through L0-014, the shell/primitives census on my paths
is down to: Block x7, Pre x5, and now **Select x2** -
cockpit/AgentInspector.tsx and connections/ProductBindingsSection.tsx.
Meridian's forms.tsx carries Input/Textarea/Checkbox/Choices/ReasonField
but no Select. The retired one is a bare passthrough
(`<select className="sp-select" {...props} />`), so either a Meridian
Select lands in forms.tsx beside its siblings or the two sites hand-roll
onto whatever ruling prefers. Everything else the census listed has since
migrated (units L0-008..L0-014).

## ADDENDUM 2 (2026-08-24T01:50+05:30): the final census - this request now covers every remaining shell reach

Three more symbols checked against meridian/ after the form singletons
landed, none with a home:

- **Record x4** ({children, evidence?, onClick?, title?}) - a standalone
  claim-citation card. RecordsTable/RecordStatus/RecordTag are a table
  system, not this.
- **Value x3** ({children, tone: quiet|pass|warn|fail|live}) - a
  tone-coloured figure span.
- **SelectionBar x2** ({selection, total, noun, children}) - a bulk-action
  toolbar bound to a Selection object. Meridian's SelectionActions is an
  unrelated range-editing surface.

FINAL census of shell/primitives consumers on LANE 0 paths, all awaiting
this one ruling: Block x7, Pre x5, Select x2, Record x4, Value x3,
SelectionBar x2 = 23 sites across ~14 files. Everything else migrated in
units L0-008 through L0-014.

## ADDENDUM 2 (2026-08-24T01:45+05:30): the census is final - three more symbols need rulings

With units L0-008..L0-014 landed, the complete list of shell/primitives
symbols still consumed on my paths, with their contracts:

1. **Block x7, Pre x5, Select x2** - already detailed above.
2. **Record x4** (DiscoverSurface, AskRunCard, AskTurn,
   ReceiptDetailSheet) - a claim card: `{children, evidence?, onClick?,
   title?}` where children is a citation that contradicts or confirms.
   Meridian's RecordsTable is a table component; RecordStatus/RecordTag are
   chips. Nothing composes a standalone claim card.
3. **Value x3** (AgentInspector, ReceiptDetailSheet, MissionChain) -
   `{children, tone?: "quiet"|"pass"|"warn"|"fail"|"live"}` rendering a
   mono value span. Closest Meridian part is StatusChip, but its statuses
   are the five status words plus quiet - no warn, no live. Mapping warn
   and live into the five-word law is a design call, not an import swap.
4. **SelectionBar x2** (DiscoverSurface, DecisionQueue) -
   `{selection: Selection, total, noun, children}` - the bulk-action bar
   over selectable rows. Meridian's SelectionActions is unrelated (a
   text-selection edit toolbar).

Everything else the original census listed has migrated across units
L0-008..L0-014.

## ADDENDUM 3 (2026-08-24T03:00+05:30): sub-nano sizes need a ruling, and one recorded set-rationale was honoured over a sweep rule

Two unrelated closes on the size front:

1. **Below-ladder captions.** 9px appears at twelve sites (chat meta,
   product FlowDiagram/LaunchPlanPanel/OutcomeContractPanel chips) plus
   9.5px x2 and 8px x1, all below nano(10). No Meridian stop exists under
   nano. Ruling needed: does Meridian want a sub-nano stop, or do these
   adopt nano(10) - which makes every one of them visibly larger?

2. **prds/RewindButton.tsx** carries an in-code record that its dialog's
   stops are deliberate as a SET (19px title / 1.32 / 600 tracking over
   13.5px body / 1.55): "rounding 19 to 20... would make the dialog worse."
   A sweep agent snapped the title to text-mrd-h3 anyway; REVERTED in
   favour of the local record. Note the comment's premise is stale - it
   claims Meridian bridges no type scale, which stopped being true when
   h3 landed - so MAIN LANE may want to re-judge the whole dialog as a
   set rather than leave the retired literals standing.

## ADDENDUM 4 (2026-08-24T05:15+05:30): PersonMark consolidation, per RL0-005c's finding

RL0-005c found runs/run-parts.tsx PersonMark duplicates Meridian's YouMark
(role/aria/colours identical; circle size differs). Ruling: become YouMark
with a size prop, or be deleted - filed rather than swept. run-parts.tsx
is mine; marks.tsx is MAIN LANE's. Requesting: either add a size prop to
YouMark (meridian/marks.tsx:241) so PersonMark's 16px-circle usage ports,
or rule deletion. PersonMark meanwhile carries a fitted-monogram comment
per the ruling. Twelve mono-label text-[9px] overrides also landed on
mrd-eyebrow/nano per this ruling (separate commit).

## ADDENDUM 5 (2026-08-24T05:40+05:30): RL0-005c's weight mechanic does not exist - font-[600] was already the honest spelling

RL0-005c section 2 prescribed taking the 600 weight via Meridian. Two
spellings tried, both refused by every-meridian-utility-paints: neither
font-mrd-semi nor font-mrd-w-600 is bridged (the paints test's own doc:
weight tokens "were never exposed to Tailwind - use font-medium /
font-[650]"). RewindButton reverted to its original font-[600], which WAS
the honest spelling; its comment now states both unbridged facts (no 19px
type stop, no weight utility). Filing back so the ruling's mechanic gets
corrected in place: either bridge --mrd-w-* to utilities, or RL0-005c
section 2's prescription should read "keep font-[600]".

## ADDENDUM 6 (2026-08-24T07:05+05:30): four Meridian gaps block the last 25 --ds survivors in ui/**

The R013 item 2 port took ui/** from 109 to 25 var(--ds-) references.
Everything that mapped is gone; the 25 survivors are exactly the gaps,
left resolving through styles.css rather than invented:

1. LINK HUE - button's link variant reads --ds-blue-700/-800. Meridian's
   only blue is --mrd-agent (status: machine working); using it for links
   violates colour-carries-status. Requesting a link token in meridian.css.
2. Z-INDEX SCALE - --ds-z-modal(300)/-menu(2001)/-drawer(200) across
   dialog/alert-dialog/sheet/popover/dropdown. Meridian declares no
   elevation stops. Requesting z tokens or a ruling that literals are fine.
3. CONTROL HEIGHTS - --ds-size-medium(36px)/-large(40px) on button/input;
   --ds-popover-row-height(36px) on command/dropdown rows. Meridian sizes
   by convention h-8 only. Requesting height stops or the convention.
4. (context) --ds-popover-row-radius and -padding already mapped to
   mrd-chip / p-mrd-3; no gap there.

Until these land, styles.css's Tempo scale cannot fully delete. The
dangling overlay-backdrop pair is already fixed (bg-mrd-scrim - overlays
were rendering transparent, a real bug the port surfaced).

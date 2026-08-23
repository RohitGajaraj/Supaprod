# UNIT L0-011: Ten prose surfaces read Meridian's Prose

**Lane:** LANE 0
**Completed:** 2026-08-23T23:20+05:30
**Commit:** ee8155d71

## What this unit was

Prose x10 migrated off shell/primitives: ask/Answer, observe/AnalyticsPanel,
knowledge/{LearningDetail,DesignMemoryPanel,DocsPanel,DecisionDetail},
governance/{EvalSuiteDetail,SupportSignalsPanel}, trust/ReceiptDetailSheet,
ship/WhatShipped.

Meridian's Prose carries the identical contract ({children, markdown?}) and
its stylesheet hoists through React (href + precedence), so N blocks emit
one sheet. Import-path swap per file; LearningDetail, DocsPanel and
WhatShipped drop their shell import line entirely.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,594 / 204 | **2,565 / 201** | design:ratchet over merged disk |
| Prose imports from shell/primitives | 10 files | **0** | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Gap findings routed to a request (REQ-L0-005, next commit)

Two retired symbols have NO Meridian equivalent and cannot be swapped
mechanically:

1. Block ({title?, sub?, more?, onMore?, lead?, children}) - a titled
   section card with an optional more-link. Meridian Surface is a page
   layout shell with a different contract entirely; no titled-card
   component exists.
2. Pre ({children}) - raw code/log block. Meridian CodeBlock wants
   {filename, language, lines: CodeToken[][], streaming} - a streaming
   agent-code view, not a wrapper for arbitrary children. Five call sites
   pass plain strings/elements.

Both need either components built in Meridian or a ruling on how their
sites port by hand.

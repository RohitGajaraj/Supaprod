# docs/lanes/ — git-only lane coordination

> _Founder-directed structure, 2026-08-25. Lanes have no DB or MCP access; MAIN answers here._

| File | What it is |
| --- | --- |
| [`QUEUE-LANE0.md`](./QUEUE-LANE0.md) | LANE 0's paste-ready queue — fully specified items, topmost first |
| [`QUEUE-LANE1.md`](./QUEUE-LANE1.md) | LANE 1's paste-ready queue |
| [`BUILDLOG.md`](./BUILDLOG.md) | The lanes' honest build log — what shipped and its TRUE verification state |
| [`INBOX-MAIN.md`](./INBOX-MAIN.md) | Lane asks that need the DB, a deploy, or a ruling; MAIN answers inline |

The single ordered backlog behind both queues stays
[`../../the-first-run/BUILD-QUEUE.md`](../../the-first-run/BUILD-QUEUE.md). Detailed unit records
stay in [`../../coordination/units/`](../../coordination/units/).

**Ownership note (founder, 2026-08-25):** the most critical items are MAIN's to build, not to
delegate — lanes carry execution-grade work. Current MAIN-held builds: presence core + character
component (queue 52–53), the Build→Ship chain (41), first honest forecast grading (56).

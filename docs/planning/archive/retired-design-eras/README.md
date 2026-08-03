# Retired design eras

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Three complete planning efforts for design systems that no longer exist.** Sixty markdown files, all of them mockups, specs, work orders and port plans aimed at visual languages that have since been retired.

They are kept because they contain real research and because the pattern in how they failed is worth not repeating. **None of it is a plan you can execute today.**

**What is live instead:** [`../../rebuild-2026-07/`](../../rebuild-2026-07/) is the current rebuild folder, and [`../../../design/DESIGN-SYSTEM.md`](../../../design/DESIGN-SYSTEM.md) is the design contract.

| Folder | Targeted | Why it is dead |
| --- | --- | --- |
| [`obsidian-port/`](./obsidian-port/) + [`obsidian-port-plan.md`](./obsidian-port-plan.md) | Porting every surface onto Obsidian v3 | Obsidian v3 was superseded by Tempo v5 on 2026-07-10, and Tempo itself was rejected on 2026-07-28. The port was aimed at a contract retired twice over. |
| [`loom-v4/`](./loom-v4/) | The Loom v4 design system | Superseded by Tempo v5 on 2026-07-10. |
| [`front-end-reimagining/`](./front-end-reimagining/) | A full front-end reimagining, including 28 mockups and 13 work-order packets | The founder's verdict on its Round-3 mockup set was *"not at all to the satisfied level."* Superseded by the 2026-07-28 rebuild-from-zero ruling. |

## The lesson that outlived all three

Each era produced more documents than code. The front-end reimagining authored 28 mockups and 13 work-order packets, and **only 2 of 11 lanes ever ran**. Then on 2026-07-29 four freshly authored design directions were all rejected in one sitting, with the diagnosis:

> "We have built all four directions only from the perspective of **assembling things**, not really thought through from a **user lens**."

**Parallelism does not buy a user lens, and a packet is not progress.** Start from a person doing a real task, walk their whole session, and take **one** direction to a high finish. Full record: [`../../rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md`](../../rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md).

## What is still worth mining

- **`front-end-reimagining/`** holds genuine competitor and pattern research. Anything verified from it should be appended to [`../../../design/REFERENCE-PATTERNS.md`](../../../design/REFERENCE-PATTERNS.md), which is the one place research is allowed to accumulate, so it is never paid for twice.
- **`obsidian-port/`** carries per-surface information-architecture arguments. Parts of that IA survived into the current rail.

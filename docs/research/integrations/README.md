# Integration research — read before researching any tool

> _Created: 2026-08-26 · Last updated: 2026-08-26_

**One file per tool, written at the moment of need, so nobody pays for the same research twice.**
Ruled by the founder 2026-08-26: research happens while building, by the session that needs it — not
as an up-front phase, which produces a document nobody reads.

**Before you research a tool, check for its file here.** If it exists, read it and stop.

## What a file must hold

Keep it short and operational. The point is the next session's decision, not completeness.

```markdown
# <Tool> — integration notes

> _Researched YYYY-MM-DD by <session>, for: <the one decision you faced>._

- **Does it have an MCP server?** If yes, that is the path — we already have a generic client
  (`src/lib/connectors/mcp/client.server.ts`). Stop here.
- **What already exists in this repo** — the provider file, what it does, who calls it.
- **The exact call** — endpoint or tool name, and the shape of what comes back.
- **The scope string** required, and the narrowest one that works.
- **Rate limits and pagination**, if they change the design.
- **Writes** — what is reversible, what is not, and therefore the mode
  (`auto` / `confirm` / `review` / never) per `SPEC-CONNECTORS.md` §5.
- **What we did NOT verify**, said plainly.
```

## The rules that make this folder trustworthy

1. **Every claim carries the date it was checked.** An API is true on a date, not forever.
2. **Name what you did not verify.** A gap stated is useful; a gap hidden costs the next session a day.
3. **Check `../../../the-first-run/SPEC-CONNECTORS.md` §1 first.** Around twenty providers already
   exist, including Jira, Linear, GitHub, GitLab, Slack, Figma, Stripe, Zendesk, Intercom, HubSpot,
   Salesforce, Canny, Productboard, Gmail and Outlook. **A session that writes a second Jira client has
   wasted a night.**
4. **Link every new file from the table below in the same commit**, or the doc gate fails and nobody
   finds it.

## The files

| Tool | What it settles |
| --- | --- |
| _(none yet — the first session to need one writes it)_ | |

# Lovable's settings, read signed in on 2026-09-02 — the mechanics, not the list

> _Created: 2026-09-02 · Last updated: 2026-09-02 · by A1, on the founder's instruction to read every
> settings page and take what fits. Stored so no session pays for the read twice. Decisions drawn
> from it: `the-first-run/A-QUEUE.md` P-17, P-22, P-23._

## The shape

One page. A search box at the top of a left rail (*Search settings*). Groups in the rail: Account
(the person, Devices and apps) · Project (General, Git, Domains) · Workspace (the workspace, Plans and
credit usage, Slack) · Access (People, Groups, Identity) · Customization (Knowledge, Skills, Templates,
Design systems, Connector settings) · Build and deploy (Build secrets, Managed registry, MCP server,
Workspace domains) · Security (Privacy and security, Security center). Plan-gated rows carry a small
*Pro* / *Business* / *Enterprise* chip and still render, with an Upgrade control in place of the
setting. The right side is inline: every row is a title, one sentence of consequence, and one
control (switch, select, button). No row opens a second page.

## The rows that matter to us, with their exact copy

| Row | Their sentence | What it is for us |
| --- | --- | --- |
| **Live preview** (Project › Preview) | *Run your app on a live dev server in the editor preview. When off, the preview shows the latest built version.* | P-22, the thing being built running in the right pane |
| **Project monitoring** (Beta) | *Regularly checks your project for issues and improvements. Past checks and their credit usage are stored in your history.* | The return edge made visible as a switch with a history: gap 4, P-04 |
| **Auto-fix security issues** | *Auto-fix is enabled for this project.* | The self-check as a switch: gap 22, P-02 |
| **Knowledge** — Project knowledge | *Help the AI understand this specific project. Describe what your app does, its domain, and any project-specific rules.* Three inspiration lines: purpose and target users · APIs, schema, architecture · project-specific rules | **The Brief.** `workspace_briefs` is empty in 13 of 21 workspaces and Discover starves without it. P-23's Brief group |
| **Knowledge** — Workspace knowledge | *Set shared rules and preferences that apply to every project in this workspace.* Coding style and naming · preferred libraries · behavioural rules like tone | The mandate's standing rules, one level up from the project |
| **Skills** | *Reusable instructions your agents can apply whenever they're at work.* Trigger with "/" or auto-activated when it matches; shared with the team | Our station briefs as versioned skills: gap 23, post-launch |
| **Credit usage / Plans and credits** | Credits left, expiry, daily build credits, a 30-day usage chart, *View usage limits* | P-23's Usage group: spend against the ceiling, runs, tokens |
| **Default monthly member credit limit** (Workspace) | *The default monthly credit limit for members of this workspace. Leave empty to use no limit.* | Note: "leave empty to use no limit" is the exact default-as-data trap R-22 refuses. We say an unset ceiling is the product default |
| **Git** | *Lovable keeps your project and repository in sync, both ways: edits made in Lovable are committed to your repo, and commits you push are pulled back into your project.* Plus *Download codebase* as a ZIP | P-23's Connections group: the repo binding stated as one sentence about direction of sync |
| **MCP server** | *Connected clients use the signed-in user's Lovable access. Tool calls can edit projects, deploy apps, query databases, and consume credits.* Per-client setup steps, OAuth, no API keys | Our `/mcp` route's settings row: say what a connected client may do, in one sentence |
| **Slack** | *"@Lovable what shipped this week?"* · *DMs are private. Channels are shared.* A consent line before Connect | The verdict reaching a person who left the page: gap 2, post-launch. The consent sentence is the model |
| **Privacy and security** | Forty-odd rows, each one sentence: *Block publishing with critical issues* · *Who can publish externally* · *Mark as abandoned after · Delete abandoned projects after* · *Remote MCP connectors: disabling this removes existing MCP connections* · *Use workspace content for model training* | P-23's Security group. Take the abandoned-project pair for our 45 abandoned tracks |
| **Security center** (Business) | Tabs: Security insights · Code analysis · Supply chain · Secrets · Security automation | Post-launch |
| **Design systems** | *Mark projects as design systems to get started.* | Meridian is already this; nothing to take |
| **Domains** | The published URL with *Edit URL*, custom domains with a *Live* chip | Ship's row: the URL and its state |

## What to take, in one line

Every setting that changes what the agent does is a switch and a sentence, findable by search, with
the consequence stated in the row. Never a console, never a second page.

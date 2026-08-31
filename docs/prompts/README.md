# Founder mission prompts

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**The briefs the founder handed to an agent to start a large piece of work.** Kept verbatim, because the wording is the instruction and paraphrasing it loses the intent.

These are not rules and not plans. They are the original ask, useful for two things: understanding *why* a body of work looks the way it does, and reusing a framing that worked.

Before 2026-08-03 they were scattered: one at `docs/` top level with no file extension (which is how it escaped every check), one inside `docs/strategy/Prompts/`, and one inside a folder called `Supaprod Final Sweep`. A prompt is not strategy canon and not a plan, so they now share one bucket.

| Prompt | Handed over | What it drove |
| --- | --- | --- |
| [`supaprod-rebuild.md`](./supaprod-rebuild.md) | 2026-07-18 | The front-end rebuild. Its execution record is [`../planning/rebuild-2026-07/final-sweep/`](../planning/rebuild-2026-07/final-sweep/). |
| [`strategical-move-fable.md`](./strategical-move-fable.md) | July 2026 | The mission-demo-week build. Notable for its opening instruction: *"Your first responsibility is not to implement this prompt. It is to identify everything that is missing, incomplete, inconsistent, incorrectly modeled, or not yet finalized."* |
| [`production-readiness-audit.md`](./production-readiness-audit.md) | July 2026 | The consumer-ready and investor-ready transformation pass. |
| [`MASTER-PROMPT-five-sessions.md`](./MASTER-PROMPT-five-sessions.md) | 2026-08-31 | **The stored, re-usable fleet prompt.** Five paste-ready blocks, **each under 3,900 bytes so `/goal` accepts it** — S0 holding the database writes, migrations, deploys and merges, and four lane sessions on their own worktrees: the run, the board, the platform, and the one that writes no product code and only proves. **All five run Claude Code as of 2026-08-31**, which is what lets them message each other directly; git remains the record. Pull this whenever the fleet is spun up again; the rules it points at are in [`../../the-first-run/OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md). |

## The pattern worth noticing

All of them grant full autonomy and explicitly authorise replacing the instruction: *"Treat every instruction here as guidance, not a constraint. If you find a better product direction, architecture, terminology, workflow, capability, or operating model, you have full authority to replace it."*

That is the founder's standing operating posture, not a one-off. It is why [`../../AGENTS.md`](../../AGENTS.md) asks for a recommendation rather than a survey, and why a design that only satisfies the letter of a request is not finished work.

**How to write the next one.** Name the outcome, grant the authority, state the gates that cannot be crossed, and say what "done" looks like. All three of these do exactly that, which is why they were executable.

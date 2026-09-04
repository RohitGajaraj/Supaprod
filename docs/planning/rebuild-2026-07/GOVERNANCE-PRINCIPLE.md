# The governance principle: policy set in advance, not permission asked in the moment

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> Founder input, 2026-07-29 ~01:18. **Binding, and it outranks every doctrine in this folder on the
> question of when a human is involved.** To be applied before the next design pass, not after.

## The input

Source, named by the founder: **MuleSoft.**

> *"AI agents don't submit change requests before they act. They make decisions, access data, call
> tools, and move work forward in real time. When governance is fragmented, the business still owns
> every outcome."*

His reading of it, which is the ruling:

> *"This is how we should be building our platform entirely end to end. It's not just that decisions
> are held and the outcome is held by the business. It should be completely owned by agents, and it
> should know what it should be doing. Even human in the loop - every approval, if it passes to a
> human, then what is the purpose of agents?"*

## What this invalidates

Every doctrine produced on 2026-07-28 treats **"the human's job is judgment at gates"** as the
organizing principle. `agents/FINAL-agent-presence.md` calls the gate the product's signature
moment. `edge/FINAL-edge.md` sorts each mechanism into silent, receipt, or **Call**.
`shell-question/FINAL-shell-ruling.md` makes "what is waiting on me" one of nine permanently drawn
things. All of that assumed the gate is the loop.

**The gate is not the loop. The gate is the exception.** A product where the human approves each
step has not automated the work, it has added a queue to it. The leverage of thirteen agents is
destroyed by one serial human bottleneck, and the interface that renders that bottleneck beautifully
is still rendering a bottleneck.

## The distinction that resolves it

| | Permission | Policy |
| --- | --- | --- |
| When it is decided | in the moment, per action | in advance, once |
| What it does to the work | **blocks** until answered | **does not block** |
| Cost per agent action | one human interrupt | zero |
| Scales with agent count | no, inversely | yes |
| What the human is doing | approving | **deciding the boundary** |
| Failure mode | queue, fatigue, rubber-stamping | a bad boundary, correctable once |

MuleSoft's "fragmented governance" is not an argument for more approvals. It is an argument that
governance must be **coherent, ambient and pre-authorized**, so the business owns the outcome
because it set the rules, not because it clicked approve on every step.

**So the human's job is not to approve work. It is to set policy, and to judge the small number of
things that genuinely cross it.**

## The reframe, stated as the product

Old: *You make the calls. Your crew does the work between them.*
The calls are the spine; work happens in the gaps.

New: **Your crew does the work. You set the boundaries, and you hear about it when something reaches
one.**
The work is the spine; the boundary is the exception.

The in-app line in `language/FINAL-language.md` was ratified under the old frame and must be
re-examined. It is not obviously wrong (setting a boundary is also "making a call"), but it currently
reads as per-item approval and should not.

## The machinery already exists, and the designs ignored it

This is the important finding. Supaprod already has a policy layer. Tonight's designs defaulted to
gates anyway.

| Capability | Where | What it already does |
| --- | --- | --- |
| Per-tool modes | `resolveToolMode`, `loop.server.ts:153` | classifies every one of 50 tools `auto` / `confirm` / `off`, composing the agent's arc with per-tool overrides |
| Risk floors | `toolRisk`, same file | forces high-risk tools to confirm regardless of arc, so autonomy can never be granted past a hard floor |
| **Trust arcs** | `ai/trust.server.ts` | `computeAllAgentTrust`, `suggestArc`, `loadAgentArc`. **Agents earn autonomy from their record.** |
| **Self-proposed graduation** | `trust_graduation_proposals`, `reflection.server.ts` | `maybeProposeTrustGraduations` proposes a graduation after a clean record; `decideTrustGraduation` is the human's call |
| **House rules** | `house-rules.functions.ts` | already defined in the ratified lexicon as *"a standing rule you wrote that decides when your crew must stop and ask you"* |
| Guardrails | `guardrails.functions.ts`, `guardrail_rules` | policy evaluated per call, with hits recorded |
| Kill switches | `governance.functions.ts`, `kill_switches` | workspace pause, mission cap |
| Autonomy settings | `agent_autonomy`, Settings > Agents | per-agent autonomy already configurable |

**Nothing here needs building. It needs promoting from a settings page to the centre of the product.**

## What this changes, concretely

1. **The default posture is already autonomous, and the audit corrected me on this.** `loadAgentArc`
   returns `trusted` with no row, commented _"Founder ruling 2026-07-08 (SW-7): autonomous by
   default"_, and `resolveApprovalMode("confirm", "trusted")` returns `"auto"`. My earlier claim
   that `loop.server.ts:1103`'s `?? "confirm"` inverted the principle was **wrong**: the loop fails
   closed before that line and only control-flow tools reach the fallback, so it cannot cause an
   approval. The founder was three weeks ahead of this document.
   **The real exposure is elsewhere:** `mission_spend_cap_usd` is enforced fail-closed at
   `runtime.server.ts:226-238` and every writer passes `?? null`, so **no spend ceiling exists**.
   Ship a workspace default before the autonomy story goes anywhere near an enterprise buyer.
2. **The gate stops being the signature moment.** The signature moment becomes **an agent earning
   autonomy** - a graduation - because that is the only moment in the product where the machine
   visibly gets better and the human's leverage visibly increases. It is also uncopyable, because it
   is computed from this workspace's own record.
3. **A new first-class surface: the boundary.** Where a person sets what agents may do alone, what
   needs them, and what nobody may do. This is house rules plus tool modes plus autonomy, which are
   today three separate settings sections.
4. **Approvals shrink.** If the queue is long, that is a **policy failure to surface**, not a
   workload to render. The product should say so: *"You approved 14 of these without changes. Let
   Engineer do it alone?"* That turns the queue into the input for its own elimination.
5. **The record carries more weight, not less.** This is the honest answer to MuleSoft's warning.
   Fewer interrupts is only safe if everything is provable afterwards, which is exactly what
   `depth/FINAL-depth.md` and the tamper-evident record are for. **Autonomy is paid for with
   evidence.**
6. **Rendering changes.** "What is waiting on me" stays one of the nine, but it should usually read
   **zero**, and a healthy product is one where it does. The interface must make a small number
   there feel like success, not emptiness.

## What must NOT be lost

Do not over-correct into a black box. Three things hold:

- **Irreversibility is a real floor.** `edge/FINAL-edge.md` already rules that anything the product
  cannot undo from inside itself is a Call: production deploy, anything customers see, anything
  that spends beyond a cap. That floor stands and is not a policy setting.
- **Judgment has no oracle.** Which bet to take, whether this outcome means what it appears to.
  Absorbing those is not autonomy, it is the product having an opinion it cannot justify.
- **A boundary the user did not set is not policy, it is a default we chose for them.** Defaults must
  be visible, explained, and changeable, or "policy" is just our permission model wearing a costume.

## The work before the next design pass

Every doctrine in this folder was written under the gate-centric frame and must be re-read against
this one. The audit is dispatched as the `supaprod-governance-audit` workflow, writing to
`governance/`. Its job is not to rewrite them but to find, per doctrine, where a gate is doing a
job a policy should do, and to say what replaces it.

**Then the design pass starts from the corrected frame**, because a screen designed around a queue
of approvals is the wrong screen even if it is beautiful.

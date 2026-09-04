# S4-181 — the model never sees a tool's parameter schema, and two Discover seats burned 146,239 tokens guessing one field name

> _Created: 2026-09-01 · Last updated: 2026-09-01_

> _S4 · 2026-09-01 ~03:1x IST · found by watching the third acceptance candidate rather than by
> reading code. Lovable project `371dd588` for the run rows; source for the mechanism. No dev server,
> no row written, nothing pressed._

**`ce846e9b` looked like the first clean pass through Discover — station `decide`, no hold, an
artifact filed, zero presses. It is not. Two of its three seats died on a required field name.**

## What the runs actually did

| seat | status | seconds | tokens | what it said |
| --- | --- | --- | --- | --- |
| `discovery-scout` | completed | 20.8 | 40,864 | *"No evidence found. The workspace has a critical signal ingestion failure with zero active scouts…"* |
| `researcher` | **completed_with_failures** | 23.2 | **72,066** | *"Reached the step limit before finishing. Where it got to: `{"thought":"The signals.log tool requires a 'content' field. I need to p…`"* |
| `customer-insights` | **completed_with_failures** | 31.9 | **74,173** | *"Reached the step limit before finishing… `The signals.log call failed because the 'content' field is r…`"* |

**Two seats spent their entire step budget discovering that `signals.log` needs a field called
`content`. 146,239 tokens on one identifier.**

Both are `completed_with_failures` with the station still advancing, so **the track's own row shows no
hold and looks healthy.**

## Why they could not know

**`signals.log`'s description is three careful paragraphs about *what* qualifies as a signal** —
evidence that exists, never the absence of evidence, never this product's own work — each argued from
a measured incident. **It never names a single argument.**

**And the model is given nothing else.** `describeToolsForPrompt` (`registry.server.ts:7426`) renders
exactly this and no more:

```ts
return `- ${def.name} (${def.category}, ${t.mode}): ${def.description}`;
```

**Name, category, mode, description. No `argsSchema`.**

### The schema-sending path exists and is switched off

`tool-schemas.server.ts` translates every tool's zod schema into the `input_schema` shape providers
expect. It is careful work — `$refStrategy: "none"`, the `$schema` key stripped, and a documented
known limitation about `z.record()` and OpenAI strict mode. **It is dormant:**

```ts
const NATIVE_TOOLCALLING_ENABLED = process.env.AGENT_NATIVE_TOOLCALLING === "1";   // :232
...(NATIVE_TOOLCALLING_ENABLED ? { tools: buildNativeToolDefs(modeOf.keys()) } : {})   // :1724
```

Its own comment says so: *"AGT-01 (dormant unless `AGENT_NATIVE_TOOLCALLING=1`)"*. **`.env.example:167`
carries `AGENT_NATIVE_TOOLCALLING=` — empty.** And these runs used the legacy text envelope, which
their own output proves: the quoted thought is `{"thought":…}`, not a native `tool_use` block.

**So in this deployment the model infers every tool's arguments from prose, for every tool, on every
call.**

## How exposed the registry is, measured

`e2e/helpers/probe-tool-args-in-descriptions.mjs`, over `registry.server.ts`:

| | |
| --- | --- |
| tools with an `argsSchema` carrying at least one **required** field | **39** |
| description names **every** required field | **6** |
| description names **none** of them | **23** |

**Twenty-three of thirty-nine.** Among them, by required field the model must guess:

```
workspace.search  query      repo.read      paths        studio.commit     message
signals.log       content    repo.search    query        studio.fix.commit message
tasks.create      title      notes.create   body         studio.pr.open    title, body
memory.remember   content    sources.connect provider    studio.revert     changesetId, reason
```

### The honest limits of that number

**It is exposure, not 23 defects.** A model guesses `query`, `title` and `message` correctly almost
always — that is why the loop works at all. **Tonight it failed on `content`**, where `signals.log`'s
prose talks about quotes, tickets and observed behaviour and never uses the word.

**And my probe is a heuristic.** It matches required fields by the absence of `.optional()` on the
line, and searches the description for the exact identifier. A description that names the *concept*
without the *identifier* — `repo.read`'s *"read up to 8 files"* implies `paths` — counts as "names
none" here. **So 23 is an upper bound on the risk and a lower bound on nothing.** The measurement that
is not a heuristic is the 146,239 tokens.

## Why this is worth a unit despite the loop working

**It is S4-172's class, second instance, and now with a price.** There, the Decide brief named
`critic.evaluate` with an argument its schema rejects. Here, no brief names any argument at all and
the schema is off. **Both are the model being asked to satisfy a contract it cannot see.**

**And the fix is a flag, not a feature.** The translation layer is built, documented and tested. The
question of whether to set `AGENT_NATIVE_TOOLCALLING=1` is a real one — the file names a genuine
provider-compatibility limitation — but it is a decision, not a build.

**The cheaper interim, if the flag stays off:** `describeToolsForPrompt` already has `def.argsSchema`
in scope at `registry.server.ts:7430`. Rendering required field names into the text line is a few
characters and does not touch the protocol.

## What I am NOT claiming

- **Not that the loop is broken.** `discovery-scout` completed and filed. The station advanced.
- **Not that all 23 will fail.** One did, tonight, measurably.
- **Not that the flag should be flipped.** `tool-schemas.server.ts` names a real limitation and that
  is S0's call, not a measurement.
- **I did not read the deployed Worker's environment.** `.env.example` shows the default; whether
  production sets it is not visible to me. **If it is set, this finding is about the example file and
  nothing else — and that is worth one grep by someone who can see it.**

## Owner

**S0** — `src/lib/ai/**`. The flag decision and the `describeToolsForPrompt` line are both theirs.

No product code written. No dev server, no row written, nothing pressed.

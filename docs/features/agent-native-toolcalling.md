# AGT-01 - Structured-output protocol upgrade

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Built, tested, adversarially reviewed 2026-07-03; SHIPPED DORMANT (activation is the founder's own `AGENT_NATIVE_TOOLCALLING=1` decision) · Route(s) - engine only, rides `executeLoop` (the agent core) · Owner: Foundational (`src/lib/ai/loop.server.ts`, `src/lib/ai/runtime.server.ts`)

## What it does

Retires the regex-parsed JSON-in-text loop protocol for native provider tool-calling / structured
outputs, per provider, behind the existing dispatch resolver - when turned on. The agent loop's
model call is offered each enabled tool's real, existing zod schema translated to JSON Schema; a
provider that honors this replies with a structured tool call instead of a `{"thought":"...",
"action":{...}}` JSON blob the loop then has to hand-parse. A provider that ignores it, or replies
with plain text anyway, degrades gracefully to today's exact parsing path - nothing new is
required for the capability to be safe to ship.

**Dormant by design.** `AGENT_NATIVE_TOOLCALLING` is unset in production today; the loop's
behavior is 100% byte-identical to before this change until the founder sets it to `"1"` - the
same activation pattern already established for `STUDIO_AUTO_SHIP` and other founder-grade
chokepoint switches in this codebase.

## Why it exists

The founder's latency ask (v12 §7.3): "retiring the regex-parsed JSON-in-text protocol for native
structured outputs per provider at the chokepoint... removes the retry tax that is today's biggest
hidden latency (the brittle-parse problem the v11 CTO villain correctly named)." See
[`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §7.3 (AGT-01).

## Where to find it

No UI surface - a runtime protocol change inside `callModel`/`executeLoop`. Once activated, its
effect is observable in `ai_events.output_preview` (a tool-call turn's preview reads
`[tool_call] tool.name` instead of raw JSON text) and, indirectly, in fewer JSON-parse-retry steps
consuming a mission's step budget.

## Demo script (once `AGENT_NATIVE_TOOLCALLING=1` is set)

1. Dispatch any agent run against a model/provider with real tool-calling support (Anthropic, or
   an OpenAI-compatible provider).
2. Confirm the run completes and its steps show real tool calls exactly as before - the loop's
   observable behavior (which tools ran, in what order, gated by the same approval modes) is
   unchanged; only the wire protocol underneath differs.
3. Check `ai_events` for that run's `surface = 'agent'` rows: `output_preview` for a pure tool-call
   turn reads `[tool_call] <tool.name>` rather than a raw JSON blob.
4. Force a model/provider that ignores `tools` (or set the flag back to unset): confirm the exact
   same legacy JSON-in-text behavior returns, byte-identical to before this ticket.

## How it works

- **`src/lib/ai/tool-schemas.server.ts`** (new) - `toolInputSchema` translates one tool's existing
  zod `argsSchema` to plain JSON Schema via `zod-to-json-schema` (`$refStrategy: "none"`, inlined,
  no `$ref`/`definitions`); `buildNativeToolDefs` builds the full native tool-def array for a set
  of enabled tool names, mirroring exactly the same list `describeToolsForPrompt` already renders
  as text. A real end-to-end sweep across all 44 registered tools converts without error or
  special-casing - the "4 awkward tools" a prior audit flagged (open `z.record` context fields,
  a conditionally-required field, several `.default()` fields) all convert correctly with zero
  bespoke handling; see the doc comment in that file for exactly why.
- **`runtime.server.ts`** - `CallOpts.tools` (optional, additive) and `CallResult.toolCalls`
  (optional, additive) thread a native tool-calling request/response through `callModel`
  (non-streaming only - `callModelStream`/SSE chat is untouched, since the agent loop never uses
  it). `callAnthropic` sends Anthropic's native `tools`/`input_schema` shape and extracts
  `tool_use` content blocks; `callOpenAICompat`/`callGateway` send the OpenAI function-calling
  shape and extract `message.tool_calls`, parsing each call's JSON-string `arguments`. A shared
  `isStructuredOutput` flag (`responseFormat === "json_object" || tools?.length`) keeps the
  existing humanize/guardrail-skip logic correct for both JSON mode and native tool-calling.
  `shouldCacheCall` now also refuses to cache a tool-calling request (a cached text response would
  be missing the tool calls a fresh call could return).
- **`loop.server.ts`** - `NATIVE_TOOLCALLING_ENABLED` gates the whole path. `resolveModelAction`
  (exported, pure) prefers a native tool call when present and enabled, else falls back to the
  exact pre-existing `safeParseAction` text-parse - the single call site this feeds
  (`executeLoop`'s one `callModel` invocation, shared by `runAgentLoop` and `resumeAgentLoop`) is
  unchanged in every other respect. `responseFormat: "json_object"` is only requested when native
  tools are NOT being offered on that call, avoiding two competing instructions ("reply in strict
  JSON" vs. "use this tool") that could otherwise bias a model back toward the legacy envelope.
  Every assistant turn pushed into `conv` (six sites) now uses a computed `assistantContent` - `r.output` when non-empty, else a serialized `{thought, action}` envelope - so a pure native tool
  call with no accompanying prose never pushes an empty-string message (which a 4-lens adversarial
  review's verify pass found would otherwise be a real, confirmed path to an Anthropic 400 on the
  very next step, since the Messages API rejects empty non-final message content).

## Governance & guardrails

- **Default OFF, founder-grade activation only** - matches `STUDIO_AUTO_SHIP`'s established
  pattern for this exact risk class of chokepoint change.
- **Every existing approval-mode gate is untouched.** Native tool-calling only changes HOW a tool
  call is parsed out of the model's reply, never WHETHER it's gated - `resolveToolMode` (shared
  with AGT-02) runs identically regardless of which protocol produced `call.name`/`call.args`.
- **Graceful degradation, not a hard cutover.** A provider that doesn't cooperate (ignores `tools`,
  replies with plain text) falls straight through to the exact legacy parsing path - there is no
  new failure mode introduced by turning the flag on beyond "the latency win doesn't materialize
  for that provider this turn."

## Verification checklist

- [x] `tsc --noEmit` clean.
- [x] `bun test` full suite green (2228 pass / 0 fail), including 30 new tests across 4 files:
      `tool-schemas.server.test.ts` (8, incl. a full 44-tool registry sweep), `resolve-model-action.test.ts`
      (7, the native/legacy branching), `tool-calling-wire-format.test.ts` (7, the OpenAI wire-shape
      mapper/extractor), plus AGT-02's `resolve-tool-mode.test.ts` (8, since both share the same
      chain function).
- [x] `bunx eslint` clean on every touched/new file.
- [x] A 4-lens adversarial review (safety-floor preservation, backward-compat, wire-format
      correctness against the real Anthropic/OpenAI APIs, loop-integration-integrity) caught and
      this session fixed two real, confirmed-blocking defects: the AGT-02 schema-column bug noted
      in [`consent-scopes.md`](./consent-scopes.md), and the empty-assistant-content bug described
      above (a genuine path to a provider-level 400 once activated, now closed). Two further
      real-but-minor findings were also addressed (a `max_tokens` bump when tools are offered, and
      making `responseFormat: "json_object"` conditional on the flag to reduce competing
      instructions) - both are documented in the code comments at their exact sites.
- [ ] Live activation + browser/API walk of the demo script above (this is a founder-timed
      activation by design - the capability ships built and tested, not yet turned on; this
      worktree's `bun run dev`/`build` also hits the pre-existing node20-vs-ESM `lovable-tagger`
      failure regardless).

## Known limits / out of scope

- **One-shot per-turn parsing, not the canonical multi-turn `tool_use`/`tool_result` protocol.**
  `conv` stays a plain `{role, content: string}[]` history - a native tool call's structured
  content block is extracted into `toolCalls` for THIS turn only and never written back as an
  actual `tool_use`/`tool_result` content block pair in the ongoing conversation. This means native
  tool-calling here is "ask the provider to structure one turn's action" rather than the full
  multi-turn protocol both providers' models are most optimized against - a real, accepted
  architectural simplification (full wiring would mean restructuring `conv`'s type throughout the
  entire loop, a much larger change than this session's scope), not a correctness defect: no
  provider ever receives a malformed/orphaned tool_use block, since the raw block is never
  round-tripped back into the request.
- **Non-streaming only.** `callModelStream` (SSR chat streaming) is untouched - the agent loop
  never uses it, so extending native tool-calling there was out of this ticket's scope.
- **The mechanical zod-to-JSON-Schema conversion has one documented, deliberate gap:** an open
  `z.record()` field (e.g. `agent.handoff`'s `context`) translates to a valid, Anthropic/gateway-
  accepted `{"type":"object","additionalProperties":{}}` schema, which OpenAI's _strict_
  function-calling mode specifically rejects (it requires `additionalProperties:false` + every
  property enumerated). This codebase does not use OpenAI's strict mode anywhere (no official SDK
  is imported; every provider call is a raw `fetch`), so this is a non-issue for every route this
  ships on today, not an unhandled edge case - see the doc comment in `tool-schemas.server.ts`.

## Related

- [`docs/planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §7.3
- [`consent-scopes.md`](./consent-scopes.md) - AGT-02, shipped alongside this in the same
  chokepoint-attended session, sharing the `resolveToolMode` mode-composition chain

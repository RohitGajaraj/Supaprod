import { z } from "zod";

/**
 * THE REQUIRED ARGUMENTS OF A TOOL, FOR THE PROMPT (F-185, found by S4 as S4-181).
 *
 * ── THE MODEL WAS NEVER SHOWN A TOOL'S PARAMETERS ───────────────────────────
 * `describeToolsForPrompt` renders `- name (category, mode): description` and
 * nothing else — its own doc comment said *"(no schemas)"*. The native path that
 * WOULD send them, `buildNativeToolDefs`, is gated on
 * `AGENT_NATIVE_TOOLCALLING === "1"` and `.env.example` ships it empty, so every
 * run uses the legacy text envelope. **So the model has to guess argument names
 * from prose.**
 *
 * ── WHAT THAT COST, ON ONE TRACK ────────────────────────────────────────────
 * `ce846e9b`'s Discover visit, 2026-09-01: three seats, **146,239 tokens**, and
 * two of them died at the step limit saying the same thing —
 * *"the signals.log tool requires a 'content' field"*. `signals.log`'s
 * description is three careful paragraphs about what qualifies as a signal, each
 * argued from a measured incident. **It is good writing and it never names a
 * single argument.** The track's row showed no hold at all.
 *
 * Registry-wide, measured by S4: **39 tools carry at least one required field, 6
 * name every one in their description, and 23 name none** — including
 * `repo.read` (paths), `workspace.search` (query), `studio.commit` (message) and
 * `studio.pr.open` (title, body). **That 23 is an upper bound on risk, not 23
 * defects**: a model guesses `query` and `title` correctly almost always, which
 * is why the loop works at all. It failed on `content`, where the prose talks
 * about quotes and tickets and never uses the word.
 *
 * ── WHY THIS FILE EXISTS RATHER THAN REUSING THE TRANSLATOR ─────────────────
 * `tool-schemas.server.ts` already turns a zod schema into a provider
 * `input_schema` with a `required` array, and reusing it would be the obvious
 * move — **but it imports `TOOL_REGISTRY` from the very module that needs this,
 * so calling it from there is an import cycle.** This depends on `zod` alone.
 *
 * **It does not turn native tool-calling on.** That flag names a real provider
 * compatibility limit and is a decision rather than a measurement; this is the
 * interim that touches no protocol.
 */

/**
 * Required (non-optional) top-level keys of a tool's args schema, in declaration
 * order.
 *
 * Anything that is not a plain object returns `[]` rather than throwing: a tool
 * whose schema this cannot read must still appear in the prompt with its
 * description, exactly as it does today. **Degrading to the current behaviour is
 * the only safe failure here** — the prompt is what every station runs on.
 */
export function requiredArgNames(schema: unknown): string[] {
  if (!(schema instanceof z.ZodObject)) return [];
  const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;
  if (!shape || typeof shape !== "object") return [];
  const out: string[] = [];
  for (const [key, field] of Object.entries(shape)) {
    try {
      const f = field as { isOptional?: () => boolean };
      // `isOptional()` is true for .optional(), .nullish() and .default(), which
      // is exactly the set a caller may leave out. A field with a default is not
      // something the model must supply.
      if (typeof f.isOptional === "function" && f.isOptional()) continue;
      out.push(key);
    } catch {
      // An exotic field that throws on inspection is not worth failing a prompt
      // over. Leaving it out under-reports; claiming it would be worse.
    }
  }
  return out;
}

/**
 * The clause appended to a tool's prompt line. Empty when there is nothing to
 * say, so a tool with no required arguments reads exactly as it does today.
 */
export function requiredArgsClause(schema: unknown): string {
  const names = requiredArgNames(schema);
  return names.length ? ` Required: ${names.join(", ")}.` : "";
}

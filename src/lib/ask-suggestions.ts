// PC-36 workstream A - capability surface for Ask (Cmd+J): route-aware
// suggested asks for the empty state + the slash-command palette. Both are
// pure, static, client-side lookups (no network call), so typing "/" or
// filtering suggestions can never reintroduce the per-keystroke-fetch class
// of bug workstream Z guards against.

export type SlashCommand = {
  cmd: string;
  label: string;
  fill: string;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "/why", label: "Why did we decide this?", fill: "Why did we decide " },
  { cmd: "/status", label: "What's the current status?", fill: "What's the current status of " },
  { cmd: "/spec", label: "Show me the spec for", fill: "Show me the spec for " },
  { cmd: "/decide", label: "Record a decision", fill: "Record a decision: " },
  { cmd: "/dig", label: "Research this on the web", fill: "Research " },
  { cmd: "/mission", label: "Dispatch a mission", fill: "Start a mission to " },
];

export function matchSlashCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q.startsWith("/")) return [];
  return SLASH_COMMANDS.filter((c) => c.cmd.startsWith(q));
}

const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  Today: [
    "What changed since yesterday?",
    "What's the top risk right now?",
    "What should I look at first today?",
  ],
  Discover: [
    "What changed overnight?",
    "What's the strongest signal this week?",
    "Show me the top opportunity",
  ],
  Plan: ["What's blocking the roadmap?", "Why did we decide this priority?"],
  Build: ["What's the status of the last mission?", "Show me open pull requests"],
  "a mission": ["What's the status of this mission?", "Show me its evidence", "Why did this fail?"],
  Brain: ["Why did we decide this?", "What do we know about our top user?"],
  /* Keyed "Guardrails" since 2026-08-15, and THIS KEY MUST MOVE WITH
   * `contextForPath` OR THE COMPOSER GOES SILENT. The lookup below falls back
   * to the generic "this screen" list on a miss, so a stale key here does not
   * throw and does not fail a type check — it just quietly serves the wrong
   * suggestions on a real screen. `ask-suggestions.test.ts` is what catches
   * that: it walks every context `contextForPath` can return and requires each
   * to have its own entry. */
  Guardrails: ["What's the current model routing?", "Show me recent guardrail triggers"],
  "this screen": ["What am I looking at?", "What changed here recently?"],
};

export function suggestedAsksForContext(context: string): string[] {
  return CONTEXT_SUGGESTIONS[context] ?? CONTEXT_SUGGESTIONS["this screen"];
}

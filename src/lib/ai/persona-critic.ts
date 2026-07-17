/**
 * RPT-41: the Critic's persona review board - PURE core (no server, no DB, no AI call).
 *
 * The Critic (critic.server.ts) gains a three-seat review board: a built-in exec
 * sponsor, engineering lead, and customer-of-record each attach their own verdict
 * plus concrete objections to the artifact's receipt trail BEFORE the human gate.
 * Runs on BOTH opportunities and PRDs (folded into the existing CriticReview.board).
 * This module only validates the model's JSON into a typed shape, mirroring
 * design-critic.ts's parseDesignCriticReview idiom exactly, so the orchestration in
 * critic.server.ts stays a thin, fail-safe wrapper around it.
 */

export type PersonaKind = "exec" | "engineering" | "customer_of_record";

export type PersonaVerdict = "ship" | "revise" | "kill";

export type PersonaObjection = {
  persona: PersonaKind;
  verdict: PersonaVerdict;
  /** Concrete objections from this seat; empty when the seat has none. */
  objections: string[];
};

export type PersonaBoardReview = PersonaObjection[];

/** The three fixed seats, always returned in this order. */
export const PERSONA_KINDS: PersonaKind[] = ["exec", "engineering", "customer_of_record"];

const MAX_OBJECTIONS = 6;

function coerceVerdict(v: unknown): PersonaVerdict {
  return v === "ship" || v === "kill" || v === "revise" ? v : "revise";
}

function coerceObjections(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    const s = typeof entry === "string" ? entry.trim() : "";
    if (!s) continue;
    out.push(s.slice(0, 400));
    if (out.length >= MAX_OBJECTIONS) break;
  }
  return out;
}

/** Normalize a persona key so "customer-of-record" / "Customer Of Record" map to the canonical kind. */
function normPersona(k: string): string {
  return k
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * PURE. Validate + bound the model's parsed JSON into a typed persona board review.
 * Always returns exactly the three fixed seats (coerces to them, tolerating missing),
 * so the receipt trail and badge can rely on a stable shape. Accepts either the
 * keyed-object form ({"exec":{verdict,objections},...}) the prompt asks for, or an
 * array-of-persona form under `board` / `personas` / the root, defensively.
 */
export function parsePersonaBoardReview(json: unknown): PersonaBoardReview {
  const root = json ?? {};
  const byKey = new Map<string, Record<string, unknown>>();

  const addFromArray = (arr: unknown[]) => {
    for (const entry of arr) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const p = typeof e.persona === "string" ? normPersona(e.persona) : "";
      if (p) byKey.set(p, e);
    }
  };

  if (Array.isArray(root)) {
    addFromArray(root);
  } else if (root && typeof root === "object") {
    const obj = root as Record<string, unknown>;
    if (Array.isArray(obj.board)) addFromArray(obj.board);
    if (Array.isArray(obj.personas)) addFromArray(obj.personas);
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        byKey.set(normPersona(k), v as Record<string, unknown>);
      }
    }
  }

  return PERSONA_KINDS.map((persona) => {
    const source = byKey.get(persona) ?? {};
    return {
      persona,
      verdict: coerceVerdict(source.verdict),
      objections: coerceObjections(source.objections),
    };
  });
}

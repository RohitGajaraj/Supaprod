import type { CriticReview } from "@/lib/discovery.functions";

export type VerdictWord = "SHIP" | "REVISE" | "KILL" | "WATCH" | "PENDING";

/** The subset of an opportunity row `verdictFor` reads. */
export interface OpportunityVerdictInput {
  status: string;
  critic_review?: CriticReview | null;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Mono-caps relative time: `12M AGO` / `1H AGO` / `3D AGO`. Floors to zero
 * for future or malformed timestamps rather than showing a negative value. */
export function relTimeCaps(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const deltaMs = Math.max(0, Date.now() - then);
  if (deltaMs < HOUR_MS) return `${Math.max(1, Math.floor(deltaMs / MINUTE_MS))}M AGO`;
  if (deltaMs < DAY_MS) return `${Math.floor(deltaMs / HOUR_MS)}H AGO`;
  return `${Math.floor(deltaMs / DAY_MS)}D AGO`;
}

/** `intercom` -> `INTERCOM`. */
export function sourceCaps(source: string): string {
  return source.toUpperCase();
}

/** Loom W2 (audit D-12): a hung server fn must reject instead of leaving the
 * surface on a permanent skeleton (the h3-swallowed-500 class never settles
 * react-query on its own). Race the call against a deadline so the error
 * state, with its retry, gets to render. The timer is cleared on settle so
 * tests hold no open handles. */
export function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error("The server took too long to answer. Retry in a moment.")),
      ms,
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Maps a production opportunity to one of the five Discover verdict words.
 * The Critic's own verdict wins when present (OBS-06.md step 1); otherwise
 * falls back to the lane status per the spec's literal mapping.
 */
export function verdictFor(opp: OpportunityVerdictInput): VerdictWord {
  const critic = opp.critic_review?.verdict;
  if (critic === "ship") return "SHIP";
  if (critic === "revise") return "REVISE";
  if (critic === "kill") return "KILL";
  if (opp.status === "shipped" || opp.status === "now") return "SHIP";
  if (opp.status === "dropped") return "KILL";
  if (opp.status === "next" || opp.status === "later") return "WATCH";
  return "PENDING";
}

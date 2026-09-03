/**
 * Shared SSE meta contract (protocol v2) — the server streams one `{"meta": …}`
 * event immediately before [DONE]; old messages may carry it in messages.metadata.
 * Sources can be web pages (url) or internal workspace records (href deep link).
 * All v2 fields are additive — the old `{n,url,title}` source shape still parses.
 *
 * MOVED from `components/chat/MessageMeta.tsx` (P-49, A-QUEUE.md). That file's
 * own UI (`MessageMetaFooter` and everything only it used) was dead — zero
 * non-test importers, confirmed live and by two guards already written to say
 * so. This contract was the opposite: the type every `ask-*` module and
 * `api/chat.ts` actually import, real callers on the tip. Splitting the two
 * apart is what let the dead half go without breaking the live one.
 */
export type SourceKind =
  | "web"
  | "signal"
  | "prd"
  | "doc"
  | "meeting"
  | "opportunity"
  | "roadmap"
  | "decision"
  | "mission"
  | "finding";

export type ChatSource = {
  n: number;
  kind: SourceKind;
  title: string;
  /** External page (web sources only). */
  url?: string;
  /** Internal app path, e.g. "/prds/<id>" or "/arriving". */
  href?: string;
  /** Domain for web sources; kind label for internal ones. */
  sub?: string;
};

export type ResearchMeta = {
  mode: "chat" | "web" | "internal" | "both";
  sub_queries: string[];
};

export type ChatMeta = {
  model: string;
  via: "gateway" | "byo";
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  sources: ChatSource[];
  web_used: boolean;
  workspace_chunks: number;
  research?: ResearchMeta;
  /** LLM-as-judge composite 0–100, scored post-completion (absent = not judged). */
  judge?: number;
};

const SOURCE_KINDS: ReadonlySet<string> = new Set([
  "web",
  "signal",
  "prd",
  "doc",
  "meeting",
  "opportunity",
  "roadmap",
  "decision",
  "mission",
  "finding",
]);

/** Tolerant parser — returns null for anything that isn't a meta payload. */
export function parseChatMeta(input: unknown): ChatMeta | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (typeof o.model !== "string" || (o.via !== "gateway" && o.via !== "byo")) return null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const sources: ChatSource[] = Array.isArray(o.sources)
    ? o.sources.flatMap((raw, i): ChatSource[] => {
        if (!raw || typeof raw !== "object") return [];
        const s = raw as Record<string, unknown>;
        const url = typeof s.url === "string" ? s.url : undefined;
        const href = typeof s.href === "string" ? s.href : undefined;
        const title = typeof s.title === "string" ? s.title : "";
        if (!url && !href && !title) return [];
        return [
          {
            n: typeof s.n === "number" ? s.n : i + 1,
            kind:
              typeof s.kind === "string" && SOURCE_KINDS.has(s.kind)
                ? (s.kind as SourceKind)
                : "web",
            title,
            url,
            href,
            sub: typeof s.sub === "string" ? s.sub : undefined,
          },
        ];
      })
    : [];
  let research: ResearchMeta | undefined;
  if (o.research && typeof o.research === "object") {
    const r = o.research as Record<string, unknown>;
    if (r.mode === "chat" || r.mode === "web" || r.mode === "internal" || r.mode === "both") {
      research = {
        mode: r.mode,
        sub_queries: Array.isArray(r.sub_queries)
          ? r.sub_queries.filter((q): q is string => typeof q === "string")
          : [],
      };
    }
  }
  return {
    model: o.model,
    via: o.via,
    latency_ms: num(o.latency_ms),
    tokens_in: num(o.tokens_in),
    tokens_out: num(o.tokens_out),
    cost_usd: num(o.cost_usd),
    sources,
    web_used: o.web_used === true,
    workspace_chunks: num(o.workspace_chunks),
    research,
    ...(typeof o.judge === "number" && Number.isFinite(o.judge)
      ? { judge: Math.round(o.judge) }
      : {}),
  };
}

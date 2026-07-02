import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SlideOver } from "@/components/obsidian/slideover";
import { MonoLabel, VerdictChip, Citation } from "@/components/obsidian";
import type { Citation as CitationRecord } from "@/components/product/CitationsCard";
import { getPrd } from "@/lib/discovery.functions";
import { stateChip, splitCitationMarkers } from "./format";

export interface SpecDetailProps {
  id: string | null;
  onClose: () => void;
}

const TONE_TO_VERDICT = {
  moss: "VALIDATED",
  marigold: "CRITIC REVIEW",
  glacier: "DRAFTING",
} as const;

/** Replace `[n]` markers in already-rendered text children with real `Citation` chips. */
function withCitations(children: ReactNode, citations: CitationRecord[]): ReactNode {
  const byIndex = new Map(citations.map((c) => [c.n, c]));
  const toNodes = (child: ReactNode, key: number): ReactNode => {
    if (typeof child !== "string") return child;
    const segments = splitCitationMarkers(child);
    if (segments.length === 1 && segments[0].type === "text") return child;
    return segments.map((seg, i) => {
      if (seg.type === "text") return <span key={`${key}-${i}`}>{seg.value}</span>;
      const record = byIndex.get(seg.index);
      if (!record) return <span key={`${key}-${i}`}>[{seg.index}]</span>;
      return (
        <Citation
          key={`${key}-${i}`}
          index={seg.index}
          source={record.title ?? `${record.source_kind} · ${record.source_id?.slice(0, 8) ?? "-"}`}
          quote={record.snippet ?? ""}
        />
      );
    });
  };
  if (Array.isArray(children)) return children.map((c, i) => toNodes(c, i));
  return toNodes(children, 0);
}

/**
 * OBS-07 §5 step 6: read-only spec detail, depth layer two. Newsreader serif
 * body with inline `[n]` markers replaced by the OBS-03 `Citation` chip
 * (superscript, verbatim quote + source on hover/focus). Editing stays in the
 * existing `/prds/$id` editor.
 */
export function SpecDetail({ id, onClose }: SpecDetailProps) {
  const fGetPrd = useServerFn(getPrd);
  const prdQuery = useQuery({
    queryKey: ["prd", id],
    queryFn: () => fGetPrd({ data: { id: id! } }),
    enabled: !!id,
  });

  const prd = prdQuery.data?.prd as
    | { title: string; status: string; body_md: string | null; citations?: CitationRecord[] | null }
    | undefined;
  const citations = prd?.citations ?? [];

  return (
    <SlideOver
      open={!!id}
      onClose={onClose}
      title={prd?.title ?? "Spec"}
      footer={
        id ? (
          <div className="flex items-center justify-between">
            <Link
              to="/prds/$id"
              params={{ id }}
              style={{ color: "var(--glacier)", fontFamily: "var(--font-mono)", fontSize: 11 }}
            >
              Open full spec →
            </Link>
            <span>Esc closes</span>
          </div>
        ) : undefined
      }
    >
      {prdQuery.isError ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD SPEC
        </div>
      ) : prdQuery.isLoading || !prd ? (
        <div role="status" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="sr-only">Loading the spec…</span>
          {["90%", "100%", "70%"].map((width) => (
            <div
              key={width}
              aria-hidden="true"
              style={{
                height: 14,
                borderRadius: 4,
                width,
                backgroundImage: "var(--shimmer-gradient)",
                backgroundSize: "280% 100%",
                animation: "cadShimmer 5s linear infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MonoLabel tone="muted">SPEC</MonoLabel>
            <VerdictChip tone={TONE_TO_VERDICT[stateChip(prd.status).tone]}>
              {stateChip(prd.status).label}
            </VerdictChip>
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-body)",
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p style={{ margin: "0 0 12px" }}>{withCitations(children, citations)}</p>
                ),
                li: ({ children }) => <li>{withCitations(children, citations)}</li>,
                h1: ({ children }) => (
                  <h1 style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {children}
                  </h3>
                ),
              }}
            >
              {prd.body_md || "_Empty spec_"}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

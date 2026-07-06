import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { MonoLabel } from "@/components/obsidian";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getLineage } from "@/lib/lineage.functions";
import { relTimeCaps, sourceCaps } from "./format";

/** The verbatim signal record, shared by the raw-signal detail sheet (Column
 * A) and the in-pane theme drill (Column B). Every field is a real signal
 * column, never fabricated; a `ThemeMember` is structurally assignable. */
export interface SignalRecord {
  id: string;
  content: string;
  title?: string | null;
  source: string;
  sourceKind?: string | null;
  url?: string | null;
  sentiment?: string | null;
  tags?: string[];
  created_at: string;
}

/** A lifecycle kind, prettified for the small peer tags in the lineage view. */
function kindLabel(kind: string): string {
  if (kind === "prd") return "Spec";
  if (kind === "roadmap_item") return "Roadmap item";
  if (kind === "mission") return "Build session";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** A subtle tone per lifecycle kind, so the lineage reads with color, not a
 * wall of gray chips. Token colors only. */
function kindTone(kind: string): string {
  if (kind === "opportunity") return "var(--ember-text)";
  if (kind === "prd") return "var(--moss-bright)";
  if (kind === "theme") return "var(--blossom)";
  if (kind === "signal") return "var(--glacier)";
  return "var(--text-muted)";
}

/** Sentiment mapped to a semantic tone (real column value, never invented). */
function sentimentTone(s: string): { label: string; color: string } {
  const v = s.toLowerCase();
  if (v.includes("pos")) return { label: s, color: "var(--moss-bright)" };
  if (v.includes("neg")) return { label: s, color: "var(--madder)" };
  if (v.includes("mix")) return { label: s, color: "var(--blossom)" };
  return { label: s, color: "var(--glacier)" };
}

/** The host of a reference URL, so a long link renders as a clean chip. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LineageSection({
  heading,
  icon,
  loading,
  emptyText,
  peers,
}: {
  heading: string;
  icon: ReactNode;
  loading: boolean;
  emptyText: string;
  peers: { kind: string; title: string; key: string }[];
}) {
  return (
    <section style={{ display: "grid", gap: "9px" }}>
      <div className="flex items-center" style={{ gap: 6 }}>
        {icon}
        <MonoLabel
          style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
        >
          {heading}
        </MonoLabel>
      </div>
      {loading ? (
        <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>Loading</p>
      ) : peers.length === 0 ? (
        <p style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
          {emptyText}
        </p>
      ) : (
        <ul style={{ display: "grid", gap: "8px", margin: 0, padding: 0, listStyle: "none" }}>
          {peers.map((p) => (
            <li key={p.key} className="flex items-start" style={{ gap: 8, fontSize: "12.5px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: kindTone(p.kind),
                  background: "var(--surface-raised)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "999px",
                  padding: "2px 8px",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {kindLabel(p.kind)}
              </span>
              <span style={{ color: "var(--text-body)", lineHeight: 1.5 }}>{p.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * One signal in full, plus how it connects across the lifecycle (getLineage,
 * the same source the lineage drawer reads). The verbatim quote leads; a
 * provenance panel carries the source, the reference link, sentiment, and
 * tags with real color; the lineage shows what it came from and what it became
 * (the cross-impact), so the reader understands in place and returns to act.
 * One home, two mounts (the raw card sheet and the theme drill).
 */
export function SignalRecordBody({ record }: { record: SignalRecord }) {
  const fLineage = useServerFn(getLineage);
  const q = useQuery({
    queryKey: ["lineage", "signal", record.id],
    queryFn: () => fLineage({ data: { kind: "signal", id: record.id } }),
  });
  const ancestors = q.data?.ancestors ?? [];
  const descendants = q.data?.descendants ?? [];
  const tags = record.tags ?? [];
  const sentiment = record.sentiment ? sentimentTone(record.sentiment) : null;

  return (
    <div className="mt-3" style={{ display: "grid", gap: "16px" }}>
      {/* The verbatim signal, leading. */}
      <div style={{ display: "grid", gap: "8px" }}>
        {record.title ? (
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-ui)",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.35,
            }}
          >
            {record.title}
          </h3>
        ) : null}
        <p
          style={{
            fontSize: "var(--text-base)",
            lineHeight: 1.6,
            color: "var(--text-body)",
            margin: 0,
            paddingLeft: "12px",
            borderLeft: "2px solid var(--hairline-strong)",
          }}
        >
          {record.content}
        </p>
      </div>

      {/* Provenance: where it is from, the reference, how it reads. */}
      <div
        style={{
          display: "grid",
          gap: "12px",
          background: "var(--surface-raised)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "14px 15px",
        }}
      >
        <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--blossom)",
              background: "var(--card)",
              border: "1px solid var(--hairline)",
              borderRadius: "999px",
              padding: "3px 9px",
            }}
          >
            {sourceCaps(record.source)}
            {record.sourceKind ? ` · ${record.sourceKind}` : ""}
          </span>
          {sentiment ? (
            <span
              className="flex items-center"
              style={{
                gap: 5,
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: sentiment.color,
                background: "var(--card)",
                border: "1px solid var(--hairline)",
                borderRadius: "999px",
                padding: "3px 9px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "999px",
                  background: sentiment.color,
                }}
              />
              {sentiment.label}
            </span>
          ) : null}
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              color: "var(--text-subtle)",
            }}
          >
            {relTimeCaps(record.created_at)}
          </span>
        </div>

        {record.url ? (
          <a
            href={record.url}
            target="_blank"
            rel="noreferrer"
            className="loom-press flex items-center hover:[color:var(--text-primary)]"
            style={{
              gap: 7,
              fontSize: "12.5px",
              color: "var(--glacier)",
              lineHeight: 1.4,
              width: "fit-content",
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: "break-all" }}>{hostOf(record.url)}</span>
          </a>
        ) : (
          <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic" }}>
            Captured directly, no external link.
          </span>
        )}

        {tags.length > 0 ? (
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.03em",
                  color: "var(--glacier)",
                  background: "color-mix(in oklab, var(--glacier) 12%, var(--card))",
                  border: "1px solid color-mix(in oklab, var(--glacier) 24%, var(--hairline))",
                  borderRadius: "999px",
                  padding: "2px 9px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Lineage: the cross-impact, in and out. */}
      <LineageSection
        heading="Came from"
        icon={<ArrowUpRight className="h-3.5 w-3.5" style={{ color: "var(--glacier)" }} />}
        loading={q.isLoading}
        emptyText="Captured directly, no upstream artifact."
        peers={ancestors.map((e) => ({
          kind: e.parent_kind,
          title: e.peer_title ?? "(untitled)",
          key: e.id,
        }))}
      />
      <LineageSection
        heading="Became"
        icon={<ArrowDownRight className="h-3.5 w-3.5" style={{ color: "var(--moss-bright)" }} />}
        loading={q.isLoading}
        emptyText="Nothing promoted from this yet."
        peers={descendants.map((e) => ({
          kind: e.child_kind,
          title: e.peer_title ?? "(untitled)",
          key: e.id,
        }))}
      />
    </div>
  );
}

/**
 * A right-side Sheet wrapping the rich signal record. Uses the same Sheet
 * primitive and side/width as LineageDrawer, so the raw-signal detail reads as
 * one drawer language with the theme drill and the lineage view.
 */
export function SignalDetailSheet({
  open,
  onOpenChange,
  record,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  record: SignalRecord | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle style={{ fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
            Signal in detail
          </SheetTitle>
          <SheetDescription style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
            The verbatim signal and how it connects across the lifecycle.
          </SheetDescription>
        </SheetHeader>
        {record ? <SignalRecordBody record={record} /> : null}
      </SheetContent>
    </Sheet>
  );
}

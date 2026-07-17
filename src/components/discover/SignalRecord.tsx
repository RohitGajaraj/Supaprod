import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Radio } from "lucide-react";
import { AuditTag } from "@/components/cadence/AuditTag";
import { Button, MonoLabel } from "@/components/obsidian";
import { ProviderLogo } from "@/components/connections/ProviderLogo";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getLineage } from "@/lib/lineage.functions";
import { DetailHeader, DetailSection, StatCell, StatStrip, type StatTone } from "./DetailKit";
import { SkeletonBar } from "./SkeletonBar";
import { relTimeCaps, signalCleanBody, signalHasRaw, sourceCaps, traceRef } from "./format";

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
  /** Audited references the signal drew on (esp. web-research signals), read
   * from the `reference_urls` jsonb column. Surfaced beside the single `url`
   * origin as one deduped, click-through Sources list. */
  references?: { url: string; title?: string | null }[];
}

/** Defensive read of the `reference_urls` jsonb column. The generated supabase
 * types do not carry it until the founder applies the migration and regens, so
 * we read via a cast and guard against a non-array or malformed value: a bad
 * row reads as no references, never a crash. Shared by every SignalRecord /
 * ThemeMember builder. */
export function readSignalReferences(row: unknown): { url: string; title?: string | null }[] {
  const raw = (row as { reference_urls?: unknown }).reference_urls;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is { url: string; title?: string | null } =>
      !!r && typeof r === "object" && typeof (r as { url?: unknown }).url === "string",
  );
}

/** A lifecycle kind, prettified for the small peer tags in the lineage view. */
function kindLabel(kind: string): string {
  if (kind === "prd") return "Spec";
  if (kind === "roadmap_item") return "Roadmap item";
  if (kind === "mission") return "Build session";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** A subtle tone per lifecycle kind. Kind is a category, not a status, so
 * only the two kinds with an established semantic elsewhere (opportunity =
 * brand, prd = shipped-green) carry color; theme and signal read neutral
 * gray (Tempo v5 glacier narrowing, 2026-07-11). Token colors only. */
function kindTone(kind: string): string {
  if (kind === "opportunity") return "var(--ember-text)";
  if (kind === "prd") return "var(--moss-bright)";
  return "var(--text-muted)";
}

/** Sentiment mapped to a semantic tone (real column value, never invented).
 * Positive/negative are genuine status color (moss/madder); a mixed or
 * unrecognized reading is not a status, so it stays neutral gray (Tempo v5
 * glacier narrowing, 2026-07-11). */
function sentimentTone(s: string): { label: string; color: string } {
  const v = s.toLowerCase();
  if (v.includes("pos")) return { label: s, color: "var(--moss-bright)" };
  if (v.includes("neg")) return { label: s, color: "var(--madder)" };
  return { label: s, color: "var(--text-muted)" };
}

/** Sentiment mapped to a DetailKit stat tone, so the sentiment stat cell tints
 * to match: positive moss, negative madder, mixed amber, else a neutral
 * muted tone. */
function sentimentStatTone(s: string): StatTone {
  const v = s.toLowerCase();
  if (v.includes("pos")) return "moss";
  if (v.includes("neg")) return "madder";
  if (v.includes("mix")) return "amber";
  return "muted";
}

/** A source id in sentence case for a header title fallback and the source
 * stat cell (a connector id like `intercom` reads as `Intercom`). */
function titleCaseSource(source: string): string {
  if (!source) return "Signal";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/** First letter upper-cased, for a clean sentiment stat value. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
        <div className="grid gap-2" role="status" aria-label={`Loading ${heading.toLowerCase()}`}>
          <SkeletonBar width="70%" height={11} />
          <SkeletonBar width="45%" height={11} />
        </div>
      ) : peers.length === 0 ? (
        <p
          style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}
        >
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
 * One signal in full, on the shared DetailKit anatomy so it reads as one
 * language with the opportunity detail and every other object detail: a
 * refined header (title or source, the sentiment chip, the captured time, and
 * the copyable trace ref), a stat strip (sentiment, source, references), then
 * the consistent sections (where it came from, what was captured, the audited
 * Sources list, and the lineage in and out via getLineage). Every field is a
 * real signal column; honest empty states throughout. One home, two mounts
 * (the raw card sheet and the theme drill). All existing behavior is preserved.
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

  // The source glyph: a provider brand mark when the source is a known
  // connector, else a neutral radio glyph (a captured-directly signal).
  const isKnownProvider = record.source in CONNECTOR_REGISTRY;
  const sourceGlyph = isKnownProvider ? (
    <ProviderLogo provider={record.source as ProviderId} size={18} />
  ) : (
    <Radio className="h-4 w-4" style={{ color: "var(--text-subtle)" }} />
  );

  // One deduped, audited Sources list: the single origin `url` leads, then
  // every reference the signal drew on, unique by url. Every entry is
  // visible and click-through.
  const sources: { url: string; title?: string | null }[] = [];
  const seenUrls = new Set<string>();
  if (record.url) {
    sources.push({ url: record.url });
    seenUrls.add(record.url);
  }
  for (const ref of record.references ?? []) {
    if (!ref?.url || seenUrls.has(ref.url)) continue;
    seenUrls.add(ref.url);
    sources.push(ref);
  }

  const headerTitle = record.title?.trim()
    ? record.title
    : `Signal from ${titleCaseSource(record.source)}`;

  return (
    <div style={{ display: "grid", gap: "16px", marginTop: "2px" }}>
      <DetailHeader
        title={headerTitle}
        chips={
          sentiment ? (
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
          ) : null
        }
        time={
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9.5px",
              letterSpacing: "0.06em",
              color: "var(--text-subtle)",
            }}
          >
            CAPTURED {relTimeCaps(record.created_at)}
          </span>
        }
        traceRef={
          <AuditTag kind="signal" id={record.id} copyable />
        }
      />

      {/* The glanceable summary: how it reads, where it is from, how many
          sources back it. */}
      <StatStrip>
        {sentiment ? (
          <StatCell
            label="Sentiment"
            value={capitalize(sentiment.label)}
            tone={sentimentStatTone(sentiment.label)}
          />
        ) : null}
        <StatCell label="Source" value={titleCaseSource(record.source)} tone="neutral" />
        <StatCell
          label="References"
          value={String(sources.length)}
          tone={sources.length > 0 ? "glacier" : "muted"}
        />
      </StatStrip>

      {/* Where it came from: the source identity and origin link, plus any
          classification tags. */}
      <DetailSection heading="Where it came from">
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
            {record.url ? (
              <a
                href={record.url}
                target="_blank"
                rel="noreferrer"
                title="Open source"
                className="loom-press flex items-center outline-none transition-colors [color:var(--text-body)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{ gap: 7 }}
              >
                {sourceGlyph}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    background: "var(--card)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "999px",
                    padding: "3px 9px",
                  }}
                >
                  {sourceCaps(record.source)}
                  {record.sourceKind ? ` · ${record.sourceKind}` : ""}
                </span>
              </a>
            ) : (
              <span className="flex items-center" style={{ gap: 7 }}>
                {sourceGlyph}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    background: "var(--card)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "999px",
                    padding: "3px 9px",
                  }}
                >
                  {sourceCaps(record.source)}
                  {record.sourceKind ? ` · ${record.sourceKind}` : ""}
                </span>
              </span>
            )}
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.03em",
                    color: "var(--text-muted)",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--hairline)",
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
      </DetailSection>

      {/* The captured signal, cleaned of connector noise (raw JSON, embedded
          images, bare URLs) so it reads as signal. The untouched original stays
          one click away whenever the capture arrived as a raw payload. */}
      <DetailSection heading="What was captured">
        <p
          style={{
            fontSize: "var(--text-base)",
            lineHeight: 1.6,
            color: "var(--text-body)",
            margin: 0,
            paddingLeft: "12px",
            borderLeft: "2px solid var(--hairline-strong)",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {signalCleanBody(record.content) || record.content}
        </p>
        {signalHasRaw(record.content) ? (
          <details style={{ marginTop: "10px" }}>
            <summary
              className="outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10.5px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Raw capture
            </summary>
            <pre
              style={{
                margin: "8px 0 0",
                padding: "10px",
                maxHeight: "240px",
                overflow: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                lineHeight: 1.5,
                color: "var(--text-muted)",
                background: "var(--surface-raised)",
                border: "1px solid var(--hairline-faint)",
                borderRadius: "var(--radius-control)",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {record.content}
            </pre>
          </details>
        ) : null}
      </DetailSection>

      {/* The audited Sources list: the origin plus every reference, deduped. */}
      <DetailSection heading="Sources">
        {sources.length > 0 ? (
          <ul style={{ display: "grid", gap: "6px", margin: 0, padding: 0, listStyle: "none" }}>
            {sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="loom-press flex items-start outline-none transition-colors [color:var(--link)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    gap: 7,
                    fontSize: "12.5px",
                    lineHeight: 1.4,
                    width: "fit-content",
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ wordBreak: "break-all" }}>{s.title || hostOf(s.url)}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic" }}>
            Captured directly, no external link.
          </span>
        )}
      </DetailSection>

      {/* Lineage: the cross-impact, in and out. An error never wears the
          empty state's clothes (a failed read used to render "Captured
          directly, no upstream artifact"): cause + retry. */}
      <DetailSection heading="Lineage">
        {q.isError ? (
          <div style={{ display: "grid", gap: "8px", justifyItems: "start" }}>
            <p style={{ fontSize: "12px", color: "var(--madder)", margin: 0 }}>
              Could not load this signal's lineage. {(q.error as Error).message}
            </p>
            <Button variant="tertiary" size="sm" onClick={() => q.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            <LineageSection
              heading="Came from"
              icon={
                <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "var(--text-subtle)" }} />
              }
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
              icon={
                <ArrowDownRight className="h-3.5 w-3.5" style={{ color: "var(--moss-bright)" }} />
              }
              loading={q.isLoading}
              emptyText="Nothing promoted from this yet."
              peers={descendants.map((e) => ({
                kind: e.child_kind,
                title: e.peer_title ?? "(untitled)",
                key: e.id,
              }))}
            />
          </div>
        )}
      </DetailSection>
    </div>
  );
}

/**
 * A right-side Sheet wrapping the rich signal record. Uses the same Sheet
 * primitive and side/width as LineageDrawer, so the raw-signal detail reads as
 * one drawer language with the theme drill and the lineage view. The header
 * name and description are screen-reader only; the visible header is the
 * DetailHeader inside the body.
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
        <SheetHeader className="sr-only">
          <SheetTitle>Signal in detail</SheetTitle>
          <SheetDescription>
            The verbatim signal and how it connects across the lifecycle.
          </SheetDescription>
        </SheetHeader>
        {record ? <SignalRecordBody record={record} /> : null}
      </SheetContent>
    </Sheet>
  );
}

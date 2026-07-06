import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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

/** A labelled fact in the signal record (mono label over its value). */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: "3px" }}>
      <MonoLabel style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
        {label}
      </MonoLabel>
      <div style={{ fontSize: "12.5px", color: "var(--text-body)", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

/**
 * One signal in full, plus how it connects across the lifecycle (getLineage,
 * the same source the lineage drawer reads). Peers are shown as quiet tags,
 * not links, so the reader stays in place, understands, and returns to act.
 * This is the exact rich record that used to live inside ThemeDetail; it now
 * has one home and two mounts (the raw card sheet and the theme drill).
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

  const peerRow = (tag: string, label: string, key: string) => (
    <li key={key} className="flex items-start" style={{ gap: 8, fontSize: "12.5px" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
          background: "var(--surface-raised)",
          border: "1px solid var(--hairline)",
          borderRadius: "999px",
          padding: "2px 7px",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {tag}
      </span>
      <span style={{ color: "var(--text-body)", lineHeight: 1.5 }}>{label}</span>
    </li>
  );

  return (
    <div className="mt-2" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "grid", gap: "7px" }}>
        {record.title ? (
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-ui)",
              fontSize: "14.5px",
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
          }}
        >
          {record.content}
        </p>
      </div>

      <section style={{ display: "grid", gap: "12px" }}>
        <Field
          label="Source"
          value={`${sourceCaps(record.source)}${record.sourceKind ? ` · ${record.sourceKind}` : ""}`}
        />
        <div style={{ display: "grid", gap: "3px" }}>
          <MonoLabel
            style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
          >
            Reference
          </MonoLabel>
          {record.url ? (
            <a
              href={record.url}
              target="_blank"
              rel="noreferrer"
              className="loom-press hover:underline"
              style={{
                fontSize: "12.5px",
                color: "var(--glacier)",
                wordBreak: "break-all",
                lineHeight: 1.5,
              }}
            >
              {record.url}
            </a>
          ) : (
            <span style={{ fontSize: "12.5px", color: "var(--text-subtle)", fontStyle: "italic" }}>
              Captured directly, no external link.
            </span>
          )}
        </div>
        {record.sentiment ? <Field label="Sentiment" value={record.sentiment} /> : null}
        {tags.length > 0 ? (
          <div style={{ display: "grid", gap: "5px" }}>
            <MonoLabel
              style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
            >
              Tags
            </MonoLabel>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.04em",
                    color: "var(--text-body)",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "999px",
                    padding: "2px 8px",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <Field label="Landed" value={relTimeCaps(record.created_at)} />
      </section>

      <section style={{ display: "grid", gap: "8px" }}>
        <MonoLabel style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
          Came from
        </MonoLabel>
        {q.isLoading ? (
          <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>Loading</p>
        ) : ancestors.length === 0 ? (
          <p
            style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}
          >
            Captured directly, no upstream artifact.
          </p>
        ) : (
          <ul style={{ display: "grid", gap: "8px", margin: 0, padding: 0, listStyle: "none" }}>
            {ancestors.map((e) =>
              peerRow(kindLabel(e.parent_kind), e.peer_title ?? "(untitled)", e.id),
            )}
          </ul>
        )}
      </section>

      <section style={{ display: "grid", gap: "8px" }}>
        <MonoLabel style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
          Became
        </MonoLabel>
        {q.isLoading ? (
          <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>Loading</p>
        ) : descendants.length === 0 ? (
          <p
            style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}
          >
            Nothing promoted from this yet.
          </p>
        ) : (
          <ul style={{ display: "grid", gap: "8px", margin: 0, padding: 0, listStyle: "none" }}>
            {descendants.map((e) =>
              peerRow(kindLabel(e.child_kind), e.peer_title ?? "(untitled)", e.id),
            )}
          </ul>
        )}
      </section>
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

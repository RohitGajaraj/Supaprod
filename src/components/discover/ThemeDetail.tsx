import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button, MonoLabel } from "@/components/obsidian";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getLineage } from "@/lib/lineage.functions";
import { relTimeCaps, sourceCaps } from "./format";

export interface ThemeMember {
  id: string;
  content: string;
  source: string;
  created_at: string;
}

export interface ThemeDetailProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  themeId: string | null;
  title: string | null;
  summary: string | null;
  /** Canonical corroboration count (theme.frequency), the same number the row
   * and the opportunity queue show and the ranking is sorted by. Can exceed
   * members.length, since the in-window signal read is capped. */
  frequency: number;
  members: ThemeMember[];
  /** True while a promote/draft-spec mutation for this theme is in flight. */
  busy?: boolean;
  onPromote: () => void;
  onDraftSpec: () => void;
}

const plural = (n: number) => (n === 1 ? "" : "s");

/** A lifecycle kind, prettified for the small peer tags in the lineage view. */
function kindLabel(kind: string): string {
  if (kind === "prd") return "Spec";
  if (kind === "roadmap_item") return "Roadmap item";
  if (kind === "mission") return "Build session";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** Second level of the theme pane: one member signal in full, plus how it
 * connects across the lifecycle (getLineage, the same source the lineage
 * drawer reads). Peers are shown as quiet tags, not links, so the user stays
 * in the pane, understands, and returns to act. */
function SignalDetailView({ member, onBack }: { member: ThemeMember; onBack: () => void }) {
  const fLineage = useServerFn(getLineage);
  const q = useQuery({
    queryKey: ["lineage", "signal", member.id],
    queryFn: () => fLineage({ data: { kind: "signal", id: member.id } }),
  });
  const ancestors = q.data?.ancestors ?? [];
  const descendants = q.data?.descendants ?? [];

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
      <button
        type="button"
        onClick={onBack}
        className="loom-press w-fit outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10.5px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {"< Back to theme"}
      </button>

      <div style={{ display: "grid", gap: "7px" }}>
        <MonoLabel tone="blossom" style={{ fontSize: "10.5px", letterSpacing: "0.08em" }}>
          {sourceCaps(member.source)} · {relTimeCaps(member.created_at)}
        </MonoLabel>
        <p
          style={{
            fontSize: "var(--text-base)",
            lineHeight: 1.6,
            color: "var(--text-body)",
            margin: 0,
          }}
        >
          {member.content}
        </p>
      </div>

      <section style={{ display: "grid", gap: "8px" }}>
        <MonoLabel style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
          Came from
        </MonoLabel>
        {q.isLoading ? (
          <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>Loading</p>
        ) : ancestors.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
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
          <p style={{ fontSize: "12px", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
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
 * The theme drill-in, opened from a `ThemeRow`. Reuses the same `Sheet`
 * primitive as `LineageDrawer` (right side sheet, same open/onOpenChange
 * contract) so the theme detail and lineage read as one drawer language.
 *
 * Two levels in one pane (founder ruling 2026-07-07): level one is the theme
 * (summary, corroboration ranking, member signals grouped by source, and the
 * two decision actions); clicking any member signal pushes to level two, that
 * signal in full plus its lineage, with a back control, so the user (or an
 * agent) digs into a single signal's context and returns to act without
 * leaving the pane.
 */
export function ThemeDetail({
  open,
  onOpenChange,
  themeId,
  title,
  summary,
  frequency,
  members,
  busy = false,
  onPromote,
  onDraftSpec,
}: ThemeDetailProps) {
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  // Drop back to the theme level whenever the pane closes or the theme changes.
  useEffect(() => {
    setActiveSignalId(null);
  }, [themeId, open]);

  // Group verbatim member signals by source (most-corroborated source first,
  // newest quote first within a group) so the detail reads as "who is saying
  // this, and when".
  const groups = useMemo(() => {
    const map = new Map<string, ThemeMember[]>();
    for (const m of members) {
      const arr = map.get(m.source) ?? [];
      arr.push(m);
      map.set(m.source, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [members]);

  const shownCount = members.length;
  const sourceCount = groups.length;
  const activeMember = members.find((m) => m.id === activeSignalId) ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle style={{ fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
            {activeMember ? "Signal in detail" : title || "Untitled theme"}
          </SheetTitle>
          <SheetDescription style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
            {activeMember
              ? `A signal inside "${title || "this theme"}".`
              : "What these signals are clustering into."}
          </SheetDescription>
        </SheetHeader>

        {activeMember ? (
          <SignalDetailView member={activeMember} onBack={() => setActiveSignalId(null)} />
        ) : (
          <div className="mt-4" style={{ display: "grid", gap: "18px" }}>
            {summary ? (
              <p
                style={{
                  fontSize: "var(--text-base)",
                  lineHeight: 1.6,
                  color: "var(--text-body)",
                  margin: 0,
                }}
              >
                {summary}
              </p>
            ) : null}

            {frequency > 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>
                Ranked by corroboration · {frequency} signal{plural(frequency)} from {sourceCount}{" "}
                source{plural(sourceCount)}
                {shownCount < frequency ? ` · showing the ${shownCount} most recent` : ""}
              </p>
            ) : (
              <p
                style={{
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  color: "var(--text-subtle)",
                  margin: 0,
                }}
              >
                No member signals captured for this theme yet. Promote it to start the decision, or
                draft a spec from what you know.
              </p>
            )}

            {groups.map(([source, groupMembers]) => (
              <div key={source} style={{ display: "grid", gap: "10px" }}>
                <MonoLabel tone="blossom" style={{ fontSize: "10.5px", letterSpacing: "0.08em" }}>
                  {sourceCaps(source)}
                </MonoLabel>
                <div style={{ display: "grid", gap: "8px" }}>
                  {groupMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveSignalId(m.id)}
                      className="loom-press w-full text-left outline-none transition-[background-color,border-color] hover:[background-color:var(--surface-raised)] hover:[border-color:var(--hairline-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      style={{
                        display: "grid",
                        gap: "4px",
                        background: "transparent",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--radius-control)",
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-base)",
                          lineHeight: 1.55,
                          color: "var(--text-body)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {m.content}
                      </span>
                      <span
                        className="flex items-center justify-between"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                          color: "var(--text-subtle)",
                        }}
                      >
                        <span>{relTimeCaps(m.created_at)}</span>
                        <span style={{ color: "var(--text-faint)" }}>{"Open ›"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div
              style={{
                display: "grid",
                gap: "10px",
                borderTop: "1px solid var(--hairline)",
                paddingTop: "16px",
              }}
            >
              <div className="flex items-center" style={{ gap: "10px" }}>
                <Button variant="primary" onClick={onPromote} loading={busy} disabled={busy}>
                  Promote to opportunity
                </Button>
                <Button variant="secondary" onClick={onDraftSpec} disabled={busy}>
                  Draft spec
                </Button>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "var(--text-subtle)",
                  margin: 0,
                }}
              >
                Promoting is what puts this in front of the Critic · it red-teams the bet with
                receipts.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Button, MonoLabel } from "@/components/obsidian";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import { relTimeCaps, sourceCaps, traceRef } from "./format";
import { SignalRecordBody } from "./SignalRecord";

export interface ThemeMember {
  id: string;
  content: string;
  source: string;
  created_at: string;
  /** Real signal columns surfaced in the drill-in (never fabricated). */
  title?: string | null;
  url?: string | null;
  sentiment?: string | null;
  sourceKind?: string | null;
  tags?: string[];
  /** Audited references the member signal drew on, mirrored from the signal's
   * `reference_urls` column so the drill-in shows every source, not just one. */
  references?: { url: string; title?: string | null }[];
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
  /** The theme's own `created_at` (when Supaprod clustered it), shown as the
   * quiet "clustered ..." caption beside the copyable trace ref. Themes carry
   * no `updated_at`, so this is the honest freshness stamp; omit and it is
   * skipped rather than fabricated. */
  createdAt?: string | null;
  /** True while a promote/draft-spec mutation for this theme is in flight. */
  busy?: boolean;
  onPromote: () => void;
  onDraftSpec: () => void;
}

const plural = (n: number) => (n === 1 ? "" : "s");

/** Second level of the theme pane: one member signal in full, plus how it
 * connects across the lifecycle. The rich record now lives in `SignalRecord`
 * (shared with the raw-signal detail sheet); this level is just the back
 * control over that body, so the theme drill and the Column A card open the
 * exact same detail. */
function SignalDetailView({ member, onBack }: { member: ThemeMember; onBack: () => void }) {
  return (
    <div className="mt-2" style={{ display: "grid", gap: "12px" }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        style={{
          justifySelf: "flex-start",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: 0,
        }}
      >
        {"< Back to theme"}
      </Button>
      <SignalRecordBody record={member} />
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
  createdAt,
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
          <SheetTitle style={{ color: "var(--text-primary)" }}>
            {activeMember ? "Signal in detail" : title || "Untitled theme"}
          </SheetTitle>
          <SheetDescription style={{ color: "var(--text-subtle)" }}>
            {activeMember
              ? `A signal inside "${title || "this theme"}".`
              : "What these signals are clustering into."}
          </SheetDescription>
        </SheetHeader>

        {activeMember ? (
          <SignalDetailView member={activeMember} onBack={() => setActiveSignalId(null)} />
        ) : (
          <div className="mt-4" style={{ display: "grid", gap: "18px" }}>
            {themeId ? (
              <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>
                {createdAt ? (
                  <span
                    className="flex items-baseline"
                    style={{ gap: "8px", color: "var(--text-body)" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        color: "var(--text-subtle)",
                      }}
                    >
                      CLUSTERED
                    </span>
                    <span>{new Date(createdAt).toLocaleString()}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                        color: "var(--text-faint)",
                      }}
                    >
                      {relTimeCaps(createdAt)}
                    </span>
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(themeId);
                    toast("Trace id copied");
                  }}
                  aria-label="Copy trace id"
                  title="Copy the full trace id"
                  className="loom-press flex items-center outline-none transition-colors [color:var(--text-faint)] hover:[color:var(--text-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    marginLeft: "auto",
                    gap: "6px",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.06em",
                    background: "transparent",
                    border: "none",
                    padding: "3px 2px",
                    cursor: "pointer",
                  }}
                >
                  THM·{traceRef(themeId)}
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ) : null}

            {summary ? (
              <p
                style={{
                  lineHeight: 1.6,
                  color: "var(--text-body)",
                  margin: 0,
                }}
              >
                {summary}
              </p>
            ) : null}

            {frequency > 0 ? (
              <p style={{ color: "var(--text-subtle)", margin: 0 }}>
                Ranked by corroboration · {frequency} signal{plural(frequency)} from {sourceCount}{" "}
                source{plural(sourceCount)}
                {shownCount < frequency ? ` · showing the ${shownCount} most recent` : ""}
              </p>
            ) : (
              <p
                style={{
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
                <MonoLabel style={{ letterSpacing: "0.08em" }}>
                  {sourceCaps(source)}
                </MonoLabel>
                <div style={{ display: "grid", gap: "8px" }}>
                  {groupMembers.map((m) => (
                    <Button
                      key={m.id}
                      variant="outline"
                      onClick={() => setActiveSignalId(m.id)}
                      style={{
                        display: "grid",
                        gap: "4px",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        padding: "10px 12px",
                        height: "auto",
                      }}
                    >
                      <span
                        style={{
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
                          letterSpacing: "0.08em",
                          color: "var(--text-subtle)",
                        }}
                      >
                        <span>{relTimeCaps(m.created_at)}</span>
                        <span style={{ color: "var(--text-faint)" }}>{"Open ›"}</span>
                      </span>
                    </Button>
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
                <Button variant="accent" onClick={onPromote} loading={busy} disabled={busy}>
                  Promote to opportunity
                </Button>
                <Button variant="secondary" onClick={onDraftSpec} loading={busy} disabled={busy}>
                  Draft spec
                </Button>
              </div>
              <p
                style={{
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

import { useMemo } from "react";
import { Button, MonoLabel } from "@/components/obsidian";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  title: string | null;
  summary: string | null;
  members: ThemeMember[];
  /** True while a promote/draft-spec mutation for this theme is in flight. */
  busy?: boolean;
  onPromote: () => void;
  onDraftSpec: () => void;
}

const plural = (n: number) => (n === 1 ? "" : "s");

/**
 * The theme drill-in, opened from a `ThemeRow`. Reuses the same `Sheet`
 * primitive as `LineageDrawer` (right side sheet, same open/onOpenChange
 * contract) so the theme detail and lineage read as one drawer language. It
 * shows the full title and summary, the corroboration ranking line, every
 * member signal grouped by its source with its landing time, and the two
 * decision actions (promote to an opportunity, or draft a spec).
 */
export function ThemeDetail({
  open,
  onOpenChange,
  title,
  summary,
  members,
  busy = false,
  onPromote,
  onDraftSpec,
}: ThemeDetailProps) {
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

  const signalCount = members.length;
  const sourceCount = groups.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle style={{ fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
            {title || "Untitled theme"}
          </SheetTitle>
          <SheetDescription style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
            What these signals are clustering into.
          </SheetDescription>
        </SheetHeader>

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

          {signalCount > 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>
              Ranked by corroboration · {signalCount} signal{plural(signalCount)} from {sourceCount}{" "}
              source{plural(sourceCount)}
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
              <div style={{ display: "grid", gap: "12px" }}>
                {groupMembers.map((m) => (
                  <div key={m.id} style={{ display: "grid", gap: "4px" }}>
                    <p
                      style={{
                        fontSize: "var(--text-base)",
                        lineHeight: 1.55,
                        color: "var(--text-body)",
                        margin: 0,
                      }}
                    >
                      {m.content}
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10.5px",
                        letterSpacing: "0.08em",
                        color: "var(--text-subtle)",
                      }}
                    >
                      {relTimeCaps(m.created_at)}
                    </span>
                  </div>
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
      </SheetContent>
    </Sheet>
  );
}

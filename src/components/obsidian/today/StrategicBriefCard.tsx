import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button, MonoLabel } from "@/components/obsidian";
import { toast } from "@/lib/notify";
import {
  listBriefItems,
  upsertBriefItem,
  retireBriefItem,
  type BriefItem,
  type BriefItemKind,
} from "@/lib/briefs.functions";

const KIND_LABEL: Record<BriefItemKind, string> = {
  vision: "Vision",
  icp: "Target user (ICP)",
  positioning: "Positioning",
  top_bet: "Top bets",
};

const SINGLETON_KINDS: BriefItemKind[] = ["vision", "icp", "positioning"];

/** JNY-02 — the living strategy brief: vision/ICP/positioning as standing,
 * versioned singleton calls plus a top-bets portfolio, each carrying its own
 * watched assumptions (surfaced elsewhere, as a Today "worth re-examining?"
 * Call, same as any other assumption). Read state renders plain lines;
 * editing is a quiet inline form, never a modal, matching the card's
 * restraint budget (this card owns zero ember — nothing here is a gate). */
export function StrategicBriefCard() {
  const qc = useQueryClient();
  const fList = useServerFn(listBriefItems);
  const fUpsert = useServerFn(upsertBriefItem);
  const fRetire = useServerFn(retireBriefItem);

  const { data, isLoading } = useQuery({
    queryKey: ["brief-items"],
    queryFn: () => fList({ data: {} }),
  });

  const byKind = React.useMemo(() => {
    const m = new Map<BriefItemKind, BriefItem[]>();
    for (const it of data ?? []) m.set(it.kind, [...(m.get(it.kind) ?? []), it]);
    return m;
  }, [data]);

  const [editingKind, setEditingKind] = React.useState<BriefItemKind | null>(null);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  // Loom W2-TODAY (DESIGN-LOOM §8b): the card shows only what is set; unset
  // rows hide behind one quiet Set link instead of a wall of "Not set yet."
  const [reveal, setReveal] = React.useState(false);

  const save = useMutation({
    mutationFn: (v: {
      kind: BriefItemKind;
      title: string;
      body: string;
      supersedesId?: string | null;
    }) => fUpsert({ data: v }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brief-items"] });
      setEditingKind(null);
      setDraftTitle("");
      setDraftBody("");
    },
    // A failed save must never end silently with the form still open.
    onError: (e: Error) => toast.success(e.message),
  });

  const retire = useMutation({
    mutationFn: (id: string) => fRetire({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["brief-items"] }),
    onError: (e: Error) => toast.success(e.message),
  });

  function startEdit(kind: BriefItemKind, existing?: BriefItem) {
    setEditingKind(kind);
    setDraftTitle(existing?.title ?? KIND_LABEL[kind]);
    setDraftBody(existing?.body ?? "");
  }

  function cancelEdit() {
    setEditingKind(null);
    setDraftTitle("");
    setDraftBody("");
  }

  function submit(kind: BriefItemKind, supersedesId?: string | null) {
    if (!draftBody.trim()) return;
    save.mutate({
      kind,
      title: draftTitle.trim() || KIND_LABEL[kind],
      body: draftBody,
      supersedesId,
    });
  }

  const rowStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 3 };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.1em",
    color: "var(--text-subtle)",
    textTransform: "uppercase",
  };
  const bodyStyle: React.CSSProperties = {
    lineHeight: 1.5,
    color: "var(--text-body)",
    margin: 0,
  };

  const bets = byKind.get("top_bet") ?? [];
  const unsetKinds = SINGLETON_KINDS.filter((k) => !byKind.get(k)?.[0]);
  const nothingSet = unsetKinds.length === SINGLETON_KINDS.length && bets.length === 0;
  // No `color` here: it rides the [color:…] class on each quiet link so the
  // hover:[color:…] variant can win (inline style beats classes).
  const quietLinkStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    background: "transparent",
    border: "none",
    textTransform: "uppercase",
    alignSelf: "flex-start",
  };

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        boxShadow: "var(--top-light)",
      }}
    >
      <MonoLabel style={{ marginBottom: 12, display: "block" }}>Strategic brief</MonoLabel>

      {isLoading ? (
        <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              height: 10,
              width: "70%",
              borderRadius: 4,
              background: "var(--surface-card-deep)",
            }}
          />
          <div
            style={{
              height: 10,
              width: "50%",
              borderRadius: 4,
              background: "var(--surface-card-deep)",
            }}
          />
        </div>
      ) : nothingSet && !reveal && editingKind === null ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ lineHeight: 1.5, color: "var(--text-muted)", margin: 0 }}>
            Vision, target user, positioning, and top bets steer the machine's judgment.
          </p>
          <button
            type="button"
            onClick={() => setReveal(true)}
            className="outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={quietLinkStyle}
          >
            Set the brief
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SINGLETON_KINDS.filter(
            (kind) => byKind.get(kind)?.[0] || reveal || editingKind === kind,
          ).map((kind) => {
            const current = byKind.get(kind)?.[0];
            const isEditing = editingKind === kind;
            return (
              <div key={kind} style={rowStyle}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span style={{ ...labelStyle, flex: 1 }}>{KIND_LABEL[kind]}</span>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(kind, current)}
                      className="outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: "transparent",
                        border: "none",
                        textTransform: "uppercase",
                      }}
                    >
                      {current ? "Edit" : "Set"}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      className="input"
                      autoFocus
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      rows={3}
                      placeholder={`What is the ${KIND_LABEL[kind].toLowerCase()}, in one paragraph?`}
                      style={{ resize: "vertical" }}
                    />
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <Button
                        variant="secondary"
                        onClick={() => submit(kind, current?.id ?? null)}
                        loading={save.isPending}
                        style={{ padding: "5px 12px" }}
                      >
                        Save · v{(current?.version ?? 0) + 1}
                      </Button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="transition-colors [color:var(--text-faint)] hover:[color:var(--text-muted)]"
                        style={{
                          fontFamily: "var(--font-mono)",
                          background: "transparent",
                          border: "none",
                          textTransform: "uppercase",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={bodyStyle}>
                    {current?.body ?? (
                      <span style={{ color: "var(--text-faint)" }}>Not set yet.</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}

          {bets.length > 0 || reveal || editingKind === "top_bet" ? (
            <div style={rowStyle}>
              <span style={labelStyle}>{KIND_LABEL.top_bet}</span>
              {bets.map((bet) => (
                <div key={bet.id} className="flex items-baseline" style={{ gap: 8 }}>
                  <p style={{ ...bodyStyle, flex: 1 }}>
                    <strong style={{ fontWeight: 500 }}>{bet.title}</strong>
                    {bet.body ? `: ${bet.body}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => retire.mutate(bet.id)}
                    disabled={retire.isPending}
                    className="transition-colors [color:var(--text-faint)] hover:[color:var(--text-muted)] disabled:cursor-default disabled:opacity-45"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "transparent",
                      border: "none",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {retire.isPending ? "Retiring…" : "Retire"}
                  </button>
                </div>
              ))}
              {editingKind === "top_bet" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <input
                    className="input"
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Bet title"
                    style={{ }}
                  />
                  <textarea
                    className="input"
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    rows={2}
                    placeholder="Why this bet, in one line"
                    style={{ resize: "vertical" }}
                  />
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Button
                      variant="secondary"
                      onClick={() => submit("top_bet")}
                      loading={save.isPending}
                      style={{ padding: "5px 12px" }}
                    >
                      Add bet
                    </Button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="transition-colors [color:var(--text-faint)] hover:[color:var(--text-muted)]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: "transparent",
                        border: "none",
                        textTransform: "uppercase",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit("top_bet")}
                  className="outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "transparent",
                    border: "none",
                    textTransform: "uppercase",
                    alignSelf: "flex-start",
                    marginTop: 2,
                  }}
                >
                  + Add a bet
                </button>
              )}
            </div>
          ) : null}
          {!reveal && !nothingSet && (unsetKinds.length > 0 || bets.length === 0) ? (
            <button
              type="button"
              onClick={() => setReveal(true)}
              className="outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={quietLinkStyle}
            >
              Set the rest of the brief
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

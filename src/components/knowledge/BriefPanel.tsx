// Brief (Brain tab, PC-33). The workspace's standing strategic calls, read
// and edited in place through the same versioned, supersedable brief_items
// machinery Today's StrategicBriefCard already writes through (see
// src/lib/briefs.functions.ts). Vision, ICP, and positioning are singleton
// kinds: an edit supersedes the current standing row instead of duplicating
// it. Top bets is a small portfolio, additive by default; an edit supersedes
// only the bet it replaces.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { PanelSkeleton } from "./PanelSkeleton";
import {
  listBriefItems,
  upsertBriefItem,
  retireBriefItem,
  type BriefItem,
  type BriefItemKind,
} from "@/lib/briefs.functions";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { BriefFormationFlow } from "@/components/brief/BriefFormationFlow";

const SINGLETON_KINDS: readonly BriefItemKind[] = ["vision", "icp", "positioning"];

const KIND_LABEL: Record<BriefItemKind, string> = {
  vision: "Vision",
  icp: "Target user (ICP)",
  positioning: "Positioning",
  top_bet: "Top bets",
};

const KIND_TITLE_PLACEHOLDER: Record<BriefItemKind, string> = {
  vision: "Where this is going, in a few words",
  icp: "Who this is for, in a few words",
  positioning: "How you want to be seen, in a few words",
  top_bet: "Bet title",
};

const KIND_BODY_PLACEHOLDER: Record<BriefItemKind, string> = {
  vision: "Where is this product going, in one paragraph?",
  icp: "Who is this for, specifically, and why they need this?",
  positioning: "How should the market see this, against the alternatives?",
  top_bet: "What is the bet, and why now?",
};

type EditTarget = { kind: BriefItemKind; itemId: string | null } | null;

const CARD_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "18px 20px",
};

export function BriefPanel() {
  const qc = useQueryClient();
  const fList = useServerFn(listBriefItems);
  const fUpsert = useServerFn(upsertBriefItem);
  const fRetire = useServerFn(retireBriefItem);

  const items = useQuery({
    queryKey: ["brief-items"],
    queryFn: () => fList({ data: {} }),
  });

  const byKind = new Map<BriefItemKind, BriefItem[]>();
  for (const it of items.data ?? []) {
    byKind.set(it.kind, [...(byKind.get(it.kind) ?? []), it]);
  }

  const [editing, setEditing] = useState<EditTarget>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  // RPT-47: the guided formation flow, opened on demand. It writes through the
  // same brief_items machinery + ["brief-items"] cache, so this panel updates
  // live as the flow saves each call.
  const [showFlow, setShowFlow] = useState(false);

  const save = useMutation({
    mutationFn: (v: {
      kind: BriefItemKind;
      title: string;
      body: string;
      supersedesId?: string | null;
    }) => fUpsert({ data: v }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brief-items"] });
      setEditing(null);
      setDraftTitle("");
      setDraftBody("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const retire = useMutation({
    mutationFn: (id: string) => fRetire({ data: { id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brief-items"] });
      // Destructive action pairs with a confirming toast (Tempo component contract).
      toast.success("Bet retired. Its versions stay on the record.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(kind: BriefItemKind, existing?: BriefItem) {
    setEditing({ kind, itemId: existing?.id ?? null });
    setDraftTitle(existing?.title ?? "");
    setDraftBody(existing?.body ?? "");
  }

  function cancelEdit() {
    setEditing(null);
    setDraftTitle("");
    setDraftBody("");
  }

  function submit(kind: BriefItemKind) {
    if (!draftTitle.trim() || !draftBody.trim()) return;
    save.mutate({
      kind,
      title: draftTitle.trim(),
      body: draftBody.trim(),
      // Singleton kinds supersede their standing row on their own (the
      // upsert looks it up by kind); a top_bet edit needs its id passed so
      // it replaces, rather than adds to, the portfolio.
      supersedesId: kind === "top_bet" ? (editing?.itemId ?? undefined) : undefined,
    });
  }

  if (items.isLoading) return <PanelSkeleton rows={[110, 110, 110, 160]} />;

  if (items.isError) {
    return (
      <div style={CARD_STYLE}>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>Brief · failed to load</MonoLabel>
        <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          {(items.error as Error).message}
        </p>
        <Button variant="secondary" onClick={() => void items.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const bets = byKind.get("top_bet") ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showFlow ? <BriefFormationFlow onClose={() => setShowFlow(false)} /> : null}

      <div className="flex items-center justify-between">
        <p style={{ color: "var(--text-muted)", margin: 0, maxWidth: 420 }}>
          The standing calls that steer the machine. Edit any in place, or walk them in order.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setShowFlow(true)}>
          Form the brief
        </Button>
      </div>

      {SINGLETON_KINDS.map((kind) => {
        const current = byKind.get(kind)?.[0];
        return (
          <SingletonSection
            key={kind}
            kind={kind}
            current={current}
            editing={editing?.kind === kind}
            draftTitle={draftTitle}
            draftBody={draftBody}
            onTitleChange={setDraftTitle}
            onBodyChange={setDraftBody}
            onStartEdit={() => startEdit(kind, current)}
            onCancel={cancelEdit}
            onSubmit={() => submit(kind)}
            submitting={save.isPending}
          />
        );
      })}

      <TopBetsSection
        bets={bets}
        editing={editing}
        draftTitle={draftTitle}
        draftBody={draftBody}
        onTitleChange={setDraftTitle}
        onBodyChange={setDraftBody}
        onStartAdd={() => startEdit("top_bet")}
        onStartEditBet={(bet) => startEdit("top_bet", bet)}
        onCancel={cancelEdit}
        onSubmit={() => submit("top_bet")}
        onRetire={(id) => retire.mutate(id)}
        submitting={save.isPending}
        retiring={retire.isPending}
      />
    </div>
  );
}

function SingletonSection({
  kind,
  current,
  editing,
  draftTitle,
  draftBody,
  onTitleChange,
  onBodyChange,
  onStartEdit,
  onCancel,
  onSubmit,
  submitting,
}: {
  kind: BriefItemKind;
  current: BriefItem | undefined;
  editing: boolean;
  draftTitle: string;
  draftBody: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <MonoLabel>{KIND_LABEL[kind]}</MonoLabel>
        {!editing ? (
          <Button variant="link" size="sm" onClick={onStartEdit}>
            {current ? "Edit" : "Write"}
          </Button>
        ) : null}
      </div>

      {editing ? (
        <BriefForm
          kind={kind}
          titleValue={draftTitle}
          bodyValue={draftBody}
          onTitleChange={onTitleChange}
          onBodyChange={onBodyChange}
          onCancel={onCancel}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel={current ? `Save · v${current.version + 1}` : "Save"}
        />
      ) : current ? (
        <div>
          <p
            style={{
              fontWeight: 500,
              color: "var(--text-primary)",
              margin: "0 0 4px",
            }}
          >
            {current.title}
          </p>
          <p
            style={{
              color: "var(--text-body)",
              lineHeight: 1.5,
              margin: "0 0 10px",
            }}
          >
            {current.body}
          </p>
          <MonoLabel>v{current.version}</MonoLabel>
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Not written yet.</p>
      )}
    </div>
  );
}

function TopBetsSection({
  bets,
  editing,
  draftTitle,
  draftBody,
  onTitleChange,
  onBodyChange,
  onStartAdd,
  onStartEditBet,
  onCancel,
  onSubmit,
  onRetire,
  submitting,
  retiring,
}: {
  bets: BriefItem[];
  editing: EditTarget;
  draftTitle: string;
  draftBody: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onStartAdd: () => void;
  onStartEditBet: (bet: BriefItem) => void;
  onCancel: () => void;
  onSubmit: () => void;
  onRetire: (id: string) => void;
  submitting: boolean;
  retiring: boolean;
}) {
  const isAdding = editing?.kind === "top_bet" && editing.itemId === null;

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <MonoLabel>{KIND_LABEL.top_bet}</MonoLabel>
        {!isAdding ? (
          <Button variant="link" size="sm" onClick={onStartAdd}>
            Add a bet
          </Button>
        ) : null}
      </div>

      {bets.length === 0 && !isAdding ? (
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Not written yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bets.map((bet) => {
            const isEditingBet = editing?.kind === "top_bet" && editing.itemId === bet.id;
            return isEditingBet ? (
              <BriefForm
                key={bet.id}
                kind="top_bet"
                titleValue={draftTitle}
                bodyValue={draftBody}
                onTitleChange={onTitleChange}
                onBodyChange={onBodyChange}
                onCancel={onCancel}
                onSubmit={onSubmit}
                submitting={submitting}
                submitLabel={`Save · v${bet.version + 1}`}
              />
            ) : (
              <div key={bet.id} className="flex items-start justify-between" style={{ gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: "0 0 3px",
                    }}
                  >
                    {bet.title}
                  </p>
                  <p
                    style={{
                      color: "var(--text-body)",
                      lineHeight: 1.5,
                      margin: "0 0 8px",
                    }}
                  >
                    {bet.body}
                  </p>
                  <MonoLabel>v{bet.version}</MonoLabel>
                </div>
                <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
                  <Button variant="link" size="sm" onClick={() => onStartEditBet(bet)}>
                    Edit
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    disabled={retiring}
                    onClick={() => onRetire(bet.id)}
                  >
                    Retire
                  </Button>
                </div>
              </div>
            );
          })}

          {isAdding ? (
            <BriefForm
              kind="top_bet"
              titleValue={draftTitle}
              bodyValue={draftBody}
              onTitleChange={onTitleChange}
              onBodyChange={onBodyChange}
              onCancel={onCancel}
              onSubmit={onSubmit}
              submitting={submitting}
              submitLabel="Add bet"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function BriefForm({
  kind,
  titleValue,
  bodyValue,
  onTitleChange,
  onBodyChange,
  onCancel,
  onSubmit,
  submitting,
  submitLabel,
}: {
  kind: BriefItemKind;
  titleValue: string;
  bodyValue: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        className="input"
        autoFocus
        value={titleValue}
        onChange={(e) => onTitleChange(e.target.value)}
        aria-label={`${KIND_LABEL[kind]} title`}
        placeholder={KIND_TITLE_PLACEHOLDER[kind]}
      />
      <textarea
        className="input"
        value={bodyValue}
        onChange={(e) => onBodyChange(e.target.value)}
        rows={kind === "top_bet" ? 2 : 3}
        aria-label={`${KIND_LABEL[kind]} body`}
        placeholder={KIND_BODY_PLACEHOLDER[kind]}
        style={{ resize: "vertical" }}
      />
      <div className="flex items-center" style={{ gap: 8 }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSubmit}
          loading={submitting}
          disabled={!titleValue.trim() || !bodyValue.trim()}
        >
          {submitLabel}
        </Button>
        <Button variant="link" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

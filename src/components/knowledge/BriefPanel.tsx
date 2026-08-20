/**
 * The brief: the workspace's standing strategic calls, read and edited in place
 * through the versioned, supersedable brief_items machinery Today's
 * StrategicBriefCard already writes through (src/lib/briefs.functions.ts).
 * Vision, ICP and positioning are singleton kinds: an edit supersedes the
 * standing row rather than duplicating it. Top bets is a small portfolio,
 * additive by default; an edit supersedes only the bet it replaces.
 *
 * Ported to the --sp-* system. The surface already titles this region with a
 * Block, so this file owns the INTERIOR only.
 *
 *   KILLED the four bordered cards. The surface puts this panel in a Block; four
 *     bordered boxes in there are cards inside a region. Each call is now a
 *     section with a rule where the register changes, which is what a Block is.
 *   KILLED the hand-rolled "MonoLabel left, link button right" head, four times
 *     over. Block already has that exact slot, so the four sections stop being
 *     four private opinions about how a section head looks.
 *   KILLED the "Vision title" / "Vision body" field labels. The section head
 *     already says which call you are writing and the placeholder says what to
 *     put in it; a third label saying it again is the redundant-writing ban.
 *   KILLED the intro paragraph's restatement. The line that survives carries
 *     only what the four heads do not: that this is versioned, and that the
 *     table does not record an author.
 *
 * ATTRIBUTION. brief_items has no author column. Rather than invent one or leave
 * it silent, the panel says so once, at the top, and every item carries the
 * provenance the record does hold: its version and when it last changed.
 *
 * UNCHANGED: listBriefItems / upsertBriefItem / retireBriefItem, the
 * ["brief-items"] key shared with BriefFormationFlow and Today, the singleton
 * vs portfolio supersession rules, and the exported BriefPanel signature.
 */
import { useState } from "react";
import {
  Num,
  Actions,
  Action,
  Region,
  Reading,
  ReadFailed,
  NothingYet,
} from "@/components/meridian/surface-parts";
import { Input, Textarea } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listBriefItems,
  upsertBriefItem,
  retireBriefItem,
  type BriefItem,
  type BriefItemKind,
} from "@/lib/briefs.functions";
import { Receipt } from "@/components/shell/primitives";
import { BriefFormationFlow } from "@/components/brief/BriefFormationFlow";
import { useConfirm } from "@/hooks/use-confirm";

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

function day(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(+d) ? "" : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** The one line of prose in a written call: what it says, then the body. */
function Standing({ item }: { item: BriefItem }) {
  return (
    <>
      <p
        style={{
          fontSize: "var(--sp-text-body)",
          fontWeight: "var(--sp-weight-strong)",
          color: "var(--sp-ink)",
        }}
      >
        {item.title}
      </p>
      <p
        style={{
          fontSize: "var(--sp-text-prose)",
          color: "var(--sp-body)",
          lineHeight: "var(--sp-leading-body)",
          marginTop: "var(--sp-space-1)",
        }}
      >
        {item.body}
      </p>
      {/* The provenance the record actually holds. Never an author it does not. */}
      <p
        style={{
          fontSize: "var(--sp-text-label)",
          color: "var(--sp-mute)",
          marginTop: "var(--sp-space-2)",
        }}
      >
        <Num>v{item.version}</Num>
        {day(item.updated_at) ? ` · last changed ${day(item.updated_at)}` : null}
      </p>
    </>
  );
}

/**
 * WHAT IS MISSING WHILE THIS IS UNWRITTEN, per call.
 *
 * Never the shape of the field, which the placeholder already gives, and never
 * a definition of the word in the heading. Each of these names the CONSEQUENCE
 * of the blank, in the crew's behaviour, because that is the only reason a
 * person would stop and write four paragraphs of strategy on a Tuesday. Every
 * one of them is true of the wiring: brief_items go into the prompt every agent
 * reads before it acts (briefs.functions.ts, and the Receipt on save says so).
 */
const WHY_IT_MATTERS: Record<BriefItemKind, string> = {
  vision:
    "Until this is written the crew ranks every bet on its own merits alone, because it has nothing to rank them against.",
  icp: "Until this is written the crew weighs every signal the same, because it does not know whose complaint should count double.",
  positioning:
    "Until this is written nothing holds a line when a bet pulls the product somewhere it should not go.",
  top_bet:
    "Until one is written, nothing else on this page has a stated priority to be measured against.",
};

const WRITE_LABEL: Record<BriefItemKind, string> = {
  vision: "Write the vision",
  icp: "Write who it is for",
  positioning: "Write the positioning",
  top_bet: "Write the first bet",
};

/**
 * NOT WRITTEN, AND IT USED TO BE FOUR WORDS IN GREY.
 *
 * `<p>Not written yet.</p>` is not an empty state. It is not the Empty
 * primitive, so it carries no door; it names nobody who acts next; and it
 * explains nothing about why the blank costs anything. On a new workspace it
 * rendered FOUR TIMES down one column, which turns the one region on Brain a
 * person could fill in five minutes into a page that looks broken.
 *
 * The Block head above each of these already carries a "Write" control, so the
 * door here is not a second route to a second place: it is the same act,
 * reachable from where the reader's eye actually is. An empty state that names
 * who acts next and gives them no way to act is only half honest, which is the
 * argument the Empty primitive's own docblock makes.
 */
function NotWritten({ kind, onWrite }: { kind: BriefItemKind; onWrite: () => void }) {
  return (
    <NothingYet action={<Action onClick={onWrite}>{WRITE_LABEL[kind]}</Action>}>
      {WHY_IT_MATTERS[kind]}
    </NothingYet>
  );
}

export function BriefPanel() {
  const qc = useQueryClient();
  const confirm = useConfirm();
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

  // THE COMMIT (agents/FINAL-agent-presence.md R10). Editing the brief changes
  // what EVERY agent reads before it acts, which is the largest blast radius
  // any write on this surface has. It used to end in a toast, or in nothing at
  // all. Session local: the durable record is the versioned brief itself.
  const [settled, setSettled] = useState<
    { id: string; verb: string; consequence: string; failed?: boolean }[]
  >([]);
  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed },
      ...prev,
    ]);

  const save = useMutation({
    mutationFn: (v: {
      kind: BriefItemKind;
      title: string;
      body: string;
      supersedesId?: string | null;
    }) => fUpsert({ data: v }),
    onSuccess: (_res, v) => {
      void qc.invalidateQueries({ queryKey: ["brief-items"] });
      commit(
        v.supersedesId || SINGLETON_KINDS.includes(v.kind)
          ? `You rewrote the ${KIND_LABEL[v.kind].toLowerCase()}`
          : `You added a ${KIND_LABEL[v.kind].toLowerCase()}`,
        `"${v.title}" goes into every agent's prompt from the next run. The version it replaced stays on the record.`,
      );
      setEditing(null);
      setDraftTitle("");
      setDraftBody("");
    },
    onError: (e: Error, v) =>
      commit(
        `You tried to write the ${KIND_LABEL[v.kind].toLowerCase()}`,
        `"${v.title}" was not saved. ${e.message || "The write failed."}`,
        true,
      ),
  });

  const retire = useMutation({
    mutationFn: (vars: { id: string; title: string }) => fRetire({ data: { id: vars.id } }),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ["brief-items"] });
      commit(
        "You retired a bet",
        `The crew stops carrying "${vars.title}" into its next run. Every version of it stays on the record.`,
      );
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to retire a bet",
        `"${vars.title}" is still live. ${e.message || "The write failed."}`,
        true,
      ),
  });

  // Retiring is the one-way door on this panel. retireBriefItem flips the row to
  // `superseded` (briefs.functions.ts:290), listBriefItems only ever reads
  // `standing`, and nothing in the codebase writes a row back to `standing`. So
  // the record survives and the bet does not come back here: putting it back
  // means writing it again as a new bet, at v1. The confirm says exactly that
  // rather than the softer "you can restore it" a delete elsewhere can promise.
  // Edit is left unguarded next to it: an edit supersedes into a new version and
  // the old one stays readable, which is not a door that shuts.
  async function confirmAndRetire(bet: BriefItem) {
    const ok = await confirm({
      title: `Retire "${bet.title}"?`,
      body: "The crew stops carrying it into its next run. Every version of it stays on the record, but nothing here puts it back: you would have to write it again as a new bet.",
      confirmLabel: "Retire the bet",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (ok) retire.mutate({ id: bet.id, title: bet.title });
  }

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

  if (items.isLoading) return <Reading>Reading the standing calls.</Reading>;

  if (items.isError) {
    return (
      <ReadFailed onRetry={() => void items.refetch()}>
        The brief did not load, so this is not a claim that nothing is written down.{" "}
        {(items.error as Error).message}
      </ReadFailed>
    );
  }

  const bets = byKind.get("top_bet") ?? [];
  const isAddingBet = editing?.kind === "top_bet" && editing.itemId === null;

  return (
    <div>
      {showFlow ? <BriefFormationFlow onClose={() => setShowFlow(false)} /> : null}

      {/* Different information from the four heads below, not a restatement:
          every call is versioned, and the table keeps no author. */}
      <p style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)", maxWidth: "62ch" }}>
        The crew reads these before it acts. Each call keeps its version history; who wrote it is
        not on the record.
      </p>
      <Actions>
        <Action onClick={() => setShowFlow(true)}>Walk them in order</Action>
      </Actions>

      {settled.map((r) => (
        <Receipt key={r.id} verb={r.verb} consequence={r.consequence} failed={r.failed} />
      ))}

      {SINGLETON_KINDS.map((kind) => {
        const current = byKind.get(kind)?.[0];
        const isEditing = editing?.kind === kind;
        return (
          <Region
            key={kind}
            title={KIND_LABEL[kind]}
            toggle={isEditing ? undefined : current ? "Edit" : "Write"}
            onToggle={() => startEdit(kind, current)}
            toggled={isEditing}
          >
            {isEditing ? (
              <BriefForm
                kind={kind}
                titleValue={draftTitle}
                bodyValue={draftBody}
                onTitleChange={setDraftTitle}
                onBodyChange={setDraftBody}
                onCancel={cancelEdit}
                onSubmit={() => submit(kind)}
                submitting={save.isPending}
                submitLabel={current ? `Save as v${current.version + 1}` : "Save"}
              />
            ) : current ? (
              <Standing item={current} />
            ) : (
              <NotWritten kind={kind} onWrite={() => startEdit(kind)} />
            )}
          </Region>
        );
      })}

      <Region
        title={KIND_LABEL.top_bet}
        toggle={isAddingBet ? undefined : "Add a bet"}
        onToggle={() => startEdit("top_bet")}
        toggled={isAddingBet}
      >
        {bets.length === 0 && !isAddingBet ? (
          <NotWritten kind="top_bet" onWrite={() => startEdit("top_bet")} />
        ) : null}

        {bets.map((bet, i) => {
          const isEditingBet = editing?.kind === "top_bet" && editing.itemId === bet.id;
          return (
            <div
              key={bet.id}
              style={
                i === 0
                  ? undefined
                  : {
                      marginTop: "var(--sp-space-3)",
                      paddingTop: "var(--sp-space-3)",
                      borderTop: "1px solid var(--sp-line-soft)",
                    }
              }
            >
              {isEditingBet ? (
                <BriefForm
                  kind="top_bet"
                  titleValue={draftTitle}
                  bodyValue={draftBody}
                  onTitleChange={setDraftTitle}
                  onBodyChange={setDraftBody}
                  onCancel={cancelEdit}
                  onSubmit={() => submit("top_bet")}
                  submitting={save.isPending}
                  submitLabel={`Save as v${bet.version + 1}`}
                />
              ) : (
                <>
                  <Standing item={bet} />
                  {/* Retiring a bet is the kill, so it sits apart by DISTANCE
                      rather than by colour: the interface is monochrome and red
                      carries outcomes, not intent. */}
                  <Actions
                    trailing={
                      <Action
                        variant="quiet"
                        busy={retire.isPending}
                        onClick={() => void confirmAndRetire(bet)}
                      >
                        Retire
                      </Action>
                    }
                  >
                    <Action variant="quiet" onClick={() => startEdit("top_bet", bet)}>
                      Edit
                    </Action>
                  </Actions>
                </>
              )}
            </div>
          );
        })}

        {isAddingBet ? (
          <div style={bets.length === 0 ? undefined : { marginTop: "var(--sp-space-3)" }}>
            <BriefForm
              kind="top_bet"
              titleValue={draftTitle}
              bodyValue={draftBody}
              onTitleChange={setDraftTitle}
              onBodyChange={setDraftBody}
              onCancel={cancelEdit}
              onSubmit={() => submit("top_bet")}
              submitting={save.isPending}
              submitLabel="Add bet"
            />
          </div>
        ) : null}
      </Region>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-space-2)" }}>
      {/* No visible labels: the section head says which call this is and the
          placeholder says what belongs in the box. Saying it a third time is
          the redundant-writing ban. */}
      <Input
        autoFocus
        value={titleValue}
        onChange={(e) => onTitleChange(e.target.value)}
        aria-label={`${KIND_LABEL[kind]} in a line`}
        placeholder={KIND_TITLE_PLACEHOLDER[kind]}
      />
      <Textarea
        value={bodyValue}
        onChange={(e) => onBodyChange(e.target.value)}
        rows={kind === "top_bet" ? 2 : 3}
        aria-label={`${KIND_LABEL[kind]} in full`}
        placeholder={KIND_BODY_PLACEHOLDER[kind]}
      />
      <Actions>
        <Action
          variant="primary"
          onClick={onSubmit}
          disabled={submitting || !titleValue.trim() || !bodyValue.trim()}
        >
          {submitting ? "Saving" : submitLabel}
        </Action>
        <Action variant="quiet" onClick={onCancel} busy={submitting}>
          Cancel
        </Action>
      </Actions>
    </div>
  );
}

/**
 * The standing written record. Brain > Written.
 *
 * REBUILT on the shell primitives, 2026-07-29. This file was the worst offender
 * behind the founder's complaint: the route was ported and this panel still
 * carried an ENTIRE earlier design system underneath it. `bento`, `lift`,
 * `btn btn-ghost btn-sm`, `btn-reject`, `mono-label`, `input`, `cmdk-item`,
 * `spinner`, and the `--ink-*` / `--soft-stone` / `--surface-1` /
 * `--geist-space-*` / `--font-display` token families, none of which resolve
 * against this shell. Opening the Written tab put a different product on screen.
 *
 * WHAT WENT, and why:
 *   KILLED the hand-rolled Notion modal: `position: fixed`, `inset: 0`,
 *     `zIndex: 60`, a scrim, its own close X and its own header rule, all built
 *     by hand. A search field, a URL field and a scrolling result list is a
 *     panel, not a single irreversible confirmation (anti-slop ban 11), and a
 *     hand-built overlay has no focus trap, no scroll lock and no focus return,
 *     which is an accessibility regression wearing a modal's name. Importing is
 *     an IN PLACE composer now, and it holds both sources.
 *   KILLED the usePrompt dialog for the Google Docs URL. It was the same job as
 *     Notion, asked in a different instrument. One composer, one mode switch.
 *   KILLED the two-column card GRID. A doc is read down a list, not scanned
 *     across a catalog: the only question a row answers is "is this the page I
 *     meant", and the card spent a 32px icon tile answering it (hard ban 8). A
 *     Row is two lines and the preview opens under the list.
 *   KILLED the "edit" affordance beside every chevron. Click previews,
 *     double-click edited, and a third control saying the same thing on every
 *     row is redundant (hard ban 10). One control, in the row's action slot,
 *     and the double-click goes with it because an affordance nobody can see is
 *     not an affordance.
 *   KILLED the shimmer skeleton. Loading is the third fact and it says so in
 *     words; a shimmer performs rather than confirms.
 *   KILLED the "docs - failed to load" box. Failed says what did not happen and
 *     refuses to claim there are no pages.
 *   KILLED every success toast. A page deleted is removed for everyone and
 *     agents stop citing it; a page pushed to Signals goes to Scout to cluster.
 *     Those are consequences, not confirmations that a click registered
 *     (agents/FINAL-agent-presence.md R10), so each leaves a Receipt. The
 *     autosave failure is now a receipt too, where it used to be a toast that
 *     erased itself while you kept typing into a page nobody was saving.
 *
 * UNCHANGED: listDocs / getDoc / createDoc / updateDoc / deleteDoc,
 * importGoogleDoc, importNotionPage / searchNotionPages, createSignal, every
 * query key, the autosave contract, the Notion search debounce, and the
 * destructive confirm before a delete.
 *
 * STILL LEGACY, and named rather than hidden: DocEditor lives in
 * components/supaprod, which this lane does not own. It is mounted as it was.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row } from "@/components/meridian/rows";
import {
  Num,
  Actions,
  Action,
  Region,
  Reading,
  ReadFailed,
  ReadFailedLine,
  NothingHere,
  NothingYet,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DocEditor } from "@/components/supaprod/DocEditor";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { listDocs, getDoc, createDoc, updateDoc, deleteDoc } from "@/lib/docs.functions";
import { importGoogleDoc } from "@/lib/gdocs.functions";
import { importNotionPage, searchNotionPages } from "@/lib/notion.functions";
import { createSignal } from "@/lib/discovery.functions";
import { Receipt } from "@/components/meridian/Receipt";
import { Prose } from "@/components/meridian/Prose";

type DocNode = {
  id: string;
  title: string;
  icon: string | null;
  parent_id: string | null;
  project_id: string | null;
  archived: boolean;
  position: number;
  updated_at: string;
};

type DocFull = {
  id: string;
  title: string;
  icon: string | null;
  content_json: unknown;
  content_text: string | null;
  updated_at: string;
};

/** What a write left behind. Session local: the durable record is the list. */
type Settled = { id: string; verb: string; consequence: string; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) return n.content.map(extractText).join(" ");
  return "";
}

function excerptOf(doc: DocFull): string {
  const text = doc.content_text?.trim() || extractText(doc.content_json).trim();
  return text.slice(0, 320);
}

function updatedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the list shows the top few
// rows and expands on demand, so Written never becomes a long wall.
const VISIBLE_DOCS = 8;

export function DocsPanel() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const fList = useServerFn(listDocs);
  const fGet = useServerFn(getDoc);
  const fCreate = useServerFn(createDoc);
  const fUpdate = useServerFn(updateDoc);
  const fDelete = useServerFn(deleteDoc);
  const fCreateSignal = useServerFn(createSignal);

  const docs = useQuery({ queryKey: ["docs"], queryFn: () => fList() });
  const allDocs = (docs.data?.docs ?? []) as DocNode[];

  const [selectedId, setSelectedId] = useState<string | null>(null); // editor
  const [openDocId, setOpenDocId] = useState<string | null>(null); // preview
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [settled, setSettled] = useState<Settled[]>([]);

  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

  const selected = useQuery({
    queryKey: ["doc", selectedId],
    queryFn: () => fGet({ data: { id: selectedId! } }),
    enabled: !!selectedId,
  });
  const preview = useQuery({
    queryKey: ["doc", openDocId],
    queryFn: () => fGet({ data: { id: openDocId! } }),
    enabled: !!openDocId,
  });

  const mCreate = useMutation({
    mutationFn: () => fCreate({ data: { title: "Untitled", parent_id: null } }),
    onSuccess: ({ doc }) => {
      qc.invalidateQueries({ queryKey: ["docs"] });
      setSelectedId(doc.id);
      setOpenDocId(null);
    },
    onError: (e: Error) =>
      commit("You tried to start a page", e.message || "Nothing was created.", true),
  });

  const mUpdate = useMutation({
    mutationFn: (vars: { id: string; title?: string; icon?: string; content_json?: unknown }) =>
      fUpdate({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["docs"] });
      qc.invalidateQueries({ queryKey: ["doc", selectedId] });
    },
    // Autosave failing quietly is the defect worth catching: you keep typing
    // into a page that is no longer being written down.
    onError: (e: Error) =>
      commit(
        "The page stopped saving",
        `${e.message || "The write failed."} Copy anything you cannot lose before you leave.`,
        true,
      ),
  });

  const mDelete = useMutation({
    mutationFn: (vars: { id: string; title: string }) => fDelete({ data: { id: vars.id } }),
    onSuccess: (_r, vars) => {
      commit(
        "You deleted a page",
        `"${vars.title}" is gone for everyone in this workspace, and agents stop citing it.`,
      );
      setSelectedId(null);
      setOpenDocId(null);
      qc.invalidateQueries({ queryKey: ["docs"] });
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to delete a page",
        `"${vars.title}" is still here. ${e.message || "The write failed."}`,
        true,
      ),
  });

  const mPush = useMutation({
    mutationFn: (doc: DocFull) =>
      fCreateSignal({
        data: {
          content: (doc.content_text?.trim() || doc.title).slice(0, 8000),
          source: "doc",
          title: doc.title,
        },
      }),
    onSuccess: (_r, doc) => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      commit(
        "You sent a page to Discovery",
        `"${doc.title}" is a signal now. Scout clusters it with everything else saying the same thing.`,
      );
    },
    onError: (e: Error, doc) =>
      commit(
        "You tried to send a page to Discovery",
        `"${doc.title}" was not sent. ${e.message || "The write failed."}`,
        true,
      ),
  });

  function openEditor(id: string) {
    setOpenDocId(null);
    setSelectedId(id);
  }

  const filter = search.trim().toLowerCase();
  const cards = filter ? allDocs.filter((d) => d.title.toLowerCase().includes(filter)) : allDocs;

  const doc = (selected.data?.doc ?? null) as DocFull | null;
  const previewDoc = (preview.data?.doc ?? null) as DocFull | null;

  const receipts = settled.map((s) => (
    <Receipt key={s.id} verb={s.verb} consequence={s.consequence} time={s.at} failed={s.failed} />
  ));

  if (docs.isLoading) return <Reading>Reading the workspace pages.</Reading>;

  if (docs.isError) {
    return (
      <ReadFailed onRetry={() => void docs.refetch()}>
        The pages did not load, so this is not a claim that none were written.{" "}
        {(docs.error as Error).message}
      </ReadFailed>
    );
  }

  /* ---------------------------------------------------------------- *
   * One page, open. IN PLACE: it replaces the list, the same way
   * admin/people and crew replace theirs.
   * ---------------------------------------------------------------- */
  if (selectedId != null) {
    return (
      <div>
        <Actions>
          <Action variant="quiet" onClick={() => setSelectedId(null)}>
            All pages
          </Action>
        </Actions>

        {receipts}

        {selected.isLoading || !doc ? (
          <Reading>Reading the page.</Reading>
        ) : selected.isError ? (
          <ReadFailed onRetry={() => void selected.refetch()}>
            The page did not load, so nothing here is safe to edit yet.{" "}
            {(selected.error as Error)?.message ?? ""}
          </ReadFailed>
        ) : (
          <Region
            title={doc.title || "Untitled"}
            // The different fact, never a restatement of the title: it saves
            // itself, and the crew reads it.
            sub={
              <>
                Last edited {updatedLabel(doc.updated_at)}. It saves as you type, and the crew reads
                it on the next run.
                {mUpdate.isPending ? " Saving." : ""}
              </>
            }
          >
            <Field label="Title" htmlFor={`doc-title-${doc.id}`}>
              <Input
                id={`doc-title-${doc.id}`}
                key={doc.id}
                defaultValue={doc.title}
                placeholder="Untitled"
                onBlur={(e) => {
                  const v = e.target.value.trim() || "Untitled";
                  if (v !== doc.title) mUpdate.mutate({ id: doc.id, title: v });
                }}
              />
            </Field>

            <DocEditor
              key={doc.id}
              initialContent={doc.content_json}
              onChange={(json) => mUpdate.mutate({ id: doc.id, content_json: json })}
            />

            <Actions
              trailing={
                <Action
                  variant="quiet"
                  busy={mDelete.isPending}
                  onClick={() => {
                    void (async () => {
                      const ok = await confirm({
                        title: "Delete this page?",
                        body: "It goes for everyone in the workspace, and agents stop citing it.",
                        destructive: true,
                        confirmLabel: "Delete",
                      });
                      if (ok) mDelete.mutate({ id: doc.id, title: doc.title });
                    })();
                  }}
                >
                  {mDelete.isPending ? "Deleting" : "Delete for everyone"}
                </Action>
              }
            >
              <Action busy={mPush.isPending} onClick={() => mPush.mutate(doc)}>
                {mPush.isPending ? "Sending" : "Send it to Discovery"}
              </Action>
              <Action
                variant="quiet"
                onClick={() => {
                  void (async () => {
                    const next = await prompt({
                      title: "Change icon",
                      label: "Paste a single emoji",
                      defaultValue: doc.icon ?? "",
                      confirmLabel: "Save",
                    });
                    if (next) mUpdate.mutate({ id: doc.id, icon: next });
                  })();
                }}
              >
                Change the icon
              </Action>
            </Actions>
          </Region>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- *
   * The list.
   * ---------------------------------------------------------------- */
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--mrd-s3)",
          marginBottom: "var(--mrd-s4)",
        }}
      >
        <span style={{ flex: "1 1 170px", minWidth: 150, maxWidth: 280 }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search pages by title"
            placeholder="Search pages"
          />
        </span>
        <span style={{ marginLeft: "auto" }}>
          <Actions>
            <Action
              variant="quiet"
              aria-expanded={importOpen}
              aria-controls="docs-import"
              onClick={() => setImportOpen((o) => !o)}
            >
              {importOpen ? "Close" : "Bring one in"}
            </Action>
            <Action variant="primary" onClick={() => mCreate.mutate()} busy={mCreate.isPending}>
              {mCreate.isPending ? "Starting" : "Start a page"}
            </Action>
          </Actions>
        </span>
      </div>

      {/* IN PLACE, never an overlay. Both sources live here: they are the same
          job asked twice, so they are one composer with a mode. */}
      {importOpen ? (
        <ImportPage
          id="docs-import"
          onClose={() => setImportOpen(false)}
          onCommit={commit}
          onImported={(docId) => {
            qc.invalidateQueries({ queryKey: ["docs"] });
            setSelectedId(docId);
            setImportOpen(false);
          }}
        />
      ) : null}

      {receipts}

      {cards.length === 0 ? (
        filter ? (
          <NothingHere action={<Action onClick={() => setSearch("")}>Clear the search</Action>}>
            No page has that in its title.
          </NothingHere>
        ) : (
          <NothingYet action={<Action onClick={() => mCreate.mutate()}>Start a page</Action>}>
            Nothing is written down yet. Start a page, or bring one in from Google Docs or Notion.
            Whatever lands here, the crew reads before it acts.
          </NothingYet>
        )
      ) : (
        <>
          {(showAll ? cards : cards.slice(0, VISIBLE_DOCS)).map((d) => (
            <Row
              key={d.id}
              tight
              focused={openDocId === d.id}
              lead={d.title || "Untitled"}
              // The different fact, never more of the title.
              sub={`Updated ${updatedLabel(d.updated_at)}`}
              onClick={() => setOpenDocId(openDocId === d.id ? null : d.id)}
              action={
                <Action variant="quiet" onClick={() => openEditor(d.id)}>
                  Open it
                </Action>
              }
            />
          ))}

          {/* The preview sits under the list rather than inside a row, because
              a row in a list never wraps (founder ruling). */}
          {openDocId ? (
            <Region title="Preview">
              {preview.isLoading || !previewDoc ? (
                <Reading>Reading the page.</Reading>
              ) : preview.isError ? (
                <ReadFailedLine onRetry={() => void preview.refetch()}>
                  The page did not load, so this is not a claim that it is empty.
                </ReadFailedLine>
              ) : (
                <>
                  <Prose>
                    <p>{excerptOf(previewDoc) || "Nothing written yet."}</p>
                  </Prose>
                  <Actions>
                    <Action onClick={() => openEditor(previewDoc.id)}>Open the editor</Action>
                  </Actions>
                </>
              )}
            </Region>
          ) : null}

          {cards.length > VISIBLE_DOCS ? (
            <Actions>
              <Action variant="quiet" onClick={() => setShowAll((v) => !v)}>
                {showAll ? (
                  "Show fewer"
                ) : (
                  <>
                    Show <Num>{cards.length - VISIBLE_DOCS}</Num> more
                  </>
                )}
              </Action>
            </Actions>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ================================================================== *
 * Bringing a page in. Two sources, one composer, in place.
 * ================================================================== */

type ImportMode = "google" | "notion";

function ImportPage({
  id,
  onClose,
  onCommit,
  onImported,
}: {
  id: string;
  onClose: () => void;
  onCommit: (verb: string, consequence: string, failed?: boolean) => void;
  onImported: (docId: string) => void;
}) {
  const fImportGDoc = useServerFn(importGoogleDoc);
  const fImportNotion = useServerFn(importNotionPage);
  const fSearchNotion = useServerFn(searchNotionPages);

  const [mode, setMode] = useState<ImportMode>("google");
  const [gdocUrl, setGdocUrl] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [notionQuery, setNotionQuery] = useState("");
  const [debouncedNotionQuery, setDebouncedNotionQuery] = useState("");

  // One request per pause, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNotionQuery(notionQuery), 300);
    return () => clearTimeout(timer);
  }, [notionQuery]);

  const mGoogle = useMutation({
    mutationFn: (urlOrId: string) => fImportGDoc({ data: { urlOrId } }),
    onSuccess: ({ doc }) => {
      onCommit(
        "You brought in a Google Doc",
        `"${doc.title}" is a workspace page now, and the crew reads it on the next run.`,
      );
      onImported(doc.id);
    },
    onError: (e: unknown) =>
      onCommit(
        "You tried to bring in a Google Doc",
        e instanceof Error ? e.message : "The import failed. Nothing was added.",
        true,
      ),
  });

  const mNotion = useMutation({
    mutationFn: (urlOrId: string) => fImportNotion({ data: { urlOrId } }),
    onSuccess: ({ doc }) => {
      onCommit(
        "You brought in a Notion page",
        `"${doc.title}" is a workspace page now, and the crew reads it on the next run.`,
      );
      onImported(doc.id);
    },
    onError: (e: unknown) =>
      onCommit(
        "You tried to bring in a Notion page",
        e instanceof Error ? e.message : "The import failed. Nothing was added.",
        true,
      ),
  });

  const notionSearch = useQuery({
    queryKey: ["notion-search", debouncedNotionQuery],
    queryFn: () => fSearchNotion({ data: { query: debouncedNotionQuery } }),
    enabled: mode === "notion" && debouncedNotionQuery.length > 0,
  });

  const busy = mGoogle.isPending || mNotion.isPending;

  return (
    <div id={id}>
      <Region
        title="Bring a page in"
        // Different information from the title, not a restatement of it.
        sub="It becomes a workspace page and joins what the crew reads before it acts. The original stays where it is."
      >
        <div className="sp-tabs" role="tablist" aria-label="Where the page comes from">
          <button
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={mode === "google"}
            onClick={() => setMode("google")}
          >
            Google Docs
          </button>
          <button
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={mode === "notion"}
            onClick={() => setMode("notion")}
          >
            Notion
          </button>
        </div>

        {mode === "google" ? (
          <>
            <Field label="Document URL or id" htmlFor="docs-gdoc-url">
              <Input
                id="docs-gdoc-url"
                value={gdocUrl}
                onChange={(e) => setGdocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/"
                autoFocus
              />
            </Field>
            <Actions
              trailing={
                <Action variant="quiet" onClick={onClose} busy={busy}>
                  Cancel
                </Action>
              }
            >
              <Action
                variant="primary"
                disabled={busy || !gdocUrl.trim()}
                onClick={() => mGoogle.mutate(gdocUrl.trim())}
              >
                {mGoogle.isPending ? "Reading" : "Bring it in"}
              </Action>
            </Actions>
          </>
        ) : (
          <>
            <Field label="Search the pages you shared with Supaprod" htmlFor="docs-notion-search">
              <Input
                id="docs-notion-search"
                value={notionQuery}
                onChange={(e) => setNotionQuery(e.target.value)}
                placeholder="Search Notion"
                autoFocus
              />
            </Field>

            {!debouncedNotionQuery ? null : notionSearch.isLoading ? (
              <Reading>Searching Notion.</Reading>
            ) : notionSearch.isError ? (
              <ReadFailedLine onRetry={() => void notionSearch.refetch()}>
                Notion did not answer, so this is not a claim that nothing matches.{" "}
                {(notionSearch.error as Error)?.message ?? ""}
              </ReadFailedLine>
            ) : (notionSearch.data?.pages?.length ?? 0) === 0 ? (
              <NothingHere>
                No page matches. Only pages you shared with the Supaprod integration are reachable,
                so share it in Notion first.
              </NothingHere>
            ) : (
              (notionSearch.data?.pages ?? []).map((p) => (
                <Row
                  key={p.id}
                  tight
                  lead={p.title || "Untitled"}
                  onClick={() => mNotion.mutate(p.id)}
                  sub={
                    mNotion.isPending && mNotion.variables === p.id
                      ? "Reading it now"
                      : "In Notion. Click to bring it in."
                  }
                />
              ))
            )}

            <Field label="Or paste a page URL" htmlFor="docs-notion-url">
              <Input
                id="docs-notion-url"
                value={notionUrl}
                onChange={(e) => setNotionUrl(e.target.value)}
                placeholder="https://www.notion.so/"
              />
            </Field>
            <Actions
              trailing={
                <Action variant="quiet" onClick={onClose} busy={busy}>
                  Cancel
                </Action>
              }
            >
              <Action
                variant="primary"
                disabled={busy || !notionUrl.trim()}
                onClick={() => mNotion.mutate(notionUrl.trim())}
              >
                {mNotion.isPending ? "Reading" : "Bring it in"}
              </Action>
            </Actions>
          </>
        )}
      </Region>
    </div>
  );
}

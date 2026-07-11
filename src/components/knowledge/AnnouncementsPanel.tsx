// AnnouncementsPanel - Brain tab (OBS-10, folds the retired /product Releases
// tab's announcement authoring surface). Same server functions and the same
// draft -> pending -> published governance as the legacy AnnouncementsManager
// (src/components/product/AnnouncementsManager.tsx); this file only changes
// the skin to the Obsidian v3 vocabulary already established by
// ChangelogPanel / DecisionsPanel / ImpactLedgerPanel on this page.
//
// Governance is still the DB's job (the published-only RLS policy + the
// SECURITY DEFINER `publish_announcement` RPC that re-checks owner/admin);
// the role gates here are UX-only, derived from the same TRANSITION_ROLES
// table the DB mirrors, so button visibility can never disagree with what the
// server allows. A tampered client still cannot publish - the RPC rejects it.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  submitForApproval,
  approveAndPublish,
  type AnnouncementRow,
} from "@/lib/announcements.functions";
import { listWorkspaceMembers } from "@/lib/workspaces.functions";
import { TRANSITION_ROLES, type WorkspaceRole } from "@/lib/announcements";
import { toast } from "@/lib/notify";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { VerdictChip, type VerdictTone } from "@/components/obsidian/verdict";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { relTime } from "./ship-format";

const STATUS_TONE: Record<AnnouncementRow["status"], VerdictTone> = {
  draft: "DRAFTING",
  pending: "WATCH",
  published: "SHIP",
};

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 13,
  color: "var(--text-primary)",
};

const FIELD_CLASS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );
}

function RowAction({
  tone,
  onClick,
  disabled,
  children,
}: {
  tone: "neutral" | "moss";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const hue =
    tone === "moss"
      ? { color: "var(--moss)", border: "rgba(127,191,142,0.35)" }
      : { color: "var(--text-subtle)", border: "var(--hairline-strong)" };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${FIELD_CLASS} disabled:opacity-45 disabled:cursor-default`}
      style={{
        fontSize: 11,
        color: hue.color,
        background: "transparent",
        border: `1px solid ${hue.border}`,
        borderRadius: 6,
        padding: "3px 9px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the list shows the top few
// and expands on demand, so Brain never becomes a long wall.
const VISIBLE_ANNOUNCEMENTS = 6;

export function AnnouncementsPanel() {
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const fList = useServerFn(listAnnouncements);
  const fMembers = useServerFn(listWorkspaceMembers);
  const fCreate = useServerFn(createAnnouncement);
  const fUpdate = useServerFn(updateAnnouncement);
  const fSubmit = useServerFn(submitForApproval);
  const fPublish = useServerFn(approveAndPublish);

  const wid = activeWorkspaceId ?? "";
  const listQ = useQuery({
    queryKey: ["announcements", wid],
    queryFn: () => fList({ data: { workspaceId: wid } }),
    enabled: !!wid,
  });
  // selfRole gates the buttons; the members fn is the proven RLS-safe source.
  const roleQ = useQuery({
    queryKey: ["workspace-members", wid],
    queryFn: () => fMembers({ data: { id: wid } }),
    enabled: !!wid,
  });

  const role = (roleQ.data?.selfRole ?? null) as WorkspaceRole | null;
  const canContribute = !!role && TRANSITION_ROLES["draft->pending"].includes(role);
  const canPublish = !!role && TRANSITION_ROLES["pending->published"].includes(role);

  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["announcements", wid] });

  const createMut = useMutation({
    mutationFn: () =>
      fCreate({ data: { workspaceId: wid, title: newTitle.trim(), body: newBody } }),
    onSuccess: () => {
      toast.success("Draft created");
      setNewTitle("");
      setNewBody("");
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; title: string; body: string }) =>
      fUpdate({ data: { id: vars.id, title: vars.title.trim(), body: vars.body } }),
    onSuccess: () => {
      toast.success("Saved");
      setEditId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitMut = useMutation({
    mutationFn: (id: string) => fSubmit({ data: { id, workspaceId: wid } }),
    onSuccess: () => {
      toast.success("Submitted for approval");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => fPublish({ data: { id, workspaceId: wid } }),
    onSuccess: () => {
      toast.success("Published");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeWorkspaceId) return null;

  const rows = listQ.data?.announcements ?? [];
  const busy =
    createMut.isPending || updateMut.isPending || submitMut.isPending || publishMut.isPending;

  function startEdit(a: AnnouncementRow) {
    setEditId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center" style={{ gap: 12, marginBottom: 14 }}>
        <p
          style={{
            flex: 1,
            minWidth: 240,
            fontSize: 12.5,
            color: "var(--text-faint)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Customer-facing posts. Drafts stay private to the workspace; a published post is public at{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>/p/&lt;slug&gt;</span>. Owners and admins
          publish.
        </p>
        {canContribute ? (
          <Button variant="secondary" disabled={busy} onClick={() => setOpen(true)}>
            New announcement
          </Button>
        ) : null}
      </div>

      {listQ.isLoading ? (
        <Card>
          <MonoLabel>LOADING</MonoLabel>
        </Card>
      ) : listQ.isError ? (
        <Card>
          <MonoLabel style={{ marginBottom: 8 }}>Announcements · failed to load</MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
            {(listQ.error as Error).message}
          </p>
          <Button variant="secondary" onClick={() => void listQ.refetch()}>
            Retry
          </Button>
        </Card>
      ) : rows.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid rgba(127,191,142,0.3)",
            borderRadius: "var(--radius-card)",
            padding: "28px 26px",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--text-body)",
              margin: "0 0 12px",
              lineHeight: 1.55,
            }}
          >
            No announcements yet. {canContribute ? "Draft one to tell customers what shipped." : ""}
          </p>
          {canContribute ? (
            <Button variant="secondary" onClick={() => setOpen(true)}>
              New announcement
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          {(showAll ? rows : rows.slice(0, VISIBLE_ANNOUNCEMENTS)).map((a, i, shown) => {
            const border = i < shown.length - 1 ? "1px solid var(--hairline)" : "none";
            if (editId === a.id) {
              return (
                <div
                  key={a.id}
                  style={{
                    padding: "13px 18px",
                    borderBottom: border,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <input
                    value={editTitle}
                    maxLength={200}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={FIELD_CLASS}
                    style={FIELD_STYLE}
                  />
                  <textarea
                    value={editBody}
                    maxLength={20000}
                    rows={4}
                    onChange={(e) => setEditBody(e.target.value)}
                    className={FIELD_CLASS}
                    style={{ ...FIELD_STYLE, resize: "vertical", fontFamily: "inherit" }}
                  />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <RowAction tone="neutral" onClick={() => setEditId(null)}>
                      Cancel
                    </RowAction>
                    <RowAction
                      tone="moss"
                      disabled={!editTitle.trim() || updateMut.isPending}
                      onClick={() =>
                        updateMut.mutate({ id: a.id, title: editTitle, body: editBody })
                      }
                    >
                      {updateMut.isPending ? "Saving…" : "Save"}
                    </RowAction>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={a.id}
                className="flex items-center"
                style={{ gap: 12, padding: "13px 18px", borderBottom: border }}
              >
                <VerdictChip tone={STATUS_TONE[a.status]}>{a.status}</VerdictChip>
                <span
                  className="truncate"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {a.title}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-mono-floor)",
                    color: "var(--text-subtle)",
                  }}
                >
                  {relTime(a.published_at ?? a.submitted_at ?? a.created_at)}
                </span>
                {a.status !== "published" && canContribute ? (
                  <RowAction tone="neutral" disabled={busy} onClick={() => startEdit(a)}>
                    Edit
                  </RowAction>
                ) : null}
                {a.status === "draft" && canContribute ? (
                  <RowAction tone="neutral" disabled={busy} onClick={() => submitMut.mutate(a.id)}>
                    Submit for approval
                  </RowAction>
                ) : null}
                {a.status === "pending" && canPublish ? (
                  <RowAction tone="moss" disabled={busy} onClick={() => publishMut.mutate(a.id)}>
                    Publish
                  </RowAction>
                ) : null}
                {a.status === "published" ? (
                  <a
                    href={`/p/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${a.title} public page`}
                    className={`${FIELD_CLASS} inline-flex items-center`}
                    style={{
                      gap: 5,
                      fontSize: 11,
                      color: "var(--link)",
                      fontFamily: "var(--font-mono)",
                      textDecoration: "none",
                    }}
                  >
                    View <ExternalLink size={11} />
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {rows.length > VISIBLE_ANNOUNCEMENTS ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
            marginTop: 10,
          }}
        >
          {showAll ? "Show fewer" : `Show ${rows.length - VISIBLE_ANNOUNCEMENTS} more`}
        </button>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setNewTitle("");
            setNewBody("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontSize: 19, fontWeight: 460 }}>
              New announcement
            </DialogTitle>
            <DialogDescription style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>
              Draft what changed for your customers. It stays private until submitted and published.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginBottom: 4 }}>
                title
              </MonoLabel>
              <input
                value={newTitle}
                maxLength={200}
                autoFocus
                placeholder="What changed?"
                onChange={(e) => setNewTitle(e.target.value)}
                className={FIELD_CLASS}
                style={FIELD_STYLE}
              />
            </div>
            <div>
              <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginBottom: 4 }}>
                body
              </MonoLabel>
              <textarea
                value={newBody}
                maxLength={20000}
                rows={4}
                placeholder="What changed for your customers…"
                onChange={(e) => setNewBody(e.target.value)}
                className={FIELD_CLASS}
                style={{ ...FIELD_STYLE, resize: "vertical", minHeight: 84, fontFamily: "inherit" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={createMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!newTitle.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

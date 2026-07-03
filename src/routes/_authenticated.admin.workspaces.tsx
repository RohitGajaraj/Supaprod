/**
 * Admin Console v2 · Workspaces tab. Search, drawer with members + audit,
 * grant credits, change member role, transfer ownership, soft-delete + restore.
 *
 * Obsidian v3 chrome pass (2026-07-03): re-skinned from the parchment "bento"
 * look to the dark card/hairline system (see the parent `_authenticated.admin.tsx`
 * for the shared look). Visual only · every query, mutation, and data shape
 * below is unchanged; only colors, type, spacing, and a few plain-words label
 * renames (Engine-Room Test) changed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MonoLabel, Button } from "@/components/obsidian";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import {
  adminSearchWorkspaces,
  adminGetWorkspaceDetail,
  adminChangeMemberRole,
  adminRemoveWorkspaceMember,
  adminTransferWorkspaceOwnership,
  adminSoftDeleteWorkspace,
  adminRestoreWorkspace,
  type AdminWorkspaceRow,
} from "@/lib/admin-workspaces.functions";
import { adminResetDemoWorkspace } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/workspaces")({
  component: AdminWorkspaces,
});

type WSDetail = {
  workspace?: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    plan_tier: string;
    deleted_at: string | null;
    created_at: string;
  };
  members?: Array<{ user_id: string; email: string; role: string }>;
  audit?: Array<{ id: string; action: string; created_at: string }>;
};

function AdminWorkspaces() {
  const fSearch = useServerFn(adminSearchWorkspaces);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const search = useQuery({
    queryKey: ["admin-workspaces", q],
    queryFn: () => fSearch({ data: { q } }),
  });
  const rows: AdminWorkspaceRow[] = Array.isArray(search.data)
    ? (search.data as AdminWorkspaceRow[])
    : [];

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <MonoLabel>Find a workspace · check its plan · move ownership</MonoLabel>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "var(--space-4)",
          display: "grid",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, slug, or owner email"
            className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)] placeholder:[color:var(--text-faint)]"
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-base)",
              color: "var(--text-primary)",
            }}
          />
          {search.isLoading ? (
            <span
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}
            >
              reading workspaces…
            </span>
          ) : (
            <MonoLabel>{rows.length} workspaces</MonoLabel>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Name</th>
                <th style={th()}>Owner</th>
                <th style={th()}>Plan</th>
                <th style={th()}>Members</th>
                <th style={th()}>Deleted</th>
                <th style={th()}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr
                  key={w.id}
                  className="transition-colors hover:[background-color:var(--hover)]"
                  style={{
                    borderTop: "1px solid var(--hairline)",
                    transitionDuration: "var(--dur-control)",
                    transitionTimingFunction: "var(--ease)",
                  }}
                >
                  <td style={td()}>
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {w.name}
                    </span>
                  </td>
                  <td style={{ ...td(), color: "var(--text-body)" }}>{w.owner_email ?? "-"}</td>
                  <td style={td()}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-mono-label)",
                        letterSpacing: "0.11em",
                        color: "var(--text-muted)",
                      }}
                      className="uppercase"
                    >
                      {w.plan_tier}
                    </span>
                  </td>
                  <td style={td()}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-body)" }}>
                      {w.member_count}
                    </span>
                  </td>
                  <td style={td()}>
                    {w.deleted_at ? (
                      <MonoLabel tone="madder">yes</MonoLabel>
                    ) : (
                      <MonoLabel>no</MonoLabel>
                    )}
                  </td>
                  <td style={td()}>
                    <Button variant="quiet" onClick={() => setSelected(w.id)}>
                      Open →
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !search.isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "var(--space-4)",
                      textAlign: "center",
                      fontFamily: "var(--font-ui)",
                      fontSize: "var(--text-base)",
                      color: "var(--text-subtle)",
                    }}
                  >
                    No workspaces.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <WorkspaceDrawer workspaceId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function WorkspaceDrawer({
  workspaceId,
  onClose,
}: {
  workspaceId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fDetail = useServerFn(adminGetWorkspaceDetail);
  const fRole = useServerFn(adminChangeMemberRole);
  const fRemove = useServerFn(adminRemoveWorkspaceMember);
  const fTransfer = useServerFn(adminTransferWorkspaceOwnership);
  const fSoftDel = useServerFn(adminSoftDeleteWorkspace);
  const fRestore = useServerFn(adminRestoreWorkspace);

  const detail = useQuery({
    queryKey: ["admin-workspace-detail", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const r = await fDetail({ data: { workspaceId: workspaceId! } });
      if ("error" in r) throw new Error(r.error);
      return JSON.parse(r.json) as WSDetail;
    },
  });
  const d = detail.data;
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-workspace-detail", workspaceId] });
    qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
  };

  const setRole = useMutation({
    mutationFn: (vars: { userId: string; role: string }) =>
      fRole({ data: { workspaceId: workspaceId!, ...vars } }),
    onSuccess: () => invalidate(),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => fRemove({ data: { workspaceId: workspaceId!, userId } }),
    onSuccess: () => invalidate(),
  });
  const transfer = useMutation({
    mutationFn: (newOwnerId: string) =>
      fTransfer({ data: { workspaceId: workspaceId!, newOwnerId } }),
    onSuccess: (r) => {
      if ("error" in r) toast.error(r.error);
      else {
        toast.success("Ownership transferred.");
        invalidate();
      }
    },
  });
  const softDel = useMutation({
    mutationFn: () => fSoftDel({ data: { workspaceId: workspaceId! } }),
    onSuccess: () => {
      toast.success("Workspace deleted. Restore any time within 30 days.");
      invalidate();
    },
  });
  const restore = useMutation({
    mutationFn: () => fRestore({ data: { workspaceId: workspaceId! } }),
    onSuccess: () => {
      toast.success("Workspace restored.");
      invalidate();
    },
  });

  const fDemoReset = useServerFn(adminResetDemoWorkspace);
  const demoReset = useMutation({
    mutationFn: () => fDemoReset({ data: { workspaceId: workspaceId! } }),
    onSuccess: (r) => {
      if ("error" in r) {
        toast.error(r.error);
      } else {
        const del = r.deleted as Record<string, number>;
        const total = Object.values(del).reduce((a, b) => a + b, 0);
        toast.success(
          `Demo reset complete. ${total} rows cleared. Reseed using the Supabase SQL editor.`,
        );
        invalidate();
      }
    },
  });

  return (
    <Sheet open={!!workspaceId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        style={{
          width: "min(560px, 100vw)",
          overflow: "auto",
          background: "var(--card)",
          borderLeft: "1px solid var(--hairline)",
          boxShadow: "none",
          color: "var(--text-primary)",
          padding: "var(--space-6)",
        }}
      >
        <SheetHeader
          style={{
            paddingBottom: "var(--space-4)",
            borderBottom: "1px solid var(--hairline)",
            marginBottom: 0,
          }}
        >
          <SheetTitle
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 460,
              fontSize: "var(--text-card-title)",
              lineHeight: 1.3,
              color: "var(--text-primary)",
            }}
          >
            {d?.workspace?.name ?? "Workspace"}
          </SheetTitle>
        </SheetHeader>
        {!d ? (
          <p
            style={{
              marginTop: "var(--space-4)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-faint)",
            }}
          >
            reading workspace…
          </p>
        ) : (
          <div style={{ marginTop: "var(--space-4)", display: "grid", gap: "var(--space-6)" }}>
            <section>
              <div style={{ marginBottom: "var(--space-2)" }}>
                <MonoLabel>Details</MonoLabel>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <FieldRow label="Slug" value={d.workspace?.slug} />
                <FieldRow label="Plan" value={d.workspace?.plan_tier} />
                <FieldRow label="Created" value={d.workspace?.created_at?.slice(0, 10)} />
                <FieldRow
                  label="Deleted"
                  value={
                    d.workspace?.deleted_at ? (
                      <MonoLabel tone="madder">{d.workspace.deleted_at.slice(0, 10)}</MonoLabel>
                    ) : (
                      <MonoLabel>no</MonoLabel>
                    )
                  }
                />
              </div>
            </section>
            <section>
              <div style={{ marginBottom: "var(--space-2)" }}>
                <MonoLabel>Members</MonoLabel>
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: "var(--space-2)",
                }}
              >
                {(d.members ?? []).map((m) => (
                  <li
                    key={m.user_id}
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      alignItems: "center",
                      fontFamily: "var(--font-ui)",
                      fontSize: "var(--text-sm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {m.email ?? m.user_id.slice(0, 8)} ·
                    <select
                      value={m.role}
                      onChange={(e) => setRole.mutate({ userId: m.user_id, role: e.target.value })}
                      className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      style={{
                        padding: "5px 8px",
                        background: "var(--raised)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--radius-control)",
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                      <option value="viewer">viewer</option>
                    </select>
                    <Button
                      variant="secondary"
                      style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 12 }}
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Remove member?",
                          body: `${m.email} loses access immediately.`,
                          confirmLabel: "Remove",
                          destructive: true,
                        });
                        if (ok) remove.mutate(m.user_id);
                      }}
                    >
                      Remove
                    </Button>
                    {d.workspace?.owner_id !== m.user_id ? (
                      <Button
                        variant="secondary"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Transfer ownership?",
                            body: `${m.email} becomes the new owner.`,
                            confirmLabel: "Transfer",
                          });
                          if (ok) transfer.mutate(m.user_id);
                        }}
                      >
                        Make owner
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <div style={{ marginBottom: "var(--space-2)" }}>
                <MonoLabel>Delete &amp; restore</MonoLabel>
              </div>
              {d.workspace?.deleted_at ? (
                <Button variant="secondary" onClick={() => restore.mutate()}>
                  Restore · re-enables workspace
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Delete this workspace?",
                      body: "Hidden from users immediately. 30-day restore window.",
                      confirmLabel: "Delete · 30-day restore window",
                      destructive: true,
                    });
                    if (ok) softDel.mutate();
                  }}
                >
                  Delete workspace · 30-day restore
                </Button>
              )}
            </section>
            {/* WM-S5: Demo reset · only shown for @redcadence.app demo accounts */}
            {(d.members ?? []).some((m) => m.email?.endsWith("@redcadence.app")) && (
              <section>
                <div style={{ marginBottom: "var(--space-2)" }}>
                  <MonoLabel>Demo reset</MonoLabel>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-muted)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Deletes all user content (signals, decisions, opportunities, and more) from this
                  demo workspace. Restore the seed data by re-running the TEST-SEED and
                  DEMO-SEED-RICH migrations in the Supabase SQL editor.
                </p>
                <Button
                  variant="secondary"
                  loading={demoReset.isPending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Reset demo workspace?",
                      body: "All content will be deleted. The workspace and its members stay. Reseed manually afterward.",
                      confirmLabel: "Reset demo data",
                      destructive: true,
                    });
                    if (ok) demoReset.mutate();
                  }}
                >
                  Reset demo data
                </Button>
              </section>
            )}

            <section>
              <div style={{ marginBottom: "var(--space-2)" }}>
                <MonoLabel>Recent activity</MonoLabel>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {(d.audit ?? []).slice(0, 10).map((row) => (
                  <li
                    key={row.id}
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "var(--text-sm)",
                      color: "var(--text-body)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--glacier)" }}>
                      {row.action}
                    </span>{" "}
                    · {row.created_at.slice(0, 16).replace("T", " ")}
                  </li>
                ))}
                {(d.audit ?? []).length === 0 ? (
                  <li
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "var(--text-sm)",
                      color: "var(--text-subtle)",
                    }}
                  >
                    No activity yet.
                  </li>
                ) : null}
              </ul>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline" }}>
      <MonoLabel style={{ minWidth: 64 }}>{label}</MonoLabel>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
          color: "var(--text-body)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function th(): React.CSSProperties {
  return {
    padding: "var(--space-2) var(--space-3)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-mono-label)",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    textAlign: "left",
    color: "var(--text-subtle)",
    borderBottom: "1px solid var(--hairline-strong)",
  };
}
function td(): React.CSSProperties {
  return {
    padding: "var(--space-3)",
    verticalAlign: "middle",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-base)",
  };
}

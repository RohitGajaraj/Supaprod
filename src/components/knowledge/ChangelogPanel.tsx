// ChangelogPanel - Brain tab (OBS-10, folds the retired /changelog page).
// Entries are materialized from merged studio changesets (the
// studio_changeset_to_changelog trigger + the durable publishChangelogEntry
// path), so a merge surfaces here automatically. Same server fn and grouping
// logic as the legacy page; re-skinned in Obsidian tokens to match the rest
// of Brain instead of the parchment bento rows the legacy page used.
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, GitPullRequest } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { listChangelog } from "@/lib/changelog.functions";
import { groupByProduct } from "@/lib/changelog";
import { MonoLabel } from "@/components/obsidian/primitives";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

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

export function ChangelogPanel() {
  const { activeWorkspace } = useWorkspace();
  const fChangelog = useServerFn(listChangelog);
  const query = useQuery({
    queryKey: ["changelog", activeWorkspace?.id],
    queryFn: () => fChangelog({ data: { workspaceId: activeWorkspace?.id } }),
  });

  if (query.isLoading) {
    return (
      <Card>
        <MonoLabel>LOADING</MonoLabel>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <MonoLabel style={{ marginBottom: 8 }}>Changelog · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          {(query.error as Error)?.message ?? "Unknown error"}
        </p>
      </Card>
    );
  }

  const entries = query.data?.entries ?? [];
  const groups = groupByProduct(entries);

  if (entries.length === 0) {
    return (
      <div
        style={{
          background: "var(--card)",
          border: "1px solid rgba(127,191,142,0.3)",
          borderRadius: "var(--radius-card)",
          padding: "28px 26px",
        }}
      >
        <p
          style={{ fontSize: 13, color: "var(--text-body)", margin: "0 0 12px", lineHeight: 1.55 }}
        >
          Nothing shipped yet. When a Build session merges a change, its release notes appear here
          automatically.
        </p>
        <Link
          to="/build"
          style={{
            fontSize: 12.5,
            color: "var(--text-subtle)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
          }}
          className="hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        >
          Go to Build →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {groups.map((group) => (
          <section key={group.label}>
            <MonoLabel style={{ marginBottom: 10, display: "block" }}>{group.label}</MonoLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {group.entries.map((e) => (
                <article
                  key={e.id}
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "var(--radius-card)",
                    padding: "16px 18px",
                  }}
                >
                  <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 460,
                        fontSize: 15,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      {e.title}
                    </h3>
                    <time
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text-faint)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(e.released_at)}
                    </time>
                  </div>
                  {e.body ? (
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-subtle)",
                        marginTop: 8,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.55,
                      }}
                    >
                      {e.body}
                    </p>
                  ) : null}
                  {e.pr_url ? (
                    <a
                      href={e.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      style={{
                        gap: 6,
                        marginTop: 12,
                        fontSize: 12,
                        color: "var(--glacier)",
                        fontFamily: "var(--font-mono)",
                        textDecoration: "none",
                      }}
                    >
                      <GitPullRequest size={13} />
                      {e.pr_number ? `PR #${e.pr_number}` : "View PR"}
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link
          to="/brain"
          search={{ tab: "impact" }}
          style={{
            fontSize: 12.5,
            color: "var(--text-subtle)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
          }}
          className="hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        >
          View outcomes →
        </Link>
      </div>
    </div>
  );
}

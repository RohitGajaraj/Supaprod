/**
 * WHAT THIS RUN GOT YOU, drawn. `run-proof.ts` decides the rows; this draws them.
 *
 * Five labelled rows at most, each one pressable where it names an artifact,
 * so the panel is the run's own table of contents as well as its proof: press
 * "Checked" and the verdict opens on the right; press the release and the
 * release does. The chip and link faces are `got-you.tsx`'s, kept identical
 * so the two read as one vocabulary; that primitive stays for the Start rows.
 */
import * as React from "react";
import { StatusChip } from "@/components/meridian/StatusChip";
import type { ProofRow } from "@/components/track/run-proof";

const LABEL: Record<ProofRow["kind"], string> = {
  made: "Made",
  checked: "Checked",
  shipped: "Shipped",
  hook: "On the hook",
  verdict: "Verdict",
};

function RowShell({ kind, children }: { kind: ProofRow["kind"]; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(6.5rem,auto)_minmax(0,1fr)] items-start gap-x-mrd-4 gap-y-1">
      <span className="pt-[3px] text-mrd-data font-medium uppercase tracking-[0.06em] text-mrd-mute">
        {LABEL[kind]}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-mrd-2 gap-y-1">{children}</div>
    </div>
  );
}

function Press({
  id,
  on,
  onOpen,
  children,
  className = "",
}: {
  id: string;
  on: boolean;
  onOpen?: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!onOpen) return <span className={className}>{children}</span>;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onOpen(id)}
      className={`mrd-focus-inset -mx-1 flex min-w-0 max-w-full flex-wrap items-center gap-x-mrd-2 gap-y-1 rounded-mrd-chip px-1 py-0.5 text-left transition-colors duration-[var(--mrd-d-press)] hover:bg-mrd-hover ${on ? "bg-mrd-lift" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function RunProof({
  rows,
  active = null,
  onOpen,
}: {
  rows: readonly ProofRow[];
  active?: string | null;
  onOpen?: (artifactId: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <section
      data-mrd=""
      aria-label="What this run got you"
      className="flex flex-col gap-mrd-3 border-b border-mrd-line pb-mrd-4 font-mrd"
    >
      <span className="mrd-eyebrow">What this run got you</span>
      {rows.map((row) => {
        if (row.kind === "made") {
          return (
            <RowShell key="made" kind="made">
              {row.chips.map((c) => {
                const on = active === c.id;
                const body = (
                  <>
                    {c.mark ? <span className="text-mrd-data text-mrd-faint">{c.mark}</span> : null}
                    <span>{c.label}</span>
                  </>
                );
                return onOpen ? (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onOpen(c.id)}
                    className={`mrd-focus-inset inline-flex items-center gap-1.5 rounded-mrd-chip px-2 py-1 text-mrd-small transition-colors duration-[var(--mrd-d-press)] ${
                      on
                        ? "bg-mrd-lift text-mrd-ink"
                        : "bg-mrd-sink text-mrd-body hover:bg-mrd-hover"
                    }`}
                  >
                    {body}
                  </button>
                ) : (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-mrd-chip bg-mrd-sink px-2 py-1 text-mrd-small text-mrd-body"
                  >
                    {body}
                  </span>
                );
              })}
              {row.pr ? (
                <a
                  href={row.pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mrd-focus-inset inline-flex items-center rounded-mrd-chip px-2 py-1 text-mrd-small font-medium text-mrd-you underline underline-offset-2"
                >
                  PR #{row.pr.number}
                </a>
              ) : null}
            </RowShell>
          );
        }
        if (row.kind === "checked") {
          return (
            <RowShell key="checked" kind="checked">
              <Press id={row.artifactId} on={active === row.artifactId} onOpen={onOpen}>
                <StatusChip status={row.status}>{row.word}</StatusChip>
                <span className="min-w-0 text-mrd-small text-mrd-body">{row.line}</span>
              </Press>
            </RowShell>
          );
        }
        if (row.kind === "shipped") {
          return (
            <RowShell key="shipped" kind="shipped">
              <Press id={row.artifactId} on={active === row.artifactId} onOpen={onOpen}>
                <StatusChip status={row.status}>{row.word}</StatusChip>
                {row.line ? (
                  <span className="min-w-0 text-mrd-small text-mrd-body">{row.line}</span>
                ) : null}
              </Press>
              {row.url ? (
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mrd-focus-inset min-w-0 max-w-[40ch] truncate rounded-mrd-chip px-1 font-mrd-mono text-mrd-data text-mrd-mute underline underline-offset-2 hover:text-mrd-ink"
                >
                  {row.url.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
            </RowShell>
          );
        }
        if (row.kind === "hook") {
          return (
            <RowShell key="hook" kind="hook">
              <Press
                id={row.artifactId}
                on={active === row.artifactId}
                onOpen={onOpen}
                className="flex-col !items-start"
              >
                <span className="min-w-0 text-mrd-small leading-mrd-prose text-mrd-body">
                  {row.claim}
                </span>
                {row.how || row.due ? (
                  <span className="min-w-0 text-mrd-small text-mrd-mute">
                    {[row.how ? `Known by: ${row.how}` : null, row.due ? `Graded ${row.due}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
              </Press>
            </RowShell>
          );
        }
        return (
          <RowShell key="verdict" kind="verdict">
            <Press id={row.artifactId} on={active === row.artifactId} onOpen={onOpen}>
              <StatusChip status={row.status}>{row.word}</StatusChip>
              {row.line ? (
                <span className="min-w-0 text-mrd-small text-mrd-body">{row.line}</span>
              ) : null}
            </Press>
          </RowShell>
        );
      })}
    </section>
  );
}

export default RunProof;

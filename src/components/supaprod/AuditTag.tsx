// Audit-ID system — the clickable trace tag (founder ruling 2026-07-13:
// "everything should have a traceable audit id generated out of this
// platform"). Drop-in replacement for the plain `PREFIX·XXXXXX` mono chips:
// same look, but clicking it opens the lineage sheet for that entity. Use it
// wherever an entity id is shown so every id is a live, verifiable entry point.
//
// Rendered as a <span role="button"> (not a <button>) so it can live safely
// inside a clickable row <button> without invalid DOM nesting / hydration
// warnings. Pass `copyable` to also show a secondary copy icon that copies the
// full id to the clipboard (used in entity detail views, replacing the old
// standalone copy button so the chip both traces and copies).
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatAuditId, type AuditKind } from "@/lib/audit-id";
import { openLineage } from "@/components/supaprod/AuditLineageSheet";

export function AuditTag({
  kind,
  id,
  title,
  copyable = false,
}: {
  kind: AuditKind;
  /** The full entity id (uuid); the short trace is derived for display. */
  id: string;
  title?: string;
  /** Show a trailing copy icon that copies the full id (detail views). */
  copyable?: boolean;
}) {
  const tag = formatAuditId(kind, id);
  const [copied, setCopied] = useState(false);

  const trace = () => openLineage(tag);
  const copy = () => {
    void navigator.clipboard?.writeText(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  /* "AUDIT TRAIL" STAYS IN THIS STRING, DELIBERATELY. It was changed away to
   * "history" on 2026-08-10 and put back the same day, so the reasoning is
   * recorded here rather than rediscovered.
   *
   * A frequency count over 5.9M words of Lenny's archive puts "audit trail" at
   * 0.2 per million and calls it dead vocabulary. That measurement is right
   * about the PUBLIC register -- podcasts and newsletters, where operators are
   * performing for an audience -- and it is why the phrase is gone from the
   * landing page and the footer.
   *
   * It is wrong about the register in here. In the members-only community,
   * practitioners describing systems they actually built reach for these words
   * unprompted: "the audit trail as to why should be clear". The split is not
   * taste, it is audience. Someone in the shop window has not felt the problem
   * yet and hears "audit trail" as vendor noise. Someone standing on a trace
   * surface came looking for exactly that thing and calls it that.
   *
   * Renaming it "history" made this tooltip VAGUER for the only person who ever
   * reads it. Specificity is a liability in marketing and a virtue in an
   * instrument.
   *
   * The rule, for whoever sweeps next: "receipt" and "unattended" are dead in
   * both registers and die everywhere. "Audit trail" and "brain" live inside the
   * product and stay out of the shop window. */
  const defaultTitle = `Trace ${tag}: its full audit trail`;

  return (
    <span className="inline-flex items-center" style={{ gap: 6 }}>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          trace();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            trace();
          }
        }}
        title={title ?? defaultTitle}
        aria-label={`Trace audit id ${tag}`}
        className="loom-press outline-none transition-colors hover:[color:var(--text-primary)] hover:[border-color:var(--hairline-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          color: "var(--text-faint)",
          background: "transparent",
          border: "1px solid transparent",
          borderRadius: 5,
          padding: "1px 4px",
          margin: "-1px -4px",
          cursor: "pointer",
        }}
      >
        {tag}
      </span>
      {copyable ? (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            copy();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              copy();
            }
          }}
          aria-label="Copy the full trace id"
          title="Copy the full trace id"
          className="loom-press inline-flex items-center outline-none transition-colors [color:var(--text-faint)] hover:[color:var(--text-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{ cursor: "pointer" }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </span>
      ) : null}
    </span>
  );
}

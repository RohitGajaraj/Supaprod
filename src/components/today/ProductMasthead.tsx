// PC-32 block 2 (PC-33 minimal) — the product masthead: one quiet line that
// grounds Today in the product's story ("{Product} · {one-liner} · this
// quarter: {top bet}"). Never a banner. Clicking opens the Brief where it is
// editable today (Settings → Workspace); Lane B repoints this to the Brain
// Brief lens when PC-34 lands.
import * as React from "react";
import type { ProductContext } from "@/lib/briefs.functions";

export function ProductMasthead({
  ctx,
  onOpen,
}: {
  ctx: ProductContext | null | undefined;
  onOpen: () => void;
}) {
  if (!ctx) return null;
  const pieces: string[] = [];
  if (ctx.oneLiner) pieces.push(ctx.oneLiner);
  if (ctx.topBet) pieces.push(`this quarter: ${ctx.topBet}`);
  const hasStory = pieces.length > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      title={hasStory ? "Open the product brief" : "Write the product brief"}
      className="loom-press group flex w-full items-baseline text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
        gap: 8,
        background: "transparent",
        border: "none",
        padding: 0,
        margin: "0 0 16px",
        cursor: "pointer",
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 12.5,
          fontWeight: 550,
          color: "var(--text-body)",
          flexShrink: 0,
        }}
      >
        {ctx.productName}
      </span>
      <span
        className="min-w-0 truncate transition-colors group-hover:[color:var(--text-body)]"
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 12.5,
          color: "var(--text-muted)",
          transitionDuration: "140ms",
        }}
      >
        {hasStory
          ? `· ${pieces.join(" · ")}`
          : "· add the product story so every agent works from it"}
      </span>
      <span
        aria-hidden="true"
        className="transition-colors group-hover:[color:var(--text-body)]"
        style={{ color: "var(--text-faint)", fontSize: 12, flexShrink: 0 }}
      >
        →
      </span>
    </button>
  );
}

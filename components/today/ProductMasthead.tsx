// PC-32 block 2 (PC-33 minimal) — the product masthead: one quiet line that
// grounds Today in the product's story ("{Product} · {one-liner} · this
// quarter: {top bet}"). Never a banner. Clicking opens the Brief where it is
// editable today (Settings → Workspace); Lane B repoints this to the Brain
// Brief lens when PC-34 lands.
import * as React from "react";
import { Button } from "@/components/obsidian";
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
    <Button
      variant="ghost"
      onClick={onOpen}
      title={hasStory ? "Open the product brief" : "Write the product brief"}
      className="group w-full justify-start px-0 py-0"
      style={{
        gap: 8,
        margin: "0 0 16px",
        minWidth: 0,
        height: "auto",
      }}
    >
      <span
        style={{
          fontSize: "var(--text-label-13)",
          fontWeight: 550,
          color: "var(--text-body)",
          flexShrink: 0,
        }}
      >
        {ctx.productName}
      </span>
      {/* Base color rides the class so group-hover can win (inline beats classes). */}
      <span
        className="min-w-0 truncate transition-colors [color:var(--text-muted)] group-hover:[color:var(--text-body)]"
        style={{
          fontSize: "var(--text-label-13)",
          transitionDuration: "140ms",
        }}
      >
        {hasStory
          ? `· ${pieces.join(" · ")}`
          : "· add the product story so every agent works from it"}
      </span>
      <span
        aria-hidden="true"
        className="text-label-12 transition-colors [color:var(--text-faint)] group-hover:[color:var(--text-body)]"
        style={{ flexShrink: 0 }}
      >
        →
      </span>
    </Button>
  );
}

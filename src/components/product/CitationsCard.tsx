import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, MessageSquare, Mic, Sparkles } from "lucide-react";
import { artifactWord } from "@/lib/artifact-words";

export type Citation = {
  n: number;
  source_kind: string;
  source_id: string | null;
  title?: string | null;
  snippet?: string;
  score?: number;
};

type Props = { citations: Citation[] | null | undefined };

function iconFor(kind: string) {
  if (kind === "signal") return Sparkles;
  if (kind === "doc") return FileText;
  if (kind === "meeting") return Mic;
  if (kind === "note") return MessageSquare;
  return BookOpen;
}

/**
 * What a source is called when it carries no title of its own.
 *
 * The fallback used to be the stored kind plus eight characters of a uuid, and
 * neither half is readable: "note · 3f2a1b9c" tells a person our column names
 * and nothing about the evidence. The bracketed [n] already tells two untitled
 * sources apart, so the kind alone carries the whole fact.
 */
function untitled(kind: string): string {
  return `Untitled ${artifactWord(kind)}`;
}

/** Deep-link to the source row. Fall back to no-link when we don't have a route for that kind. */
function linkFor(
  c: Citation,
): { to: string; params?: Record<string, string>; search?: Record<string, string> } | null {
  if (!c.source_id) return null;
  switch (c.source_kind) {
    case "signal":
      return { to: "/arriving" };
    case "doc":
      return { to: "/outcomes", search: { tab: "docs" } };
    case "meeting":
      return { to: "/outcomes", search: { tab: "calendar", meeting: c.source_id } };
    default:
      return null;
  }
}

export function CitationsCard({ citations }: Props) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="rounded-lg border hairline bg-card/60 p-4">
      <div className="text-mrd-nano uppercase tracking-[0.16em] text-muted-foreground mb-3 flex items-center gap-2">
        <BookOpen className="h-3 w-3" /> Cited evidence · {citations.length}
      </div>
      <ol className="space-y-2.5">
        {citations.map((c) => {
          const Icon = iconFor(c.source_kind);
          const link = linkFor(c);
          const inner = (
            <>
              <span className="font-mono text-mrd-nano text-muted-foreground tabular-nums shrink-0 mt-0.5">
                [{c.n}]
              </span>
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-xs font-medium truncate">
                  {c.title ?? untitled(c.source_kind)}
                </span>
                {c.snippet && (
                  <span className="block text-mrd-tiny text-muted-foreground line-clamp-2">
                    {c.snippet}
                  </span>
                )}
              </span>
            </>
          );
          return (
            <li key={c.n}>
              {link ? (
                <Link
                  to={link.to}
                  search={link.search as never}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-start gap-2 px-2 py-1.5">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { getProductContext } from "@/lib/product-context.functions";

/**
 * PC-33: one shared masthead, one quiet line, never a banner. Resolves the
 * active workspace's product context on its own (name, one-liner, and this
 * quarter's top bet) and reads as a single sentence above a surface's hero,
 * one step down from the h1. The whole line is a genuine Link into the
 * Brain brief (Loom Link voice: glacier text, underline only on hover, no
 * button chrome, no card, no accent). Renders nothing while loading or with
 * no active workspace: a quiet enhancement, never a loading flash.
 */
export function ProductMasthead() {
  const { activeWorkspaceId } = useWorkspace();
  const context = useQuery({
    queryKey: ["product-context", activeWorkspaceId],
    queryFn: () => getProductContext({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });

  if (!activeWorkspaceId || context.isLoading || !context.data) return null;

  const { name, oneLiner, topBet } = context.data;
  const line = [name, oneLiner || null, topBet ? `this quarter: ${topBet}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to="/brain"
      search={{ tab: "brief" }}
      className="loom-press inline-block hover:underline"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "13px",
        lineHeight: 1.5,
        color: "var(--glacier)",
        textDecoration: "none",
        margin: "0 0 12px",
      }}
    >
      {line}
    </Link>
  );
}

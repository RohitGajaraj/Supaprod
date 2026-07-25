// PC-29 layer 6: the delegation verb, on a primary card. ONE contextual ask
// per kind (never a generic "..." catch-all), rendered as a small dropdown so
// the same component can grow more verbs per kind later without a reshape.
// Dispatches through the SAME mission machinery every other "start work from
// here" affordance already uses (startOrchestratedMission - see
// GraphNodeActions's "start mission from this node") - a UI affordance and an
// intent mapping only, no new engine/backend logic.
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot } from "lucide-react";
import { toast } from "@/lib/notify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";

export type AskInContextKind = "signal" | "theme" | "opportunity" | "spec" | "shipped";

/** The exact verb mapping per kind (spec-fixed, one per kind - never a
 * generic "Ask" fallback, so the affordance always names the real next
 * move). */
const VERB_BY_KIND: Record<AskInContextKind, string> = {
  signal: "Investigate",
  theme: "Frame the bet",
  opportunity: "Red-team this",
  spec: "Build this",
  shipped: "Explain what happened",
};

/** The mission goal handed to the loop, one plain instruction per kind, the
 * target quoted so the agent knows exactly what "this" refers to. */
function goalFor(kind: AskInContextKind, title: string): string {
  switch (kind) {
    case "signal":
      return `Investigate this signal: "${title}"`;
    case "theme":
      return `Frame the bet on this theme: "${title}"`;
    case "opportunity":
      return `Red-team this opportunity before it is committed to: "${title}"`;
    case "spec":
      return `Build this spec: "${title}"`;
    case "shipped":
      return `Explain what happened with this shipped change: "${title}"`;
  }
}

export interface AskInContextProps {
  stationOrKind: AskInContextKind;
  targetId: string;
  targetTitle?: string;
}

/**
 * A quiet icon trigger next to a card's other actions. Opens a one-item menu
 * naming the real next move for that kind of card; clicking it starts a
 * mission with the card as context, then hands off to Build the same way
 * every other mission-start action does (toast, navigate to the mission).
 */
export function AskInContext({ stationOrKind, targetId, targetTitle }: AskInContextProps) {
  const navigate = useNavigate();
  const fStart = useServerFn(startOrchestratedMission);
  const verb = VERB_BY_KIND[stationOrKind];
  const title = targetTitle?.trim() || `this ${stationOrKind}`;
  const ref = targetId.slice(0, 8).toUpperCase();

  const dispatch = useMutation({
    mutationFn: () =>
      fStart({
        data: {
          goal: `${goalFor(stationOrKind, title)} (ref ${ref})`,
          title: targetTitle?.slice(0, 200),
        },
      }),
    onSuccess: (res) => {
      toast.success(`${verb} - mission started.`);
      navigate({ to: "/build", search: { mission: res.mission_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Ask Supaprod to ${verb.toLowerCase()}`}
          title={`Ask Supaprod to ${verb.toLowerCase()}`}
          disabled={dispatch.isPending}
          onClick={(event) => event.stopPropagation()}
          className="loom-press"
          style={{
            display: "inline-flex",
            alignItems: "center",
            flexShrink: 0,
            color: "var(--text-subtle)",
            background: "none",
            border: "none",
            cursor: dispatch.isPending ? "default" : "pointer",
            opacity: dispatch.isPending ? 0.5 : 1,
            padding: "2px 6px",
          }}
        >
          <Bot className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={dispatch.isPending}
          onClick={(event) => {
            event.stopPropagation();
            dispatch.mutate();
          }}
        >
          {verb}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

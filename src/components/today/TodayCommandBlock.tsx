import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CommandBar } from "@/components/ink";
import { createProject } from "@/lib/projects.functions";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";

/**
 * The two pieces rescued from the archived rebuild (founder ruling, 2026-07-18),
 * living inside Today per the old IA's contract law (doors inside destinations,
 * never new rail items):
 * 1. A sentence box that actually does something: typing an idea creates a
 *    real project and confirms it.
 * 2. The one door to the federated Approvals queue, with its live count.
 * Self-contained on purpose: one import + one JSX line inside Today, so the
 * screen the founder likes stays untouched around it.
 */

/** First few meaningful words of the sentence, title-cased, as the name. */
function nameFromIntent(intent: string): string {
  const stop = new Set([
    "a", "an", "the", "for", "to", "of", "and", "my", "our", "with", "that",
    "build", "make", "create", "design", "plan", "write", "add", "ship",
  ]);
  const words = intent
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()));
  const picked = (words.length ? words : intent.split(/\s+/)).slice(0, 3);
  const name = picked
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 60);
  return name || "New project";
}

export function TodayCommandBlock() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doCreateProject = useServerFn(createProject);
  const fetchQueue = useServerFn(getApprovalsQueue);

  const queue = useQuery({
    queryKey: ["approvals", "queue"],
    queryFn: () => fetchQueue(),
    refetchInterval: 30_000,
  });
  const count = queue.data?.items?.length ?? 0;

  const create = useMutation({
    mutationFn: (intent: string) =>
      doCreateProject({ data: { name: nameFromIntent(intent), status: "active" as const } }),
    onSuccess: async (created: { project?: { id: string; name?: string | null } }) => {
      const name = created.project?.name ?? "Your project";
      toast.success(`${name} created. The plan starts from your sentence.`);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not start the project. Try again."),
  });

  return (
    <section aria-label="Start something" className="mb-5 space-y-2">
      <CommandBar
        variant="rail"
        placeholder="What are we building? A sentence starts a project."
        onSubmit={(intent) => create.mutateAsync(intent).then(() => undefined)}
      />
      <button
        type="button"
        onClick={() => void navigate({ to: "/approvals" })}
        className="ink-focus ink-mono rounded-sm px-1 text-[11px] text-[var(--ink-subtle)] transition-colors hover:text-[var(--ink-text)]"
      >
        {count > 0
          ? `${count} thing${count === 1 ? "" : "s"} waiting on you. Open the approvals queue`
          : "Nothing waiting on you. Open the approvals queue"}
      </button>
    </section>
  );
}

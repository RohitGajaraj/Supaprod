import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CommandBar } from "@/components/ink";
import { createProject } from "@/lib/projects.functions";

/**
 * The sentence box rescued from the archived rebuild (founder keep-list,
 * 2026-07-18): typing an idea creates a real project. It sits BELOW the
 * greeting hero (founder ruling: the greeting card is the fixed top of
 * Today). Approvals are NOT rendered here; the "Waiting on you" pill in the
 * top bar is the one approvals affordance and opens the queue.
 */

/** First few meaningful words of the sentence, title-cased, as the name. */
function nameFromIntent(intent: string): string {
  const stop = new Set([
    "a",
    "an",
    "the",
    "for",
    "to",
    "of",
    "and",
    "my",
    "our",
    "with",
    "that",
    "build",
    "make",
    "create",
    "design",
    "plan",
    "write",
    "add",
    "ship",
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
  const queryClient = useQueryClient();
  const doCreateProject = useServerFn(createProject);

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
    <section aria-label="Start something" className="mb-5 mt-4">
      <CommandBar
        variant="rail"
        placeholder="What are we building? A sentence starts a project."
        onSubmit={(intent) => create.mutateAsync(intent).then(() => undefined)}
      />
    </section>
  );
}

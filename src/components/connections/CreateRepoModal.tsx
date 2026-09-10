/**
 * BYO-P1c. Managed repo creation modal.
 *
 * Creates a GitHub repo in the user's own account (or an explicit org) using
 * their existing GitHub connection. Repo lands in the user's personal namespace
 * by default, never in a Supaprod-owned org (BYO means it's theirs).
 *
 * On success, the repo is auto-bound as a product-level binding for the current
 * product, and an onSuccess callback fires so the parent can refresh bindings.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Github, Lock, Unlock } from "lucide-react";
import { Dialog } from "@/components/meridian/Dialog";
import { Action, Actions } from "@/components/meridian/surface-parts";
/*
 * ── AND THE INPUT IS MERIDIAN'S TOO. THE NOTE THAT STOOD HERE WAS WRONG ─────
 *
 * It said "Meridian has a Dialog, an Action and a Picker, and NO text input",
 * and kept `ui/input` on that basis. Meridian has had `Input` since before this
 * file was touched: it is in `forms.tsx`, with `Textarea` and the labelled
 * `Field` beside it, and 37 files already import it by name.
 *
 * WHAT THE MISTAKE WAS, because the shape of it outlives this file: I listed
 * `components/meridian/` looking for something called an input, found no
 * `Input.tsx`, and concluded there was none. `COMPONENTS.md` in that directory
 * exists precisely to answer this, and its own header says the quiet part --
 * `ls` will not show you `Block` or `Pre` either, and those exist too. A
 * directory listing answers "what files are here", never "what parts exist",
 * and a component living in a file named for its FAMILY is invisible to the
 * first question and obvious to the second.
 *
 * A false gap is worse than a missing port. The port is one import; the note
 * would have told the next reader that building a text input was open work.
 */
import { Field, Input } from "@/components/meridian/forms";
import { toast } from "@/lib/notify";
import { createRepoForProduct } from "@/lib/connectors/product-binding.functions";
import { humanWriteError } from "@/lib/roles.functions";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  workspaceId?: string;
  productName?: string;
  onSuccess?: (owner: string, repo: string) => void;
};

export function CreateRepoModal({
  open,
  onOpenChange,
  productId,
  workspaceId,
  productName,
  onSuccess,
}: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState(() => slugify(productName ?? "my-product"));
  const [org, setOrg] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const fCreate = useServerFn(createRepoForProduct);

  const mutation = useMutation({
    mutationFn: () =>
      fCreate({
        data: {
          name,
          isPrivate,
          org: org.trim() || undefined,
          description: description.trim() || undefined,
          productId,
          workspaceId,
        },
      }),
    onSuccess: (res) => {
      toast.success(`Repo ${res.repo.owner}/${res.repo.repo} created`);
      qc.invalidateQueries({ queryKey: ["product-bindings"] });
      onOpenChange(false);
      onSuccess?.(res.repo.owner, res.repo.repo);
    },
    onError: (e: unknown) => toast.error(humanWriteError(e, "Repo creation failed")),
  });

  return (
    <Dialog
      open={open}
      /* Meridian's Dialog reports a DISMISSAL; the caller owns what that means.
         Every call site here drives `onOpenChange` with a setter. */
      onClose={() => onOpenChange(false)}
      title={
        <span className="flex items-center gap-mrd-3">
          <Github className="h-4 w-4" />
          Create a GitHub repo
        </span>
      }
      actions={
        <Actions>
          <Action variant="quiet" onClick={() => onOpenChange(false)}>
            Cancel
          </Action>
          <Action
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={!name || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create repo"}
          </Action>
        </Actions>
      }
    >
      <p className="text-mrd-base text-mrd-mute">
        Creates a new repo in your GitHub account and binds it to this product automatically.
      </p>

      <div className="mt-mrd-4 flex flex-col gap-mrd-5">
        <Field
          label="Repo name"
          htmlFor="repo-name"
          hint="Letters, numbers, hyphens, dots, and underscores only."
        >
          <Input
            id="repo-name"
            value={name}
            onChange={(e) => setName(slugify(e.target.value))}
            placeholder="my-product"
            className="font-mrd-mono"
            autoFocus
          />
        </Field>

        <Field
          label={
            <>
              Organization <span className="text-mrd-mute">(optional)</span>
            </>
          }
          htmlFor="repo-org"
          hint="Leave blank to create in your personal account."
        >
          <Input
            id="repo-org"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="your-org"
            className="font-mrd-mono"
          />
        </Field>

        <Field
          label={
            <>
              Description <span className="text-mrd-mute">(optional)</span>
            </>
          }
          htmlFor="repo-desc"
        >
          <Input
            id="repo-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
          />
        </Field>

        <button
          type="button"
          onClick={() => setIsPrivate((p) => !p)}
          aria-pressed={isPrivate}
          className="text-mrd-base text-mrd-mute hover:text-mrd-ink flex w-full items-center gap-mrd-3 rounded-mrd-ctl text-left outline-none"
        >
          {/* NO HUE ON THE GLYPH. It was `text-amber-500`, a raw palette colour,
              and the replacement is not another colour: the lock and the open
              lock are already two different SHAPES, which is the distinction
              Meridian asks a label to carry. A colour here would say a second
              time what the shape says once, in a token that would have to be
              invented to say it. */}
          {isPrivate ? (
            <Lock className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Unlock className="h-3.5 w-3.5 shrink-0" />
          )}
          {isPrivate ? "Private repo" : "Public repo"}
          <span className="text-mrd-tiny text-mrd-faint ml-auto">click to toggle</span>
        </button>
      </div>
    </Dialog>
  );
}

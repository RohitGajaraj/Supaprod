/**
 * ── YOU ARE IN A WORKSPACE THAT IS NOT YOURS, AND HERE IS THE WAY BACK ────
 *
 * P-33, 2026-09-03. The empty-desk door in Discover reads "The sample opens a
 * separate Explore workspace of labelled example data. Yours stays empty." Two
 * of those claims were false and the third was incomplete:
 *
 *   it does not OPEN a separate workspace, it MOVES you into one. Pressing it
 *   sets the seeded workspace active and writes that id to localStorage
 *   (`use-workspace.tsx`), so every later visit lands there by default.
 *
 *   the data is not LABELLED. `seed_sample_workspace` predates the `is_sample`
 *   columns by a month and writes none of them, so 2,144 rows across the
 *   sample workspaces carry the `false` default and the row-level Example
 *   marks the product already renders have never once fired.
 *
 *   and no return door was named anywhere in the receipt.
 *
 * So a person who pressed it was moved into an invented company's decisions,
 * with nothing on any screen saying so and no way back that anyone had told
 * them about. This is the banner four separate comments in the codebase have
 * asserted already existed (`use-workspace.tsx`'s type comment, this repo's
 * `_authenticated.tsx`, the label migration, the seeder) and that none of them
 * rendered.
 *
 * ── WHY IT LOOKS LIKE THIS ────────────────────────────────────────────────
 *
 * NOT A WARNING. Being in the sample is a normal, chosen state and often the
 * right one: it is how a person sees the loop work before they have evidence
 * of their own. Alarm colouring would tell them they had done something wrong.
 * So it is `--mrd-lift` over a hairline, the quietest raised surface Meridian
 * has, and it carries no icon: an icon here would be decoration, since the
 * sentence is the content.
 *
 * DISMISSIBLE, BUT THE FACT IS NOT. It sits on EVERY authenticated surface, so
 * a person who has understood it and wants to work needs a way to quiet it.
 * Dismissing hides the sentence for the session and never the fact: the
 * `SampleTag` beside the workspace name in the top bar is permanent and
 * cannot be dismissed at all. That is the division of labour between them --
 * the tag says where you are, this says what to do about it.
 *
 * IT DOES NOT MOVE THE PAGE. It renders from `useWorkspace()`, the same
 * synchronous context the switcher reads, so it is present on first paint
 * rather than arriving after a read resolves and pushing the page down.
 */
import * as React from "react";

import { Action } from "@/components/meridian/surface-parts";

export function SampleBanner({
  workspaceName,
  ownWorkspaceName,
  onReturn,
}: {
  /** The sample workspace the person is standing in. */
  workspaceName: string;
  /**
   * Their own workspace, named. `null` when they have none yet, which is the
   * common case: the door that brings most people here is offered ON an empty
   * workspace, and plenty of accounts have only the sample. The sentence
   * changes rather than offering a door to nowhere.
   */
  ownWorkspaceName: string | null;
  /** Switches back. Absent when there is nowhere to go back to. */
  onReturn?: () => void;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div
      data-mrd=""
      /*
       * `role="status"` and not `role="alert"`: an alert interrupts a screen
       * reader mid-sentence, which is right for something going wrong and
       * wrong for a standing fact about where you are.
       */
      role="status"
      className="flex flex-wrap items-center gap-mrd-3 border-b border-mrd-line bg-mrd-lift px-mrd-4 py-mrd-2 font-mrd"
    >
      <p className="text-mrd-small text-mrd-body">
        {/*
         * The workspace is NAMED rather than called "the sample", because the
         * name is what the switcher shows and the two have to be matchable.
         */}
        You are in <strong>{workspaceName}</strong>, a sample workspace. Everything in it is
        invented, so the loop has something to run on before you have evidence of your own. Nothing
        you do here touches your own work.
      </p>
      <div className="ml-auto flex items-center gap-mrd-2">
        {onReturn && ownWorkspaceName ? (
          <Action variant="quiet" onClick={onReturn}>
            {/* The door is NAMED. "Go back" would be the same omission in a
                shorter sentence: a person who arrived here by pressing one
                button needs to know which workspace they are returning to. */}
            Back to {ownWorkspaceName}
          </Action>
        ) : null}
        <Action variant="quiet" onClick={() => setDismissed(true)}>
          Hide this
        </Action>
      </div>
    </div>
  );
}

export default SampleBanner;

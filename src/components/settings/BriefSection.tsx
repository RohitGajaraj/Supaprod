/**
 * WHAT AN AGENT READS BEFORE IT ACTS - ITS OWN PANE NOW (P-23, 2026-09-02).
 *
 * Until this packet it rendered fused with the workspace pane in the settings
 * route (`WorkspaceSection`), and the `?section=brief` address scrolled to a
 * ref inside that combined pane rather than opening a pane named for it.
 * Split out per A1's ruling: the brief changes what a mission reads, the
 * company record changes who is in the workspace and what it is called -
 * different errands that used to share one heading only because both counted
 * as "things about the company" (see settings-sections.ts's header, §1).
 *
 * NO `scrollToBrief` PROP OR REF ANY MORE. `?section=brief` used to normalize
 * to `workspace` and the fused pane caught the raw value to scroll to itself.
 * `brief` is a real, doored section now, so landing here already IS the pane
 * - nothing left to scroll to.
 *
 * PULLED INTO ITS OWN FILE, not left inline in the 4,000-line route: every
 * other settings pane already lives under `src/components/settings/**`
 * (`DataSection`, `IntegrationsTab`, `ModelsSection`...) and is wired in with
 * one `{active === "..." && <X />}` line. Leaving this one inline would have
 * been the one pane breaking that convention, and it is the reason the
 * route's own line count went UP rather than down after the split - P-23's
 * acceptance measures the route file specifically.
 *
 * MOUNTED BY _authenticated.settings.tsx ONLY (`{active === "brief" &&
 * <BriefSection />}`).
 */
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { failureLine } from "@/lib/error-copy";
import { readFailureMessage } from "@/lib/roles.functions";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { getActiveBrief, upsertBrief } from "@/lib/briefs.functions";
import { Field, Textarea } from "@/components/meridian/forms";
import {
  Action,
  Actions,
  PageHeading,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

type BriefFieldKey = "mission" | "target_user" | "current_focus" | "anti_goals" | "notes";

/**
 * Prose spells its counts, and the data face uses `Num`. Indexed by
 * `BRIEF_FIELDS.length` on purpose: a sixth field changes the word rather than
 * leaving "five" standing over six answers.
 */
const COUNT_IN_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven"] as const;

const BRIEF_FIELDS: {
  key: BriefFieldKey;
  label: string;
  hint: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "mission",
    label: "Mission",
    hint: "One paragraph. What this workspace exists to do.",
    placeholder: "We help solo PMs run the work of a 10-person product org.",
    rows: 3,
  },
  {
    key: "target_user",
    label: "Target user",
    hint: "Who you are building for. Every agent anchors on this.",
    placeholder: "Lead or solo PM at a 10 to 100 person B2B SaaS team. Ships weekly.",
    rows: 3,
  },
  {
    key: "current_focus",
    label: "Current focus",
    hint: "What to prioritise this quarter. Cut, do not expand.",
    placeholder: "Q3 2026: close the Discover, Plan, Build loop on real signals.",
    rows: 4,
  },
  {
    key: "anti_goals",
    label: "Anti-goals",
    hint: "What the crew refuses, even when it looks reasonable.",
    placeholder: "No new dashboards. No mocked data. No feature whose value cannot be measured.",
    rows: 3,
  },
  {
    key: "notes",
    label: "Notes",
    hint: "Constraints, decisions and references that do not fit above.",
    placeholder: "Speak in product terms. Lean concise over verbose. Always cite evidence.",
    rows: 4,
  },
];

const EMPTY_BRIEF: Record<BriefFieldKey, string> = {
  mission: "",
  target_user: "",
  current_focus: "",
  anti_goals: "",
  notes: "",
};

export function BriefSection() {
  const qc = useQueryClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const getFn = useServerFn(getActiveBrief);
  const upsertFn = useServerFn(upsertBrief);
  const fProfile = useServerFn(getProfile);
  const mUpdate = useServerFn(updateProfile);

  const brief = useQuery({
    queryKey: ["workspace-brief", activeWorkspaceId],
    queryFn: () => getFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fProfile() });

  const effectiveWorkspaceId = activeWorkspaceId ?? brief.data?.workspace_id ?? null;

  const [form, setForm] = useState<Record<BriefFieldKey, string>>(EMPTY_BRIEF);
  const [voiceAnchor, setVoiceAnchor] = useState("");
  const [briefDirty, setBriefDirty] = useState(false);
  const [voiceDirty, setVoiceDirty] = useState(false);

  useEffect(() => {
    const d = brief.data;
    if (!d) return;
    setForm({
      mission: d.mission ?? "",
      target_user: d.target_user ?? "",
      current_focus: d.current_focus ?? "",
      anti_goals: d.anti_goals ?? "",
      notes: d.notes ?? "",
    });
    setBriefDirty(false);
  }, [brief.data]);

  useEffect(() => {
    const p = profile.data?.profile as { voice_anchor_text?: string | null } | null;
    if (p) {
      setVoiceAnchor(p.voice_anchor_text ?? "");
      setVoiceDirty(false);
    }
  }, [profile.data]);

  // ONE SAVE, because the brief and the voice anchor are one instrument: what
  // the crew reads before it acts. Two cards with two Save buttons meant two
  // primary actions on a surface entitled to one. Both server functions are
  // still called, and only for what actually changed.
  const save = useMutation({
    mutationFn: async () => {
      if (briefDirty) {
        const row = await upsertFn({ data: { workspaceId: effectiveWorkspaceId, ...form } });
        qc.setQueryData(["workspace-brief", activeWorkspaceId], row);
        qc.setQueryData(["workspace-brief", null], row);
        void refreshWorkspaces();
      }
      if (voiceDirty) {
        await mUpdate({ data: { voice_anchor_text: voiceAnchor } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setBriefDirty(false);
      setVoiceDirty(false);
      toast.success("Saved. The next mission reads it.");
    },
    /*
     * THE SUCCESS SENTENCE IS "The next mission reads it", SO THE FAILURE HAS TO
     * ANSWER THAT SAME QUESTION. This is the most load-bearing write on the
     * surface -- the brief is injected into every agent's prompt -- and a bare
     * error string left it ambiguous whether the crew is now running on the new
     * text or the old. `briefDirty`/`voiceDirty` stay set on this path, so the
     * draft is still in the fields and the stored copy is untouched.
     */
    onError: (e: Error) =>
      toast.error(failureLine("The crew still reads the brief it read before.", e)),
  });

  const dirty = briefDirty || voiceDirty;
  const filled = BRIEF_FIELDS.filter((f) => form[f.key].trim().length > 0).length;

  return (
    <div className="flex flex-col gap-mrd-7">
      <PageHeading
        title="Brief and voice"
        sub={
          /*
           * ONE VOICE PER WAIT. This branch used to say "Reading the brief."
           * and the Region below it says "Reading the brief." through
           * `Reading`, so every cold load of this pane printed the same
           * sentence twice, one directly above the other. The Region's copy is
           * the one attached to the thing being waited on, so it keeps the
           * line and the heading says nothing until it has something to say.
           * Falling through to the branches below during the load would be
           * worse than either: `filled` is 0 until the read lands, so the
           * heading would assert "Nothing set" about a brief it has not read.
           *
           * AND THE RATIO ONLY PRINTS WHEN IT IS SHORT. "these 5 of 5 answers"
           * was a ratio that can never be anything but N-of-N on a filled
           * brief, sat on the same pane as MembersCard's "N of the 8 things
           * that govern the crew". Two ratios, one screen, and the one that
           * could only ever say one thing was this one. Filled says so in
           * words; short still counts, because then the numbers differ and the
           * gap is the point.
           */
          brief.isLoading
            ? undefined
            : brief.isError
              ? "The brief did not load, so nothing here is safe to save yet."
              : filled === 0
                ? "Nothing set. Every mission currently starts with no standing instruction."
                : filled === BRIEF_FIELDS.length
                  ? `Every mission starts by reading all ${COUNT_IN_WORDS[BRIEF_FIELDS.length] ?? BRIEF_FIELDS.length} answers${activeWorkspace?.name ? `, for ${activeWorkspace.name}` : ""}.`
                  : `Every mission starts by reading these ${filled} of ${BRIEF_FIELDS.length} answers${activeWorkspace?.name ? `, for ${activeWorkspace.name}` : ""}.`
        }
      />

      <Region title="What the crew reads before it acts">
        {brief.isLoading ? (
          <Reading>Reading the brief.</Reading>
        ) : brief.isError ? (
          // A failed read must never render blank fields whose save would wipe
          // the real brief.
          <ReadFailedLine onRetry={() => void brief.refetch()}>
            The brief did not load. {readFailureMessage(brief.error)}
          </ReadFailedLine>
        ) : (
          /*
           * THE STACK STATES ITS OWN GAP NOW. The retired `.sp-field` carried
           * `margin-top: var(--sp-space-3)` (12px), so six stacked fields were
           * spaced by the primitive and the Actions row underneath them was not
           * spaced at all. Meridian's `Field` sets no outer margin, on the same
           * rule `Actions` and `Pre` follow -- a composition decision belongs to
           * the composition -- so one 16px column here replaces both, which is
           * the nearest stop at or above the 12px it had.
           */
          <div className="flex flex-col gap-mrd-5">
            {BRIEF_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`brief-${f.key}`}>
                <Textarea
                  id={`brief-${f.key}`}
                  value={form[f.key]}
                  rows={f.rows}
                  placeholder={f.placeholder}
                  aria-describedby={`brief-hint-${f.key}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, [f.key]: val }));
                    setBriefDirty(true);
                  }}
                />
                {/*
                 * NOT `Field`'s own `hint` slot, and the reason is the binding
                 * rather than the paint: `hint` renders no id, so moving this
                 * there would leave `aria-describedby` pointing at nothing and
                 * silently drop the description for anyone reading by ear. The
                 * 5px top margin is gone because `Field` is a 6px flex column
                 * now, so the space is stated once instead of twice.
                 */}
                <span
                  id={`brief-hint-${f.key}`}
                  style={{
                    display: "block",
                    fontSize: "var(--mrd-t-label)",
                    color: "var(--mrd-mute)",
                  }}
                >
                  {f.hint}
                </span>
              </Field>
            ))}

            <Field label="Voice" htmlFor="voice-anchor">
              <Textarea
                id="voice-anchor"
                value={voiceAnchor}
                rows={3}
                maxLength={2000}
                placeholder="Direct, evidence first, no hype. Challenge weak assumptions. Short declarative sentences."
                aria-describedby="voice-hint"
                onChange={(e) => {
                  setVoiceAnchor(e.target.value);
                  setVoiceDirty(true);
                }}
              />
              <span
                id="voice-hint"
                style={{
                  display: "block",
                  fontSize: "var(--mrd-t-label)",
                  color: "var(--mrd-mute)",
                }}
              >
                The tone and stance every agent writes in. Leave it empty to skip.
              </span>
            </Field>

            <Actions>
              <Action
                variant="primary"
                disabled={!dirty || save.isPending || profile.isLoading}
                onClick={() => save.mutate()}
              >
                {/*
                  "SAVED" IS A RECEIPT, AND A RECEIPT NEEDS A TRANSACTION (P-33).
                  `dirty` is false on arrival, so this button's RESTING label
                  asserted a save that had never happened, on the one pane whose
                  own heading directly above it reads "Nothing set. Every mission
                  currently starts with no standing instruction." The screen
                  contradicted itself in two adjacent elements.

                  The resting label is now the verb, greyed by `disabled`,
                  which is what an untouched form looks like everywhere else.
                  "Saved" is kept for the case it was written for: a save that
                  actually happened in this session.
                */}
                {save.isPending
                  ? "Saving"
                  : dirty
                    ? "Save the brief"
                    : save.isSuccess
                      ? "Saved"
                      : "Save the brief"}
              </Action>
            </Actions>
          </div>
        )}
      </Region>
    </div>
  );
}

/**
 * THE FIRST RUN. One screen, then the home.
 *
 * ── WHAT IT REPLACES (Lane 1, 2026-09-08) ────────────────────────────────
 * A five-phase flow (arrival, product, data, critic, results; 1,743 lines)
 * that asked a new account to name a product, paste notes or connect a
 * source, type a belief for a critic to challenge, and read a teardown,
 * before it had seen the product do anything. Founder, 2026-09-08: "Within
 * seconds a user understands what Supaprod is for, what it does for them,
 * what to do first. No blank canvas. Anticipate, do not interrogate."
 *
 * ── WHAT IT IS ───────────────────────────────────────────────────────────
 * One question a person can answer without thinking: what are you building,
 * and in one line, who is it for. The road under it says what happens next,
 * drawn with the same Journey the home and the run screen use, so the model
 * is learned once. Pressing the one button creates the workspace and the
 * product, records the one line as the positioning brief, marks the account
 * onboarded and opens the home, which greets the product by name with the
 * composer focused. Sources connect later, from Sources; nothing is gated on
 * a connection.
 *
 * Everything it writes already had a writer: `seedWorkspaceForTrack` (the
 * workspace, the product row, the marked sample rows), `renameWorkspace`,
 * `upsertBriefItem`, `completeOnboarding`. No new server function.
 */
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Journey } from "@/components/meridian/Journey";
import { Receipt } from "@/components/meridian/Receipt";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { Action, Door } from "@/components/meridian/surface-parts";
import { promiseStations } from "@/components/start/JourneyMap";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { supabase } from "@/integrations/supabase/client";
import { markOnboarded } from "@/lib/onboarding-gate";
import {
  completeOnboarding,
  recordOnboardingMilestone,
  seedWorkspaceForTrack,
} from "@/lib/onboarding.functions";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { renameWorkspace } from "@/lib/workspaces.functions";
import { updateProject } from "@/lib/projects.functions";
import { upsertBriefItem } from "@/lib/briefs.functions";
import { failureLine } from "@/lib/error-copy";

export function FirstRun() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fGetProfile = useServerFn(getProfile);
  const fUpdateProfile = useServerFn(updateProfile);
  const fSeed = useServerFn(seedWorkspaceForTrack);
  const fRename = useServerFn(renameWorkspace);
  const fProduct = useServerFn(updateProject);
  const fBrief = useServerFn(upsertBriefItem);
  const fComplete = useServerFn(completeOnboarding);
  const fMilestone = useServerFn(recordOnboardingMilestone);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fGetProfile() });
  const needsName =
    profile.isSuccess &&
    !(profile.data?.profile as { display_name?: string | null } | null)?.display_name;

  const [name, setName] = React.useState("");
  const [product, setProduct] = React.useState("");
  const [line, setLine] = React.useState("");
  /* THE FORM ARRIVES ONCE. The name field used to pop in above an already
     focused product field when the profile read landed (entry review,
     2026-09-08). The header stands at once; the fields mount when the read
     has settled either way, with the first of them focused. */
  const ready = profile.isSuccess || profile.isError;

  const go = useMutation({
    mutationFn: async () => {
      const productName = product.trim();
      const oneLine = line.trim();
      if (needsName && name.trim()) {
        const first = name.trim().split(/\s+/)[0] ?? name.trim();
        await fUpdateProfile({ data: { display_name: first, full_name: name.trim() } });
      }
      const seeded = (await fSeed({ data: { track: "solo" } })) as {
        workspaceId?: string | null;
        projectId?: string | null;
      };
      const workspaceId = seeded?.workspaceId ?? null;
      if (workspaceId) {
        await fRename({ data: { id: workspaceId, name: productName } });
        /* The activation funnel's "product_named" moment (Lane 3's note):
           the old screen fired it from its name field; the server fires
           "onboarding_completed" itself. Non-fatal. */
        await fMilestone({
          data: { workspaceId, stage: "product_named", metadata: { productName } },
        }).catch(() => undefined);
      }
      /* The product row is what the home greets by name; the seed named it
         after the workspace before the person had typed anything. The one
         line is NOT written to `north_star`: that field is a goal ("Get 40%
         of active users to a funded savings goal") and the composer's
         placeholder templates it as one, so a positioning line there read
         "Help Prism an expense tool for freelancers" (entry review,
         2026-09-08). The line's home is the positioning brief, below. */
      if (seeded?.projectId) {
        await fProduct({
          data: { id: seeded.projectId, name: productName },
        }).catch(() => undefined);
      }
      if (oneLine) {
        /* The one line is the positioning brief. Non-fatal: a person who
           wrote it should not be stopped at the door if the brief write
           fails; the home will ask for it again where it is used. */
        await fBrief({
          data: { kind: "positioning", title: productName, body: oneLine },
        }).catch(() => undefined);
      }
      /* The product id lets the server write the first three runs at once
         (Lane 3, 2026-09-08), so the home usually arrives with them there. */
      await fComplete({ data: { productId: seeded?.projectId ?? undefined } });
      const { data } = await supabase.auth.getSession();
      if (data.session) await markOnboarded(data.session.user.id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workspaces"] }),
        qc.invalidateQueries({ queryKey: ["products"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
    onSuccess: () => {
      void navigate({ to: SIGNED_IN_HOME, search: {} });
    },
  });

  const canGo =
    product.trim().length > 0 && (!needsName || name.trim().length > 0) && !go.isPending;

  return (
    <main
      data-mrd=""
      data-screen-label="First run"
      className="flex min-h-dvh items-center justify-center bg-mrd-bg px-mrd-5 py-mrd-8 font-mrd"
    >
      <div className="flex w-full max-w-[38rem] flex-col gap-mrd-7">
        <SupaprodMark size={36} glow={false} />

        <header className="flex flex-col gap-mrd-3">
          <span className="mrd-eyebrow">Supaprod</span>
          <h1 className="font-mrd-display text-mrd-h1 leading-mrd-tight font-medium tracking-[-0.015em] text-mrd-ink">
            What are you building?
          </h1>
          <p className="max-w-[var(--mrd-measure-page)] text-mrd-prose leading-mrd-prose text-mrd-body">
            Name it, and say in one line who it is for. After this, everything is a run you can
            watch: it finds the evidence, makes the call, writes the spec, builds the change, ships
            it and checks that it did what you said.
          </p>
        </header>

        {!ready ? (
          <div className="min-h-[14rem]" aria-hidden="true" />
        ) : (
          <form
            className="flex flex-col gap-mrd-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (canGo) go.mutate();
            }}
          >
            {needsName ? (
              <Field label="Your name" htmlFor="first-run-name">
                <Input
                  id="first-run-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Maya Ruiz"
                  autoFocus
                />
              </Field>
            ) : null}
            <Field label="The product" htmlFor="first-run-product">
              <Input
                id="first-run-product"
                autoFocus={!needsName}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                autoComplete="off"
                placeholder="Prism"
                maxLength={120}
              />
            </Field>
            <Field
              label="In one line, who it is for and what it does"
              htmlFor="first-run-line"
              hint="Optional. It becomes the first thing on the record, and every run reads it."
            >
              <Textarea
                id="first-run-line"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                rows={2}
                placeholder="An expense tool for freelancers who hate spreadsheets"
                maxLength={300}
              />
            </Field>

            {go.isError ? (
              <Receipt
                verb="It did not finish"
                consequence={failureLine(
                  "What you typed is still here, and whatever was set up before it stopped stays set up.",
                  go.error as Error,
                )}
                failed
              />
            ) : null}

            <div className="flex items-center justify-between gap-mrd-4">
              <span className="mrd-meta">
                Slack, GitHub, Intercom and the rest connect later, from Sources. Nothing has to be
                connected first.{" "}
                {/* The one way out of a screen that otherwise has none (third
                    review, 2026-09-08): a wrong account can leave. */}
                <Door
                  onClick={() => {
                    void supabase.auth.signOut().then(() => navigate({ to: "/login" }));
                  }}
                >
                  Not you? Sign out
                </Door>
              </span>
              <Action type="submit" variant="primary" busy={go.isPending} disabled={!canGo}>
                {go.isPending ? "Setting up" : "Open Supaprod"}
              </Action>
            </div>
          </form>
        )}

        <section
          aria-label="What happens after you press Enter"
          className="flex flex-col gap-mrd-4 rounded-mrd-pane bg-mrd-sheet px-mrd-5 pt-mrd-5 pb-mrd-4"
        >
          <Journey
            size="full"
            stations={promiseStations()}
            label="The road every run travels"
            promise
          />
          <p className="mrd-meta">
            Every run travels this road, and it stops to ask you only where the call is yours.
          </p>
        </section>
      </div>
    </main>
  );
}

export default FirstRun;

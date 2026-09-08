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
import { openFirstRun } from "@/lib/onboarding.functions";
import { getProfile } from "@/lib/profile.functions";
import { failureLine } from "@/lib/error-copy";

export function FirstRun() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fGetProfile = useServerFn(getProfile);
  const fOpen = useServerFn(openFirstRun);

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
      /* ONE CALL (fourth review, 2026-09-09; Lane 3's openFirstRun). This
         press ran seven authenticated server functions one after another,
         each paying its own auth hop, so the first press in the product sat
         disabled reading "Setting up" for seconds. The server runs the name
         and the seed together, then everything keyed on the seed together,
         then the completion, which claims the starter runs and returns at
         once. The one line is the positioning brief, never `north_star`
         (entry review, 2026-09-08). */
      await fOpen({
        data: {
          productName,
          oneLine: oneLine || undefined,
          name: needsName && name.trim() ? name.trim() : undefined,
          track: "solo",
        },
      });
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
          /* Named for what it shows, in the drawing's own words. It was
             "What happens after you press Enter": on this screen Enter opens
             the home and starts no run, and a screen reader heard the key
             named where no visible copy does (fourth review, 2026-09-09). */
          aria-label="The road every run travels"
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

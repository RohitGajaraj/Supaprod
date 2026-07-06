// OBS-03 step 12: the dev-only storybook substitute. Every Obsidian
// primitive in every state, in a labeled grid, for parity review against
// design-reference/obsidian-v3/design-reference/cadence-app.html. Not in
// the production rail; reachable only by direct URL. OBS-10 folds or
// removes this route once every surface has shipped and there is nowhere
// left to hold a side-by-side review.
//
// This page is a catalog, not a product composition. The per-screen
// restraint budget (one ember CTA, one aurora, two pencils) applies to
// each individual example below, not to the page as a whole.
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/cadence/TopBar";
import { Surface } from "@/components/obsidian/Surface";
import {
  AuroraCard,
  Button,
  CallCard,
  Citation,
  MissionRow,
  MonoLabel,
  PencilNote,
  SlideOver,
  StatusDot,
  STATUS_WORD,
  ToastProvider,
  VerdictChip,
  useToast,
  type ButtonVariant,
  type MissionRowStatus,
  type MonoLabelTone,
  type PencilInk,
  type StatusState,
  type VerdictTone,
} from "@/components/obsidian";

export const Route = createFileRoute("/_authenticated/obsidian-specimen")({
  component: ObsidianSpecimenPage,
  head: () => ({ meta: [{ title: "Obsidian specimen · Cadence" }] }),
});

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "link"];
const BUTTON_HOVER_FILL: Record<ButtonVariant, string> = {
  primary: "brightness",
  secondary: "var(--hover)",
  tertiary: "var(--hover)",
  link: "underline",
  quiet: "var(--hover)",
};
const STATUS_STATES: StatusState[] = [
  "working",
  "gate",
  "waiting",
  "done",
  "shipped",
  "queued",
  "thinking",
  "in-review",
  "blocked",
];
const VERDICT_TONES: VerdictTone[] = [
  "SHIP",
  "VALIDATED",
  "KEPT",
  "KILL",
  "MISSED",
  "REVISE",
  "CRITIC REVIEW",
  "WATCH",
  "DRAFTING",
  "PENDING",
];
const MONO_LABEL_TONES: MonoLabelTone[] = [
  "ember",
  "glacier",
  "blossom",
  "moss",
  "madder",
  "marigold",
  "muted",
  "faint",
];
const PENCIL_INKS: PencilInk[] = ["best-bet", "pet-feature", "scope-creep"];
const PENCIL_SAMPLE: Record<PencilInk, string> = {
  "best-bet": "this one",
  "pet-feature": "my favorite",
  "scope-creep": "scope creep",
};
const MISSION_ROW_STATUSES: MissionRowStatus[] = ["working", "gate", "done", "queued"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="flex flex-col gap-4"
      style={{ paddingBottom: "40px", borderBottom: "1px solid var(--hairline)" }}
    >
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "20px",
          fontWeight: 460,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-start gap-2"
      style={{
        padding: "16px",
        backgroundColor: "var(--surface-card-deep)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <MonoLabel tone="faint" style={{ fontSize: "9px" }}>
        {label}
      </MonoLabel>
      {children}
    </div>
  );
}

function ObsidianSpecimenPage() {
  return (
    <ToastProvider>
      <ObsidianSpecimenContent />
    </ToastProvider>
  );
}

function ObsidianSpecimenContent() {
  const showToast = useToast();
  const [slideOverOpen, setSlideOverOpen] = React.useState(false);

  return (
    <>
      <TopBar crumbs={["Obsidian specimen"]} />
      <Surface>
        <div className="flex flex-col gap-3" style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "32px",
              fontWeight: 460,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Obsidian <em>specimen</em>
          </h1>
          <MonoLabel tone="faint">
            DEV ONLY · NOT IN PRODUCTION NAV · REACHABLE BY DIRECT URL
          </MonoLabel>
        </div>

        <div className="flex flex-col gap-10">
          <Section title="Button">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {BUTTON_VARIANTS.map((variant) => (
                <React.Fragment key={variant}>
                  <Cell label={`${variant} · default`}>
                    <Button variant={variant}>Approve</Button>
                  </Cell>
                  <Cell label={`${variant} · hover`}>
                    <Button variant={variant}>Approve</Button>
                    <MonoLabel tone="faint" style={{ fontSize: "9px" }}>
                      fills {BUTTON_HOVER_FILL[variant]} on hover
                    </MonoLabel>
                  </Cell>
                  <Cell label={`${variant} · disabled`}>
                    <Button variant={variant} disabled>
                      Approve
                    </Button>
                  </Cell>
                  <Cell label={`${variant} · loading`}>
                    <Button variant={variant} loading>
                      Approve
                    </Button>
                  </Cell>
                </React.Fragment>
              ))}
            </div>
          </Section>

          <Section title="StatusDot">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {STATUS_STATES.map((state) => (
                <Cell key={state} label={state}>
                  <StatusDot state={state} word={STATUS_WORD[state]} />
                </Cell>
              ))}
            </div>
          </Section>

          <Section title="VerdictChip">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {VERDICT_TONES.map((tone) => (
                <Cell key={tone} label={tone}>
                  <VerdictChip tone={tone} />
                </Cell>
              ))}
            </div>
          </Section>

          <Section title="MonoLabel">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Cell label="default (no tone)">
                <MonoLabel>Sample label</MonoLabel>
              </Cell>
              {MONO_LABEL_TONES.map((tone) => (
                <Cell key={tone} label={tone}>
                  <MonoLabel tone={tone}>Sample label</MonoLabel>
                </Cell>
              ))}
            </div>
          </Section>

          <Section title="CallCard">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CallCard
                kind="BUDGET OVERRUN"
                expiry="EXPIRES IN 2H"
                title="The onboarding rewrite is projected to run 40 percent over budget"
                body="Three of five steps are done. At the current burn rate the remaining two will push total spend past the approved ceiling."
                ev={[{ src: "Trace 88f2", text: "Step 4 used 3.1x the estimated tokens." }]}
                okLabel="Approve overage"
                noLabel="Send back"
                consequence="Approving raises this mission's budget ceiling. Sending back pauses it for rescoping."
                onOk={() => showToast("Overage approved")}
                onNo={() => showToast("Sent back for rescoping")}
              />
              <CallCard
                kind="YOUR CALL"
                expiry="EXPIRES IN 40M"
                title="Ship the pricing page copy update"
                body="The Critic flagged one claim it could not verify against the source doc."
                ev={[]}
                okLabel="Ship it"
                noLabel="Hold"
                consequence="Shipping publishes immediately. Holding keeps the draft private."
                onOk={() => showToast("Shipped")}
                onNo={() => showToast("Held")}
                compact
              />
            </div>
            <Cell label="empty (all clear)">
              <MonoLabel tone="moss">ALL CLEAR · NOTHING NEEDS YOU RIGHT NOW</MonoLabel>
            </Cell>
          </Section>

          <Section title="MissionRow">
            <div
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-card)",
                overflow: "hidden",
              }}
            >
              {MISSION_ROW_STATUSES.map((status) => (
                <MissionRow
                  key={status}
                  status={status}
                  title={`Mission in the ${status} state`}
                  verdict={status === "done" ? "SHIP" : undefined}
                  stepLabel={status === "queued" ? "NOT STARTED" : "STEP 3 OF 5"}
                  cost="$0.42"
                  onOpen={() => showToast(`Opened ${status} mission`)}
                />
              ))}
            </div>
          </Section>

          <Section title="AuroraCard">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AuroraCard label="LOOP HEALTH" value="94" note="7 loops · 30 days" hue="healthy" />
              <AuroraCard label="LOOP HEALTH" value="61" note="2 loops slipping" hue="attention" />
              <AuroraCard label="LOOP HEALTH" value="28" note="3 loops broken" hue="failing" />
            </div>
          </Section>

          <Section title="Citation">
            <Cell label="with popover (hover or focus the chip)">
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  color: "var(--text-body)",
                  margin: 0,
                }}
              >
                Retention improved after the onboarding rewrite
                <Citation
                  index={1}
                  source="Amplitude · Retention cohort"
                  quote="D7 retention moved from 31 percent to 38 percent for the rewrite cohort."
                />
                .
              </p>
            </Cell>
          </Section>

          <Section title="PencilNote">
            <div className="flex flex-wrap items-center gap-8">
              {PENCIL_INKS.map((ink) => (
                <Cell key={ink} label={ink}>
                  <PencilNote ink={ink}>{PENCIL_SAMPLE[ink]}</PencilNote>
                </Cell>
              ))}
            </div>
          </Section>

          <Section title="Toast">
            <Cell label="trigger (fires twice fast to verify replace, not stack)">
              <Button variant="secondary" onClick={() => showToast("Change saved")}>
                Trigger toast
              </Button>
            </Cell>
          </Section>

          <Section title="SlideOver">
            <Cell label="trigger (Tab through the body, Esc to verify focus restore)">
              <Button variant="secondary" onClick={() => setSlideOverOpen(true)}>
                Open slide-over
              </Button>
            </Cell>
            <SlideOver
              open={slideOverOpen}
              onClose={() => setSlideOverOpen(false)}
              title="Specimen slide-over"
              footer="Tab through the body, then press Escape and confirm focus returns to the trigger."
            >
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  color: "var(--text-body)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                This panel exists to verify the focus trap and restore-on-close behavior against the
                prototype.
              </p>
              <Button
                variant="primary"
                style={{ marginTop: "16px" }}
                onClick={() => setSlideOverOpen(false)}
              >
                Close
              </Button>
            </SlideOver>
          </Section>
        </div>
      </Surface>
    </>
  );
}

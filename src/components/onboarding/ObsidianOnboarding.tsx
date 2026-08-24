// OBS-14 - the five-screen Obsidian onboarding golden path (Arrival ->
// track pick -> one connection -> point the Critic -> land on Today),
// replacing the parchment four-step `OnboardingFlow`. Full account, the
// server-fn reuse map, and the two honest deviations from the literal spec
// (isDemoSeedEnabled - a minimal new read, and the belief input driving a
// real seeded opportunity id rather than free text) live in
// docs/features/obsidian-port.md's OBS-14 section.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { Action } from "@/components/meridian/surface-parts";
import { CONNECTOR_REGISTRY, type ProviderId, type ProviderSpec } from "@/lib/connectors/registry";
import {
  listConnections,
  saveGatewayConnection,
  startGatewayConnect,
  startGithubAppConnect,
  startNativeOAuthConnect,
} from "@/lib/connections.functions";
import { listMySuiteConnections, startSuiteConnect } from "@/lib/calendar-connections.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { upsertBriefItem } from "@/lib/briefs.functions";
import {
  seedWorkspaceForTrack,
  completeOnboarding,
  recordOnboardingMilestone,
  type OnboardingTrack,
} from "@/lib/onboarding.functions";
import { isDemoSeedEnabled, triggerWorkspaceSeed } from "@/lib/onboarding/onboarding.functions";
import { soloTrack, foundingTrack, techTrack } from "@/lib/onboarding/track-seeds";
import {
  runCriticReview,
  runWedgeTeardown,
  listOpportunities,
  createSignal,
  type CriticReview,
} from "@/lib/discovery.functions";
// Client-safe by declaration (see the module header): string work only, no
// server imports. The paste step needs both - the same body ceiling the server
// validator enforces, and the same first-line rule the sink uses for a title.
import { titleFromBody, MAX_BODY_CHARS } from "@/lib/sources/manual";
import { markOnboarded } from "@/lib/onboarding-gate";
import { useWorkspace } from "@/hooks/use-workspace";
import { ArrivalMark } from "@/components/onboarding/ArrivalButterfly";
import { AiPulse } from "@/components/meridian/AiPulse";
// The results screen's copy action reuses the receipt formatter the public
// /p/teardown page already ships. One formatter, two surfaces, no drift.
import { asPlainText } from "@/components/public/TeardownReceipt";
import type { Teardown, TeardownVerdict } from "@/lib/ai/public-teardown.server";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
// SW-7: multi-account suite providers (Calendar + Gmail/Outlook Mail), same
// mapping AccountConnectionsSection.tsx uses for its own settings-page grid.
const SUITE_PROVIDERS: Partial<
  Record<ProviderId, { provider: "google" | "microsoft"; product: "calendar" | "mail" }>
> = {
  google_calendar: { provider: "google", product: "calendar" },
  gmail: { provider: "google", product: "mail" },
  microsoft_outlook: { provider: "microsoft", product: "calendar" },
  microsoft_mail: { provider: "microsoft", product: "mail" },
};
const TRACKS: OnboardingTrack[] = ["solo", "founding", "tech"];

/**
 * THE FIRST THING THIS PRODUCT EVER DID WAS JUDGE A STRANGER'S BET.
 *
 * A constant, `FALLBACK_BELIEF = "Mobile capture is our biggest gap"`, used to
 * be the initial value of the belief input AND the initial value of
 * `seededBeliefRef`. So a brand-new account that skimmed step 3 and pressed the
 * button got a Critic teardown of a sentence they never wrote, about a product
 * they do not have. That is the product's first act, spent on someone else.
 *
 * There is no default belief now. The box starts empty, and the Critic only
 * ever judges what this user actually typed, pasted, or what their own
 * workspace actually contains. The empty case is COMPOSED instead: this line
 * tells them what to write, and it is pure so a test can pin it.
 *
 * WHERE THE BOX'S CONTENTS CAME FROM IS PART OF WHAT THIS LINE SAYS, and until
 * now it was guessed from a string being non-empty. Every prefill therefore
 * claimed "this is what Supaprod read from what you just connected" - including
 * the three that connect nothing: the product name echoed back from step 1, the
 * notes the user pasted, and the case where they pressed "skip and connect
 * later" and no source exists at all. The source is passed in now, so the
 * sentence can only describe what actually happened.
 */
export type BeliefSource =
  /** Nothing in the box. The user writes their own. */
  | "none"
  /** A real bet already in this user's workspace, pulled by `listOpportunities`. */
  | "opportunity"
  /** The product name they typed on step 1, echoed back. Nothing was read. */
  | "product-name"
  /** The first line of the notes they pasted on step 2. */
  | "pasted";

/* THE AGENT THIS FILE RUNS IS THE CRITIC, AND TWO STRINGS CALLED IT SOMETHING
 * ELSE. The "none" line below and the belief input's aria-label (:1580) both
 * said "the AI analyst". That is a real and DIFFERENT agent in this codebase —
 * the brain's intelligence analyst, whose ANALYST_SYSTEM opens "You are the
 * Supaprod intelligence analyst" (brain-insights.functions.ts:455) — and it
 * never runs here. Everything else on this screen already says Critic,
 * including the submit button below the input ("Get the Critic's take", :1619)
 * and the failure copy at :1703-1704, so
 * a new account was told two names for one agent inside one viewport. Renamed,
 * matching agent-vocabulary.ts:75 `{ name: "Critic", verb: "challenges" }`. */
export function beliefGuidance(source: BeliefSource): string {
  switch (source) {
    case "opportunity":
      return "Supaprod spotted this opportunity in your workspace. Edit it, or try your own.";
    case "product-name":
      return "This is the product name you gave. Edit it into the idea you want analyzed.";
    case "pasted":
      return "This is the first line of what you pasted. Edit it, or write your own idea.";
    case "none":
      return "Write the idea you want analyzed, in your own words. The Critic reads only what is in this box.";
  }
}

/**
 * THE CANNED BETS, AND WHY THE CRITIC MUST NEVER BE POINTED AT ONE.
 *
 * Deleting `FALLBACK_BELIEF` closed the front door and left the back one open.
 * Step 1 fires `seedWorkspaceForTrack("solo")` unconditionally, which writes
 * four sample opportunities into the user's REAL workspace (track-seeds.ts).
 * `afterConnected` then took `opportunities[0]` - ordered by ice_score, so
 * reliably the highest-scoring SAMPLE row - as the belief AND as the Critic's
 * target. The product's first act was a teardown of "Redesign onboarding to
 * reduce day-1 drop-off": a bet about a mobile app the user does not have,
 * scored by numbers they did not choose. That is the exact defect the constant
 * was deleted for, arriving through the seed table instead.
 *
 * The sample data is kept (a workspace with something in it is a better first
 * run, and track-seeds.ts labels it "Example:" where a human will see it). It is
 * simply never mistaken for a bet this person made. Pure, so a test pins it, and
 * derived from the seeds themselves so a new fixture cannot drift past it.
 */
const SEEDED_EXAMPLE_TITLES: ReadonlySet<string> = new Set(
  [soloTrack, foundingTrack, techTrack].flatMap((t) =>
    t.opportunities.map((o) => o.title.trim().toLowerCase()),
  ),
);

export function isSeededExampleTitle(title: string): boolean {
  return SEEDED_EXAMPLE_TITLES.has(title.trim().toLowerCase());
}

/**
 * The belief a pasted document leads with.
 *
 * `pasteNotes.slice(0, 200)` took 200 characters of whatever the clipboard
 * happened to start with - a markdown title fence, a metadata block, half of the
 * second paragraph - and sent that to the Critic as the user's bet. The first
 * line that carries words is what a person actually wrote at the top of a
 * document, and it is the same rule the signal sink uses to title one, so the
 * row and the belief cannot disagree. 200 is the wedge validator's own ceiling.
 */
export function beliefFromPaste(text: string): string {
  return titleFromBody(text, "").slice(0, 200);
}

/**
 * A VERDICT WORD WITH NOTHING BEHIND IT IS NOT A REVIEW.
 *
 * `runCritic` never returns a half-review on purpose, but it does coerce: a
 * model reply it cannot read yields `verdict: "revise"`, `summary: ""`, and
 * empty `risks`/`missing_evidence`, and only a hard failure returns null. The
 * results screen tested `review === null`, so that coerced shell rendered as a
 * SUCCESS: one uppercase word in a coloured box, a confidence bar at its default
 * half, and nothing else - with "Copy this teardown" underneath, which put a
 * verdict word and a link to our own site on the user's clipboard.
 *
 * Substance is the honest test: did the Critic actually say anything. Pure, and
 * shared by the render, the failure flag, and the copy action so all three
 * agree.
 */
export function reviewHasSubstance(
  review: {
    summary?: string;
    risks?: string[];
    missing_evidence?: string[];
  } | null,
): boolean {
  if (!review) return false;
  return (
    (review.summary ?? "").trim().length > 0 ||
    (review.risks ?? []).some((r) => r.trim().length > 0) ||
    (review.missing_evidence ?? []).some((m) => m.trim().length > 0)
  );
}

/** The verdict word the results screen stamps when a review arrives without
 *  one. Shared with the copyable receipt so both say the same thing. */
const VERDICT_WHEN_UNSTATED = "hold";

/**
 * A CriticReview, shaped for the ONE receipt formatter this product has.
 *
 * `asPlainText` already ships on the anonymous /p/teardown page, so onboarding
 * reuses it rather than growing a second formatter that drifts from the first.
 * Exported for the test that pins what a user actually gets on their clipboard.
 */
export function criticReviewAsShareable(review: {
  verdict?: string;
  summary?: string;
  risks?: string[];
  missing_evidence?: string[];
  confidence?: number;
}): Teardown {
  return {
    // The Critic's OWN verdict word, the same one stamped on the screen the
    // user is looking at. `asPlainText` only ever uppercases this field, and
    // translating "revise" into the public teardown's "needs work" would hand
    // a reader a verdict the machine never returned. The widening cast is the
    // honest move here; the vocabulary swap is not.
    verdict: (review.verdict ?? VERDICT_WHEN_UNSTATED) as TeardownVerdict,
    headline: review.summary ?? "",
    // Every risk and every gap the Critic found, not the three and the one the
    // screen has room for.
    risks: review.risks ?? [],
    gaps: review.missing_evidence ?? [],
    // A CriticReview has no recommendation field. asPlainText drops the block
    // when it is empty, which is the right outcome: absent beats invented.
    recommendation: "",
    confidence: review.confidence ?? 0,
  };
}

// Presentation-only estimates (no such field exists on the connector
// registry) - the copy the spec names verbatim, plus a sensible default.
const TIME_ESTIMATE: Partial<Record<ProviderId, string>> = {
  github: "about 1 minute",
  intercom: "about 2 minutes",
  slack: "about 2 minutes",
  stripe: "about 1 minute",
  google_calendar: "about 1 minute",
  microsoft_outlook: "about 1 minute",
};

/** Exported for testing: the pure lookup behind every connection row's mono estimate. */
export function timeEstimateFor(id: ProviderId): string {
  return TIME_ESTIMATE[id] ?? "about 2 minutes";
}

// PC-02 step arithmetic (2026-07-11): the name pre-gate folded INTO the
// THE COUNTED PATH IS GONE (founder ruling 2026-08-10: sixty seconds, one
// input). There is no "step 1 of 3" because there is one step: the Critic runs
// on the one thing the user brought, and everything else is offered after they
// have a result. A step counter on a one-step flow is an admission that it is
// not one step.
type Phase = "critic" | "results";

// The honest Critic-run stages the AiPulse cycles through while the run is
// live. Plain words, no theater beyond what the run actually does.
/**
 * What the Critic is doing while a new account waits, said once and truthfully.
 *
 * This used to be three strings advanced on a 2400ms setInterval with no server
 * event behind them, so the first thing a brand-new user ever saw this product
 * do was narrate work on a timer. Worse, the interval was tied only to
 * `mFinish.isPending`, and the critic call's catch swallows its error, so the
 * full three-step performance also played when the critic had already failed
 * and there would be no review at the end of it.
 *
 * The founder's rule that a still label reads as a stalled one still applies, so
 * the motion stays. What changes is that the words no longer claim a sequence
 * nobody reported: one honest label, plus an elapsed count, which is the only
 * fact on this screen that cannot be wrong while the work is.
 */
const CRITIC_LABEL = "Reading your belief";

// Meridian input chrome: 36px control, the everyday r-ctl radius, the
// field-at-rest edge, token-traced text. The focus ring comes from the global
// :focus-visible rule; never removed here.
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 36,
  background: "var(--mrd-bg)",
  border: "1px solid var(--mrd-field)",
  borderRadius: "var(--mrd-r-ctl)",
  padding: "0 12px",
  color: "var(--mrd-ink)",
  fontFamily: "var(--mrd-font)",
  boxSizing: "border-box",
};

function Frame({
  eyebrow,
  heading,
  children,
  showTimer,
}: {
  eyebrow?: string;
  heading: string;
  children: React.ReactNode;
  showTimer?: string;
}) {
  return (
    <div
      style={{
        width: 600,
        maxWidth: "calc(100vw - 48px)",
        animation: "cadRise 0.3s var(--mrd-ease) both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          {eyebrow ? <MonoLabel style={{ marginBottom: 10 }}>{eyebrow}</MonoLabel> : null}
          <h1 className="text-heading-24" style={{ color: "var(--mrd-ink)", margin: 0 }}>
            {heading}
          </h1>
        </div>
        {showTimer ? (
          <div
            className="text-label-12-mono"
            style={{ color: "var(--mrd-body)", textAlign: "right" }}
          >
            {showTimer}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  );
}

// A full-width clickable card row (the data step's source/paste/demo
// choices). Meridian chrome: the lift ground for rest, lift-hover on hover,
// and the ground ladder's next stop on active; line edges, edge on hover.
// All state (hover, active, focus-visible) is CSS-driven for keyboard
// accessibility.
function ChoiceCard({
  onClick,
  disabled,
  busy,
  dimmed,
  children,
  ariaLabel,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  /** A connect/seed request is in flight for this row. */
  busy?: boolean;
  /** Unconfigured providers stay visible but visually recede. */
  dimmed?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  /** Plain-words explanation for a disabled row (contract: disabled pairs
   * with an explanation). */
  title?: string;
}) {
  const interactive = !disabled && !busy;
  return (
    <>
      <style>
        {`
          .choice-card-interactive {
            background-color: var(--mrd-lift);
            border-color: var(--mrd-line);
          }
          .choice-card-interactive:hover {
            background-color: var(--mrd-lift-hover);
            border-color: var(--mrd-edge);
          }
          .choice-card-interactive:active {
            background-color: var(--mrd-float);
          }
        `}
      </style>
      <button
        type="button"
        disabled={disabled}
        aria-busy={busy || undefined}
        aria-label={ariaLabel}
        title={title}
        onClick={onClick}
        className={interactive ? "choice-card-interactive" : ""}
        style={{
          textAlign: "left",
          width: "100%",
          padding: "13px 14px",
          borderRadius: "var(--mrd-r-ctl)",
          background: "var(--mrd-lift)",
          border: "1px solid var(--mrd-line)",
          opacity: dimmed ? 0.45 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--geist-space-3x)",
          cursor: interactive ? "pointer" : "default",
          transition:
            "background-color 0.2s var(--mrd-ease), border-color 0.2s var(--mrd-ease)",
        }}
      >
        {children}
      </button>
    </>
  );
}

// The Critic's confidence, animating in from zero when the verdict lands.
// Agent fill: confidence is the machine's own number. The global
// prefers-reduced-motion override collapses the transition.
function ConfidenceBar({ value }: { value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setWidth(Math.max(0, Math.min(1, value))));
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div
      role="meter"
      aria-label="Critic confidence"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.max(0, Math.min(1, value)) * 100)}
      style={{
        height: 4,
        borderRadius: 2,
        background: "var(--mrd-edge)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width * 100}%`,
          background: "var(--mrd-agent)",
          transition: "width 0.6s var(--mrd-ease)",
        }}
      />
    </div>
  );
}

// The product screen. Optional and post-outcome: a product name improves a
// teardown, it does not gate one.
// When the profile has no display name yet, the same screen asks for it
// first; one submit saves both, so the counted path stays three steps.
function ProductStep({
  needsName,
  busy,
  onDone,
}: {
  needsName: boolean;
  /** The parent's workspace seeding is in flight; if it fails, the parent
   * toasts and this flag drops, so the button re-enables for a retry instead
   * of holding a dead "Saving" state forever. */
  busy?: boolean;
  onDone: (name: string, oneLiner: string) => void;
}) {
  const fUpdate = useServerFn(updateProfile);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [productName, setProductName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const firstName = first.trim();
    if (needsName && !firstName) {
      toast.error("Add at least your first name");
      return;
    }
    const name = productName.trim();
    if (!name) {
      toast.error("Give your product a name");
      return;
    }
    setSaving(true);
    try {
      if (needsName) {
        const fullName = [firstName, last.trim()].filter(Boolean).join(" ");
        await fUpdate({ data: { full_name: fullName, display_name: firstName } });
        await supabase.auth.updateUser({
          data: { display_name: firstName, full_name: fullName },
        });
      }
      // PC-33: the one-liner is captured here but written to the Brief only
      // once a workspace is guaranteed to exist (ensureDefaultWorkspace's own
      // doc comment: a brand-new user reaches this exact screen before their
      // workspace_members row is reliable, so current_user_default_workspace()
      // can return null here). The write fires from the parent's
      // mSeedWorkspace.onSuccess instead, after seeding has resolved a real
      // workspace, not from this component.
      onDone(name, oneLiner.trim());
      // Hand the pending state to the parent's `busy` (the seed mutation): if
      // seeding fails, busy drops and the button comes back for a retry.
      setSaving(false);
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Could not save your details");
    }
  }

  const helpStyle: React.CSSProperties = {
    color: "var(--mrd-body)",
    marginTop: 20,
    marginBottom: 0,
    lineHeight: 1.55,
  };

  return (
    <Screen>
      <form onSubmit={save} style={{ width: 420, maxWidth: "calc(100vw - 48px)" }}>
        <MonoLabel style={{ marginBottom: 10 }}>OPTIONAL</MonoLabel>
        <h1 className="text-heading-24" style={{ color: "var(--mrd-ink)", margin: 0 }}>
          What are you building?
        </h1>
        <p className="text-copy-13" style={{ ...helpStyle, marginTop: 10 }}>
          A product name, feature, or bet. Supaprod will challenge your thinking and show its work.
        </p>
        {needsName ? (
          <>
            <p className="text-copy-13" style={helpStyle}>
              First, your name, so Supaprod signs every decision with you.
            </p>
            <div style={{ display: "flex", gap: "var(--geist-space-2x)", marginTop: 8 }}>
              <input
                autoFocus
                required
                aria-label="First name"
                placeholder="First name"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1, width: "auto" }}
              />
              <input
                aria-label="Last name"
                placeholder="Last name"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1, width: "auto" }}
              />
            </div>
          </>
        ) : null}
        <input
          autoFocus={!needsName}
          required
          aria-label="Product name"
          placeholder="e.g. Mobile capture, better notifications"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          style={{ ...INPUT_STYLE, marginTop: 20 }}
        />
        <p className="text-copy-13" style={helpStyle}>
          In one sentence, what does it do?
        </p>
        <input
          aria-label="One sentence description"
          placeholder="e.g. Turns customer conversations into a prioritized roadmap"
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          style={{ ...INPUT_STYLE, marginTop: 8 }}
        />
        <div style={{ marginTop: 16 }}>
          {/* TIER: Action, primary face. Submitting writes the profile and names
              the product - the whole point of this step. */}
          <Action type="submit" variant="primary" busy={saving || busy}>
            {saving || busy ? "Saving…" : "Continue"}
          </Action>
        </div>
      </form>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-screen-label="Onboarding"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--mrd-bg)",
        padding: "var(--geist-gap)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * The results screen's second action: put the verdict on the clipboard.
 *
 * Reuses `asPlainText`, the receipt formatter the public teardown page already
 * ships, so the text a new account pastes into a team channel is the same
 * receipt a stranger gets, footer and all. A blocked clipboard is reported as a
 * failure, never as a button that quietly does nothing.
 */
function CopyTeardown({ review }: { review: Parameters<typeof criticReviewAsShareable>[0] }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    // TIER: Action, quiet face. Performs the clipboard write with its own
    // failure state - not a reveal or a navigation.
    <Action
      variant="quiet"
      style={{ width: "100%" }}
      // Reports what the press DID, not what the button is.
      aria-live="polite"
      onClick={() => {
        // Not every context has a clipboard (an insecure origin has none at
        // all), and reading through it blind would throw inside the handler.
        const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
        if (!clipboard) {
          setState("failed");
          return;
        }
        void clipboard.writeText(asPlainText(criticReviewAsShareable(review))).then(
          () => {
            setState("copied");
            window.setTimeout(() => setState("idle"), 2400);
          },
          () => setState("failed"),
        );
      }}
    >
      {state === "copied"
        ? "Copied, paste it anywhere"
        : state === "failed"
          ? "Your browser blocked the clipboard"
          : "Copy this teardown"}
    </Action>
  );
}

export function ObsidianOnboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  const fGetProfile = useServerFn(getProfile);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fGetProfile() });
  // Folded into the product screen - no standalone pre-gate.
  const needsDetails =
    !!profileQ.data && !(profileQ.data.profile as { display_name?: string } | null)?.display_name;

  /* FIRST RUN STARTS AT THE ONE INPUT. Founder ruling 2026-08-10: sixty
   * seconds, one input.
   *
   * This used to open on `arrival` and walk arrival -> product -> data ->
   * critic -> results, so a person met three screens before anything happened
   * to them. Latency was never the constraint -- measured across 20,000+
   * ai_events, the heaviest substantive calls average 3.5 to 3.8 seconds -- the
   * PHASE COUNT was. Three screens of setup in front of a four-second answer.
   *
   * So the flow now opens where the value is. The user types the one thing they
   * care about, the Critic runs, and they leave with a real teardown of their
   * own idea rather than a tour. Everything that was asked before is asked
   * after, if at all: a product name improves the teardown and does not gate
   * it, and connecting data was already skippable and should never have stood
   * between a person and their first outcome.
   *
   * `arrival`, `product` and `data` are NOT deleted. They are reachable from
   * the result, which is where an ask has earned itself, and a saved phase
   * still restores exactly as before so a refresh mid-flow loses nothing. */
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "critic";
    const saved = window.sessionStorage.getItem("supaprod.onboarding.phase");
    return saved === "arrival" ||
      saved === "product" ||
      saved === "data" ||
      saved === "critic" ||
      saved === "results"
      ? (saved as Phase)
      : "critic";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("supaprod.onboarding.phase", phase);
  }, [phase]);

  /* PC-02 stopwatch. It was labelled "the 10-minute wedge promise" and there is
   * no such promise any more: the duration ruling of 2026-08-11 settled on ONE,
   * a minute, hedged as "usually" for the reasons written out beside the copy on
   * the critic screen below. A comment naming a retired number is how the wrong
   * number gets taught to the next reader, which is the whole reason that sweep
   * happened, so the number is out of here rather than merely stale.
   *
   * TWO THINGS THE NEXT PERSON SHOULD KNOW BEFORE TRUSTING THIS BLOCK.
   *
   * `elapsed` IS WRITTEN AND NEVER READ. Nothing renders it: `Frame` takes a
   * `showTimer` prop and no caller anywhere passes one, so this interval wakes
   * every 500 ms for the life of the screen, sets state, forces a re-render and
   * shows a person nothing. It is a dead stopwatch, not a displayed one.
   *
   * That is a LOGIC defect and it is deliberately not fixed here: this pass was
   * scoped to copy only while the phase state machine was being cut, and
   * deleting state is exactly the kind of change that collides. Left named
   * rather than silently tidied.
   *
   * The live counter a user actually sees is a different one: `criticStage`,
   * rendered by the AiPulse during the run, which counts real seconds. */
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<string>("0m 0s");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("supaprod.onboarding.startTime");
    if (!saved) {
      startTimeRef.current = Date.now();
      window.sessionStorage.setItem(
        "supaprod.onboarding.startTime",
        startTimeRef.current.toString(),
      );
    } else {
      startTimeRef.current = parseInt(saved, 10);
    }

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const deltaSec = Math.floor((now - startTimeRef.current) / 1000);
        const minutes = Math.floor(deltaSec / 60);
        const seconds = deltaSec % 60;
        setElapsed(`${minutes}m ${seconds}s`);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const [productName, setProductName] = useState<string>("");
  const [pendingOneLiner, setPendingOneLiner] = useState<string>("");
  const fUpsertBrief = useServerFn(upsertBriefItem);
  // Empty on purpose. See `beliefGuidance` above: nothing this user did not
  // write ever reaches the Critic.
  const [belief, setBelief] = useState<string>("");
  const [beliefTarget, setBeliefTarget] = useState<{ kind: "opportunity"; id: string } | null>(
    null,
  );
  /**
   * THE `any` HERE IS WHAT LET A FIELD THAT DOES NOT EXIST SHIP.
   *
   * This was `useState<any>`, and the handoff to Today below read
   * `review.challenges`. `CriticReview` (critic.server.ts:157-170) has
   * `summary`, `risks` and `missing_evidence` and no `challenges`, so that read
   * compiled, arrived `undefined`, and the block on the other side never
   * rendered once. Typed, the same line is a compile error.
   */
  const [criticReview, setCriticReview] = useState<CriticReview | null>(null);
  const [pasteNotes, setPasteNotes] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  // Where the belief box's contents came from, so the guidance line can only
  // describe what actually happened. See `beliefGuidance`.
  const [beliefSource, setBeliefSource] = useState<BeliefSource>("none");
  // Whether the belief the Critic ran on is genuinely on the record as an
  // opportunity. The failure screen promises exactly this ("nothing is lost"),
  // and it must not promise it on a run that never wrote a row.
  const [beliefIsOnRecord, setBeliefIsOnRecord] = useState(false);
  // What the paste step reported: it captures the whole document now, and a
  // capture that failed says so rather than pretending the PRD is filed.
  const [pasteNote, setPasteNote] = useState<string | null>(null);

  // The workspace this session created, straight from the seed call. The
  // ["workspaces"] query refetch that populates `activeWorkspace` lands some
  // time AFTER step 1, and every milestone fired in between was silently
  // dropped for want of an id. Server truth first, context second.
  const [seededWorkspaceId, setSeededWorkspaceId] = useState<string | null>(null);

  // PC-02: data source connections
  const fListConnections = useServerFn(listConnections);
  const fStartGithub = useServerFn(startGithubAppConnect);
  const fStartGateway = useServerFn(startGatewayConnect);
  const fSaveGateway = useServerFn(saveGatewayConnection);
  const fSuiteList = useServerFn(listMySuiteConnections);
  const fStartSuite = useServerFn(startSuiteConnect);
  const fStartNative = useServerFn(startNativeOAuthConnect);
  const fSeedEnabled = useServerFn(isDemoSeedEnabled);
  const fTriggerSeed = useServerFn(triggerWorkspaceSeed);
  const fListOpportunities = useServerFn(listOpportunities);

  /**
   * THREE QUERIES AND TWO HELPERS LIVED HERE AND NEVER RAN.
   *
   * `connectionsQ`, `suiteQ` and `seedEnabledQ` were each `enabled: phase ===
   * "data"`, and `data` was unreachable, so react-query never fired one of them.
   * `providers` and `isConnected` existed only to render the connector list
   * inside that same dead branch. All five typechecked, all five were exported
   * from nothing, and none of them had run since 2026-08-10.
   *
   * Removed with the branch rather than left behind it: a query that cannot run
   * still costs every reader of this file the time to work out when it would.
   */

  // Tracks the exact prefilled title so mFinish can tell "user kept the
  // suggestion" (evidence-linked critic) from "user typed their own belief"
  // (verbatim wedge teardown). Empty until this user's own workspace actually
  // hands us a title, so an untouched box can never read as a kept suggestion.
  const seededBeliefRef = useRef<string>("");

  /** The step-1 product name, echoed into the box and labelled as such. */
  function fallBackToProductName() {
    if (!productName) return;
    setBelief(productName);
    seededBeliefRef.current = productName;
    setBeliefSource("product-name");
  }

  async function afterConnected() {
    // Track data_connected milestone
    await trackMilestone("data_connected");

    // Pull a real opportunity out of THIS user's workspace to point the Critic
    // at. If there is none, fall back to the product name they typed, and to
    // an empty box if they typed none. Never to a canned belief.
    try {
      const { opportunities } = await fListOpportunities();
      // The FIRST bet this person actually owns. `opportunities` is ordered by
      // ice_score, and step 1's track seed put four sample rows in this
      // workspace with scores the user never chose, so the top row is reliably
      // one of ours. Pointing the Critic at it would be the deleted
      // FALLBACK_BELIEF wearing a database row. See `isSeededExampleTitle`.
      /**
       * THE FLAG FIRST, THE TITLE ONLY AS A FALLBACK.
       *
       * `isSeededExampleTitle` matches against the strings in track-seeds.ts,
       * which worked but rested on a convention. 2026-08-05 showed exactly how
       * that convention breaks: the same file also claims its seed projects are
       * named "Example: ...", and a live check found ZERO such projects, because
       * the prefix was added later and every existing row predates it. A rule
       * that lives in a string is one edit away from going quiet with no test
       * failing.
       *
       * `opportunities.is_sample` is now a column the row carries itself. It
       * survives a retitle, and the migration backfilled the 20 live rows that
       * predate it. The title check is kept behind it, not replaced by it, so a
       * row written before the column and missed by the backfill is still
       * caught. Either signal is enough to disqualify a bet from being treated
       * as one this person made.
       */
      const own = opportunities.find((o) => {
        const flagged = (o as { is_sample?: boolean | null }).is_sample === true;
        return typeof o.title === "string" && !flagged && !isSeededExampleTitle(o.title);
      });
      if (own) {
        setBelief(own.title);
        seededBeliefRef.current = own.title;
        setBeliefTarget({ kind: "opportunity", id: own.id });
        setBeliefSource("opportunity");
        // It is already a row; a failed Critic run loses nothing.
        setBeliefIsOnRecord(true);
      } else {
        fallBackToProductName();
      }
    } catch {
      // The read failed. Fall back to the product name this user typed, and to
      // nothing at all if they typed none.
      fallBackToProductName();
    }
    setPhase("critic");
  }

  const [connectingId, setConnectingId] = useState<ProviderId | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const mConnect = useMutation({
    mutationFn: async (spec: ProviderSpec) => {
      // SW-6/SW-7: every full-page-redirect flow here rides returnTo:
      // "onboarding" in the signed state, so its callback sends the user
      // back here (?connected=<id>) instead of stranding them on a
      // close-tab page meant for the Settings page's new-tab+poll flow.
      const suiteSpec = SUITE_PROVIDERS[spec.id];
      if (suiteSpec) {
        const { authorizeUrl } = await fStartSuite({
          data: { ...suiteSpec, returnTo: "onboarding" },
        });
        window.location.assign(authorizeUrl);
        return null;
      }
      if (spec.id === "github") {
        const { installUrl } = await fStartGithub({ data: { returnTo: "onboarding" } });
        window.location.assign(installUrl);
        return null;
      }
      if (spec.authMethods.some((m) => m.kind === "oauth_native")) {
        const { authorizeUrl } = await fStartNative({
          data: { provider: spec.id, returnTo: "onboarding" },
        });
        window.location.assign(authorizeUrl);
        return null;
      }
      const method = spec.authMethods.find((m) => m.kind === "oauth_gateway");
      if (!method || method.kind !== "oauth_gateway") {
        throw new Error(`${spec.label} does not support OAuth connect yet.`);
      }
      const result = await connectAppUser({
        connectorId: method.connectorId,
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: (targetOrigin) => fStartGateway({ data: { provider: spec.id, targetOrigin } }),
      });
      if (!result.success || !result.connectionId)
        throw new Error(result.error ?? "Connect failed");
      return fSaveGateway({ data: { provider: spec.id, connectionId: result.connectionId } });
    },
    onSuccess: async (r) => {
      if (r === null) return; // github redirect in flight
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["calendar-connections"] });
      await afterConnected();
    },
    onError: (e: Error) => setConnectError(e.message || "Could not reach that source"),
    onSettled: () => setConnectingId(null),
  });

  // The workspace this flow is writing to. `seededWorkspaceId` is the server's
  // answer from step 1 and is available immediately; `activeWorkspace` is the
  // context's, and only after its own query refetches. Preferring the first
  // removes the window where onboarding knew nothing about its own workspace.
  const workspaceId = seededWorkspaceId ?? activeWorkspace?.id ?? null;

  const mDemo = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("Workspace not ready yet");
      return fTriggerSeed({ data: { workspaceId } });
    },
    onSuccess: () => afterConnected(),
    onError: (e: Error) => setConnectError(e.message || "Could not seed the demo workspace"),
  });

  /**
   * "SUPAPROD WILL ANALYZE IT DIRECTLY" - AND THEN IT KEPT 200 CHARACTERS.
   *
   * The paste card offers a PRD as one of the three ways to feed the product,
   * and its handler was `setBelief(pasteNotes.slice(0, 200))`. Nothing was
   * written anywhere. A user who pasted eight pages of a spec had 200 characters
   * of it cut mid-sentence into the belief box and the rest dropped on the
   * floor, silently, with no row to show for it afterwards - the promise on the
   * card was simply false, and the loss was invisible.
   *
   * `createSignal` with kind "document" is the door that already exists for
   * exactly this material: it captures the body whole through the signal sink,
   * which is what gives it dedup, the manual `source_kind` stamp, a stage_events
   * trail and an embedding. The belief becomes the document's FIRST LINE (the
   * same rule the sink's own title uses) instead of an arbitrary 200-character
   * cut.
   *
   * Non-fatal: if the capture fails the user still goes to the Critic with their
   * text, and the screen says the document was not filed rather than implying it
   * was.
   */
  const fCreateSignal = useServerFn(createSignal);
  const mPaste = useMutation({
    mutationFn: async (raw: string) => {
      // The server validator caps the body at MAX_BODY_CHARS; sending more is a
      // rejected request rather than a truncated one, so the cut happens here
      // and gets reported instead of guessed at.
      const body = raw.trim().slice(0, MAX_BODY_CHARS);
      const overflow = Math.max(0, raw.trim().length - MAX_BODY_CHARS);
      const result = await fCreateSignal({
        data: { content: body, source: "paste", kind: "document" },
      });
      return { result, overflow };
    },
    onSuccess: ({ overflow }) => {
      setPasteNote(
        overflow > 0
          ? `Filed in your workspace. It was long, so the last ${overflow.toLocaleString()} characters were not kept.`
          : "Filed in your workspace, whole.",
      );
    },
    onError: (e: Error) => {
      setPasteNote(
        `Could not file this document (${e.message || "the write failed"}). Your bet still goes to the Critic; paste it again from Discover later.`,
      );
    },
  });

  const fRunCritic = useServerFn(runCriticReview);
  const fWedgeTeardown = useServerFn(runWedgeTeardown);
  const fComplete = useServerFn(completeOnboarding);
  const fRecordMilestone = useServerFn(recordOnboardingMilestone);

  // PC-02: Helper to track funnel milestone (async, non-blocking)
  async function trackMilestone(
    stage:
      "signup" | "product_named" | "data_connected" | "critic_completed" | "onboarding_completed",
    metadata?: Record<string, unknown>,
    /** For the caller that IS the moment the workspace came into existence and
     *  therefore holds an id no piece of state has caught up to yet. */
    explicitWorkspaceId?: string | null,
  ) {
    // A brand-new account has no workspace until step 1's seed creates one, and
    // the context's copy arrives later still, so this used to return here for
    // every real signup and drop `product_named` on the floor. `workspaceId`
    // prefers the id the seed call handed back. Still a guard, not a throw: a
    // milestone is never worth failing onboarding over.
    const target = explicitWorkspaceId ?? workspaceId;
    if (!target) return;
    try {
      await fRecordMilestone({
        data: { workspaceId: target, stage, metadata },
      });
    } catch (e) {
      console.error("[PC-02] trackMilestone failed:", e);
      // Non-critical: continue even if tracking fails
    }
  }

  /**
   * Release the first-run gate. Extracted so the Critic run is not the only
   * thing in this flow that can do it - see `mLeaveEarly`.
   *
   * Non-fatal by the same contract it always had: a user who has reached the
   * end of onboarding is finished whether or not the flag write succeeded, and
   * `needsOnboarding` fails open on a read error, so the worst case is being
   * shown this flow again rather than being locked out of the app.
   */
  async function finishOnboarding() {
    try {
      await fComplete({ data: {} });
      const { data } = await supabase.auth.getSession();
      if (data.session) await markOnboarded(data.session.user.id);
      await trackMilestone("onboarding_completed");
    } catch (e) {
      console.error("onboarding completion failed:", e);
    }
  }

  /** Clear the resume state and hand off to the app. */
  function leave() {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("supaprod.onboarding.phase");
      window.sessionStorage.removeItem("supaprod.onboarding.startTime");
      window.sessionStorage.setItem("supaprod.onboarding.justLanded", "1");
    }
    navigate({ to: "/today" });
  }

  /**
   * THE STEP THE USER COULD NOT LEAVE.
   *
   * Step 3 had exactly one control, and it disabled itself below three
   * characters. That was survivable while `FALLBACK_BELIEF` prefilled the box;
   * with the box now honestly empty it is a trap, and a closing one: onboarding
   * renders chromeless (no nav, no shortcuts - see _authenticated.tsx), the
   * phase is persisted to sessionStorage so a reload returns here, and the
   * first-run gate bounces any hand-typed URL straight back to /onboarding. A
   * new account that cleared the box to write its own bet and then hesitated
   * had no way into the product at all.
   *
   * So there is a second door, and it is honest about the trade: no verdict,
   * everything else kept. It never depends on the Critic, which is the one step
   * here that talks to a model and the one most likely to be slow or down on a
   * launch day.
   */
  const mLeaveEarly = useMutation({
    mutationFn: async () => {
      await finishOnboarding();
    },
    onSettled: () => leave(),
  });

  // Honest failure (2026-07-11): a failed Critic run is a FAILED state, never
  // an eternal spinner. The results screen reads this flag and offers Try
  // again / Continue instead of pretending to load.
  const [criticFailed, setCriticFailed] = useState(false);

  // Seconds elapsed since the Critic run started. Not stages: the comment here
  // still described the retired three-string performance on a 2400ms interval
  // long after the strings were replaced by a real count, which is how a stale
  // comment turns back into a stale feature. It counts, and only counts.
  const [criticStage, setCriticStage] = useState(0);

  // PC-02: run Critic and display results, then mark onboarded
  const mFinish = useMutation({
    mutationFn: async () => {
      setCriticFailed(false);
      const typed = belief.trim();
      const editedBelief =
        typed.length >= 3 && (!beliefTarget || typed !== seededBeliefRef.current);

      let review: CriticReview | null = null;
      try {
        if (editedBelief) {
          const result = await fWedgeTeardown({ data: { idea: typed.slice(0, 200) } });
          review = result?.review ?? null;
          // The wedge records the idea BEFORE it judges it, so once this
          // resolves the belief is genuinely a row and the failure screen is
          // allowed to say so. Reading the returned opportunity rather than
          // assuming it: only what came back is claimed.
          if (result?.opportunity?.id) setBeliefIsOnRecord(true);
        } else if (beliefTarget) {
          const result = await fRunCritic({
            data: { target_kind: beliefTarget.kind, target_id: beliefTarget.id },
          });
          review = result?.review ?? null;
        }
      } catch (e) {
        /* SWALLOWED, and it is the first thing this account ever asks us to do.
         *
         * console.error is not observability (the operating lesson from
         * 2026-08-02: error_events is). This catch is deliberately kept, because
         * a failed Critic must not block a new account from finishing
         * onboarding, but it was failing INVISIBLY: the caller went on to render
         * the working pulse and then simply had no review to show, and nobody
         * downstream could tell a critic that declined from a critic that broke.
         *
         * Recorded now, so the tenth occurrence is a number rather than a
         * discovery. Still non-fatal by design. */
        console.error("onboarding critic run failed:", e);
        // NOT recorded from here on purpose, and this is worth stating so the
        // next reader does not "fix" it the wrong way. `recordErrorEvent` lazy
        // imports the ADMIN Supabase client, so calling it from this client
        // component would fail in the browser. The right home for the receipt is
        // inside `runCritic` itself, which already runs on the server and knows
        // the workspace and user. Left as a named gap rather than a plausible
        // call that would throw.
      }

      // Track critic_completed milestone
      await trackMilestone("critic_completed", {
        verdict: review?.verdict,
        confidence: review?.confidence,
      });

      setCriticReview(review);
      // No verdict, or a verdict with nothing behind it, means the run did not
      // reach a review worth showing. Say so instead of stamping a bare word.
      // See `reviewHasSubstance`.
      setCriticFailed(!reviewHasSubstance(review));

      // Move to results display before marking onboarded
      setPhase("results");

      /**
       * THE SAME TEST THE LINE ABOVE USES. `criticFailed` is set from
       * `reviewHasSubstance(review)`, and this guard was bare truthiness six
       * lines later -- so a coerced shell (a verdict string, everything else
       * empty) counted as failed for the screen the person is looking at AND
       * as a real review for the one they land on next. Onboarding said the
       * Critic came back with nothing; Today then stamped a verdict.
       */
      if (review && reviewHasSubstance(review) && typeof window !== "undefined") {
        /**
         * THE HANDOFF CARRIES THE REVIEW, NOT ONE WORD OUT OF IT.
         *
         * This sent `challenges`, and there is no such field. `CriticReview`
         * (critic.server.ts:157-170) has `summary`, `risks` and
         * `missing_evidence`; `review` was `any`, so the read compiled, the key
         * was `undefined`, `JSON.stringify` dropped it, and Today's "Challenges
         * to consider" block never rendered for anyone. `confidence` crossed
         * and was never read on the other side.
         *
         * What crosses now is what the screen behind this line is showing: the
         * Critic's own sentence, the risks it named, the evidence it says is
         * missing. `reviewHasSubstance` guarantees at least one of those three
         * carries words, so the card on Today cannot be a heading over nothing.
         */
        window.sessionStorage.setItem(
          "supaprod.onboarding.criticReview",
          JSON.stringify({
            idea: typed.slice(0, 200),
            verdict: review.verdict,
            summary: review.summary,
            risks: review.risks,
            missing_evidence: review.missing_evidence,
            confidence: review.confidence,
          }),
        );
      }

      await finishOnboarding();
    },
    onError: (e) => {
      toast.error("Could not complete onboarding. Redirecting...");
      console.error("onboarding error:", e);
      window.sessionStorage.removeItem("supaprod.onboarding.phase");
      navigate({ to: "/today" });
    },
  });

  useEffect(() => {
    if (!mFinish.isPending) {
      setCriticStage(0);
      return;
    }
    // Counts real seconds instead of stepping through invented stages.
    const t = window.setInterval(() => setCriticStage((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [mFinish.isPending]);

  // PC-02: product name → data source flow, skip track selection
  /**
   * THE WORKSPACE SEED RAN FROM A BRANCH NOBODY WALKS.
   *
   * `seedWorkspaceForTrack("solo")` had exactly one caller, inside the `product`
   * phase, and `product` is unreachable. Read the phase machine rather than
   * trusting this paragraph: `useState<Phase>` initialises to `"critic"`
   * unconditionally, and the ONLY route to `arrival` is sessionStorage already
   * holding `"arrival"` — which can only happen if you had already been in
   * `arrival`. `arrival` is the only door to `product`, and `product` the only
   * door to `data`, so all three died together when the one-input change landed
   * on 2026-08-10. A comment left behind claimed those phases were "reachable
   * from the result"; the results screen renders two controls and neither goes
   * there.
   *
   * WHAT IT COST, and it is the whole first impression: a new account reached
   * `/today` with exactly ONE row — the opportunity the teardown had just
   * written. The positioning brief was never written, `display_name` was never
   * captured, and two of five funnel milestones never fired, all silently,
   * because the code that does those things typechecks and renders and is simply
   * never reached.
   *
   * SO IT FIRES ON MOUNT, unconditionally, rather than being re-hung off a
   * button. Re-adding "name your product" and "connect a source" to the results
   * screen was the other option and it is the wrong one: the declared P0 is a
   * real outcome in 60 seconds from one input, and the fix for a step nobody
   * reaches is not to put the step back in front of them. A populated workspace
   * is something the product can do for a person without asking.
   *
   * Guarded by a ref rather than by the mutation's own state, because
   * `isPending` is false on the first render and StrictMode mounts twice in
   * development — the two together are how "seed once" becomes "seed twice".
   * `seedWorkspaceForTrack` is idempotent on the server, so this is belt and
   * braces rather than the only thing standing between us and a double seed.
   */
  const seedFiredRef = useRef(false);

  const mSeedWorkspace = useMutation({
    mutationFn: async (track: OnboardingTrack) => {
      return fSeedTrack({ data: { track } });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      // The id the server just created, held directly rather than waited for.
      const seeded = (result as { workspaceId?: string | null } | undefined)?.workspaceId ?? null;
      if (seeded) setSeededWorkspaceId(seeded);
      // Track product_named milestone. Passed explicitly: this callback runs
      // BEFORE the setState above lands and before ["workspaces"] refetches, so
      // reading either would find null and drop the milestone - which is
      // precisely what used to happen, for every signup.
      void trackMilestone("product_named", { productName }, seeded);
      // PC-33: capture the one-liner as the initial positioning brief now
      // that seeding has resolved a real workspace. Best-effort only, same
      // non-fatal pattern as trackMilestone above - a Brief write must
      // never block or fail the onboarding flow.
      if (pendingOneLiner) {
        void fUpsertBrief({
          data: { kind: "positioning", title: productName, body: pendingOneLiner },
        }).catch((err) => {
          console.error("[PC-33] Brief pre-seed failed (non-fatal):", err);
        });
      }
      // NO PHASE MOVE. This used to send the person to data-source selection,
      // which no longer exists — and since the seed now fires on mount rather
      // than from a button, there is nobody standing on a screen waiting to be
      // moved off it. The seed finishing is a background fact, not a step.
    },
    onError: (e: Error) => toast.error(e.message || "Could not set up the workspace"),
  });
  const fSeedTrack = useServerFn(seedWorkspaceForTrack);

  /**
   * Fire it. See the block above `mSeedWorkspace` for why this is a mount effect
   * and not a button.
   *
   * Deliberately NOT gated on the phase. The whole defect was a seed that only
   * ran on one path, and re-gating it on `phase === "critic"` would rebuild that
   * failure the next time the phases move. Whoever opens onboarding gets a
   * populated workspace, whichever screen they land on.
   */
  useEffect(() => {
    if (seedFiredRef.current) return;
    seedFiredRef.current = true;
    mSeedWorkspace.mutate("solo");
    // Mount only. `mSeedWorkspace` is recreated every render, so listing it
    // would re-run this on every render and the ref would be the only thing
    // stopping a seed storm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SW-6/SW-7: returning from any full-page-redirect connect (GitHub App
  // install, or any native-OAuth/suite provider), the callback lands on
  // /onboarding?connected=<id>. Resume at the critic step with the freshly
  // seeded opportunity instead of restarting at arrival. Generalized beyond
  // "github" once every other connector also got a real OAuth redirect.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      resumedRef.current = true;
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["calendar-connections"] });
      void afterConnected();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (profileQ.isLoading)
    return (
      <Screen>
        <p className="text-label-13" style={{ color: "var(--mrd-body)" }}>
          Waking your workspace…
        </p>
      </Screen>
    );

  if (phase === "critic") {
    const running = mFinish.isPending;
    // The empty box is composed, not filled in with a stranger's bet: the
    // guidance line says what to write, the placeholder shows the shape, and
    // the disabled action says why it is disabled.
    const beliefTooShort = belief.trim().length < 3;
    return (
      <Screen>
        <Frame
          eyebrow="START HERE"
          // Present-progressive only once the run actually starts.
          heading={running ? "Challenging your thinking…" : "Challenge your thinking."}
        >
          <p
            className="text-copy-13"
            style={{ color: "var(--mrd-body)", margin: "0 0 10px", lineHeight: 1.55 }}
          >
            {beliefGuidance(beliefSource)}
          </p>
          {/* What the paste step actually managed to do with the document,
              said on the next screen because that is where the user is by the
              time it resolves. */}
          {pasteNote ? (
            <p
              className="text-label-12"
              style={{ color: "var(--mrd-mute)", margin: "0 0 10px", lineHeight: "var(--mrd-lh-snug)" }}
            >
              {pasteNote}
            </p>
          ) : null}
          {/* Named agent, not the wrong one. See the note on `beliefGuidance`:
              the aria-label is what a screen-reader user hears, and it said
              "the AI analyst" on the same screen as the button below that reads
              "Get the Critic's take". `challenge` is the Critic's own verb in
              agent-vocabulary.ts:75. */}
          <input
            autoFocus
            aria-label="Your key assumption the Critic will challenge"
            placeholder="Your key assumption that could be wrong"
            value={belief}
            disabled={running}
            onChange={(e) => setBelief(e.target.value)}
            style={{ ...INPUT_STYLE, opacity: running ? 0.6 : 1 }}
          />
          {running ? (
            // Critic-run theater: the glacier shimmer cycles the honest
            // stages of what the run is actually doing.
            <div style={{ marginTop: 14 }}>
              <AiPulse
                label={criticStage > 1 ? `${CRITIC_LABEL} · ${criticStage}s` : CRITIC_LABEL}
                state="working"
              />
            </div>
          ) : (
            /* THE ONE DURATION THIS PRODUCT PROMISES, AND WHY IT IS HEDGED.
             *
             * Founder ruling 2026-08-11, delegated: one duration, said the same
             * way on every surface, and it has to be the one the flow actually
             * keeps. Two were in the code and they disagreed by a factor of ten.
             * The arrival screen said "in the next 10 minutes" and named three
             * steps; the declared P0 and the 2026-08-10 one-input ruling both
             * said sixty seconds. Ten minutes lost outright: it was ten times
             * the typical truth AND it described a sequence nobody could reach,
             * since arrival, product and data were already dead by then and have
             * since been deleted.
             *
             * MEASURED 2026-08-11 against the one call that stands between a new
             * account and its verdict. `mFinish` runs `runWedgeTeardown`, which
             * records the idea and then calls `runCritic`; that call is logged
             * as surface `judge`, so it can be counted rather than estimated.
             * Broken out BY MODEL, because this path is not on the fast one:
             *
             *   select model, count(*), round(avg(latency_ms)),
             *          max(latency_ms)
             *   from ai_events
             *   where surface = 'judge' and status = 'ok' and latency_ms > 0
             *   group by model;
             *   -- gemini-2.5-pro    n=9    mean 20,628 ms  max 24,777 ms
             *   -- gemini-2.5-flash  n=638  mean  2,429 ms  max 18,930 ms
             *
             * `runCritic` asks for `gemini-2.5-pro` and only falls back to
             * flash, so THIS surface is the 20-second row, not the 2-second one.
             * Across all 716 judge calls ever made, none has exceeded 24.8 s and
             * none has crossed 30 s. So a minute is comfortably the typical
             * case, and "under a minute" is the same duration as the
             * sixty-second P0. It is also already the shipped wording on
             * /p/teardown, so the two surfaces that perform one act now make one
             * promise.
             *
             * "USUALLY" IS LOAD-BEARING AND MUST NOT BE DROPPED, and this is the
             * half that a happy-path reading misses. The number a flow can keep
             * is not the number it hits when everything works:
             *
             *   · A single model attempt is bounded at `MODEL_CALL_TIMEOUT_MS`
             *     = 90_000 (runtime.server.ts). One timeout alone overruns a
             *     minute by half, before anything else has been tried.
             *   · On RATE_LIMIT or SERVER_ERROR the runtime RETRIES with backoff,
             *     then walks an ordered fallback chain, and every entry in that
             *     chain gets its own 90 s ceiling. Nothing in the code bounds
             *     the TOTAL under a minute.
             *   · The primary model's sample is n=9. Nine runs cannot carry a
             *     hard latency guarantee for anyone.
             *   · 9 further attempts came back `blocked` with no verdict at all.
             *
             * So the unhedged forms ("in 60 seconds", "in under a minute") are
             * claims this repo cannot keep on a bad day, and a promise that
             * fails on a bad day is the same defect as a metric that cannot be
             * reproduced. docs/pitch/verified-numbers.md governs: where a number
             * cannot be established hard, the weaker form is the one that ships.
             *
             * The unfalsifiable half is already on screen: the AiPulse above
             * counts REAL elapsed seconds during the run, so a slow day tells
             * the truth in real time instead of being predicted at.
             *
             * "Receipts" is gone with the vocabulary ruling of 2026-08-11. The
             * word for what the Critic hands back is evidence, which is also
             * the field name it returns (`missing_evidence`). */
            <p
              className="text-label-12"
              style={{
                color: "var(--mrd-mute)",
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              Supaprod will show its work and the evidence under it, usually in under a minute.
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            {/* TIER: Action, primary face. Dispatches the Critic run - the whole
                point of this screen. busy carries the run; disabled keeps the
                too-short guard, so the explanation below stays truthful. */}
            <Action
              variant="primary"
              busy={running}
              disabled={beliefTooShort}
              // Disabled pairs with an explanation, always.
              title={
                !running && beliefTooShort ? "Write the bet you want challenged first" : undefined
              }
              onClick={() => mFinish.mutate()}
              style={{ width: "100%" }}
            >
              {running ? "Analyzing…" : "Get the Critic's take"}
            </Action>
          </div>
          {/* THE WAY OUT. See `mLeaveEarly`: without this the only control on
              this screen disables itself on an empty box, and onboarding is
              chromeless behind a gate that redirects every other route back
              here. Hidden while the run is live so it cannot race it. */}
          {!running ? (
            <div style={{ marginTop: 10 }}>
              {/* TIER: Action, quiet face. Completes onboarding and leaves - the
                  secondary door, not the screen's point. */}
              <Action
                variant="quiet"
                busy={mLeaveEarly.isPending}
                onClick={() => mLeaveEarly.mutate()}
                style={{ width: "100%" }}
              >
                {mLeaveEarly.isPending
                  ? "Opening your workspace…"
                  : "Skip this and go to your workspace"}
              </Action>
              <p
                className="text-label-12"
                style={{ color: "var(--mrd-mute)", marginTop: 8, marginBottom: 0 }}
              >
                No verdict yet. Everything you set up is kept, and the Critic is on every bet
                inside.
              </p>
            </div>
          ) : null}
        </Frame>
      </Screen>
    );
  }

  // phase === "results" - show Critic findings + brain warming signals
  if (phase === "results") {
    const verdict: string = criticReview?.verdict ?? VERDICT_WHEN_UNSTATED;
    /* The verdict stamp speaks Meridian's status law: pass, fail, hold. The
     * pale Tempo washes (ds-*-100) became the chip grounds, which are the one
     * tinted-block pair Meridian measures in both grounds; the stamp word takes
     * the hue itself, which is its own drawn edge on the chip. */
    const verdictColor =
      verdict === "ship"
        ? "var(--mrd-pass)"
        : verdict === "kill"
          ? "var(--mrd-fail)"
          : "var(--mrd-hold)";
    const verdictBg =
      verdict === "ship"
        ? "var(--mrd-pass-chip)"
        : verdict === "kill"
          ? "var(--mrd-fail-chip)"
          : "var(--mrd-hold-chip)";
    const verdictBorder =
      verdict === "ship"
        ? "var(--mrd-pass)"
        : verdict === "kill"
          ? "var(--mrd-fail)"
          : "var(--mrd-hold)";
    const sectionLabel: React.CSSProperties = {
      color: "var(--mrd-body)",
      margin: 0,
      marginBottom: 8,
      textTransform: "uppercase",
      fontWeight: 550,
      letterSpacing: "0.06em",
    };

    // ONE test, in all three places that used to ask it differently. The render
    // asked `criticReview && !criticFailed`, the flag asked `review === null`,
    // and the copy action asked nothing at all, so a review with a verdict and
    // no content took the success branch. See `reviewHasSubstance`.
    //
    // It holds the REVIEW rather than a boolean now that `criticReview` is
    // `CriticReview | null` instead of `any`: a boolean cannot narrow it, and
    // every field the branch below prints has to be one the type says exists.
    // That is the check that was absent when this screen sent Today a field
    // called `challenges`.
    const shown: CriticReview | null =
      !criticFailed && reviewHasSubstance(criticReview) ? criticReview : null;

    return (
      <Screen>
        <Frame
          heading={
            shown
              ? "Here's what Supaprod found."
              : criticReview
                ? "The Critic came back with nothing to show."
                : "The Critic couldn't finish this run."
          }
        >
          {shown ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Verdict stamp - the results screen's one Geist Pixel brand
                  moment, landing with the confidence bar below. */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--mrd-r-ctl)",
                  background: verdictBg,
                  border: `1px solid ${verdictBorder}`,
                  animation: "cadRise 0.4s var(--mrd-ease) both",
                  transform: "scale(1)",
                  transformOrigin: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--mrd-face-brand)",
                    fontSize: "30px",
                    lineHeight: 1.2,
                    textTransform: "uppercase",
                    color: verdictColor,
                    letterSpacing: "0.05em",
                  }}
                >
                  {verdict}
                </p>
                {shown.summary ? (
                  <p
                    className="text-copy-13"
                    style={{ color: "var(--mrd-body)", margin: "6px 0 0" }}
                  >
                    {shown.summary}
                  </p>
                ) : null}
              </div>

              {/* Brain warming: risks + evidence */}
              {(shown.risks ?? []).length > 0 ? (
                <div>
                  <p style={sectionLabel}>Key risks</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(shown.risks ?? []).slice(0, 3).map((risk: string, i: number) => (
                      <div
                        key={i}
                        className="text-label-12"
                        style={{ color: "var(--mrd-body)", lineHeight: "var(--mrd-lh-snug)" }}
                      >
                        • {risk}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Missing evidence / precedent */}
              {(shown.missing_evidence ?? []).length > 0 ? (
                <div>
                  <p style={sectionLabel}>What you need to test</p>
                  <div
                    className="text-label-12"
                    style={{ color: "var(--mrd-body)", lineHeight: 1.5 }}
                  >
                    {shown.missing_evidence[0]}
                  </div>
                </div>
              ) : null}

              {/* Confidence, animating in with the verdict */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--mrd-r-ctl)",
                  background: "var(--mrd-lift)",
                  animation: "cadRise 0.5s var(--mrd-ease) 0.1s both",
                  opacity: 0,
                }}
              >
                <p style={{ ...sectionLabel, marginBottom: 4 }}>Confidence</p>
                <ConfidenceBar value={shown.confidence ?? 0.5} />
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--geist-space-2x)",
                }}
              >
                {/* TIER: stays plain. Navigation only - leave() changes nothing
                    in the record, it moves you to /today. */}
                <button
                  type="button"
                  onClick={leave}
                  className="w-full rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-3 py-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover"
                >
                  Go to your workspace
                </button>
                {/* THE MOST SHAREABLE THING A REAL USER EVER GETS FROM US, AND
                    IT HAD NO WAY OUT OF THIS SCREEN.
                    A verdict on the user's own bet, about a minute after signup,
                    and the only action was to walk away from it. The public
                    /p/teardown page has shipped copy-to-share for a stranger's
                    pasted document since RPT-03; the account holder looking at
                    a verdict on their own words had nothing. Same formatter,
                    same promise: it copies rather than minting a link, because
                    a share URL would mean persisting and publishing the review,
                    which is the founder's call, not a side effect of a button. */}
                <CopyTeardown review={shown} />
              </div>
            </div>
          ) : (
            // Honest failure: failed is not loading. Say what happened, offer
            // a retry, and let the user move on with their belief kept.
            //
            // "Your belief is saved as an opportunity" was stated
            // unconditionally, including on the run where the write is the very
            // thing that failed. `beliefIsOnRecord` is set only when a row came
            // back, so the reassurance is now a fact rather than a hope.
            <div>
              <p
                className="text-copy-13"
                style={{ color: "var(--mrd-body)", margin: 0, maxWidth: 460 }}
              >
                {criticReview
                  ? "The run finished but returned no findings, so there is nothing worth stamping a verdict on."
                  : "The run hit an error before it could reach a verdict."}{" "}
                {beliefIsOnRecord
                  ? "Your belief is saved as an opportunity, so nothing is lost."
                  : "Your belief was not saved, so try again or take it into your workspace."}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "var(--geist-space-2x)",
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                {/* TIER: Action, primary face. Re-dispatches the failed Critic
                    run - the forward path this screen offers. */}
                <Action
                  variant="primary"
                  busy={mFinish.isPending}
                  onClick={() => {
                    setPhase("critic");
                    mFinish.mutate();
                  }}
                >
                  Try again
                </Action>
                {/* TIER: stays plain. Navigation only - it leaves for /today and
                    writes nothing. */}
                <button
                  type="button"
                  onClick={leave}
                  className="rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-3 py-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover"
                >
                  {beliefIsOnRecord
                    ? "Continue - your belief is saved as an opportunity"
                    : "Continue to your workspace"}
                </button>
              </div>
            </div>
          )}
        </Frame>
      </Screen>
    );
  }

  return null;
}

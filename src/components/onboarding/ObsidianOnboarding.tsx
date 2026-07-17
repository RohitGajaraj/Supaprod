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
import { Button, MonoLabel } from "@/components/obsidian";
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
import { runCriticReview, runWedgeTeardown, listOpportunities } from "@/lib/discovery.functions";
import { markOnboarded } from "@/lib/onboarding-gate";
import { useWorkspace } from "@/hooks/use-workspace";
import { ArrivalMark } from "@/components/onboarding/ArrivalButterfly";
import { AiPulse } from "@/components/obsidian/AiPulse";

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
export const FALLBACK_BELIEF = "Mobile capture is our biggest gap";

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
// product screen, so the counted path is exactly STEP 1 OF 3 (product) ->
// STEP 2 OF 3 (data) -> STEP 3 OF 3 (critic), then results.
type Phase = "arrival" | "product" | "data" | "critic" | "results";

// The honest Critic-run stages the AiPulse cycles through while the run is
// live. Plain words, no theater beyond what the run actually does.
const CRITIC_STAGES = ["Reading your belief", "Hunting counter-evidence", "Scoring confidence"];

// Tempo v5 input chrome: 36px medium control, 6px everyday radius, gray-400
// border, token-traced text. Focus ring comes from the global
// [data-obsidian] :focus-visible rule; never removed here.
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: "var(--ds-size-medium)",
  background: "var(--ds-background-100)",
  border: "1px solid var(--ds-gray-400)",
  borderRadius: "var(--ds-radius-small)",
  padding: "0 12px",
  color: "var(--ds-gray-1000)",
  fontSize: "13px",
  fontFamily: "var(--font-sans)",
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
        animation: "cadRise 0.3s var(--ds-motion-timing-swift) both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          {eyebrow ? <MonoLabel style={{ marginBottom: 10 }}>{eyebrow}</MonoLabel> : null}
          <h1 className="text-heading-24" style={{ color: "var(--ds-gray-1000)", margin: 0 }}>
            {heading}
          </h1>
        </div>
        {showTimer ? (
          <div
            className="text-label-12-mono"
            style={{ color: "var(--ds-gray-900)", textAlign: "right" }}
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
// choices). Tempo chrome: gray 100/200/300 for default/hover/active, 6px
// radius, alpha borders; the global focus-visible ring applies. All state
// (hover, active, focus-visible) is CSS-driven for keyboard accessibility.
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
    <button
      type="button"
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        padding: "13px 14px",
        borderRadius: "var(--ds-radius-small)",
        background: "var(--ds-gray-100)",
        border: "1px solid var(--ds-gray-alpha-400)",
        opacity: dimmed ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        cursor: interactive ? "pointer" : "default",
        transition:
          "background-color 0.2s var(--ds-motion-timing-swift), border-color 0.2s var(--ds-motion-timing-swift)",
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--ds-gray-200)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ds-gray-alpha-500)";
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--ds-gray-100)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ds-gray-alpha-400)";
        }
      }}
      onMouseDown={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--ds-gray-300)";
        }
      }}
      onMouseUp={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--ds-gray-200)";
        }
      }}
    >
      {children}
    </button>
  );
}

// The Critic's confidence, animating in from zero when the verdict lands.
// Glacier fill: confidence is the machine's own number. The global
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
        background: "var(--ds-gray-alpha-400)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width * 100}%`,
          background: "var(--ds-blue-600)",
          transition: "width 0.6s var(--ds-motion-timing-swift)",
        }}
      />
    </div>
  );
}

// STEP 1 OF 3 - the product screen, with the old name pre-gate folded in.
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
    color: "var(--ds-gray-900)",
    marginTop: 20,
    marginBottom: 0,
    lineHeight: 1.55,
  };

  return (
    <Screen>
      <form onSubmit={save} style={{ width: 420, maxWidth: "calc(100vw - 48px)" }}>
        <MonoLabel style={{ marginBottom: 10 }}>STEP 1 OF 3</MonoLabel>
        <h1 className="text-heading-24" style={{ color: "var(--ds-gray-1000)", margin: 0 }}>
          What are you building?
        </h1>
        <p className="text-copy-13" style={{ ...helpStyle, marginTop: 10 }}>
          A product name, feature, or bet. Cadence will challenge your thinking and show its work.
        </p>
        {needsName ? (
          <>
            <p className="text-copy-13" style={helpStyle}>
              First, your name, so Cadence signs every decision with you.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
          <Button
            type="submit"
            variant="primary"
            disabled={saving || busy}
            loading={saving || busy}
          >
            {saving || busy ? "Saving…" : "Continue"}
          </Button>
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
        background: "var(--ds-background-100)",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

export function ObsidianOnboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  const fGetProfile = useServerFn(getProfile);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fGetProfile() });
  // Folded into STEP 1 OF 3 (the product screen) - no standalone pre-gate.
  const needsDetails =
    !!profileQ.data && !(profileQ.data.profile as { display_name?: string } | null)?.display_name;

  // PC-02: phase state persists for tab refresh resilience
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "arrival";
    const saved = window.sessionStorage.getItem("cadence.onboarding.phase");
    return saved === "product" || saved === "data" || saved === "critic" || saved === "results"
      ? (saved as Phase)
      : "arrival";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("cadence.onboarding.phase", phase);
  }, [phase]);

  // PC-02: stopwatch timer for the "10-minute wedge" promise
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<string>("0m 0s");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("cadence.onboarding.startTime");
    if (!saved) {
      startTimeRef.current = Date.now();
      window.sessionStorage.setItem(
        "cadence.onboarding.startTime",
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
  const [belief, setBelief] = useState<string>(FALLBACK_BELIEF);
  const [beliefTarget, setBeliefTarget] = useState<{ kind: "opportunity"; id: string } | null>(
    null,
  );
  const [criticReview, setCriticReview] = useState<any>(null);
  const [pasteNotes, setPasteNotes] = useState("");
  const [showPaste, setShowPaste] = useState(false);

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

  const connectionsQ = useQuery({
    queryKey: ["connections"],
    queryFn: () => fListConnections(),
    enabled: phase === "data",
  });
  const suiteQ = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: () => fSuiteList(),
    enabled: phase === "data",
  });
  const seedEnabledQ = useQuery({
    queryKey: ["demo-seed-enabled"],
    queryFn: () => fSeedEnabled(),
    enabled: phase === "data",
  });

  const providers = Object.values(CONNECTOR_REGISTRY).filter((s) => s.userFacing !== false);
  function isConnected(spec: ProviderSpec): boolean {
    const suiteSpec = SUITE_PROVIDERS[spec.id];
    if (suiteSpec) {
      return (suiteQ.data?.connections ?? []).some(
        (c) => c.provider === suiteSpec.provider && c.product === suiteSpec.product,
      );
    }
    return (connectionsQ.data?.connections ?? []).some(
      (c) => c.provider === spec.id && c.status === "connected",
    );
  }

  // Tracks the exact prefilled title so mFinish can tell "user kept the
  // suggestion" (evidence-linked critic) from "user typed their own belief"
  // (verbatim wedge teardown).
  const seededBeliefRef = useRef<string>(FALLBACK_BELIEF);

  async function afterConnected() {
    // Track data_connected milestone
    await trackMilestone("data_connected");

    // Pull a real seeded/connected opportunity to point the Critic at; fall
    // back to the product belief if the workspace has none yet.
    try {
      const { opportunities } = await fListOpportunities();
      if (opportunities[0]) {
        setBelief(opportunities[0].title);
        seededBeliefRef.current = opportunities[0].title;
        setBeliefTarget({ kind: "opportunity", id: opportunities[0].id });
      } else if (productName) {
        setBelief(productName);
        seededBeliefRef.current = productName;
      }
    } catch {
      // Fall back to product name or constant belief
      if (productName) {
        setBelief(productName);
        seededBeliefRef.current = productName;
      }
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

  const mDemo = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) throw new Error("Workspace not ready yet");
      return fTriggerSeed({ data: { workspaceId: activeWorkspace.id } });
    },
    onSuccess: () => afterConnected(),
    onError: (e: Error) => setConnectError(e.message || "Could not seed the demo workspace"),
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
  ) {
    if (!activeWorkspace?.id) return;
    try {
      await fRecordMilestone({
        data: { workspaceId: activeWorkspace.id, stage, metadata },
      });
    } catch (e) {
      console.error("[PC-02] trackMilestone failed:", e);
      // Non-critical: continue even if tracking fails
    }
  }

  // Honest failure (2026-07-11): a failed Critic run is a FAILED state, never
  // an eternal spinner. The results screen reads this flag and offers Try
  // again / Continue instead of pretending to load.
  const [criticFailed, setCriticFailed] = useState(false);

  // Critic-run theater: the AiPulse cycles the honest stages while the run
  // is live, advancing every 2.4s and holding on the last stage.
  const [criticStage, setCriticStage] = useState(0);

  // PC-02: run Critic and display results, then mark onboarded
  const mFinish = useMutation({
    mutationFn: async () => {
      setCriticFailed(false);
      const typed = belief.trim();
      const editedBelief =
        typed.length >= 3 && (!beliefTarget || typed !== seededBeliefRef.current);

      let review: any = null;
      try {
        if (editedBelief) {
          const result = await fWedgeTeardown({ data: { idea: typed.slice(0, 200) } });
          review = result?.review ?? null;
        } else if (beliefTarget) {
          const result = await fRunCritic({
            data: { target_kind: beliefTarget.kind, target_id: beliefTarget.id },
          });
          review = result?.review ?? null;
        }
      } catch (e) {
        console.error("onboarding critic run failed:", e);
      }

      // Track critic_completed milestone
      await trackMilestone("critic_completed", {
        verdict: review?.verdict,
        confidence: review?.confidence,
      });

      setCriticReview(review);
      // No verdict = the run did not finish. Say so instead of spinning.
      setCriticFailed(review === null);

      // Move to results display before marking onboarded
      setPhase("results");

      // Complete onboarding in the background
      try {
        await fComplete({ data: {} });
        const { data } = await supabase.auth.getSession();
        if (data.session) await markOnboarded(data.session.user.id);

        // Track onboarding_completed milestone
        await trackMilestone("onboarding_completed");
      } catch (e) {
        console.error("onboarding completion failed:", e);
      }
    },
    onError: (e) => {
      toast.error("Could not complete onboarding. Redirecting...");
      console.error("onboarding error:", e);
      window.sessionStorage.removeItem("cadence.onboarding.phase");
      navigate({ to: "/today" });
    },
  });

  useEffect(() => {
    if (!mFinish.isPending) {
      setCriticStage(0);
      return;
    }
    const t = window.setInterval(
      () => setCriticStage((s) => Math.min(s + 1, CRITIC_STAGES.length - 1)),
      2400,
    );
    return () => window.clearInterval(t);
  }, [mFinish.isPending]);

  // PC-02: product name → data source flow, skip track selection
  const mSeedWorkspace = useMutation({
    mutationFn: async (track: OnboardingTrack) => {
      return fSeedTrack({ data: { track } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      // Track product_named milestone
      void trackMilestone("product_named", { productName });
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
      // Move directly to data source selection, skipping explicit track choice
      setPhase("data");
    },
    onError: (e: Error) => toast.error(e.message || "Could not set up the workspace"),
  });
  const fSeedTrack = useServerFn(seedWorkspaceForTrack);

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
        <p className="text-label-13" style={{ color: "var(--ds-gray-900)" }}>
          Waking your workspace…
        </p>
      </Screen>
    );

  if (phase === "arrival") {
    return (
      <Screen>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <ArrivalMark />
          {/* Geist Pixel brand moment (DESIGN-TEMPO.md SS3/SS8): the arrival
              headline is this surface's one hero moment - a single line
              shown once, first thing a new user sees. */}
          <p
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: 34,
              lineHeight: 1.15,
              color: "var(--ds-gray-1000)",
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            Judgment, with receipts.
          </p>
          <p
            className="text-copy-13"
            style={{ color: "var(--ds-gray-900)", marginTop: 12, maxWidth: 380 }}
          >
            In the next 10 minutes: name your product, give Cadence one data point, and see what it
            thinks. Receipts included.
          </p>
          <div style={{ marginTop: 24 }}>
            <Button
              variant="primary"
              onClick={() => {
                setPhase("product");
              }}
            >
              Start
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === "product") {
    return (
      <ProductStep
        needsName={needsDetails}
        busy={mSeedWorkspace.isPending}
        onDone={(name, oneLiner) => {
          setProductName(name);
          setPendingOneLiner(oneLiner);
          // Auto-seed workspace with default track ("solo") for new accounts
          mSeedWorkspace.mutate("solo");
        }}
      />
    );
  }

  if (phase === "data") {
    const seedLive = !!seedEnabledQ.data?.enabled;
    return (
      <Screen>
        <Frame eyebrow="STEP 2 OF 3" heading="What should Cadence read?" showTimer={elapsed}>
          {!showPaste ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* While the availability reads are in flight, say so - without
                  this, every row rendered dimmed as "not set up", a loading
                  state wearing a disabled state's clothes. */}
              {connectionsQ.isLoading || suiteQ.isLoading ? (
                <AiPulse label="Checking your sources" />
              ) : null}
              {/* A failed availability read is an ERROR, not an empty list of
                  configured sources: name the cause, offer the one action. */}
              {connectionsQ.isError || suiteQ.isError ? (
                <div
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--ds-radius-small)",
                    background: "var(--ds-red-100)",
                    border: "1px solid var(--ds-red-400)",
                  }}
                >
                  <span
                    className="text-label-12"
                    style={{ color: "var(--ds-red-900)", lineHeight: 1.5 }}
                  >
                    Could not load your sources. Check your connection.
                  </span>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      if (connectionsQ.isError) void connectionsQ.refetch();
                      if (suiteQ.isError) void suiteQ.refetch();
                    }}
                  >
                    Try again
                  </Button>
                </div>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {providers.slice(0, 5).map((spec) => {
                  const on = isConnected(spec);
                  const configured =
                    connectionsQ.data?.providerAvailability?.[spec.id]?.configured ?? false;
                  const busy = connectingId === spec.id && mConnect.isPending;
                  const estimate = timeEstimateFor(spec.id);
                  return (
                    <ChoiceCard
                      key={spec.id}
                      disabled={on || busy || !configured}
                      busy={busy}
                      dimmed={!configured && !on}
                      title={
                        !configured && !on
                          ? `${spec.label} is not set up on this workspace yet`
                          : undefined
                      }
                      ariaLabel={on ? `${spec.label} connected` : `Connect ${spec.label}`}
                      onClick={() => {
                        setConnectError(null);
                        setConnectingId(spec.id);
                        mConnect.mutate(spec);
                      }}
                    >
                      <span>
                        <span className="text-heading-14" style={{ color: "var(--ds-gray-1000)" }}>
                          {spec.label}
                        </span>
                        <MonoLabel style={{ display: "block", marginTop: 3 }}>
                          {estimate.toUpperCase()}
                        </MonoLabel>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-label-12-mono"
                        style={{ color: "var(--ds-gray-700)" }}
                      >
                        {on ? "✓" : busy ? "…" : "→"}
                      </span>
                    </ChoiceCard>
                  );
                })}
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--ds-gray-alpha-400)",
                  paddingTop: 12,
                  marginTop: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <ChoiceCard onClick={() => setShowPaste(true)}>
                  <span>
                    <span className="text-heading-14" style={{ color: "var(--ds-gray-1000)" }}>
                      Or paste your notes
                    </span>
                    <span
                      className="text-label-12"
                      style={{
                        display: "block",
                        color: "var(--ds-gray-600)",
                        marginTop: 3,
                      }}
                    >
                      Paste a PRD, product notes, or your bet · Cadence will analyze it directly.
                    </span>
                  </span>
                </ChoiceCard>

                {seedLive ? (
                  <ChoiceCard
                    busy={mDemo.isPending}
                    disabled={mDemo.isPending}
                    onClick={() => {
                      setConnectError(null);
                      mDemo.mutate();
                    }}
                  >
                    <span>
                      <span className="text-heading-14" style={{ color: "var(--ds-gray-1000)" }}>
                        Watch it on demo data first
                      </span>
                      <span
                        className="text-label-12"
                        style={{
                          display: "block",
                          color: "var(--ds-gray-600)",
                          marginTop: 3,
                        }}
                      >
                        Swap in your own sources any time.
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-label-12-mono"
                      style={{ color: "var(--ds-gray-700)" }}
                    >
                      {mDemo.isPending ? "…" : "→"}
                    </span>
                  </ChoiceCard>
                ) : null}
              </div>

              {mDemo.isPending ? (
                <AiPulse label="Seeding demo data" style={{ marginTop: 4 }} />
              ) : null}

              {connectError ? (
                <p
                  role="alert"
                  className="text-label-12"
                  style={{ color: "var(--ds-red-900)", marginTop: 4 }}
                >
                  {connectError} · try a different source
                </p>
              ) : null}

              <div style={{ marginTop: 10 }}>
                <Button
                  variant="tertiary"
                  onClick={() => {
                    void afterConnected();
                  }}
                >
                  Or skip and connect later
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <textarea
                autoFocus
                aria-label="Paste your notes"
                value={pasteNotes}
                onChange={(e) => setPasteNotes(e.target.value)}
                placeholder="Paste your product notes, PRD, or the bet you want to challenge..."
                style={{
                  width: "100%",
                  minHeight: 180,
                  background: "var(--ds-background-100)",
                  border: "1px solid var(--ds-gray-400)",
                  borderRadius: "var(--ds-radius-small)",
                  padding: "10px 12px",
                  color: "var(--ds-gray-1000)",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button
                  variant="primary"
                  disabled={!pasteNotes.trim()}
                  title={!pasteNotes.trim() ? "Paste some notes first" : undefined}
                  onClick={() => {
                    if (pasteNotes.trim()) {
                      setBelief(pasteNotes.slice(0, 200));
                      seededBeliefRef.current = pasteNotes.slice(0, 200);
                      setPhase("critic");
                    }
                  }}
                >
                  Use these notes
                </Button>
                <Button variant="tertiary" onClick={() => setShowPaste(false)}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </Frame>
      </Screen>
    );
  }

  if (phase === "critic") {
    const running = mFinish.isPending;
    return (
      <Screen>
        <Frame
          eyebrow="STEP 3 OF 3"
          // Present-progressive only once the run actually starts.
          heading={running ? "Challenging your thinking…" : "Challenge your thinking."}
          showTimer={elapsed}
        >
          <input
            aria-label="The belief the Critic will challenge"
            value={belief}
            disabled={running}
            onChange={(e) => setBelief(e.target.value)}
            style={{ ...INPUT_STYLE, fontSize: "13.5px", opacity: running ? 0.6 : 1 }}
          />
          {running ? (
            // Critic-run theater: the glacier shimmer cycles the honest
            // stages of what the run is actually doing.
            <div style={{ marginTop: 14 }}>
              <AiPulse label={CRITIC_STAGES[criticStage]} state="working" />
            </div>
          ) : (
            <p
              className="text-label-12"
              style={{
                color: "var(--ds-gray-700)",
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              Cadence will show its work with receipts.
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <Button
              variant="primary"
              disabled={running || belief.trim().length < 3}
              onClick={() => mFinish.mutate()}
              style={{ width: "100%" }}
            >
              {running ? "Analyzing…" : "Get the Critic's take"}
            </Button>
          </div>
        </Frame>
      </Screen>
    );
  }

  // phase === "results" - show Critic findings + brain warming signals
  if (phase === "results") {
    const verdict: string = criticReview?.verdict ?? "hold";
    const verdictColor =
      verdict === "ship"
        ? "var(--ds-green-900)"
        : verdict === "kill"
          ? "var(--ds-red-900)"
          : "var(--ds-amber-900)";
    const verdictBg =
      verdict === "ship"
        ? "var(--ds-green-100)"
        : verdict === "kill"
          ? "var(--ds-red-100)"
          : "var(--ds-amber-100)";
    const verdictBorder =
      verdict === "ship"
        ? "var(--ds-green-400)"
        : verdict === "kill"
          ? "var(--ds-red-400)"
          : "var(--ds-amber-400)";
    const sectionLabel: React.CSSProperties = {
      color: "var(--ds-gray-900)",
      margin: 0,
      marginBottom: 8,
      textTransform: "uppercase",
      fontWeight: 550,
      letterSpacing: "0.06em",
      fontSize: "11px",
    };

    function leave() {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("cadence.onboarding.phase");
        window.sessionStorage.removeItem("cadence.onboarding.startTime");
        window.sessionStorage.setItem("cadence.onboarding.justLanded", "1");
      }
      navigate({ to: "/today" });
    }

    return (
      <Screen>
        <Frame
          heading={
            criticFailed || !criticReview
              ? "The Critic couldn't finish this run."
              : "Here's what Cadence found."
          }
          showTimer={elapsed}
        >
          {criticReview && !criticFailed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Verdict stamp - the results screen's one Geist Pixel brand
                  moment, landing with the confidence bar below. */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--ds-radius-small)",
                  background: verdictBg,
                  border: `1px solid ${verdictBorder}`,
                  animation: "cadRise 0.3s var(--ds-motion-timing-swift) both",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-pixel)",
                    fontSize: 22,
                    lineHeight: 1.2,
                    textTransform: "uppercase",
                    color: verdictColor,
                  }}
                >
                  {verdict}
                </p>
                {criticReview.summary ? (
                  <p
                    className="text-copy-13"
                    style={{ color: "var(--ds-gray-900)", margin: "6px 0 0" }}
                  >
                    {criticReview.summary}
                  </p>
                ) : null}
              </div>

              {/* Brain warming: risks + evidence */}
              {(criticReview.risks ?? []).length > 0 ? (
                <div>
                  <p style={sectionLabel}>Key risks</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(criticReview.risks ?? []).slice(0, 3).map((risk: string, i: number) => (
                      <div
                        key={i}
                        className="text-label-12"
                        style={{ color: "var(--ds-gray-900)", lineHeight: 1.5 }}
                      >
                        • {risk}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Missing evidence / precedent */}
              {(criticReview.missing_evidence ?? []).length > 0 ? (
                <div>
                  <p style={sectionLabel}>What you need to test</p>
                  <div
                    className="text-label-12"
                    style={{ color: "var(--ds-gray-900)", lineHeight: 1.5 }}
                  >
                    {criticReview.missing_evidence[0]}
                  </div>
                </div>
              ) : null}

              {/* Confidence, animating in with the verdict */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--ds-radius-small)",
                  background: "var(--ds-gray-100)",
                }}
              >
                <p style={{ ...sectionLabel, marginBottom: 4 }}>Confidence</p>
                <ConfidenceBar value={criticReview.confidence ?? 0.5} />
              </div>

              <div style={{ marginTop: 8 }}>
                <Button variant="primary" onClick={leave} style={{ width: "100%" }}>
                  Go to your workspace
                </Button>
              </div>
            </div>
          ) : (
            // Honest failure: failed is not loading. Say what happened, offer
            // a retry, and let the user move on with their belief kept.
            <div>
              <p
                className="text-copy-13"
                style={{ color: "var(--ds-gray-900)", margin: 0, maxWidth: 460 }}
              >
                The run hit an error before it could reach a verdict. Your belief is saved as an
                opportunity, so nothing is lost.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  disabled={mFinish.isPending}
                  onClick={() => {
                    setPhase("critic");
                    mFinish.mutate();
                  }}
                >
                  Try again
                </Button>
                <Button variant="tertiary" onClick={leave}>
                  Continue - your belief is saved as an opportunity
                </Button>
              </div>
            </div>
          )}
        </Frame>
      </Screen>
    );
  }

  return null;
}

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
import { trackDescriptions } from "@/lib/onboarding/track-seeds";
import { isDemoSeedEnabled, triggerWorkspaceSeed } from "@/lib/onboarding/onboarding.functions";
import { runCriticReview, runWedgeTeardown, listOpportunities } from "@/lib/discovery.functions";
import { markOnboarded } from "@/lib/onboarding-gate";
import { useWorkspace } from "@/hooks/use-workspace";
import { ArrivalButterfly } from "@/components/onboarding/ArrivalButterfly";
import { track } from "@/lib/observability/analytics";
import { trackFunnelMilestone } from "@/lib/activation-funnel.server";

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

// The name pre-gate is handled by needsDetails/detailsDone below, not this
// state machine - it is explicitly not one of the five counted screens.
type Phase = "arrival" | "product" | "data" | "critic" | "results";

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
        animation: "cadRise 260ms var(--ease) both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          {eyebrow ? <MonoLabel style={{ marginBottom: 10 }}>{eyebrow}</MonoLabel> : null}
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 430,
              fontSize: 28,
              lineHeight: 1.2,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {heading}
          </h1>
        </div>
        {showTimer ? (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-muted)",
              textAlign: "right",
            }}
          >
            {showTimer}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  );
}

function ProductNamePreGate({ onDone }: { onDone: (name: string, oneLiner: string) => void }) {
  const [productName, setProductName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = productName.trim();
    if (!name) {
      toast.error("Give your product a name");
      return;
    }
    setSaving(true);
    // PC-33: the one-liner is captured here but written to the Brief only
    // once a workspace is guaranteed to exist (ensureDefaultWorkspace's own
    // doc comment: a brand-new user reaches this exact screen before their
    // workspace_members row is reliable, so current_user_default_workspace()
    // can return null here). The write fires from the parent's
    // mSeedWorkspace.onSuccess instead, after seeding has resolved a real
    // workspace, not from this component.
    onDone(name, oneLiner.trim());
  }

  return (
    <Screen>
      <form onSubmit={save} style={{ width: 420, maxWidth: "calc(100vw - 48px)" }}>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 26,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          What are you building?
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.55 }}>
          A product name, feature, or bet. Cadence will challenge your thinking and show its work.
        </p>
        <input
          autoFocus
          required
          placeholder="e.g. Mobile capture, better notifications"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          style={{
            width: "100%",
            minWidth: 0,
            background: "var(--raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "11px 14px",
            color: "var(--text-primary)",
            fontSize: 13,
            marginTop: 20,
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 20, lineHeight: 1.55 }}>
          In one sentence, what does it do?
        </p>
        <input
          placeholder="e.g. Turns customer conversations into a prioritized roadmap"
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          style={{
            width: "100%",
            minWidth: 0,
            background: "var(--raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "11px 14px",
            color: "var(--text-primary)",
            fontSize: 13,
            marginTop: 8,
            boxSizing: "border-box",
          }}
        />
        <div style={{ marginTop: 16 }}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Continue"}
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
        background: "var(--canvas)",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function NamePreGate({ onDone }: { onDone: () => void }) {
  const fUpdate = useServerFn(updateProfile);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const firstName = first.trim();
    if (!firstName) {
      toast.error("Add at least your first name");
      return;
    }
    const fullName = [firstName, last.trim()].filter(Boolean).join(" ");
    setSaving(true);
    try {
      await fUpdate({ data: { full_name: fullName, display_name: firstName } });
      await supabase.auth.updateUser({ data: { display_name: firstName, full_name: fullName } });
      onDone();
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Could not save your details");
    }
  }

  return (
    <Screen>
      <form onSubmit={save} style={{ width: 420, maxWidth: "calc(100vw - 48px)" }}>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 26,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          First, your name.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.55 }}>
          So Cadence greets you by name and signs every decision it makes with you.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <input
            autoFocus
            required
            placeholder="first name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              padding: "9px 12px",
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          />
          <input
            placeholder="last name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              padding: "9px 12px",
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </Button>
        </div>
      </form>
    </Screen>
  );
}

export function ObsidianOnboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  const fGetProfile = useServerFn(getProfile);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fGetProfile() });
  const [detailsDone, setDetailsDone] = useState(false);
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
      | "signup"
      | "product_named"
      | "data_connected"
      | "critic_completed"
      | "onboarding_completed",
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

  // PC-02: run Critic and display results, then mark onboarded
  const mFinish = useMutation({
    mutationFn: async () => {
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
        console.error("onboarding critic run failed (non-fatal):", e);
      }

      // Track critic_completed milestone
      await trackMilestone("critic_completed", {
        verdict: review?.verdict,
        confidence: review?.confidence,
      });

      setCriticReview(review);

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
  const [pendingTrack, setPendingTrack] = useState<OnboardingTrack | null>(null);

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
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Waking your workspace…</p>
      </Screen>
    );
  if (needsDetails && !detailsDone) {
    return <NamePreGate onDone={() => setDetailsDone(true)} />;
  }

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
          <ArrivalButterfly />
          {/* Geist Pixel brand moment (DESIGN-TEMPO.md SS3/SS8): the arrival
              headline is this surface's one hero moment - a single line
              shown once, first thing a new user sees. */}
          <p
            className="font-pixel"
            style={{
              fontSize: 34,
              lineHeight: 1.15,
              color: "var(--text-primary)",
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            Judgment, with receipts.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, maxWidth: 380 }}>
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
      <ProductNamePreGate
        onDone={(name, oneLiner) => {
          setProductName(name);
          setPendingOneLiner(oneLiner);
          // Auto-seed workspace with default track ("solo") for new accounts
          setPendingTrack("solo");
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {providers.slice(0, 5).map((spec) => {
                  const on = isConnected(spec);
                  const configured =
                    connectionsQ.data?.providerAvailability?.[spec.id]?.configured ?? false;
                  const busy = connectingId === spec.id && mConnect.isPending;
                  const estimate = timeEstimateFor(spec.id);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      disabled={on || busy || !configured}
                      onClick={() => {
                        setConnectError(null);
                        setConnectingId(spec.id);
                        mConnect.mutate(spec);
                      }}
                      style={{
                        textAlign: "left",
                        padding: "13px 14px",
                        borderRadius: "var(--radius-card)",
                        background: "var(--card)",
                        border: "1px solid var(--hairline)",
                        opacity: configured || on ? 1 : 0.45,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        <span
                          style={{
                            fontFamily: "var(--font-ui)",
                            fontSize: 13.5,
                            fontWeight: 550,
                            color: "var(--text-primary)",
                          }}
                        >
                          {spec.label}
                        </span>
                        <MonoLabel style={{ display: "block", marginTop: 3 }}>
                          {estimate.toUpperCase()}
                        </MonoLabel>
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--text-subtle)",
                        }}
                      >
                        {on ? "✓" : busy ? "…" : "→"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowPaste(true)}
                  style={{
                    textAlign: "left",
                    padding: "13px 14px",
                    borderRadius: "var(--radius-card)",
                    background: "var(--card)",
                    border: "1px solid var(--hairline)",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: 13.5,
                      fontWeight: 550,
                      color: "var(--text-primary)",
                    }}
                  >
                    Or paste your notes
                  </span>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-faint)",
                      marginTop: 3,
                      marginBottom: 0,
                    }}
                  >
                    Paste a PRD, product notes, or your bet · Cadence will analyze it directly.
                  </p>
                </button>
              </div>

              {connectError ? (
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                  {connectError} · try connecting a different source
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
                value={pasteNotes}
                onChange={(e) => setPasteNotes(e.target.value)}
                placeholder="Paste your product notes, PRD, or the bet you want to challenge..."
                style={{
                  width: "100%",
                  minHeight: 180,
                  background: "var(--raised)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)",
                  padding: "11px 14px",
                  color: "var(--text-body)",
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button
                  variant="primary"
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
    return (
      <Screen>
        <Frame eyebrow="STEP 3 OF 3" heading="Challenging your thinking…" showTimer={elapsed}>
          <input
            value={belief}
            onChange={(e) => setBelief(e.target.value)}
            style={{
              width: "100%",
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              padding: "11px 14px",
              color: "var(--text-body)",
              fontSize: 13.5,
              boxSizing: "border-box",
            }}
          />
          <p
            style={{ fontSize: 11.5, color: "var(--text-subtle)", marginTop: 12, marginBottom: 0 }}
          >
            Cadence will show its work with receipts.
          </p>
          <div style={{ marginTop: 16 }}>
            <Button
              variant="primary"
              disabled={mFinish.isPending}
              onClick={() => mFinish.mutate()}
              style={{ width: "100%" }}
            >
              {mFinish.isPending ? "Analyzing…" : "Get the Critic's take"}
            </Button>
          </div>
        </Frame>
      </Screen>
    );
  }

  // phase === "results" — show Critic findings + brain warming signals
  if (phase === "results") {
    return (
      <Screen>
        <Frame heading="Here's what Cadence found." showTimer={elapsed}>
          {criticReview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Verdict badge */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-card)",
                  background:
                    criticReview.verdict === "ship"
                      ? "var(--success-tint)"
                      : criticReview.verdict === "kill"
                        ? "var(--danger-tint)"
                        : "var(--caution-tint)",
                  border:
                    criticReview.verdict === "ship"
                      ? "1px solid var(--success)"
                      : criticReview.verdict === "kill"
                        ? "1px solid var(--danger)"
                        : "1px solid var(--caution)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 550,
                    color: "var(--text-primary)",
                    textTransform: "capitalize",
                  }}
                >
                  Verdict: {criticReview.verdict}
                </p>
                {criticReview.summary ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, margin: 0 }}>
                    {criticReview.summary}
                  </p>
                ) : null}
              </div>

              {/* Brain warming: risks + evidence */}
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: 0,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    fontWeight: 550,
                  }}
                >
                  Key risks
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(criticReview.risks ?? []).slice(0, 3).map((risk: string, i: number) => (
                    <div
                      key={i}
                      style={{ fontSize: 12, color: "var(--text-body)", lineHeight: 1.5 }}
                    >
                      • {risk}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing evidence / precedent */}
              {(criticReview.missing_evidence ?? []).length > 0 ? (
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      margin: 0,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      fontWeight: 550,
                    }}
                  >
                    What you need to test
                  </p>
                  <div style={{ fontSize: 12, color: "var(--text-body)", lineHeight: 1.5 }}>
                    {criticReview.missing_evidence[0]}
                  </div>
                </div>
              ) : null}

              {/* Confidence */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-control)",
                  background: "var(--raised)",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: 0,
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}
                >
                  Confidence
                </p>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "var(--hairline)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(criticReview.confidence ?? 0.5) * 100}%`,
                      background: "var(--text-muted)",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.sessionStorage.removeItem("cadence.onboarding.phase");
                      window.sessionStorage.removeItem("cadence.onboarding.startTime");
                      window.sessionStorage.setItem("cadence.onboarding.justLanded", "1");
                    }
                    navigate({ to: "/today" });
                  }}
                  style={{ width: "100%" }}
                >
                  Go to your workspace
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Critic review is loading…</p>
              <Button
                variant="tertiary"
                onClick={() => {
                  navigate({ to: "/today" });
                }}
                style={{ marginTop: 12 }}
              >
                Skip to workspace
              </Button>
            </div>
          )}
        </Frame>
      </Screen>
    );
  }

  return null;
}

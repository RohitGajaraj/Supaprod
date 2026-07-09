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
import {
  seedWorkspaceForTrack,
  completeOnboarding,
  type OnboardingTrack,
} from "@/lib/onboarding.functions";
import { trackDescriptions } from "@/lib/onboarding/track-seeds";
import { isDemoSeedEnabled, triggerWorkspaceSeed } from "@/lib/onboarding/onboarding.functions";
import { runCriticReview, runWedgeTeardown, listOpportunities } from "@/lib/discovery.functions";
import { markOnboarded } from "@/lib/onboarding-gate";
import { useWorkspace } from "@/hooks/use-workspace";
import { ArrivalButterfly } from "@/components/onboarding/ArrivalButterfly";

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
type Phase = "arrival" | "track" | "connect" | "critic";

function Frame({
  eyebrow,
  heading,
  children,
}: {
  eyebrow?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 600,
        maxWidth: "calc(100vw - 48px)",
        animation: "cadRise 260ms var(--ease) both",
      }}
    >
      {eyebrow ? (
        <MonoLabel tone="glacier" style={{ marginBottom: 10 }}>
          {eyebrow}
        </MonoLabel>
      ) : null}
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
      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
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

  // SW-7 step-0 rerun (2026-07-09): the step state was memory-only, so any
  // refresh (or a full-page bounce that missed ?connected=) restarted the
  // whole flow at arrival. Persist the phase for the tab's lifetime; the
  // finish mutation clears it on the way to Today.
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "arrival";
    const saved = window.sessionStorage.getItem("cadence.onboarding.phase");
    return saved === "track" || saved === "connect" || saved === "critic" ? saved : "arrival";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("cadence.onboarding.phase", phase);
  }, [phase]);
  const [belief, setBelief] = useState<string>(FALLBACK_BELIEF);
  const [beliefTarget, setBeliefTarget] = useState<{ kind: "opportunity"; id: string } | null>(
    null,
  );

  // Screen 3: connections
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
    enabled: phase === "connect",
  });
  const suiteQ = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: () => fSuiteList(),
    enabled: phase === "connect",
  });
  const seedEnabledQ = useQuery({
    queryKey: ["demo-seed-enabled"],
    queryFn: () => fSeedEnabled(),
    enabled: phase === "connect",
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
    // Pull a real seeded/connected opportunity to point the Critic at; fall
    // back to the constant belief if the workspace has none yet.
    try {
      const { opportunities } = await fListOpportunities();
      if (opportunities[0]) {
        setBelief(opportunities[0].title);
        seededBeliefRef.current = opportunities[0].title;
        setBeliefTarget({ kind: "opportunity", id: opportunities[0].id });
      }
    } catch {
      // never traps: the fallback belief still lets Finish complete
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
  const mFinish = useMutation({
    mutationFn: async () => {
      // SW-6 (felt journey, the surprise beat): honor what the user actually
      // typed. If they edited the belief, record THEIR words verbatim and run
      // the Critic on them (runWedgeTeardown was built for exactly this and
      // was orphaned); the prefilled seeded-opportunity title keeps the
      // evidence-linked runCriticReview path.
      const typed = belief.trim();
      const editedBelief =
        typed.length >= 3 && (!beliefTarget || typed !== seededBeliefRef.current);
      // The teardown/critic call is best-effort narration for the "surprise"
      // beat, never a completion gate - unlike fWedgeTeardown, fRunCritic had
      // no .catch(), so a failed run (a missing seeded target, an AI hiccup)
      // threw out of the whole mutationFn and skipped fComplete/markOnboarded
      // below. onError still navigated to /today, but with onboarded never
      // set true server-side, the route gate bounced straight back to
      // /onboarding's first screen - the "progress evaporated" loop this
      // fixes. Both calls now degrade the same way: log and move on.
      if (editedBelief) {
        await fWedgeTeardown({ data: { idea: typed.slice(0, 200) } }).catch(() => null);
      } else if (beliefTarget) {
        await fRunCritic({
          data: { target_kind: beliefTarget.kind, target_id: beliefTarget.id },
        }).catch((e) => {
          console.error("onboarding critic run failed (non-fatal):", e);
          return null;
        });
      }
      await fComplete({ data: {} });
      const { data } = await supabase.auth.getSession();
      if (data.session) await markOnboarded(data.session.user.id);
    },
    onSuccess: () => {
      window.sessionStorage.removeItem("cadence.onboarding.phase");
      window.sessionStorage.setItem("cadence.onboarding.justLanded", "1");
      navigate({ to: "/today" });
    },
    onError: (e) => {
      // fComplete itself (or the session/markOnboarded read) failed - the one
      // failure mode the teardown catches above can't cover. Still land on
      // Today per the "never traps" intent, but this case is a real gap: the
      // gate will bounce back next load since onboarded was never set. The
      // persisted phase is intentionally KEPT here so the bounce-back resumes
      // at the critic step instead of restarting the whole flow.
      console.error("onboarding completion failed:", e);
      window.sessionStorage.setItem("cadence.onboarding.justLanded", "1");
      navigate({ to: "/today" });
    },
  });

  const mSeedTrack = useMutation({
    mutationFn: (track: OnboardingTrack) => fSeedTrack({ data: { track } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      // SW-6: the seed just created the workspace on a fresh account; without
      // this, activeWorkspace stays null and the demo-data button on the next
      // step fails with "Workspace not ready yet".
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      setPhase("connect");
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
    // Never a dead-blank screen: after the login redirect this state was
    // observed holding for 14+ seconds while the profile query settled, and
    // the empty span read as a broken app (SW-7 step-0 rerun, 2026-07-09).
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
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 430,
              fontSize: 34,
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              color: "var(--text-primary)",
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            Judgment, with receipts.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, maxWidth: 380 }}>
            Cadence reads your signals, argues with your beliefs, and shows its work. Ten minutes to
            your first teardown.
          </p>
          <div style={{ marginTop: 24 }}>
            <Button variant="primary" onClick={() => setPhase("track")}>
              Start
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === "track") {
    return (
      <Screen>
        <Frame eyebrow="STEP 1 OF 4" heading="What are you here to do?">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TRACKS.map((track) => {
              const d = trackDescriptions[track];
              const busy = pendingTrack === track && mSeedTrack.isPending;
              return (
                <button
                  key={track}
                  type="button"
                  disabled={mSeedTrack.isPending}
                  onClick={() => {
                    setPendingTrack(track);
                    mSeedTrack.mutate(track);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: "var(--radius-card)",
                    background: "var(--card)",
                    border: "1px solid var(--hairline)",
                    opacity: mSeedTrack.isPending && !busy ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 15,
                        fontWeight: 550,
                        color: "var(--text-primary)",
                      }}
                    >
                      {d.label}
                    </span>
                    {busy ? <MonoLabel tone="glacier">seeding</MonoLabel> : null}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 4,
                      marginBottom: 0,
                    }}
                  >
                    {d.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </Frame>
      </Screen>
    );
  }

  if (phase === "connect") {
    const seedLive = !!seedEnabledQ.data?.enabled;
    return (
      <Screen>
        <Frame eyebrow="STEP 2 OF 4" heading="Give it something to read.">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {providers.map((spec) => {
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
                      {spec.label.toUpperCase()} · {estimate.toUpperCase()}
                    </MonoLabel>
                    {!configured ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--text-faint)",
                          marginTop: 3,
                        }}
                      >
                        Admin setup required
                      </span>
                    ) : null}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-subtle)",
                    }}
                  >
                    {on ? "connected" : busy ? "…" : "→"}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              disabled={!seedLive || mDemo.isPending}
              onClick={() => {
                setConnectError(null);
                mDemo.mutate();
              }}
              style={{
                textAlign: "left",
                padding: "13px 14px",
                borderRadius: "var(--radius-card)",
                background: "transparent",
                border: "1px solid var(--hairline)",
                marginTop: 4,
                opacity: seedLive ? 1 : 0.5,
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
                {mDemo.isPending ? "Setting up demo data…" : "Use demo data instead · 0 setup"}
              </span>
              <p
                style={{
                  fontSize: 11.5,
                  color: "var(--text-faint)",
                  marginTop: 3,
                  marginBottom: 0,
                }}
              >
                {seedLive
                  ? "A seeded workspace with real-shaped signals · nothing to connect."
                  : "Demo data is not enabled yet · connect a real source to continue."}
              </p>
            </button>

            {connectError ? (
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                {connectError} · try demo data
              </p>
            ) : null}

            {/* SW-6: this step could hard dead-end (no configured providers +
                demo seed off left every button disabled). The seeded track
                data already gives the Critic something real to work with, so
                skipping is always safe. */}
            <div style={{ marginTop: 10 }}>
              <Button variant="tertiary" onClick={() => void afterConnected()}>
                Skip for now, connect later in Settings
              </Button>
            </div>
          </div>
        </Frame>
      </Screen>
    );
  }

  // phase === "critic"
  return (
    <Screen>
      <Frame eyebrow="STEP 3 OF 4" heading="Point the Critic at a belief.">
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
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 11.5, color: "var(--text-subtle)", maxWidth: 260 }}>
            The teardown lands on Today · receipts attached.
          </span>
          <Button variant="primary" disabled={mFinish.isPending} onClick={() => mFinish.mutate()}>
            {mFinish.isPending ? "Challenging…" : "Challenge this"}
          </Button>
        </div>
      </Frame>
    </Screen>
  );
}

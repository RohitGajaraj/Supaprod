// F-IA-V4: notification preferences, folded from the orphaned standalone
// /notifications route into Settings (config/prefs belong in Settings, per the
// home-and-today-ia rubric). Same preferences matrix + save path; the AppShell /
// TopBar / SurfaceHeader wrapper is dropped because SettingsPage provides the shell.
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "@/lib/notify";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { Button } from "@/components/ui/button";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UserNotificationPreferences,
} from "@/lib/notifications.functions";
import { getFeedbackPrefs, setFeedbackPrefs, fireFeedback } from "@/lib/interaction-feedback";

const ROWS: { key: "Approvals" | "Health" | "Budget" | "Drift"; label: string; desc: string }[] = [
  { key: "Approvals", label: "Approvals Needed", desc: "Tool runs waiting on human decision." },
  {
    key: "Health",
    label: "Loop Health & Stalls",
    desc: "Stalled agent runs and run status flags.",
  },
  {
    key: "Budget",
    label: "Spend & Budgets",
    desc: "Spend nearing daily or monthly limit thresholds.",
  },
  {
    key: "Drift",
    label: "Output Quality & Trends",
    desc: "Alerts when Supaprod's output quality changes or slips.",
  },
];

const TH: React.CSSProperties = {
  textAlign: "center",
  padding: "8px 12px 12px 12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--ink-muted)",
};
const CHK: React.CSSProperties = { width: 16, height: 16, cursor: "pointer" };

export function NotificationsTab() {
  const qc = useQueryClient();
  const fGetPrefs = useServerFn(getNotificationPreferences);
  const prefsQuery = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => fGetPrefs(),
  });
  const fUpdatePrefs = useServerFn(updateNotificationPreferences);
  const saveMutation = useMutation({
    mutationFn: (updated: Partial<UserNotificationPreferences>) => fUpdatePrefs({ data: updated }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificationPreferences"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification preferences saved successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to save preferences: ${err.message}`);
    },
  });

  // channel[category] = boolean, per the three delivery channels.
  const [inApp, setInApp] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState<Record<string, boolean>>({});
  const [digest, setDigest] = useState<Record<string, boolean>>({});
  const [digestFrequency, setDigestFrequency] = useState<"daily" | "weekly">("daily");
  const [stakeholderUpdate, setStakeholderUpdate] = useState(false);
  const [stakeholderAudience, setStakeholderAudience] = useState<"exec" | "eng" | "board">("exec");

  // Interaction feedback is a client-local preference (localStorage), not a
  // server-stored notification pref, so it applies instantly with no save.
  const [feedbackSound, setFeedbackSound] = useState(() => getFeedbackPrefs().sound);
  const [feedbackHaptics, setFeedbackHaptics] = useState(() => getFeedbackPrefs().haptics);

  useEffect(() => {
    const p = prefsQuery.data?.preferences;
    if (!p) return;
    setInApp({
      Approvals: p.in_app_approvals,
      Health: p.in_app_health,
      Budget: p.in_app_budget,
      Drift: p.in_app_drift,
    });
    setEmail({
      Approvals: p.email_approvals,
      Health: p.email_health,
      Budget: p.email_budget,
      Drift: p.email_drift,
    });
    setDigest({
      Approvals: p.digest_approvals,
      Health: p.digest_health,
      Budget: p.digest_budget,
      Drift: p.digest_drift,
    });
    setDigestFrequency(p.digest_frequency);
    setStakeholderUpdate(p.digest_stakeholder_update ?? false);
    setStakeholderAudience(p.digest_stakeholder_audience ?? "exec");
  }, [prefsQuery.data]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      in_app_approvals: inApp.Approvals,
      in_app_health: inApp.Health,
      in_app_budget: inApp.Budget,
      in_app_drift: inApp.Drift,
      email_approvals: email.Approvals,
      email_health: email.Health,
      email_budget: email.Budget,
      email_drift: email.Drift,
      digest_approvals: digest.Approvals,
      digest_health: digest.Health,
      digest_budget: digest.Budget,
      digest_drift: digest.Drift,
      digest_frequency: digestFrequency,
      digest_stakeholder_update: stakeholderUpdate,
      digest_stakeholder_audience: stakeholderAudience,
    });
  };

  if (prefsQuery.isLoading) {
    return (
      <div className="mono-label" style={{ color: "var(--ink-muted)", padding: 8 }}>
        Loading preferences…
      </div>
    );
  }

  const cell = (
    state: Record<string, boolean>,
    setState: (v: Record<string, boolean>) => void,
    key: string,
    aria: string,
  ) => (
    <td style={{ textAlign: "center", padding: "14px 12px" }}>
      <input
        type="checkbox"
        aria-label={aria}
        checked={state[key] ?? false}
        onChange={(e) => setState({ ...state, [key]: e.target.checked })}
        style={CHK}
      />
    </td>
  );

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="material-medium" style={{ padding: "var(--card-pad, 20px)" }}>
        <MonoLabel style={{ marginBottom: 16 }}>Preferences Matrix</MonoLabel>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
                <th style={{ ...TH, textAlign: "left" }}>Alert Category</th>
                <th style={TH}>In-App Feed</th>
                <th style={TH}>Instant Email</th>
                <th style={TH}>Digest Summary</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.key}
                  style={
                    i < ROWS.length - 1 ? { borderBottom: "1px solid var(--hairline)" } : undefined
                  }
                >
                  <td style={{ padding: "14px 12px" }}>
                    <div className="text-label-14" style={{ fontWeight: 550 }}>
                      {r.label}
                    </div>
                    <div
                      className="text-label-13"
                      style={{ color: "var(--ink-muted)", marginTop: 2 }}
                    >
                      {r.desc}
                    </div>
                  </td>
                  {cell(inApp, setInApp, r.key, `In-app ${r.label}`)}
                  {cell(email, setEmail, r.key, `Email ${r.label}`)}
                  {cell(digest, setDigest, r.key, `Digest ${r.label}`)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="material-medium" style={{ padding: "var(--card-pad, 20px)" }}>
        <MonoLabel style={{ marginBottom: 12 }}>Digest Settings</MonoLabel>
        <label style={{ display: "block", maxWidth: 320 }}>
          <div className="text-label-13" style={{ fontWeight: 500, marginBottom: 6 }}>
            Digest Delivery Frequency
          </div>
          <select
            className="input"
            value={digestFrequency}
            onChange={(e) => setDigestFrequency(e.target.value as "daily" | "weekly")}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 6 }}
          >
            <option value="daily">Daily summary</option>
            <option value="weekly">Weekly summary</option>
          </select>
          <div
            style={{ marginTop: 6, color: "var(--ink-muted)" }}
          >
            How often email digests are aggregated and sent to you.
          </div>
        </label>
      </div>

      <div className="material-medium" style={{ padding: "var(--card-pad, 20px)" }}>
        <MonoLabel style={{ marginBottom: 12 }}>Stakeholder update</MonoLabel>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: stakeholderUpdate ? 14 : 0,
          }}
        >
          <input
            type="checkbox"
            checked={stakeholderUpdate}
            onChange={(e) => setStakeholderUpdate(e.target.checked)}
            style={CHK}
            aria-label="Include a stakeholder update in my digest"
          />
          <span className="text-label-14">Include a stakeholder update in my digest</span>
        </label>
        <p
          style={{
            color: "var(--ink-muted)",
            margin: stakeholderUpdate ? "0 0 14px" : 0,
          }}
        >
          Your workspace's newest decision, framed for the audience you pick, riding the same email
          above. No separate send.
        </p>
        {stakeholderUpdate ? (
          <label style={{ display: "block", maxWidth: 320 }}>
            <div className="text-label-13" style={{ fontWeight: 500, marginBottom: 6 }}>
              Written for
            </div>
            <select
              className="input"
              value={stakeholderAudience}
              onChange={(e) => setStakeholderAudience(e.target.value as "exec" | "eng" | "board")}
              style={{ width: "100%", padding: "6px 10px", borderRadius: 6 }}
            >
              <option value="exec">Executives</option>
              <option value="eng">Engineering</option>
              <option value="board">Board</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="material-medium" style={{ padding: "var(--card-pad, 20px)" }}>
        <MonoLabel style={{ marginBottom: 4 }}>Interaction feedback</MonoLabel>
        <p
          style={{
            color: "var(--ink-muted)",
            margin: "0 0 14px",
          }}
        >
          Sound and touch feedback on actions. Applies instantly on this device. Sound is
          synthesized and subtle; haptics only fire on devices that support it.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={feedbackSound}
            onChange={(e) => {
              const next = e.target.checked;
              setFeedbackSound(next);
              setFeedbackPrefs({ sound: next });
              if (next) fireFeedback("success");
            }}
            style={CHK}
            aria-label="Sound effects on actions"
          />
          <span className="text-label-14">Sound effects</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={feedbackHaptics}
            onChange={(e) => {
              const next = e.target.checked;
              setFeedbackHaptics(next);
              setFeedbackPrefs({ haptics: next });
              if (next) fireFeedback("select");
            }}
            style={CHK}
            aria-label="Haptic feedback on supported devices"
          />
          <span className="text-label-14">Haptics (supported devices)</span>
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" size="sm" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}

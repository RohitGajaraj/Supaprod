/**
 * NOTIFICATIONS. Rebuilt on the primitives 2026-07-29, replacing
 * NotificationsTab.
 *
 * The founder named horizontal scrolling as a pain point twice. This surface
 * was the clearest instance of it left in the product: a four-column checkbox
 * matrix inside `overflow-x: auto`, so on a normal settings pane you scrolled
 * sideways to reach the third channel. A matrix is the right MODEL and the
 * wrong SHAPE for four rows: the same twelve booleans are four lines with a
 * three-state control at the end of each, which is the sentence-with-a-switch
 * form the governance canon asks a boundary to take.
 *
 * KILLED, and what each cost:
 *   - The table, its header row, and the sideways scroll it needed.
 *   - Four `material-medium` card shells, all written against a class the
 *     rebuild deleted, plus the four uppercase MonoLabel headings inside them.
 *   - The "Preferences Matrix" heading. A mechanism name for a thing whose
 *     outcome is "what reaches you, and how".
 *   - The bare checkbox as the on/off control. The system has a Switch, it is
 *     green when live because green carries status, and a boundary that is on
 *     should look on from across the room.
 *
 * KEPT: every server function, both preference paths (the server-stored matrix
 * and the device-local interaction feedback), the same query keys, and the
 * single Save. Interaction feedback still applies instantly with no save,
 * because it is a localStorage preference, and the line says so.
 */
import { useEffect, useState } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UserNotificationPreferences,
} from "@/lib/notifications.functions";
import { getFeedbackPrefs, setFeedbackPrefs, fireFeedback } from "@/lib/interaction-feedback";
import { Actions, Block, Button, Failed, Line, Loading, PageHead, Select, Switch } from "@/components/shell/primitives";

type Category = "Approvals" | "Health" | "Budget" | "Drift";
type Channel = "app" | "email" | "digest";

const CATEGORIES: { key: Category; label: string; sub: string }[] = [
  {
    key: "Approvals",
    label: "Something is waiting on your call",
    sub: "A tool run stopped at a boundary you set and needs a decision.",
  },
  {
    key: "Health",
    label: "A run stalled or went in circles",
    sub: "The loop stopped making progress, or ran past what the work should have needed.",
  },
  {
    key: "Budget",
    label: "Spend is nearing a ceiling",
    sub: "A daily or monthly limit is close enough that the next run may be held.",
  },
  {
    key: "Drift",
    label: "The output got worse",
    sub: "Quality slipped against what this workspace was producing before.",
  },
];

const CHANNELS: { key: Channel; label: string; title: string }[] = [
  { key: "app", label: "App", title: "In the app" },
  { key: "email", label: "Email", title: "Straight to your inbox" },
  { key: "digest", label: "Digest", title: "Held for the next summary" },
];

export function NotificationsSection() {
  const qc = useQueryClient();
  const fGet = useServerFn(getNotificationPreferences);
  const fUpdate = useServerFn(updateNotificationPreferences);

  const prefs = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => fGet(),
  });

  const save = useMutation({
    mutationFn: (updated: Partial<UserNotificationPreferences>) => fUpdate({ data: updated }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificationPreferences"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setDirty(false);
      toast.success("Saved. The next alert obeys it.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // matrix[category][channel]. One shape instead of three parallel records,
  // because three records is three chances for them to disagree.
  const [matrix, setMatrix] = useState<Record<Category, Record<Channel, boolean>>>({
    Approvals: { app: false, email: false, digest: false },
    Health: { app: false, email: false, digest: false },
    Budget: { app: false, email: false, digest: false },
    Drift: { app: false, email: false, digest: false },
  });
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [stakeholder, setStakeholder] = useState(false);
  const [audience, setAudience] = useState<"exec" | "eng" | "board">("exec");
  const [dirty, setDirty] = useState(false);

  // Device-local, applied instantly, never part of the save.
  const [sound, setSound] = useState(() => getFeedbackPrefs().sound);
  const [haptics, setHaptics] = useState(() => getFeedbackPrefs().haptics);

  useEffect(() => {
    const p = prefs.data?.preferences;
    if (!p) return;
    setMatrix({
      Approvals: { app: p.in_app_approvals, email: p.email_approvals, digest: p.digest_approvals },
      Health: { app: p.in_app_health, email: p.email_health, digest: p.digest_health },
      Budget: { app: p.in_app_budget, email: p.email_budget, digest: p.digest_budget },
      Drift: { app: p.in_app_drift, email: p.email_drift, digest: p.digest_drift },
    });
    setFrequency(p.digest_frequency);
    setStakeholder(p.digest_stakeholder_update ?? false);
    setAudience(p.digest_stakeholder_audience ?? "exec");
    setDirty(false);
  }, [prefs.data]);

  const toggle = (cat: Category, ch: Channel) => {
    setMatrix((prev) => ({ ...prev, [cat]: { ...prev[cat], [ch]: !prev[cat][ch] } }));
    setDirty(true);
  };

  const onSave = () =>
    save.mutate({
      in_app_approvals: matrix.Approvals.app,
      in_app_health: matrix.Health.app,
      in_app_budget: matrix.Budget.app,
      in_app_drift: matrix.Drift.app,
      email_approvals: matrix.Approvals.email,
      email_health: matrix.Health.email,
      email_budget: matrix.Budget.email,
      email_drift: matrix.Drift.email,
      digest_approvals: matrix.Approvals.digest,
      digest_health: matrix.Health.digest,
      digest_budget: matrix.Budget.digest,
      digest_drift: matrix.Drift.digest,
      digest_frequency: frequency,
      digest_stakeholder_update: stakeholder,
      digest_stakeholder_audience: audience,
    });

  const reachable = CATEGORIES.filter((c) => CHANNELS.some((ch) => matrix[c.key][ch.key])).length;

  if (prefs.isError) {
    return (
      <>
        <PageHead title="Notifications" sub="When the product may interrupt you, and where." />
        {/* A failed read must not render an empty matrix whose save would
            silence every alert. */}
        <Failed onRetry={() => void prefs.refetch()}>
          Your preferences did not load, so nothing here is safe to change yet.{" "}
          {(prefs.error as Error)?.message ?? "The read failed."}
        </Failed>
      </>
    );
  }

  if (prefs.isLoading) {
    return (
      <>
        <PageHead title="Notifications" sub="When the product may interrupt you, and where." />
        <Loading>Reading your preferences.</Loading>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Notifications"
        sub={
          reachable === 0 ? (
            "Nothing reaches you. Every alert is currently silent, including the ones waiting on your decision."
          ) : (
            <>
              <Num>{reachable}</Num> of the four things that can interrupt you currently do. The
              rest stay silent until you come looking.
            </>
          )
        }
      />

      <Block
        title="What reaches you, and how"
        sub="Your working hours still apply: outside them, anything scheduled waits."
      >
        {CATEGORIES.map((c) => (
          <Line key={c.key} label={c.label} sub={c.sub}>
            {CHANNELS.map((ch) => (
              <Button
                key={ch.key}
                variant={matrix[c.key][ch.key] ? "default" : "ghost"}
                aria-pressed={matrix[c.key][ch.key]}
                title={ch.title}
                onClick={() => toggle(c.key, ch.key)}
              >
                {ch.label}
              </Button>
            ))}
          </Line>
        ))}
      </Block>

      <Block title="The digest">
        <Line
          label="How often it goes out"
          sub="Anything set to Digest above waits for this send rather than pinging you."
        >
          <Select
            value={frequency}
            aria-label="Digest frequency"
            onChange={(e) => {
              setFrequency(e.target.value as "daily" | "weekly");
              setDirty(true);
            }}
          >
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
          </Select>
        </Line>
        <Line
          label="Include a stakeholder update"
          sub="Your newest decision, rewritten for the audience you pick, riding the same email. No separate send."
        >
          <Switch
            checked={stakeholder}
            label="Include a stakeholder update in the digest"
            onChange={(next) => {
              setStakeholder(next);
              setDirty(true);
            }}
          />
        </Line>
        {stakeholder ? (
          <Line label="Written for">
            <Select
              value={audience}
              aria-label="Stakeholder audience"
              onChange={(e) => {
                setAudience(e.target.value as "exec" | "eng" | "board");
                setDirty(true);
              }}
            >
              <option value="exec">Executives</option>
              <option value="eng">Engineering</option>
              <option value="board">The board</option>
            </Select>
          </Line>
        ) : null}
      </Block>

      <Actions>
        <Button variant="primary" disabled={!dirty || save.isPending} onClick={onSave}>
          {save.isPending ? "Saving" : dirty ? "Save" : "Saved"}
        </Button>
      </Actions>

      <Block
        title="On this device"
        sub="These two apply the moment you set them, and only here. They are not part of the save above."
      >
        <Line
          label="A sound when something completes"
          sub="Synthesized and short. It never plays for anything you did not start."
        >
          <Switch
            checked={sound}
            label="Sound on actions"
            onChange={(next) => {
              setSound(next);
              setFeedbackPrefs({ sound: next });
              if (next) fireFeedback("success");
            }}
          />
        </Line>
        <Line
          label="A tap when something completes"
          sub="Only fires on hardware that supports haptics; elsewhere it does nothing."
        >
          <Switch
            checked={haptics}
            label="Haptics on actions"
            onChange={(next) => {
              setHaptics(next);
              setFeedbackPrefs({ haptics: next });
              if (next) fireFeedback("select");
            }}
          />
        </Line>
      </Block>
    </>
  );
}

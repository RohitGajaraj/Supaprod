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
 *   - The bare checkbox as the on/off control. The system has a switch, and a
 *     boundary that is on should look on from across the room.
 *
 * Ported to Meridian 2026-08-20. The switch is `Toggle`, which is deliberately
 * NOT green: under Meridian green reports an OUTCOME, so a green track would
 * say the preference SUCCEEDED. The knob position carries it instead, which is
 * the half that survives greyscale. `Loading` became `Reading` and not
 * `LoadingState`, whose own header forbids an elapsed timer on a plain fetch.
 *
 * 2026-08-26, S3: added the "When work finishes" region for the verdict email
 * (gap #2). It renders only once the fetched row carries `email_verdict`, so
 * the surface cannot ship ahead of S0's column; see
 * coordination/requests/S3/verdict-notify-trigger.md. The template it sends
 * re-lands once the email palette is promoted
 * (coordination/requests/S3/mrd-email-palette.md).
 *
 * 2026-08-31, S3: that region was making a claim the product cannot keep, and
 * the correction is in it now. It said "Work that finishes while you are away
 * also emails you what came of it" and "The result finds you, even with the tab
 * closed" to every one of sixteen people, on a default nobody set. Measured on
 * the live database the same day: 97 of 106 pieces of work carry a hold, only 2
 * have reached Learn, and the send has fired ZERO times ever, because the newest
 * `learnings` row predates its own trigger. The mechanism is right and the
 * sentence was wrong, so the sentence changed and the feature stayed. The long
 * comment beside the new second Line carries the full measurement.
 *
 * KEPT: every server function, both preference paths (the server-stored matrix
 * and the device-local interaction feedback), the same query keys, and the
 * single Save. Interaction feedback still applies instantly with no save,
 * because it is a localStorage preference, and the line says so.
 */
import { useEffect, useState } from "react";
import { Line } from "@/components/meridian/rows";
import { Link } from "@tanstack/react-router";
import {
  ACTION_LINK_FACE,
  Num,
  Actions,
  Action,
  PageHeading,
  Picker,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UserNotificationPreferences,
} from "@/lib/notifications.functions";
import { getFeedbackPrefs, setFeedbackPrefs, fireFeedback } from "@/lib/interaction-feedback";

type Category = "Approvals" | "Health" | "Budget" | "Drift";
type Channel = "app" | "email" | "digest";

/**
 * The verdict-email preference arrives with S0's migration (request:
 * coordination/requests/S3/verdict-notify-trigger.md). Until the fetched row
 * carries the key, this whole region stays hidden rather than offering a save
 * that cannot persist, so the surface can never ship ahead of its column.
 */
type PrefsPlusVerdict = UserNotificationPreferences & { email_verdict?: boolean };

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

/**
 * The App column now delivers for TWO of the four, and not for the other two.
 *
 * ── THE HOLD LIFTED AT INTEGRATION, WHICH IS WHERE IT COULD ONLY LIFT ──────
 * `a-toggle-that-cannot-deliver.test.ts` was written to fail the moment any
 * surface began rendering the feed, and to say what to do when it did. It fired
 * the first time S2's lane and this one were in the same tree: `SystemAlerts` on
 * /today (eb161ca85) calls `getNotifications` for **budget and drift**, and its
 * own header confirms the toggle has real power there — *"switching App off for
 * budget removes it here with no code on this side."*
 *
 * Neither lane could have seen this alone. The guard was on one branch and the
 * capability on another, which is exactly what an integration pass is for.
 *
 * ── THE OTHER TWO STAY OFF, AND THEY ARE NOT OVERSIGHTS ────────────────────
 * **Approvals** — Today's "What needs you" lane reads `agent_approvals`
 * DIRECTLY and never consults this feed, so switching that toggle off would not
 * stop Today showing approvals. The control would promise power it does not
 * have, which is this same defect pointing the other way.
 *
 * **Health** — the running lane already prints each run's own clock, so a stall
 * alert would be a second voice on rows that already speak.
 *
 * So the rule is a property of the CATEGORY, not of the column, and it is named
 * here rather than inlined so the next surface to start drawing a kind has one
 * place to change.
 */
const APP_DELIVERS: ReadonlySet<Category> = new Set<Category>(["Budget", "Drift"]);

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
    onSuccess: (result, updated) => {
      qc.invalidateQueries({ queryKey: ["notificationPreferences"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      // THE WRITE MUST HAVE TAKEN, not merely succeeded. A key the server's
      // schema does not know is stripped silently before the upsert, which
      // would return success while dropping exactly what the person changed.
      // Until the email_verdict key lands in PreferencesUpdateSchema
      // (coordination/requests/S3/verdict-notify-trigger.md ask 3), this check
      // is what keeps the toggle from lying about a save it cannot make.
      const dropped = Object.entries(updated).filter(
        ([k, v]) =>
          k in result.preferences && (result.preferences as Record<string, unknown>)[k] !== v,
      );
      if (dropped.length > 0) {
        toast.error(
          "That did not save. The change was accepted and then dropped, which usually means this setting is still arriving on the server. Nothing you chose is wrong; try again shortly or say so to support.",
        );
        return;
      }
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
  // null = the preference has not shipped yet; the region stays hidden.
  const [verdictEmail, setVerdictEmail] = useState<boolean | null>(null);
  const [dirty, setDirty] = useState(false);

  // Device-local, applied instantly, never part of the save.
  const [sound, setSound] = useState(() => getFeedbackPrefs().sound);
  const [haptics, setHaptics] = useState(() => getFeedbackPrefs().haptics);

  useEffect(() => {
    const row = prefs.data?.preferences as PrefsPlusVerdict | undefined;
    if (!row) return;
    setMatrix({
      Approvals: {
        app: row.in_app_approvals,
        email: row.email_approvals,
        digest: row.digest_approvals,
      },
      Health: { app: row.in_app_health, email: row.email_health, digest: row.digest_health },
      Budget: { app: row.in_app_budget, email: row.email_budget, digest: row.digest_budget },
      Drift: { app: row.in_app_drift, email: row.email_drift, digest: row.digest_drift },
    });
    setFrequency(row.digest_frequency);
    setStakeholder(row.digest_stakeholder_update ?? false);
    setAudience(row.digest_stakeholder_audience ?? "exec");
    setVerdictEmail(typeof row.email_verdict === "boolean" ? row.email_verdict : null);
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
      // Omitted entirely until the column exists, so the save can never name a
      // field the database does not know.
      ...(verdictEmail !== null ? { email_verdict: verdictEmail } : {}),
    });

  const reachable = CATEGORIES.filter((c) => CHANNELS.some((ch) => matrix[c.key][ch.key])).length;

  if (prefs.isError) {
    return (
      <>
        <PageHeading title="Notifications" sub="When the product may interrupt you, and where." />
        {/* A failed read must not render an empty matrix whose save would
            silence every alert. */}
        <ReadFailedLine error={prefs.error} onRetry={() => void prefs.refetch()}>
          Your preferences did not load, so nothing here is safe to change yet.
        </ReadFailedLine>
      </>
    );
  }

  if (prefs.isLoading) {
    return (
      <>
        <PageHeading title="Notifications" sub="When the product may interrupt you, and where." />
        <Reading>Reading your preferences.</Reading>
      </>
    );
  }

  return (
    <>
      <PageHeading
        title="Notifications"
        sub={
          reachable === 0 && verdictEmail !== true ? (
            "Nothing reaches you. Every alert is currently silent, including the ones waiting on your decision."
          ) : (
            <>
              <Num>{reachable}</Num> of the four things that can interrupt you currently do. The
              rest stay silent until you come looking.
              {verdictEmail === true
                ? " Work that reaches a result emails you what came of it."
                : ""}
            </>
          )
        }
      />

      <Region
        title="What reaches you, and how"
        /*
         * IT SAYS WHOSE SETTINGS THESE ARE, because for almost everybody they
         * are ours.
         *
         * With no `user_notification_preferences` row the reader hands back
         * defaults with every switch ON, and this pane draws them exactly as it
         * draws a row somebody chose. Measured on the live database 2026-08-28:
         * ONE row exists against 16 profiles. Fifteen of sixteen people are
         * looking at eight switches they never touched -- four of which send
         * EMAIL -- and concluding they opted in.
         *
         * The governance canon's fourth floor states the rule for the numeric
         * bars: a default the user never set is our choice, and the surface
         * names it as ours rather than presenting it as their policy. The
         * boundary says it, the autonomy bars say it, and the one setting whose
         * defaults leave the building did not.
         *
         * Same voice as `oursNote` on the boundary, deliberately: one idea, one
         * wording, wherever it appears.
         */
        sub={
          prefs.data && !prefs.data.chosen
            ? "Your working hours still apply: outside them, anything scheduled waits. Nobody has changed any of these, so what you see below is what we ship rather than anything you set."
            : "Your working hours still apply: outside them, anything scheduled waits."
        }
      >
        {CATEGORIES.map((c) => (
          <Line key={c.key} label={c.label} sub={c.sub}>
            {CHANNELS.map((ch) => (
              <Action
                key={ch.key}
                variant={matrix[c.key][ch.key] ? "default" : "quiet"}
                aria-pressed={matrix[c.key][ch.key]}
                /*
                 * THE APP COLUMN CANNOT DELIVER ANYTHING TODAY, so it does not
                 * pretend to. Traced end to end rather than assumed: the only
                 * reader of `in_app_approvals`, `in_app_health`,
                 * `in_app_budget` and `in_app_drift` is `getNotifications`, and
                 * NOTHING in src/components or src/routes imports
                 * `getNotifications` or renders an `AppNotification`. The
                 * preference is written, the feed is computed, and no surface
                 * shows it. A closed loop with no output.
                 *
                 * Four toggles a person could press, believing they had asked
                 * to be told something. An affordance is a promise, and this
                 * one could not be kept.
                 *
                 * DISABLED RATHER THAN DELETED, deliberately. The column is not
                 * a mistake, it is unfinished: Today already has a "What needs
                 * you" feed and the honest fix is to drive THAT from these
                 * preferences rather than to build a second feed here, which
                 * would be two answers to one question. Deleting the column
                 * would hide the gap instead of naming it, and would throw away
                 * settings people have already saved.
                 *
                 * Email and Digest are untouched and do deliver.
                 *
                 * WHEN THIS LIFTS, IT LIFTS FOR TWO OF THE FOUR. S2 has
                 * SystemAlerts on /today calling getNotifications for BUDGET
                 * and DRIFT (eb161ca85, not yet merged here). Approvals and
                 * Health stay disabled after that, for reasons that are not
                 * oversights: Today's What-needs-you lane reads agent_approvals
                 * DIRECTLY and never consults this feed, so an approvals toggle
                 * would promise control it does not have -- the same defect
                 * pointing the other way -- and a stall alert would be a second
                 * voice on a lane that already prints each run's clock.
                 *
                 * AND THE FEED WAS NEVER DARK BECAUSE OF THESE TOGGLES. The
                 * gate defaults to ON (`prefs?.in_app_budget ?? true`) and
                 * user_notification_preferences holds ONE row. It was dark
                 * because nothing called it, which is the distinction between
                 * a preference that is off and a feature that is unplugged.
                 */
                disabled={ch.key === "app" && !APP_DELIVERS.has(c.key)}
                title={
                  ch.key === "app" && !APP_DELIVERS.has(c.key)
                    ? "Not delivered anywhere yet"
                    : ch.title
                }
                onClick={() => toggle(c.key, ch.key)}
              >
                {ch.label}
              </Action>
            ))}
          </Line>
        ))}
        {/*
         * The sentence had to change with the toggles. It read "In-app alerts
         * are not switched on yet ... nothing in the product shows these as
         * notifications yet", which became FALSE for budget and drift the
         * moment SystemAlerts landed on /today. A held control explaining
         * itself is honest; the same explanation left standing after the hold
         * lifts is a page arguing with its own switches.
         */}
        <Line
          label="Two of these show up in the app, two do not yet"
          sub="Spend and drift appear on Today. Approvals already have their own lane there and do not need a second voice, and a stalled run prints its own clock, so those two stay held rather than looking as though they do something."
        />
      </Region>

      {verdictEmail !== null && (
        <Region
          title="When work finishes"
          sub="A result finds you with the tab closed. It goes to the address on your account."
        >
          <Line
            label="Email me what came of it"
            sub="What was expected beside what actually happened, and a link to the work. Sends as soon as the result lands, whatever the hour."
          >
            <Toggle
              checked={verdictEmail}
              label="Email me what came of finished work"
              onChange={(next) => {
                setVerdictEmail(next);
                setDirty(true);
              }}
            />
          </Line>
          {/*
           * THE OTHER HALF OF THE SAME PROMISE, AND IT IS THE LIKELIER ONE.
           *
           * The send above fires from the AGENT path at Learn, so it needs work
           * to REACH a result. Measured on the live database 2026-08-31: 97 of
           * 106 pieces of work carry a hold and 2 have reached Learn, and 42 of
           * those holds are in `TERMINAL_HOLDS`, which the sweep refuses to act
           * on by design. Nothing anywhere tells the person. The verdict send
           * itself has never fired once in production: the newest `learnings`
           * row is 2026-08-25 19:40 UTC and the trigger shipped on 2026-08-26.
           *
           * So the page was promising "the result finds you" to sixteen people
           * whose work, nine times in ten, produces no result to find them with.
           * That is standard #7, and the sentence goes rather than the feature:
           * the toggle above is real and correct about its own mechanism, and
           * this line states what it does not cover.
           *
           * NO NUMBER IN THE COPY, deliberately. A count rendered here would be
           * measured once and read forever; the measurement belongs in this
           * comment and in the unit log, where it carries its date.
           *
           * THE ROUTE OUT IS REQUIRED, not decorative (R-20 section 6). Today
           * lists held work, `TERMINAL_HOLDS` included, via
           * `src/components/today/tracks-feed.ts`. Saying "nothing tells you"
           * and stopping there would be the dead end the rule forbids.
           *
           * The send this line describes is S0's to build, because the trigger
           * lives in `src/lib/**`: see
           * `coordination/requests/S3/the-work-that-stopped-reaches-nobody.md`.
           */}
          <Line
            label="Work that stops early does not reach you yet"
            sub="This sends when work reaches a result. Work that stops before one, waiting on a tool, on evidence, or on your decision, stays where it is and nothing tells you. Today lists those."
          >
            <Link to="/today" className={ACTION_LINK_FACE.quiet}>
              See what is stopped
            </Link>
          </Line>
        </Region>
      )}

      <Region title="The digest">
        <Line
          label="How often it goes out"
          sub="Anything set to Digest above waits for this send rather than pinging you."
        >
          <Picker
            value={frequency}
            aria-label="Digest frequency"
            onChange={(e) => {
              setFrequency(e.target.value as "daily" | "weekly");
              setDirty(true);
            }}
          >
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
          </Picker>
        </Line>
        <Line
          label="Include a stakeholder update"
          sub="Your newest decision, rewritten for the audience you pick, riding the same email. No separate send."
        >
          <Toggle
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
            <Picker
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
            </Picker>
          </Line>
        ) : null}
      </Region>

      <Actions>
        <Action variant="primary" disabled={!dirty || save.isPending} onClick={onSave}>
          {save.isPending ? "Saving" : dirty ? "Save" : "Saved"}
        </Action>
      </Actions>

      <Region
        title="On this device"
        sub="These two apply the moment you set them, and only here. They are not part of the save above."
      >
        <Line
          label="A sound when something completes"
          sub="Synthesized and short. It never plays for anything you did not start."
        >
          <Toggle
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
          <Toggle
            checked={haptics}
            label="Haptics on actions"
            onChange={(next) => {
              setHaptics(next);
              setFeedbackPrefs({ haptics: next });
              if (next) fireFeedback("select");
            }}
          />
        </Line>
      </Region>
    </>
  );
}

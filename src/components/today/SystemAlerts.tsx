import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getNotifications, type AppNotification } from "@/lib/notifications.functions";

/**
 * THE TWO THINGS A PERSON WOULD MOST WANT TO BE INTERRUPTED FOR, WHICH THIS
 * PRODUCT COMPUTED AND SHOWED NOBODY.
 *
 * ── WHAT WAS WRONG ─────────────────────────────────────────────────────────
 * `getNotifications` builds four classes of alert against real tables —
 * `agent_approvals`, `agent_runs`, `ai_budgets`, `drift_incidents` — RLS-scoped,
 * degrading safely, each with a title, a detail and a live href. Verified
 * independently on 2026-08-27 with a complete count rather than a capped one:
 * **it has exactly ONE mention in all of `src/`, its own definition.** Nothing
 * called it.
 *
 * Meanwhile Settings offers four "App" toggles that write
 * `in_app_approvals`, `in_app_health`, `in_app_budget` and `in_app_drift`. The
 * preference saved, the feed computed, and no surface rendered it. A person
 * switched App on for "The output got worse", believed they had asked to be
 * told, and was never told. Found and traced by S3, who deliberately did not
 * wire it on their own route because Today already answers "what needs you"
 * and a second feed there would be two answers to one question.
 *
 * ── WHY ONLY BUDGET AND DRIFT ARE DRAWN ────────────────────────────────────
 * `approval` is this board's entire "What needs you" lane, so rendering it here
 * would be exactly the duplication S3 avoided, in the one place it would be
 * most confusing.
 *
 * `health` — runs in flight past a stall window — is EXCLUDED on a closer call,
 * and it is worth stating in case it turns out wrong. The running lane already
 * prints each run's own clock, so a reader can see a three-hour run; calling it
 * "stalled" here would be a second voice on rows that already speak. If that
 * proves too quiet it is one entry in the array below.
 *
 * Budget and drift have no home on this board at all. Spend nearing a ceiling
 * and output quality drifting are conditions of the SYSTEM rather than
 * decisions in a queue, and neither is derivable from anything Today reads.
 *
 * ── THE TOGGLES NOW MEAN SOMETHING, WITHOUT THIS FILE KNOWING ABOUT THEM ───
 * `getNotifications` already gates each class on the user's own preference, so
 * switching "App" off for budget removes it here with no code on this side.
 * That is the right shape: the preference belongs to the feed that computes it,
 * not to every surface that draws it.
 *
 * ── SILENT UNLESS IT HAS SOMETHING TO SAY ──────────────────────────────────
 * Nothing renders while the read is in flight, nothing renders when there is no
 * alert, and nothing renders when the read FAILS. That last one is deliberate
 * and is the opposite of my usual rule, so: this board already reports its read
 * failures loudly — measured against a dead backend it draws four failure
 * sentences and a banner — and a fifth line about a region that is empty on
 * almost every load is the defect S1 found on /learn, one fact reported once
 * per region. Silence here claims nothing; it never says "no alerts".
 *
 * It also means this costs the fold nothing on an ordinary morning, which
 * matters while the first Approve already sits below it.
 */

/** The classes this board does not already answer. */
const SHOWN = new Set<AppNotification["kind"]>(["budget", "drift"]);

/**
 * `href` SPLIT INTO WHAT THE ROUTER ACTUALLY TAKES.
 *
 * The feed stores a whole URL — `/engine-room?room=spend&view=caps` — and every
 * other navigation in this codebase passes `to` and `search` SEPARATELY
 * (`navigate({ to: "/engine-room", search: { room: "record" } })`). Handing the
 * query string to `to` typechecks and is not how this router reads it, so the
 * door would open on the right page in the wrong state, which is worse than a
 * door that fails visibly.
 *
 * Written here rather than fixed in the feed because that module is shared and
 * a whole URL is the right thing for the email and digest paths that also read
 * it. Only the in-app link needs the split.
 */
function splitHref(href: string): { to: string; search: Record<string, string> } {
  const q = href.indexOf("?");
  if (q < 0) return { to: href, search: {} };
  const search: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(href.slice(q + 1))) search[k] = v;
  return { to: href.slice(0, q), search };
}

export function SystemAlerts() {
  const fNotifications = useServerFn(getNotifications);
  const q = useQuery({
    queryKey: ["today", "system-alerts"],
    queryFn: () => fNotifications(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const alerts = (q.data?.notifications ?? []).filter((n) => SHOWN.has(n.kind));
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label="Conditions worth interrupting you for"
      className="flex flex-col gap-mrd-3 rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-4"
    >
      {alerts.map((n) => (
        <div key={n.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {/* The severity is carried by the WORD, not only by a colour. R-19
              keeps that in scope at full weight: colour must never be the only
              signal, and "cap reached" reads the same in greyscale. */}
          <span
            className={`text-mrd-base font-medium ${
              n.severity === "warning" ? "text-mrd-fail" : "text-mrd-ink"
            }`}
          >
            {n.title}
          </span>
          <span className="text-mrd-data leading-mrd-prose text-mrd-body">{n.detail}</span>
          {(() => {
            const { to, search } = splitHref(n.href);
            return (
              <Link
                to={to}
                search={search}
                className="text-mrd-data text-mrd-you underline underline-offset-2"
              >
                Open it
              </Link>
            );
          })()}
        </div>
      ))}
    </section>
  );
}

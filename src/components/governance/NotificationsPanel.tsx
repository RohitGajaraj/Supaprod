/**
 * ATTENTION: one calm feed of what needs the operator right now. Ported onto
 * the primitives, 2026-07-29.
 *
 * WHAT CHANGED, AND WHY. It was a stack of `bento` cards, each carrying a
 * coloured dot plus a mono-caps severity word plus a title plus a detail: four
 * elements to say two facts, and the severity repeated on every single card.
 * The severity is now said ONCE, as the heading of the group it names (hard ban
 * 10: label, sublabel and helper all saying the same thing). What is left is a
 * list of one-line rows, which is what a feed is.
 *
 * The order carries the hierarchy rather than the colour: what is blocked on
 * you is first, and the page greys out cleanly. Nothing here wears a hue.
 *
 * Each row navigates by the server-supplied `href`, which carries a query
 * string (`/engine-room?room=spend&view=caps`), so it goes through the router's
 * own `href` option rather than `to`, which does not parse one.
 *
 * KNOWN DEFECT, REPORTED NOT PAPERED OVER: nothing in `src/` mounts this
 * component. `AttentionBell` is its doorway and points at
 * `/engine-room?room=record&view=verify`, but no room renders the feed, so the
 * bell's count is live and its destination is not. That is a wiring fix in the
 * Engine Room, not a styling one, and it is left for the lane that owns it.
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getNotifications, type AppNotification } from "@/lib/notifications.functions";
import { Block, Empty, Failed, Loading, Row } from "@/components/shell/primitives";

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** The severity, said once per group instead of once per row. `sub` says what
 *  the group MEANS for you, never a restatement of its own title. */
const GROUPS: { severity: AppNotification["severity"]; title: string; sub: string }[] = [
  {
    severity: "action",
    title: "Needs you",
    sub: "Each one is stopped until you rule on it.",
  },
  {
    severity: "warning",
    title: "Worth a look",
    sub: "Nothing is stopped. These are heading somewhere you would not choose.",
  },
  {
    severity: "info",
    title: "Heads up",
    sub: "Nothing to do. Here so nothing later comes as a surprise.",
  },
];

export function NotificationsPanel() {
  const fGet = useServerFn(getNotifications);
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => fGet() });

  if (q.isLoading) return <Loading>Reading what needs you.</Loading>;

  // A read that FAILED is not an empty state. "Nothing needs you" and "we could
  // not find out what needs you" are different facts, and an operator acts
  // differently on each.
  if (q.isError) {
    return (
      <Failed onRetry={() => void q.refetch()}>
        {(q.error as Error)?.message ??
          "This did not load, so an empty feed here would not mean you are clear."}
      </Failed>
    );
  }

  const items = q.data?.notifications ?? [];

  if (items.length === 0) {
    return (
      <Empty>
        Nothing needs you. A call waiting on a decision, spend nearing a cap, or a loop that has
        stalled arrives here the moment it happens.
      </Empty>
    );
  }

  return (
    <>
      {GROUPS.map((g) => {
        const rows = items.filter((n) => n.severity === g.severity);
        if (rows.length === 0) return null;
        return (
          <Block key={g.severity} title={g.title} sub={g.sub}>
            {rows.map((n) => (
              <Row
                key={n.id}
                lead={n.title}
                sub={n.detail}
                time={ago(n.created_at)}
                tight
                onClick={() => void navigate({ href: n.href })}
              />
            ))}
          </Block>
        );
      })}
    </>
  );
}

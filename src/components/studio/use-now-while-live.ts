import * as React from "react";

/**
 * NOW, ticking once a second while the work is alive and frozen the moment it
 * stops.
 *
 * This is what makes the run's duration an ELAPSED COUNTER rather than a number
 * that was true when the page loaded. It is deliberately not a progress bar: a
 * coding agent cannot know how long it will take, and a bar that implies it can
 * is a lie the user catches inside one session. A counter claims only that time
 * is passing, which is the one thing that is certainly true.
 *
 * The interval is torn down the moment the run is not live, so a finished run
 * left open on a background tab costs nothing.
 *
 * ITS OWN FILE, following this folder's split (studio-format.ts for pure
 * helpers, studio-ui.tsx for components) and the shell's own convention that a
 * hook gets a file — see shell/use-selection.ts. A hook exported beside
 * components breaks fast refresh for every component in that file.
 */
export function useNowWhileLive(live: boolean): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [live]);
  return now;
}

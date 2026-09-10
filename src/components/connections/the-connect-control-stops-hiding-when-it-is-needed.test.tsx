/**
 * THE CONNECT CONTROL HID ITSELF AT THE MOMENT IT WAS NEEDED.
 *
 * THE REPORTED DEFECT, and it is why these are RENDER tests and not source-text
 * ones. S1 mounted `AskInPlace` on a held Build station, which is the exact
 * situation `SPEC-CONNECTORS.md` §5 rule 4 wrote it for, and **it drew nothing.**
 * Their note in `track/TrackRun.tsx` has the diagnosis exactly right: the
 * component decided the need was met by asking whether a CONNECTOR EXISTS, while
 * that station's blocker was `canDispatchToRepo` failing because no repository
 * RESOLVES, most often a credential that is present with no repo bound. The two
 * disagreed precisely where it mattered, so the control concluded it was
 * satisfied and returned null while the station could not proceed. They reverted
 * rather than patch another lane's file, which was right, and it left this
 * component with zero importers and zero mounts.
 *
 * A source-text assertion could never have caught that, because every line of
 * the component was correct read on its own. The bug was a rendered absence.
 *
 * THE THIRD CASE IS THE ONE WITH TEETH. When the need is unmet but a connector
 * IS present, offering the connect buttons would start an authorisation the
 * person has already completed, which reads as "you did it wrong" when they did
 * it right. So that branch must render the ask AND withhold the buttons.
 *
 * HARNESS. The `mock.module` pattern from `PublishTeardown.test.tsx`:
 * `@tanstack/react-start` is re-exported wholesale with only `useServerFn`
 * swapped for identity, because the `*.functions` modules call `createServerFn`
 * at module scope. `Link` is stubbed to an anchor so the component can render
 * outside a router. React Query is REAL, so these are the states a person
 * actually passes through.
 */
import { describe, expect, test, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

type Availability = Record<string, Record<string, boolean>>;
let CONNECTIONS: { provider: string; status: string }[] = [];
let AVAILABILITY: Availability = {};

const realStart = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...realStart,
  useServerFn: (fn: unknown) => fn,
}));

const realRouter = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...realRouter,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

/*
 * SPREAD THE REAL MODULE, OVERRIDE ONE EXPORT.
 *
 * `mock.module` is process-global in bun and every test file shares one process,
 * so a mock that returns ONLY the export this file needs deletes the rest of the
 * module for every other file. Replacing this one wholesale broke
 * `onboarding/ObsidianOnboarding.test.tsx` (since deleted) with `SyntaxError: Export named
 * 'saveGatewayConnection' not found`, and it broke it only when the two ran
 * together, which is why the file passed alone and the suite did not. Same
 * discipline as the `@tanstack/react-start` mock above and for the same reason.
 */
const realConnections = await import("@/lib/connections.functions");
mock.module("@/lib/connections.functions", () => ({
  ...realConnections,
  listConnections: () =>
    Promise.resolve({ connections: CONNECTIONS, providerAvailability: AVAILABILITY }),
}));

/**
 * The mutations are not under test here; the question is what renders. Spread
 * for the same reason as above: this module also exports `GATEWAY_BASE_URL`, and
 * a wholesale replacement would delete it process-wide for anyone who imports it
 * later. Nothing does today, which is exactly when the trap is cheapest to avoid.
 */
const realActions = await import("./useConnectorActions");
mock.module("./useConnectorActions", () => ({
  ...realActions,
  SUITE_PROVIDERS: {},
  useConnectorActions: () => ({
    busy: false,
    mGithub: { mutate: () => {} },
    mGateway: { mutate: () => {} },
    mNative: { mutate: () => {} },
    mSuite: { mutate: () => {} },
  }),
}));

const { AskInPlace } = await import("./AskInPlace");

function ui(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

/** GitHub, connected, with its app registered so it would be offerable. */
function githubIsConnected() {
  CONNECTIONS = [{ provider: "github", status: "connected" }];
  AVAILABILITY = { github: { githubAppConfigured: true, envConfigured: false } };
}
function nothingIsConnected() {
  CONNECTIONS = [];
  AVAILABILITY = { github: { githubAppConfigured: true, envConfigured: false } };
}

describe("AskInPlace stops hiding when the need is genuinely unmet", () => {
  test("ORIGINAL BEHAVIOUR IS UNCHANGED: a connected connector with no caller test hides it", async () => {
    githubIsConnected();
    const { container } = ui(
      <AskInPlace need="somewhere to push the change" suggest={["github"]} />,
    );
    await screen.findByText(/./, {}, { timeout: 50 }).catch(() => {});
    expect(container.textContent ?? "").not.toContain("This needs");
  });

  test("THE DEFECT: a connected connector plus a caller saying the need is unmet no longer hides it", async () => {
    githubIsConnected();
    ui(
      <AskInPlace
        need="somewhere to push the change"
        why="Build cannot start."
        suggest={["github"]}
        needIsMet={false}
      />,
    );
    expect(await screen.findByText(/This needs somewhere to push the change/)).toBeTruthy();
  });

  test("and it withholds the connect buttons, because connecting again fixes nothing", async () => {
    githubIsConnected();
    ui(<AskInPlace need="somewhere to push the change" suggest={["github"]} needIsMet={false} />);
    // P-44 (A-QUEUE.md): this door used to read "Finish it in Settings" and
    // point at the account list, which is not where a binding is changed.
    const door = await screen.findByText(/Finish it on Sync/);
    expect(door).toBeTruthy();
    expect(door.closest("a")?.getAttribute("href")).toBe("/sources");
    expect(screen.queryByText(/^Connect GitHub$/)).toBeNull();
    expect(screen.queryByText(/connecting again would change nothing/)).toBeTruthy();
  });

  test("with nothing connected it still asks to connect, which was never broken", async () => {
    nothingIsConnected();
    ui(<AskInPlace need="somewhere to push the change" suggest={["github"]} />);
    expect(await screen.findByText(/This needs somewhere to push the change/)).toBeTruthy();
    expect(screen.queryByText(/Finish it on Sync/)).toBeNull();
  });
});

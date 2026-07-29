import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, fireEvent, waitFor, screen, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * CalendarPanel Test Suite
 *
 * CalendarPanel is the Knowledge > Calendar surface: a list / Month / Year
 * switcher over a merged feed of calendar events and meetings, plus the
 * production mutations that ride it (two-way sync, create / update / delete,
 * the Scheduler slot proposer, deep-work planning, and calendar OAuth).
 *
 * The live seams (server functions, workspace, confirm, toasts) are replaced
 * with mock.module, the pattern DecisionsPanel/GlobalComposer established for
 * query-backed components. Everything else is the real thing: real TanStack
 * Query, real mutations, real render. Retries are off so a failure surfaces
 * immediately instead of hanging the test.
 */

/* ---- The live seams ---- */

type Conn = {
  id: string;
  provider: "google" | "microsoft";
  product: string;
  account_email: string | null;
};

const NO_EVENTS = { events: [] as unknown[] };
const NO_MEETINGS = { meetings: [] as unknown[] };
const NO_CONNS = {
  connections: [] as Conn[],
  providersAvailable: { google_calendar: true, microsoft_outlook: true },
};

// Per-test data + spies. The mocked modules read these at call time so a test
// can set up its world before rendering without re-registering the mock.
let eventsResult: () => Promise<unknown> = async () => NO_EVENTS;
let meetingsResult: () => Promise<unknown> = async () => NO_MEETINGS;
let connsResult: () => Promise<unknown> = async () => NO_CONNS;
let slotsResult: () => Promise<unknown> = async () => ({ slots: [] });
let blocksResult: () => Promise<unknown> = async () => ({ blocks: [] });
let confirmAnswer = true;

const listEventsSpy = mock(() => eventsResult());
const listMeetingsSpy = mock((_args?: unknown) => meetingsResult());
const listConnsSpy = mock(() => connsResult());
const syncSpy = mock(async (_args?: unknown) => ({ count: 3 }));
const createSpy = mock(async (_args?: unknown) => ({ ok: true }));
const updateSpy = mock(async (_args?: unknown) => ({ ok: true }));
const deleteSpy = mock(async (_args?: unknown) => ({ ok: true }));
const proposeSpy = mock((_args?: unknown) => slotsResult());
const planSpy = mock((_args?: unknown) => blocksResult());
const startConnectSpy = mock(async (_args?: unknown) => ({
  authorizeUrl: "https://consent.example/oauth",
}));
const disconnectSpy = mock(async (_args?: unknown) => ({ ok: true }));
const confirmSpy = mock(async (_opts?: unknown) => confirmAnswer);
const toastSuccessSpy = mock((_m?: unknown) => "1");
const toastErrorSpy = mock((_m?: unknown) => "1");

const calActual = await import("@/lib/calendar.functions");
const connActual = await import("@/lib/calendar-connections.functions");
const meetActual = await import("@/lib/meetings.functions");
const notifyActual = await import("@/lib/notify");

mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => ({ activeWorkspaceId: "workspace-1" }),
}));
mock.module("@/hooks/use-confirm", () => ({
  useConfirm: () => confirmSpy,
}));
mock.module("@/lib/notify", () => ({
  ...notifyActual,
  toast: { ...notifyActual.toast, success: toastSuccessSpy, error: toastErrorSpy },
}));
mock.module("@/lib/calendar.functions", () => ({
  ...calActual,
  listCalendarEvents: listEventsSpy,
  syncCalendar: syncSpy,
  createCalendarEvent: createSpy,
  updateCalendarEvent: updateSpy,
  deleteCalendarEvent: deleteSpy,
  proposeSlots: proposeSpy,
  proposeWorkBlocks: planSpy,
}));
mock.module("@/lib/calendar-connections.functions", () => ({
  ...connActual,
  listMySuiteConnections: listConnsSpy,
  startSuiteConnect: startConnectSpy,
  disconnectSuiteConnection: disconnectSpy,
}));
mock.module("@/lib/meetings.functions", () => ({
  ...meetActual,
  listMeetings: listMeetingsSpy,
}));

const { CalendarPanel, fmtTime, whenLabel, toLocalInput } = await import("./CalendarPanel");

/* ---- Harness ---- */

/**
 * Render the panel inside a throwaway QueryClient. Retries are off on both
 * queries and mutations: a rejected server fn must fail the assertion now, not
 * three exponential backoffs later.
 */
function renderPanel(
  props: Partial<{ meetingId: string | undefined; onMeetingChange: (id?: string) => void }> = {},
): RenderResult {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CalendarPanel
        meetingId={props.meetingId}
        onMeetingChange={props.onMeetingChange ?? (() => {})}
      />
    </QueryClientProvider>,
  );
}

/** The loading state. The shimmer went with the port (2026-07-29): loading is
 *  the THIRD fact and it says so in words, so the probe is the live region the
 *  Loading primitive renders rather than a gradient. */
const shimmer = (c: HTMLElement) => c.querySelector(".sp-loading[aria-live]");

/**
 * Assert an element is absent. Never write expect(node).toBeNull(): when that
 * fails, Bun deep-serializes the whole DOM node, which takes tens of seconds
 * and blows the surrounding waitFor budget. Compare a boolean instead.
 */
function expectGone(el: Element | null | undefined) {
  expect(el == null).toBe(true);
}

/** Wait for the two feed queries to settle so the skeleton is gone. */
async function renderLoaded(
  props?: Parameters<typeof renderPanel>[0],
): Promise<ReturnType<typeof renderPanel>> {
  const view = renderPanel(props);
  await waitFor(() => expectGone(shimmer(view.container)));
  return view;
}

const hoursOut = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

function makeEvent(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "evt-1",
    title: "Design review",
    description: null,
    location: null,
    start_at: hoursOut(3),
    end_at: hoursOut(4),
    all_day: false,
    hangout_link: null,
    html_link: null,
    organizer_email: null,
    attendees: [],
    ...over,
  };
}

function makeMeeting(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "mtg-1",
    title: "Weekly sync",
    start_at: hoursOut(5),
    processed_at: null,
    summary: null,
    stakeholder: null,
    ...over,
  };
}

/** Click the calendar view switcher. */
function switchTo(label: "List" | "Month" | "Year") {
  fireEvent.click(screen.getByText(label));
}

beforeEach(() => {
  eventsResult = async () => NO_EVENTS;
  meetingsResult = async () => NO_MEETINGS;
  connsResult = async () => NO_CONNS;
  slotsResult = async () => ({ slots: [] });
  blocksResult = async () => ({ blocks: [] });
  confirmAnswer = true;
  window.open = mock(() => null) as unknown as typeof window.open;
});

afterEach(() => {
  for (const spy of [
    listEventsSpy,
    listMeetingsSpy,
    listConnsSpy,
    syncSpy,
    createSpy,
    updateSpy,
    deleteSpy,
    proposeSpy,
    planSpy,
    startConnectSpy,
    disconnectSpy,
    confirmSpy,
    toastSuccessSpy,
    toastErrorSpy,
  ]) {
    spy.mockClear();
  }
});

/* ---- Pure formatters ---- */

describe("CalendarPanel · time formatting helpers", () => {
  it("fmtTime returns 'all day' for an all-day item, ignoring the clock", () => {
    expect(fmtTime(new Date(2026, 6, 25, 14, 30).toISOString(), true)).toBe("all day");
  });

  it("fmtTime renders a timed item as hour and zero-padded minute", () => {
    const out = fmtTime(new Date(2026, 6, 25, 14, 30).toISOString(), false);
    // Locale decides 12h vs 24h, so pin the shape and the minute, not the string.
    expect(out).toMatch(/^\d{1,2}:\d{2}(\s\S*[AP]M)?$/i);
    expect(out).toContain(":30");
  });

  it("fmtTime zero-pads a single-digit minute", () => {
    expect(fmtTime(new Date(2026, 6, 25, 9, 5).toISOString(), false)).toContain(":05");
  });

  it("whenLabel composes weekday, day of month and the delegated time", () => {
    const iso = new Date(2026, 6, 25, 14, 30).toISOString();
    const d = new Date(iso);
    const weekday = d.toLocaleDateString([], { weekday: "short" });
    expect(whenLabel(iso, false)).toBe(`${weekday} 25 · ${fmtTime(iso, false)}`);
  });

  it("whenLabel carries the all-day marker into the time slot", () => {
    const iso = new Date(2026, 6, 25, 14, 30).toISOString();
    expect(whenLabel(iso, true)).toContain("25 · all day");
  });

  it("toLocalInput produces a datetime-local value", () => {
    expect(toLocalInput(new Date(2026, 6, 25, 14, 30).toISOString())).toBe("2026-07-25T14:30");
  });

  it("toLocalInput zero-pads month, day, hour and minute", () => {
    expect(toLocalInput(new Date(2026, 0, 5, 9, 5).toISOString())).toBe("2026-01-05T09:05");
  });

  it("toLocalInput reads local wall time, not UTC", () => {
    const d = new Date(2026, 6, 25, 14, 30);
    const out = toLocalInput(d.toISOString());
    expect(out.slice(11)).toBe(`${String(d.getHours()).padStart(2, "0")}:30`);
  });
});

/* ---- Chrome ---- */

describe("CalendarPanel · toolbar and view switcher", () => {
  it("renders the four production actions", async () => {
    await renderLoaded();
    expect(screen.getByLabelText("Calendar connections")).toBeTruthy();
    expect(screen.getByText("New event · Scheduler proposes slots")).toBeTruthy();
    expect(screen.getByText("Plan deep work")).toBeTruthy();
    expect(screen.getAllByText("Sync · pulls 14 days").length).toBeGreaterThan(0);
  });

  it("renders the List / Month / Year switcher and opens on List", async () => {
    const { container } = await renderLoaded();
    expect(screen.getByText("List")).toBeTruthy();
    expect(screen.getByText("Month")).toBeTruthy();
    expect(screen.getByText("Year")).toBeTruthy();
    expect(container.textContent).toContain("Nothing in the next 14 days");
  });

  it("persists the chosen view to localStorage", async () => {
    await renderLoaded();
    switchTo("Month");
    await waitFor(() => {
      expect(window.localStorage.getItem("supaprod.calendar.view")).toBe("month");
    });
  });

  it("restores a stored view on mount", async () => {
    window.localStorage.setItem("supaprod.calendar.view", "year");
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("· occupancy"));
  });

  it("upgrades the pre-Ember stored 'grid' value to Month", async () => {
    window.localStorage.setItem("supaprod.calendar.view", "grid");
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.querySelector('[aria-label="Next month"]')).toBeTruthy());
  });
});

/* ---- List view ---- */

describe("CalendarPanel · list view", () => {
  it("shows events and meetings from the next 14 days in one feed", async () => {
    eventsResult = async () => ({ events: [makeEvent()] });
    meetingsResult = async () => ({ meetings: [makeMeeting()] });
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("Design review"));
    expect(container.textContent).toContain("Weekly sync");
  });

  it("sorts the feed by start time", async () => {
    eventsResult = async () => ({
      events: [
        makeEvent({ id: "late", title: "Later event", start_at: hoursOut(30) }),
        makeEvent({ id: "early", title: "Earlier event", start_at: hoursOut(2) }),
      ],
    });
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("Earlier event"));
    const text = container.textContent ?? "";
    expect(text.indexOf("Earlier event")).toBeLessThan(text.indexOf("Later event"));
  });

  it("drops items outside the 14 day window", async () => {
    eventsResult = async () => ({
      events: [
        makeEvent({ id: "old", title: "Last month", start_at: hoursOut(-24 * 30) }),
        makeEvent({ id: "far", title: "Next quarter", start_at: hoursOut(24 * 90) }),
        makeEvent({ id: "now", title: "In window", start_at: hoursOut(6) }),
      ],
    });
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("In window"));
    expect(container.textContent).not.toContain("Last month");
    expect(container.textContent).not.toContain("Next quarter");
  });

  it("names the window in the empty state instead of claiming an empty calendar", async () => {
    const { container } = await renderLoaded();
    expect(container.textContent).toContain("Nothing in the next 14 days");
    expect(container.textContent).toContain("Sync pulls the next 14 days");
  });

  it("points at the Month and Year views when older entries exist", async () => {
    eventsResult = async () => ({
      events: [makeEvent({ id: "old", title: "Old", start_at: hoursOut(-24 * 40) })],
    });
    const { container } = await renderLoaded();
    await waitFor(() =>
      expect(container.textContent).toContain("1 earlier entry lives in the Month and Year views"),
    );
  });

  it("pluralizes the earlier-entries count", async () => {
    eventsResult = async () => ({
      events: [
        makeEvent({ id: "o1", title: "Old 1", start_at: hoursOut(-24 * 40) }),
        makeEvent({ id: "o2", title: "Old 2", start_at: hoursOut(-24 * 41) }),
      ],
    });
    const { container } = await renderLoaded();
    await waitFor(() =>
      expect(container.textContent).toContain("2 earlier entries live in the Month and Year views"),
    );
  });

  it("says a processed meeting has been read", async () => {
    // The VerdictChip is retired. A completed outcome is a WORD carried by the
    // one class that means it.
    meetingsResult = async () => ({
      meetings: [makeMeeting({ processed_at: new Date().toISOString() })],
    });
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.querySelector(".sp-pass")).toBeTruthy());
    expect(container.querySelector(".sp-pass")!.textContent).toBe("read");
  });

  it("expands a meeting that carries a Historian capture", async () => {
    meetingsResult = async () => ({
      meetings: [makeMeeting({ summary: "Agreed to cut the export tab." })],
    });
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("Weekly sync"));
    expect(container.textContent).not.toContain("Agreed to cut the export tab.");

    fireEvent.click(screen.getByText("Weekly sync").closest('[role="button"]')!);
    await waitFor(() => expect(container.textContent).toContain("Agreed to cut the export tab."));
    expect(container.textContent).toContain("capture · extracted by Historian");
  });

  it("opens the meeting sheet when a meeting has no capture to expand", async () => {
    const onMeetingChange = mock((_id?: string) => {});
    meetingsResult = async () => ({ meetings: [makeMeeting()] });
    await renderLoaded({ onMeetingChange });
    await waitFor(() => expect(screen.getByText("Weekly sync")).toBeTruthy());

    fireEvent.click(screen.getByText("Weekly sync").closest('[role="button"]')!);
    expect(onMeetingChange).toHaveBeenCalledWith("mtg-1");
  });

  it("shows an event location, and falls back to the attendee count", async () => {
    eventsResult = async () => ({
      events: [
        makeEvent({ id: "e1", title: "Onsite", location: "Room 4" }),
        makeEvent({
          id: "e2",
          title: "Remote",
          attendees: [{ email: "a@b.c" }, { email: "d@e.f" }],
        }),
      ],
    });
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("Room 4"));
    expect(container.textContent).toContain("2 attendees");
  });

  it("links an event back to its provider when it has an html_link", async () => {
    eventsResult = async () => ({
      events: [makeEvent({ html_link: "https://calendar.example/evt-1" })],
    });
    await renderLoaded();
    const link = await screen.findByLabelText("Open in provider");
    expect(link.getAttribute("href")).toBe("https://calendar.example/evt-1");
  });
});

/* ---- Month view ---- */

describe("CalendarPanel · month view", () => {
  const monthName = () => new Date().toLocaleDateString([], { month: "long" });

  it("opens on the current month with today already selected", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain(monthName()));
    expect(container.textContent).toContain("· today");
  });

  it("renders a whole number of Monday-first weeks", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.querySelector('[aria-label="Next month"]')).toBeTruthy());

    // Only in-month cells carry an aria-label; the adjacent-month spacers are
    // unlabelled, so the grid is counted through the shared parent.
    const labelled = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.getAttribute("aria-label")?.includes(monthName()),
    );
    const grid = labelled[0].parentElement!;
    expect(grid.querySelectorAll("button").length % 7).toBe(0);
    expect(labelled.length).toBe(
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
    );
  });

  it("labels each day cell with its event count", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    eventsResult = async () => ({
      events: [makeEvent({ id: "a", start_at: today.toISOString() })],
    });
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() =>
      expect(
        container.querySelector(`button[aria-label="${monthName()} ${today.getDate()} · 1 event"]`),
      ).toBeTruthy(),
    );
  });

  it("pads the grid with blank, disabled cells for the adjacent months", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.querySelector('[aria-label="Next month"]')).toBeTruthy());

    const labelled = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.getAttribute("aria-label")?.includes(monthName()),
    );
    const cells = Array.from(labelled[0].parentElement!.querySelectorAll("button"));
    const firstDayIndex = cells.indexOf(labelled[0]);
    const lastDayIndex = cells.indexOf(labelled[labelled.length - 1]);

    // The 1st sits at its Monday-first weekday offset, and everything outside
    // the month is a blank, non-clickable spacer.
    const now = new Date();
    expect(firstDayIndex).toBe((new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7);
    for (const cell of [...cells.slice(0, firstDayIndex), ...cells.slice(lastDayIndex + 1)]) {
      expect(cell.hasAttribute("disabled")).toBe(true);
      expect(cell.textContent?.trim()).toBe("");
    }
  });

  it("steps back a month and clears the selection", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain("· today"));

    fireEvent.click(screen.getByLabelText("Previous month"));
    const prev = new Date();
    prev.setDate(1);
    prev.setMonth(prev.getMonth() - 1);
    await waitFor(() =>
      expect(container.textContent).toContain(prev.toLocaleDateString([], { month: "long" })),
    );
    expect(container.textContent).not.toContain("· today");
  });

  it("steps forward a month", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain(monthName()));

    fireEvent.click(screen.getByLabelText("Next month"));
    const next = new Date();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    await waitFor(() =>
      expect(container.textContent).toContain(next.toLocaleDateString([], { month: "long" })),
    );
  });

  it("crosses the year boundary when stepping back past January", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain(monthName()));

    for (let i = 0; i < 13; i++) fireEvent.click(screen.getByLabelText("Previous month"));

    // 13 steps back always crosses at least one year boundary, whichever month
    // the suite happens to run in.
    const now = new Date();
    const expected = new Date(now.getFullYear(), now.getMonth() - 13, 1);
    expect(expected.getFullYear()).toBeLessThan(now.getFullYear());
    const label = `${expected.toLocaleDateString([], { month: "long" })} ${expected.getFullYear()}`;
    await waitFor(() => expect(container.textContent).toContain(label));
  });

  it("Today returns the cursor to this month and reselects today", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain("· today"));

    fireEvent.click(screen.getByLabelText("Next month"));
    await waitFor(() => expect(container.textContent).not.toContain("· today"));

    fireEvent.click(screen.getByText("Today"));
    await waitFor(() => expect(container.textContent).toContain("· today"));
  });

  it("says the selected day is free when nothing is on it", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() =>
      expect(container.textContent).toContain("Nothing scheduled · a good deep-work day."),
    );
  });

  it("lists the selected day's items and opens an event from them", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    eventsResult = async () => ({
      events: [makeEvent({ id: "evt-1", title: "Design review", start_at: today.toISOString() })],
    });
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain("Design review"));

    const dayRow = screen
      .getAllByText((_t, el) => el?.textContent?.endsWith("· Design review") === true)
      .pop()!;
    fireEvent.click(dayRow);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
  });

  it("quick-adds an 09:00 to 10:00 focus block on the selected day", async () => {
    await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(screen.getByText("+ Add · syncs back")).toBeTruthy());

    fireEvent.click(screen.getByText("+ Add · syncs back"));
    await waitFor(() => expect(createSpy).toHaveBeenCalled());

    const arg = createSpy.mock.calls[0][0] as {
      data: { summary: string; start_at: string; end_at: string };
    };
    const start = new Date(arg.data.start_at);
    const end = new Date(arg.data.end_at);
    expect(arg.data.summary).toBe("Hold · focus block");
    expect(start.getHours()).toBe(9);
    expect(end.getHours()).toBe(10);
    expect(start.getDate()).toBe(new Date().getDate());
    // THE COMMIT: a write that reaches the user's real calendar leaves a
    // receipt naming the consequence, never a toast confirming the click.
    await waitFor(() => expect(screen.getByText("You held an hour")).toBeTruthy());
    expect(toastSuccessSpy).not.toHaveBeenCalled();
  });

  it("toggles the selected day off when its cell is clicked again", async () => {
    const { container } = await renderLoaded();
    switchTo("Month");
    await waitFor(() => expect(container.textContent).toContain("· today"));

    const todayCell = container.querySelector(
      `button[aria-label^="${monthName()} ${new Date().getDate()} ·"]`,
    )!;
    fireEvent.click(todayCell);
    await waitFor(() => expect(container.textContent).not.toContain("· today"));
  });
});

/* ---- Year view ---- */

describe("CalendarPanel · year view", () => {
  it("renders the occupancy quilt for the current year", async () => {
    const { container } = await renderLoaded();
    switchTo("Year");
    await waitFor(() =>
      expect(container.textContent).toContain(`${new Date().getFullYear()} · occupancy`),
    );
    expect(container.textContent).toContain("today ringed ember");
  });

  it("stops the grid at today rather than rendering the rest of the year", async () => {
    const { container } = await renderLoaded();
    switchTo("Year");
    await waitFor(() => expect(container.textContent).toContain("· occupancy"));
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (const m of months.slice(new Date().getMonth() + 1)) {
      expect(container.textContent).not.toContain(m);
    }
  });
});

/* ---- Event editor ---- */

describe("CalendarPanel · event editor", () => {
  async function openEditor() {
    eventsResult = async () => ({ events: [makeEvent()] });
    const view = await renderLoaded();
    await waitFor(() => expect(screen.getByText("Design review")).toBeTruthy());
    fireEvent.click(screen.getByText("Design review").closest('[role="button"]')!);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    return view;
  }

  it("opens the editor prefilled from the event row", async () => {
    await openEditor();
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("Edit event");
    expect((screen.getByDisplayValue("Design review") as HTMLInputElement).value).toBe(
      "Design review",
    );
  });

  it("blocks Save while the title is empty", async () => {
    await openEditor();
    const title = screen.getByDisplayValue("Design review") as HTMLInputElement;
    fireEvent.change(title, { target: { value: "  " } });
    await waitFor(() =>
      expect((screen.getByText("Save · syncs back") as HTMLButtonElement).disabled).toBe(true),
    );
  });

  it("saves an edited event back through updateCalendarEvent", async () => {
    await openEditor();
    fireEvent.change(screen.getByDisplayValue("Design review"), {
      target: { value: "Design review v2" },
    });
    fireEvent.click(screen.getByText("Save · syncs back"));

    await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    const arg = updateSpy.mock.calls[0][0] as {
      data: { externalId: string; summary: string };
    };
    expect(arg.data.externalId).toBe("evt-1");
    expect(arg.data.summary).toBe("Design review v2");
  });

  it("closes the editor and leaves a receipt naming what the save reached", async () => {
    await openEditor();
    fireEvent.click(screen.getByText("Save · syncs back"));
    await waitFor(() => expectGone(screen.queryByRole("dialog")));
    await waitFor(() => expect(screen.getByText("You changed an event")).toBeTruthy());
    expect(toastSuccessSpy).not.toHaveBeenCalled();
  });

  it("asks for confirmation before deleting, then deletes", async () => {
    await openEditor();
    fireEvent.click(screen.getByText("Delete · removes everywhere"));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
    const arg = deleteSpy.mock.calls[0][0] as { data: { externalId: string } };
    expect(arg.data.externalId).toBe("evt-1");
  });

  it("keeps the event when the confirmation is declined", async () => {
    confirmAnswer = false;
    await openEditor();
    fireEvent.click(screen.getByText("Delete · removes everywhere"));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("dismisses the editor without saving on Cancel", async () => {
    await openEditor();
    fireEvent.click(screen.getByText("Cancel · keeps it"));
    await waitFor(() => expectGone(screen.queryByRole("dialog")));
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("leaves a FAILED receipt and keeps the editor open when the save is rejected", async () => {
    updateSpy.mockImplementationOnce(async () => {
      throw new Error("Provider rejected the update");
    });
    await openEditor();
    fireEvent.click(screen.getByText("Save · syncs back"));
    await waitFor(() => expect(screen.getByText("You tried to change an event")).toBeTruthy());
    // The cause survives, and the receipt is marked failed rather than
    // flashing red and erasing itself.
    expect(document.body.textContent).toContain("Provider rejected the update");
    expect(document.querySelector('.sp-receipt[data-failed="true"]')).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

/* ---- Sync and connections ---- */

describe("CalendarPanel · sync and connections", () => {
  it("pulls 14 days through syncCalendar", async () => {
    await renderLoaded();
    fireEvent.click(screen.getAllByText("Sync · pulls 14 days")[0]);
    await waitFor(() => expect(syncSpy).toHaveBeenCalled());
    const arg = syncSpy.mock.calls[0][0] as { data: { calendarId: string; daysAhead: number } };
    expect(arg.data).toEqual({ calendarId: "primary", daysAhead: 14 });
  });

  it("reports the synced count on a receipt, with the real number", async () => {
    await renderLoaded();
    fireEvent.click(screen.getAllByText("Sync · pulls 14 days")[0]);
    await waitFor(() => expect(screen.getByText("You pulled your calendar in")).toBeTruthy());
    // The count is the server's, never invented.
    expect(document.body.textContent).toContain("3 events");
  });

  it("leaves a FAILED receipt when the sync is rejected", async () => {
    syncSpy.mockImplementationOnce(async () => {
      throw new Error("Calendar is not connected");
    });
    await renderLoaded();
    fireEvent.click(screen.getAllByText("Sync · pulls 14 days")[0]);
    await waitFor(() =>
      expect(screen.getByText("You tried to pull your calendar in")).toBeTruthy(),
    );
    expect(document.body.textContent).toContain("Calendar is not connected");
  });

  it("marks the connections button live once a calendar account exists", async () => {
    connsResult = async () => ({
      connections: [
        { id: "c1", provider: "google", product: "calendar", account_email: "pm@example.com" },
      ],
      providersAvailable: { google_calendar: true, microsoft_outlook: true },
    });
    await renderLoaded();
    const dot = await waitFor(() => {
      const el = screen.getByLabelText("Calendar connections").querySelector("span.dot");
      expect(el?.getAttribute("style")).toContain("var(--emerald)");
      return el;
    });
    expect(dot).toBeTruthy();
  });

  it("opens the provider consent screen in a new tab", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByLabelText("Calendar connections"));
    const google = await screen.findByText(/Connect Google Calendar/);
    fireEvent.click(google);

    await waitFor(() => expect(startConnectSpy).toHaveBeenCalled());
    const arg = startConnectSpy.mock.calls[0][0] as {
      data: { provider: string; product: string };
    };
    expect(arg.data).toEqual({ provider: "google", product: "calendar" });
    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        "https://consent.example/oauth",
        "_blank",
        "noopener",
      ),
    );
  });

  it("confirms before disconnecting a calendar account", async () => {
    connsResult = async () => ({
      connections: [
        { id: "c1", provider: "google", product: "calendar", account_email: "pm@example.com" },
      ],
      providersAvailable: { google_calendar: true, microsoft_outlook: true },
    });
    await renderLoaded();
    fireEvent.click(screen.getByLabelText("Calendar connections"));
    fireEvent.click(await screen.findByLabelText("Disconnect"));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    await waitFor(() => expect(disconnectSpy).toHaveBeenCalled());
    expect((disconnectSpy.mock.calls[0][0] as { data: { id: string } }).data.id).toBe("c1");
  });
});

/* ---- Scheduler ---- */

describe("CalendarPanel · scheduler slot proposals", () => {
  const SLOTS = {
    slots: [
      { start_at: hoursOut(24), end_at: hoursOut(25), label: "Tomorrow 10:00" },
      { start_at: hoursOut(48), end_at: hoursOut(49), label: "Thu 14:00" },
    ],
  };

  it("asks the Scheduler for open time when the composer opens", async () => {
    slotsResult = async () => SLOTS;
    await renderLoaded();
    fireEvent.click(screen.getByText("New event · Scheduler proposes slots"));
    await waitFor(() => expect(proposeSpy).toHaveBeenCalled());
    const arg = proposeSpy.mock.calls[0][0] as { data: Record<string, number> };
    expect(arg.data).toEqual({ durationMinutes: 60, daysAhead: 7, count: 3 });
  });

  it("renders the proposed slots and preselects the first", async () => {
    slotsResult = async () => SLOTS;
    await renderLoaded();
    fireEvent.click(screen.getByText("New event · Scheduler proposes slots"));
    const first = await screen.findByText("Tomorrow 10:00");
    expect(screen.getByText("Thu 14:00")).toBeTruthy();
    expect(first.getAttribute("style")).toContain("var(--ink)");
  });

  it("keeps Create disabled until a title is typed", async () => {
    slotsResult = async () => SLOTS;
    await renderLoaded();
    fireEvent.click(screen.getByText("New event · Scheduler proposes slots"));
    await screen.findByText("Tomorrow 10:00");
    expect((screen.getByText("Create · syncs back") as HTMLButtonElement).disabled).toBe(true);
  });

  it("creates the event on the picked slot", async () => {
    slotsResult = async () => SLOTS;
    await renderLoaded();
    fireEvent.click(screen.getByText("New event · Scheduler proposes slots"));
    await screen.findByText("Thu 14:00");

    fireEvent.click(screen.getByText("Thu 14:00"));
    fireEvent.change(screen.getByPlaceholderText("Event title · e.g. Deep-work block"), {
      target: { value: "Deep-work block" },
    });
    fireEvent.click(screen.getByText("Create · syncs back"));

    await waitFor(() => expect(createSpy).toHaveBeenCalled());
    const arg = createSpy.mock.calls[0][0] as { data: { summary: string; start_at: string } };
    expect(arg.data.summary).toBe("Deep-work block");
    expect(arg.data.start_at).toBe(SLOTS.slots[1].start_at);
  });

  it("closes the composer after a successful create", async () => {
    slotsResult = async () => SLOTS;
    await renderLoaded();
    fireEvent.click(screen.getByText("New event · Scheduler proposes slots"));
    await screen.findByText("Tomorrow 10:00");
    fireEvent.change(screen.getByPlaceholderText("Event title · e.g. Deep-work block"), {
      target: { value: "Deep-work block" },
    });
    fireEvent.click(screen.getByText("Create · syncs back"));
    await waitFor(() => expectGone(screen.queryByText("Tomorrow 10:00")));
  });
});

/* ---- Deep-work planning ---- */

describe("CalendarPanel · deep-work planning", () => {
  it("proposes a block per open deep-work task", async () => {
    blocksResult = async () => ({
      blocks: [
        {
          task_id: "t1",
          title: "Ship the export fix",
          start_at: hoursOut(24),
          end_at: hoursOut(26),
          label: "Wed 09:00",
        },
      ],
    });
    await renderLoaded();
    fireEvent.click(screen.getByText("Plan deep work"));
    await waitFor(() => expect(planSpy).toHaveBeenCalled());
    expect(await screen.findByText("Ship the export fix")).toBeTruthy();
    expect(screen.getByText("Wed 09:00")).toBeTruthy();
  });

  it("adds a proposed block to the calendar and marks it added", async () => {
    blocksResult = async () => ({
      blocks: [
        {
          task_id: "t1",
          title: "Ship the export fix",
          start_at: hoursOut(24),
          end_at: hoursOut(26),
          label: "Wed 09:00",
        },
      ],
    });
    await renderLoaded();
    fireEvent.click(screen.getByText("Plan deep work"));
    fireEvent.click(await screen.findByText("Add to calendar"));

    await waitFor(() => expect(createSpy).toHaveBeenCalled());
    const arg = createSpy.mock.calls[0][0] as { data: { summary: string } };
    expect(arg.data.summary).toBe("Ship the export fix");
    expect(await screen.findByText("Added")).toBeTruthy();
  });

  it("says so honestly when there is nothing to schedule", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByText("Plan deep work"));
    await waitFor(() => expect(screen.getByText(/Nothing to schedule/)).toBeTruthy());
  });
});

/* ---- Loading and failure ---- */

describe("CalendarPanel · loading and failure", () => {
  it("says it is reading, in words, while the feed queries are in flight", () => {
    eventsResult = () => new Promise(() => {});
    const { container } = renderPanel();
    expect(shimmer(container)).toBeTruthy();
    expect(container.textContent).toContain("Reading your next fourteen days.");
    // Loading is not emptiness, and must never be mistaken for it.
    expect(container.textContent).not.toContain("Nothing in the next 14 days");
  });

  it("names the failure and offers a retry when the feed cannot load", async () => {
    eventsResult = async () => {
      throw new Error("Calendar service unavailable");
    };
    const { container } = await renderLoaded();
    // A failed read must refuse to wear the empty state's clothes.
    await waitFor(() => expect(container.textContent).toContain("The calendar did not load"));
    expect(container.textContent).toContain("Calendar service unavailable");
    expect(container.textContent).not.toContain("Nothing in the next 14 days");
    expect(screen.getByText("Try again")).toBeTruthy();
  });

  it("refetches both feed queries on retry", async () => {
    let fail = true;
    eventsResult = async () => {
      if (fail) throw new Error("Calendar service unavailable");
      return { events: [makeEvent()] };
    };
    const { container } = await renderLoaded();
    await waitFor(() => expect(container.textContent).toContain("The calendar did not load"));

    fail = false;
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(container.textContent).toContain("Design review"));
  });

  it("scopes the meetings read to the active workspace", async () => {
    await renderLoaded();
    await waitFor(() => expect(listMeetingsSpy).toHaveBeenCalled());
    const arg = listMeetingsSpy.mock.calls[0][0] as { data: { workspaceId: string | null } };
    expect(arg.data.workspaceId).toBe("workspace-1");
  });
});

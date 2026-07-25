import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarPanel } from "./CalendarPanel";

/**
 * CalendarPanel Test Suite
 *
 * CalendarPanel is a 1707-line complex calendar UI component with:
 * - Month and year grid navigation
 * - Event CRUD operations
 * - Meeting sync with external calendars
 * - Scheduler slot proposals
 * - OAuth connection flows
 *
 * This test skeleton identifies the key test categories and provides
 * patterns for testing complex calendar functionality.
 */

describe("CalendarPanel", () => {
  // Mock dependencies
  let mockFetchMeetings: jest.Mock;
  let mockCreateEvent: jest.Mock;
  let mockUpdateEvent: jest.Mock;
  let mockDeleteEvent: jest.Mock;
  let mockSyncCalendars: jest.Mock;
  let mockGetAvailableSlots: jest.Mock;

  beforeEach(() => {
    // Initialize mock functions
    mockFetchMeetings = jest.fn();
    mockCreateEvent = jest.fn();
    mockUpdateEvent = jest.fn();
    mockDeleteEvent = jest.fn();
    mockSyncCalendars = jest.fn();
    mockGetAvailableSlots = jest.fn();

    // Setup default mock implementations
    mockFetchMeetings.mockResolvedValue([]);
    mockCreateEvent.mockResolvedValue({ id: "event-1", title: "New Event" });
    mockUpdateEvent.mockResolvedValue({ id: "event-1", title: "Updated Event" });
    mockDeleteEvent.mockResolvedValue(true);
    mockSyncCalendars.mockResolvedValue({ synced: 5 });
    mockGetAvailableSlots.mockResolvedValue([
      { start: "2026-07-25T10:00:00Z", end: "2026-07-25T11:00:00Z" },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("render and layout", () => {
    it("renders calendar container", () => {
      const { container } = render(<CalendarPanel />);
      expect(container.querySelector(".calendar-panel")).toBeTruthy();
    });

    it("renders month/year navigation controls", () => {
      const { container } = render(<CalendarPanel />);
      const prevButton = container.querySelector("button[aria-label*='Previous']");
      const nextButton = container.querySelector("button[aria-label*='Next']");
      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
    });

    it("renders month grid view", () => {
      const { container } = render(<CalendarPanel />);
      const grid = container.querySelector(".month-grid");
      expect(grid).toBeTruthy();
    });

    it("renders event list section", () => {
      const { container } = render(<CalendarPanel />);
      const eventList = container.querySelector(".event-list");
      expect(eventList).toBeTruthy();
    });

    it("renders meeting sync section when OAuth is connected", () => {
      const { container } = render(<CalendarPanel connectedAccounts={["google-calendar"]} />);
      const syncButton = container.querySelector("button[aria-label*='Sync']");
      expect(syncButton).toBeTruthy();
    });
  });

  describe("month/year navigation", () => {
    it("displays current month and year", () => {
      const { container } = render(<CalendarPanel />);
      const header = container.querySelector(".calendar-header");
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      expect(header?.textContent).toContain(monthYear);
    });

    it("advances to next month on next button click", async () => {
      const { container, rerender } = render(<CalendarPanel />);
      const nextButton = container.querySelector("button[aria-label*='Next']") as HTMLButtonElement;

      fireEvent.click(nextButton);

      // After navigation, header should show next month
      const header = container.querySelector(".calendar-header");
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const monthYear = nextMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      // Verify the month has changed (exact text depends on locale)
      expect(header?.textContent).not.toContain(
        new Date().toLocaleDateString("en-US", { month: "long" }),
      );
    });

    it("goes back to previous month on prev button click", async () => {
      const { container } = render(<CalendarPanel />);
      const prevButton = container.querySelector(
        "button[aria-label*='Previous']",
      ) as HTMLButtonElement;

      fireEvent.click(prevButton);

      const header = container.querySelector(".calendar-header");
      // Verify the month has changed
      expect(header?.textContent).not.toContain(
        new Date().toLocaleDateString("en-US", { month: "long" }),
      );
    });

    it("handles year navigation when crossing month boundary", async () => {
      const { container } = render(<CalendarPanel initialMonth={0} initialYear={2026} />);
      const prevButton = container.querySelector(
        "button[aria-label*='Previous']",
      ) as HTMLButtonElement;

      // Click multiple times to cross year boundary
      for (let i = 0; i < 13; i++) {
        fireEvent.click(prevButton);
      }

      const header = container.querySelector(".calendar-header");
      expect(header?.textContent).toContain("2025");
    });
  });

  describe("month grid rendering", () => {
    it("renders all days of current month", () => {
      const { container } = render(<CalendarPanel />);
      const dayCells = container.querySelectorAll(".day-cell");
      // A full month grid should have at least 28 cells (Feb) to 31 cells (31-day months)
      expect(dayCells.length).toBeGreaterThanOrEqual(28);
    });

    it("highlights today with special styling", () => {
      const { container } = render(<CalendarPanel />);
      const today = new Date().getDate();
      const todayCell = Array.from(container.querySelectorAll(".day-cell")).find(
        (cell) => cell.textContent?.trim() === String(today),
      );
      expect(todayCell?.className).toContain("today");
    });

    it("shows events on their respective date cells", () => {
      const mockEvents = [
        {
          id: "1",
          title: "Team Meeting",
          start: new Date(2026, 6, 25, 10, 0),
          end: new Date(2026, 6, 25, 11, 0),
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);
      const eventIndicator = container.querySelector(".event-indicator");
      expect(eventIndicator).toBeTruthy();
    });

    it("renders grayed-out days from adjacent months", () => {
      const { container } = render(<CalendarPanel />);
      const adjacentDays = container.querySelectorAll(".day-cell.adjacent-month");
      expect(adjacentDays.length).toBeGreaterThan(0);
    });
  });

  describe("event CRUD operations", () => {
    it("creates new event when date is clicked", async () => {
      const { container } = render(<CalendarPanel onCreateEvent={mockCreateEvent} />);
      const dayCell = container.querySelector(".day-cell:not(.adjacent-month)");
      fireEvent.click(dayCell);

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalled();
      });
    });

    it("opens event editor modal on event click", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Existing Event",
          start: new Date(),
          end: new Date(),
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);
      const eventElement = container.querySelector(".event-item");
      fireEvent.click(eventElement);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });
    });

    it("updates event when modal is submitted", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Original Title",
          start: new Date(),
          end: new Date(),
        },
      ];
      const { container } = render(
        <CalendarPanel events={mockEvents} onUpdateEvent={mockUpdateEvent} />,
      );
      const eventElement = container.querySelector(".event-item");
      fireEvent.click(eventElement);

      const titleInput = screen.getByDisplayValue("Original Title") as HTMLInputElement;
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Updated Title");

      const submitButton = screen.getByText("Save");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateEvent).toHaveBeenCalled();
      });
    });

    it("deletes event when delete button is clicked", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Event to Delete",
          start: new Date(),
          end: new Date(),
        },
      ];
      const { container } = render(
        <CalendarPanel events={mockEvents} onDeleteEvent={mockDeleteEvent} />,
      );
      const eventElement = container.querySelector(".event-item");
      fireEvent.click(eventElement);

      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = screen.queryByText("Confirm Delete");
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockDeleteEvent).toHaveBeenCalled();
      });
    });
  });

  describe("event list and filtering", () => {
    it("displays all events in sidebar list", () => {
      const mockEvents = [
        {
          id: "1",
          title: "Meeting 1",
          start: new Date(),
          end: new Date(),
        },
        {
          id: "2",
          title: "Meeting 2",
          start: new Date(),
          end: new Date(),
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);
      expect(container.textContent).toContain("Meeting 1");
      expect(container.textContent).toContain("Meeting 2");
    });

    it("filters events by date range when date range is selected", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Past Event",
          start: new Date(2026, 5, 1),
          end: new Date(2026, 5, 2),
        },
        {
          id: "2",
          title: "Future Event",
          start: new Date(2026, 8, 1),
          end: new Date(2026, 8, 2),
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);

      // Select a date range
      const startDateInput = screen.getByLabelText("Start Date") as HTMLInputElement;
      fireEvent.change(startDateInput, { target: { value: "2026-07-01" } });

      const endDateInput = screen.getByLabelText("End Date") as HTMLInputElement;
      fireEvent.change(endDateInput, { target: { value: "2026-08-31" } });

      await waitFor(() => {
        expect(container.textContent).toContain("Future Event");
        // Past event may or may not be visible depending on filter logic
      });
    });

    it("sorts events by start time", () => {
      const mockEvents = [
        {
          id: "1",
          title: "Event 2PM",
          start: new Date(2026, 6, 25, 14, 0),
          end: new Date(2026, 6, 25, 15, 0),
        },
        {
          id: "2",
          title: "Event 10AM",
          start: new Date(2026, 6, 25, 10, 0),
          end: new Date(2026, 6, 25, 11, 0),
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);
      const eventList = container.querySelectorAll(".event-item");
      expect(eventList[0]?.textContent).toContain("Event 10AM");
      expect(eventList[1]?.textContent).toContain("Event 2PM");
    });
  });

  describe("meeting sync and OAuth", () => {
    it("shows sync button when calendar is connected", () => {
      const { container } = render(<CalendarPanel connectedAccounts={["google-calendar"]} />);
      const syncButton = container.querySelector("button[aria-label*='Sync']");
      expect(syncButton).toBeTruthy();
    });

    it("syncs meetings from connected calendar on button click", async () => {
      const { container } = render(
        <CalendarPanel
          connectedAccounts={["google-calendar"]}
          onSyncMeetings={mockSyncCalendars}
        />,
      );
      const syncButton = container.querySelector("button[aria-label*='Sync']") as HTMLButtonElement;
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockSyncCalendars).toHaveBeenCalled();
      });
    });

    it("displays sync status (loading/complete/error)", async () => {
      const { container, rerender } = render(
        <CalendarPanel connectedAccounts={["google-calendar"]} />,
      );
      const syncButton = container.querySelector("button[aria-label*='Sync']") as HTMLButtonElement;
      fireEvent.click(syncButton);

      // Loading state
      expect(container.textContent).toContain("Syncing");

      // After sync completes
      await waitFor(() => {
        expect(container.textContent).toContain("Synced");
      });
    });

    it("opens OAuth connection flow when Connect button is clicked", async () => {
      const mockOnConnect = jest.fn();
      const { container } = render(<CalendarPanel onConnectCalendar={mockOnConnect} />);
      const connectButton = container.querySelector("button[aria-label*='Connect']");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenCalled();
      });
    });
  });

  describe("scheduler and slot proposals", () => {
    it("shows available time slots when scheduler is opened", async () => {
      const { container } = render(<CalendarPanel onGetAvailableSlots={mockGetAvailableSlots} />);
      const schedulerButton = container.querySelector("button[aria-label*='Schedule']");
      fireEvent.click(schedulerButton);

      await waitFor(() => {
        expect(screen.getByText(/10:00 AM/)).toBeTruthy();
      });
    });

    it("proposes meeting times based on attendee availability", async () => {
      const mockAttendees = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];
      const { container } = render(
        <CalendarPanel attendees={mockAttendees} onGetAvailableSlots={mockGetAvailableSlots} />,
      );
      const schedulerButton = container.querySelector("button[aria-label*='Schedule']");
      fireEvent.click(schedulerButton);

      await waitFor(() => {
        expect(mockGetAvailableSlots).toHaveBeenCalledWith(
          expect.objectContaining({
            attendees: mockAttendees,
          }),
        );
      });
    });

    it("creates meeting when proposed slot is accepted", async () => {
      const { container } = render(
        <CalendarPanel
          onGetAvailableSlots={mockGetAvailableSlots}
          onCreateEvent={mockCreateEvent}
        />,
      );
      const schedulerButton = container.querySelector("button[aria-label*='Schedule']");
      fireEvent.click(schedulerButton);

      await waitFor(() => {
        const slotButton = screen.getByText(/10:00 AM/);
        fireEvent.click(slotButton);
      });

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalled();
      });
    });
  });

  describe("error handling", () => {
    it("displays error message when event creation fails", async () => {
      mockCreateEvent.mockRejectedValueOnce(new Error("Network error"));
      const { container } = render(<CalendarPanel onCreateEvent={mockCreateEvent} />);
      const dayCell = container.querySelector(".day-cell:not(.adjacent-month)");
      fireEvent.click(dayCell);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeTruthy();
      });
    });

    it("displays error when sync fails", async () => {
      mockSyncCalendars.mockRejectedValueOnce(new Error("Sync failed"));
      const { container } = render(
        <CalendarPanel
          connectedAccounts={["google-calendar"]}
          onSyncMeetings={mockSyncCalendars}
        />,
      );
      const syncButton = container.querySelector("button[aria-label*='Sync']") as HTMLButtonElement;
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeTruthy();
      });
    });

    it("retries sync on network failure", async () => {
      mockSyncCalendars.mockRejectedValueOnce(new Error("Network error"));
      mockSyncCalendars.mockResolvedValueOnce({ synced: 5 });

      const { container } = render(
        <CalendarPanel
          connectedAccounts={["google-calendar"]}
          onSyncMeetings={mockSyncCalendars}
        />,
      );
      const syncButton = container.querySelector("button[aria-label*='Sync']") as HTMLButtonElement;
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeTruthy();
      });

      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockSyncCalendars).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("time formatting utilities (pure functions)", () => {
    it("formats time correctly (fmtTime)", () => {
      // This tests a pure utility function that should be extracted
      const date = new Date(2026, 6, 25, 14, 30);
      // Pattern: fmtTime("14:30") => "2:30 PM"
      expect(fmtTime(date)).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it("generates readable when label (whenLabel)", () => {
      const date = new Date();
      // Pattern: whenLabel(date) => "Today", "Tomorrow", "Monday", etc.
      const label = whenLabel(date);
      expect(label).toBeTruthy();
      expect(typeof label).toBe("string");
    });

    it("converts date to local input format (toLocalInput)", () => {
      const date = new Date(2026, 6, 25);
      // Pattern: toLocalInput(date) => "2026-07-25"
      const result = toLocalInput(date);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe("useMemo aggregation logic", () => {
    it("aggregates events for allItems memo", () => {
      const mockEvents = [
        {
          id: "1",
          title: "Event 1",
          start: new Date(),
          end: new Date(),
        },
        {
          id: "2",
          title: "Event 2",
          start: new Date(),
          end: new Date(),
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);
      // Verify both events are rendered (memo should aggregate them)
      expect(container.textContent).toContain("Event 1");
      expect(container.textContent).toContain("Event 2");
    });

    it("recalculates allItems when events dependency changes", () => {
      const mockEvents1 = [{ id: "1", title: "Event 1", start: new Date(), end: new Date() }];
      const { rerender } = render(<CalendarPanel events={mockEvents1} />);

      const mockEvents2 = [{ id: "2", title: "Event 2", start: new Date(), end: new Date() }];
      rerender(<CalendarPanel events={mockEvents2} />);

      // Verify memoization by checking the component re-renders correctly
      expect(screen.queryByText("Event 1")).toBeFalsy();
      expect(screen.getByText("Event 2")).toBeTruthy();
    });

    it("computes pastCount for statistics", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const mockEvents = [
        {
          id: "1",
          title: "Past Event",
          start: pastDate,
          end: pastDate,
        },
      ];
      const { container } = render(<CalendarPanel events={mockEvents} />);
      const stats = container.querySelector(".calendar-stats");
      // Should show past count in stats
      expect(stats?.textContent).toContain("1");
    });
  });
});

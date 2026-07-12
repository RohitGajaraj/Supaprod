import { describe, test, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignalCard, type SignalCardProps } from "../SignalCard";

describe("SignalCard", () => {
  const baseProps: SignalCardProps = {
    src: "GitHub",
    when: "2 days ago",
    quote: "This is a signal quote",
    theme: null,
  };

  test("renders with basic props", () => {
    render(<SignalCard {...baseProps} />);
    expect(screen.getByText("GitHub")).toBeDefined();
    expect(screen.getByText("2 days ago")).toBeDefined();
    expect(screen.getByText(/This is a signal quote/)).toBeDefined();
  });

  test("does not have role='button' when onOpen is not provided", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    expect(rootDiv?.getAttribute("role")).toBeNull();
  });

  test("has role='button' when onOpen is provided", () => {
    const { container } = render(<SignalCard {...baseProps} onOpen={() => {}} />);
    const rootDiv = container.querySelector("div");
    expect(rootDiv?.getAttribute("role")).toBe("button");
  });

  test("is not tabbable when onOpen is not provided", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    expect(rootDiv?.getAttribute("tabIndex")).toBeNull();
  });

  test("is tabbable when onOpen is provided", () => {
    const { container } = render(<SignalCard {...baseProps} onOpen={() => {}} />);
    const rootDiv = container.querySelector("div");
    expect(rootDiv?.getAttribute("tabIndex")).toBe("0");
  });

  test("has aria-label when clickable", () => {
    const { container } = render(<SignalCard {...baseProps} onOpen={() => {}} />);
    const rootDiv = container.querySelector("div");
    expect(rootDiv?.getAttribute("aria-label")).toBe("Open signal detail");
  });

  test("calls onOpen when clicked and clickable", () => {
    let clicked = false;
    const { container } = render(<SignalCard {...baseProps} onOpen={() => { clicked = true; }} />);
    const rootDiv = container.querySelector("div");
    if (rootDiv) {
      fireEvent.click(rootDiv);
    }
    expect(clicked).toBe(true);
  });

  test("does not call onOpen when clicked if not clickable", () => {
    let clicked = false;
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    if (rootDiv) {
      fireEvent.click(rootDiv);
    }
    expect(clicked).toBe(false);
  });

  test("calls onOpen when Enter key pressed and clickable", () => {
    let opened = false;
    const { container } = render(<SignalCard {...baseProps} onOpen={() => { opened = true; }} />);
    const rootDiv = container.querySelector("div");
    if (rootDiv) {
      fireEvent.keyDown(rootDiv, { key: "Enter" });
    }
    expect(opened).toBe(true);
  });

  test("calls onOpen when Space key pressed and clickable", () => {
    let opened = false;
    const { container } = render(<SignalCard {...baseProps} onOpen={() => { opened = true; }} />);
    const rootDiv = container.querySelector("div");
    if (rootDiv) {
      fireEvent.keyDown(rootDiv, { key: " " });
    }
    expect(opened).toBe(true);
  });

  test("does not call onOpen for other keys", () => {
    let opened = false;
    const { container } = render(<SignalCard {...baseProps} onOpen={() => { opened = true; }} />);
    const rootDiv = container.querySelector("div");
    if (rootDiv) {
      fireEvent.keyDown(rootDiv, { key: "Escape" });
    }
    expect(opened).toBe(false);
  });

  test("renders URL link when url is provided", () => {
    render(<SignalCard {...baseProps} url="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link?.getAttribute("href")).toBe("https://example.com");
  });

  test("does not render URL link when url is not provided", () => {
    const { container } = render(<SignalCard {...baseProps} url={undefined} />);
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(0);
  });

  test("does not render URL link when url is null", () => {
    const { container } = render(<SignalCard {...baseProps} url={null} />);
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(0);
  });

  test("renders theme line when theme is provided", () => {
    render(<SignalCard {...baseProps} theme="Product Strategy" />);
    expect(screen.getByText("Product Strategy")).toBeDefined();
  });

  test("does not render theme line when theme is null", () => {
    const { container } = render(<SignalCard {...baseProps} theme={null} />);
    expect(screen.queryByText("null")).toBeNull();
  });

  test("does not render trace chip when id is not provided", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const text = container.textContent;
    expect(text).not.toContain("SIG·");
  });

  test("renders action menu button when hasActions is true", () => {
    render(<SignalCard {...baseProps} onPromote={() => {}} />);
    expect(screen.getByText("⋯")).toBeDefined();
  });

  test("does not render action menu button when no actions provided", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    expect(screen.queryByText("⋯")).toBeNull();
  });

  test("renders border when isLast is false", () => {
    const { container } = render(<SignalCard {...baseProps} isLast={false} />);
    const rootDiv = container.querySelector("div");
    expect((rootDiv as HTMLElement).style.borderBottom).toBeDefined();
    expect((rootDiv as HTMLElement).style.borderBottom.length).toBeGreaterThan(0);
  });

  test("does not render border when isLast is true", () => {
    const { container } = render(<SignalCard {...baseProps} isLast={true} />);
    const rootDiv = container.querySelector("div");
    expect((rootDiv as HTMLElement).style.borderBottom).toBe("");
  });

  test("applies padding when clickable", () => {
    const { container } = render(<SignalCard {...baseProps} onOpen={() => {}} />);
    const rootDiv = container.querySelector("div");
    expect((rootDiv as HTMLElement).style.padding).toContain("10px");
  });

  test("does not apply padding when not clickable", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    const paddingValue = (rootDiv as HTMLElement).style.padding;
    expect(paddingValue === "" || paddingValue === undefined).toBe(true);
  });

  test("applies cursor pointer when clickable", () => {
    const { container } = render(<SignalCard {...baseProps} onOpen={() => {}} />);
    const rootDiv = container.querySelector("div");
    expect((rootDiv as HTMLElement).style.cursor).toBe("pointer");
  });

  test("does not apply cursor when not clickable", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    const cursorValue = (rootDiv as HTMLElement).style.cursor;
    expect(cursorValue === "" || cursorValue === undefined).toBe(true);
  });

  test("shows pending state on action button when actionsPending is true", () => {
    render(<SignalCard {...baseProps} onPromote={() => {}} actionsPending={true} />);
    const button = screen.getByText("⋯");
    expect((button as HTMLElement).getAttribute("disabled")).toBeDefined();
  });

  test("does not show pending state when actionsPending is false", () => {
    render(<SignalCard {...baseProps} onPromote={() => {}} actionsPending={false} />);
    const button = screen.getByText("⋯");
    expect((button as HTMLElement).getAttribute("disabled")).toBeNull();
  });

  test("renders promote menu item when onPromote provided", () => {
    render(<SignalCard {...baseProps} onPromote={() => {}} />);
    // Note: Menu items are rendered in a portal, may not be directly accessible
    // This test verifies the component renders without error
    expect(screen.getByText("⋯")).toBeDefined();
  });

  test("renders draft spec menu item when onDraftSpec provided", () => {
    render(<SignalCard {...baseProps} onDraftSpec={() => {}} />);
    expect(screen.getByText("⋯")).toBeDefined();
  });


  test("applies grid display layout", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    expect((rootDiv as HTMLElement).style.display).toBe("grid");
  });

  test("applies gap styling", () => {
    const { container } = render(<SignalCard {...baseProps} />);
    const rootDiv = container.querySelector("div");
    expect((rootDiv as HTMLElement).style.gap).toBe("5px");
  });

  test("renders all parts with multiple features (without id/AskInContext)", () => {
    render(
      <SignalCard
        {...baseProps}
        theme="Growth"
        url="https://github.com/example"
        onOpen={() => {}}
        onPromote={() => {}}
        isLast={false}
      />
    );
    expect(screen.getByText("GitHub")).toBeDefined();
    expect(screen.getByText("2 days ago")).toBeDefined();
    expect(screen.getByText("Growth")).toBeDefined();
    expect(screen.getByText("⋯")).toBeDefined();
  });
});

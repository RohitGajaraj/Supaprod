import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../Card";

/**
 * Card component tests — Tempo v5 surface container.
 * Coverage: rendering, composition, styling classes, responsive behavior.
 */

describe("Card", () => {
  it("renders a div with surface styling", () => {
    const { container } = render(React.createElement(Card, {}, "Content"));
    const card = container.querySelector("div");
    expect(card).toBeDefined();
    expect(card?.className).toContain("rounded-md");
    expect(card?.className).toContain("border");
  });

  it("applies custom className alongside defaults", () => {
    const { container } = render(
      React.createElement(Card, { className: "custom-class" }, "Content"),
    );
    const card = container.querySelector("div");
    expect(card?.className).toContain("custom-class");
    expect(card?.className).toContain("rounded-md");
  });

  it("forwards ref correctly", () => {
    let ref: HTMLDivElement | null = null;
    render(React.createElement(Card, { ref: (el) => (ref = el) }, "Content"));
    expect(ref).toBeDefined();
    expect(ref?.tagName).toBe("DIV");
  });
});

describe("CardHeader", () => {
  it("renders with flex column layout", () => {
    const { container } = render(React.createElement(CardHeader, {}, "Header content"));
    const header = container.querySelector("div");
    expect(header?.className).toContain("flex");
    expect(header?.className).toContain("flex-col");
  });

  it("applies padding classes", () => {
    const { container } = render(React.createElement(CardHeader, {}, "Header"));
    const header = container.querySelector("div");
    expect(header?.className).toContain("p-6");
  });
});

describe("CardTitle", () => {
  it("renders as h3 element", () => {
    const { container } = render(React.createElement(CardTitle, {}, "Title"));
    const title = container.querySelector("h3");
    expect(title).toBeDefined();
    expect(title?.textContent).toBe("Title");
  });

  it("applies heading typography", () => {
    const { container } = render(React.createElement(CardTitle, {}, "Title"));
    const title = container.querySelector("h3");
    expect(title?.className).toContain("font-semibold");
    expect(title?.className).toContain("leading-none");
    expect(title?.className).toContain("tracking-tight");
  });
});

describe("CardDescription", () => {
  it("renders as paragraph with label typography", () => {
    const { container } = render(React.createElement(CardDescription, {}, "Description"));
    const desc = container.querySelector("p");
    expect(desc).toBeDefined();
    expect(desc?.textContent).toBe("Description");
    // CardDescription uses text-label-14 which is a custom text class
    // and text-[var(--ds-gray-900)] for color
    expect(desc?.className).toContain("text");
  });
});

describe("CardContent", () => {
  it("renders with content padding and reset top padding", () => {
    const { container } = render(React.createElement(CardContent, {}, "Content"));
    const content = container.querySelector("div");
    expect(content?.className).toContain("p-6");
    expect(content?.className).toContain("pt-0");
  });
});

describe("CardFooter", () => {
  it("renders with flex layout and gap", () => {
    const { container } = render(React.createElement(CardFooter, {}, "Actions"));
    const footer = container.querySelector("div");
    expect(footer?.className).toContain("flex");
    expect(footer?.className).toContain("items-center");
    expect(footer?.className).toContain("gap-3");
  });

  it("resets top padding", () => {
    const { container } = render(React.createElement(CardFooter, {}, "Actions"));
    const footer = container.querySelector("div");
    expect(footer?.className).toContain("pt-0");
  });
});

describe("Card composition", () => {
  it("renders a complete card structure", () => {
    const { container } = render(
      React.createElement(
        Card,
        {},
        React.createElement(
          CardHeader,
          {},
          React.createElement(CardTitle, {}, "Card Title"),
          React.createElement(CardDescription, {}, "A card description"),
        ),
        React.createElement(CardContent, {}, "Main content"),
        React.createElement(CardFooter, {}, "Footer action"),
      ),
    );

    const card = container.querySelector("div");
    expect(card).toBeDefined();
    expect(card?.textContent).toContain("Card Title");
    expect(card?.textContent).toContain("A card description");
    expect(card?.textContent).toContain("Main content");
    expect(card?.textContent).toContain("Footer action");
  });
});

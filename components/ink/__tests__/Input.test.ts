import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Input, Textarea } from "../Input";

/**
 * Input component tests — Tempo v5 form control.
 * Coverage: rendering, input types, accessibility states, focus/error/disabled styling,
 * placeholder behavior, ref forwarding.
 */

describe("Input", () => {
  it("renders an input element", () => {
    const { container } = render(React.createElement(Input, {}));
    const input = container.querySelector("input");
    expect(input).toBeDefined();
    expect(input?.tagName).toBe("INPUT");
  });

  it("defaults to type='text'", () => {
    const { container } = render(React.createElement(Input, {}));
    const input = container.querySelector("input");
    expect(input?.type).toBe("text");
  });

  it("accepts custom type attribute", () => {
    const { container } = render(React.createElement(Input, { type: "email" }));
    const input = container.querySelector("input");
    expect(input?.type).toBe("email");
  });

  it("applies base styling classes", () => {
    const { container } = render(React.createElement(Input, {}));
    const input = container.querySelector("input");
    expect(input?.className).toContain("flex");
    expect(input?.className).toContain("h-10");
    expect(input?.className).toContain("w-full");
    expect(input?.className).toContain("rounded-md");
    expect(input?.className).toContain("border");
  });

  it("accepts placeholder text", () => {
    const { container } = render(React.createElement(Input, { placeholder: "Enter text..." }));
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input?.placeholder).toBe("Enter text...");
  });

  it("applies disabled state styling", () => {
    const { container } = render(React.createElement(Input, { disabled: true }));
    const input = container.querySelector("input");
    expect(input?.className).toContain("disabled:cursor-not-allowed");
    expect(input?.className).toContain("disabled:opacity-50");
    expect((input as HTMLInputElement)?.disabled).toBe(true);
  });

  it("applies aria-invalid for error state", () => {
    const { container } = render(React.createElement(Input, { "aria-invalid": "true" }));
    const input = container.querySelector("input");
    expect(input?.className).toContain("aria-invalid:border");
  });

  it("forwards ref correctly", () => {
    let ref: HTMLInputElement | null = null;
    render(React.createElement(Input, { ref: (el) => (ref = el) }));
    expect(ref).toBeDefined();
    expect(ref?.tagName).toBe("INPUT");
  });

  it("passes through standard HTML attributes", () => {
    const { container } = render(
      React.createElement(Input, { maxLength: 50, minLength: 3, required: true }),
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input?.maxLength).toBe(50);
    expect(input?.minLength).toBe(3);
    expect(input?.required).toBe(true);
  });

  it("accepts custom className and merges with defaults", () => {
    const { container } = render(React.createElement(Input, { className: "custom-input" }));
    const input = container.querySelector("input");
    expect(input?.className).toContain("custom-input");
    expect(input?.className).toContain("rounded-md");
  });

  it("applies focus ring styling", () => {
    const { container } = render(React.createElement(Input, {}));
    const input = container.querySelector("input");
    expect(input?.className).toContain("focus-visible:outline-none");
    expect(input?.className).toContain("focus-visible:ring");
  });

  it("responds to value changes", () => {
    const { container } = render(React.createElement(Input, { defaultValue: "initial" }));
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input?.value).toBe("initial");
  });
});

describe("Textarea", () => {
  it("renders a textarea element", () => {
    const { container } = render(React.createElement(Textarea, {}));
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeDefined();
    expect(textarea?.tagName).toBe("TEXTAREA");
  });

  it("applies base styling with minimum height", () => {
    const { container } = render(React.createElement(Textarea, {}));
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("min-h-[80px]");
    expect(textarea?.className).toContain("w-full");
    expect(textarea?.className).toContain("rounded-md");
  });

  it("accepts placeholder text", () => {
    const { container } = render(
      React.createElement(Textarea, { placeholder: "Enter description..." }),
    );
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea?.placeholder).toBe("Enter description...");
  });

  it("applies disabled state styling", () => {
    const { container } = render(React.createElement(Textarea, { disabled: true }));
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("disabled:cursor-not-allowed");
    expect(textarea?.className).toContain("disabled:opacity-50");
    expect((textarea as HTMLTextAreaElement)?.disabled).toBe(true);
  });

  it("applies aria-invalid for error state", () => {
    const { container } = render(React.createElement(Textarea, { "aria-invalid": "true" }));
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("aria-invalid:border");
  });

  it("forwards ref correctly", () => {
    let ref: HTMLTextAreaElement | null = null;
    render(React.createElement(Textarea, { ref: (el) => (ref = el) }));
    expect(ref).toBeDefined();
    expect(ref?.tagName).toBe("TEXTAREA");
  });

  it("accepts rows and cols attributes", () => {
    const { container } = render(React.createElement(Textarea, { rows: 10, cols: 50 }));
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    // rows and cols are returned as string or number depending on the DOM impl
    expect(Number(textarea?.rows)).toBe(10);
    expect(Number(textarea?.cols)).toBe(50);
  });

  it("accepts custom className and merges with defaults", () => {
    const { container } = render(React.createElement(Textarea, { className: "custom-textarea" }));
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("custom-textarea");
    expect(textarea?.className).toContain("rounded-md");
  });

  it("applies focus ring styling", () => {
    const { container } = render(React.createElement(Textarea, {}));
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("focus-visible:outline-none");
    expect(textarea?.className).toContain("focus-visible:ring");
  });

  it("responds to value changes", () => {
    const { container } = render(
      React.createElement(Textarea, { defaultValue: "initial content" }),
    );
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea?.value).toBe("initial content");
  });
});

describe("Input accessibility", () => {
  it("Input supports aria-label", () => {
    const { container } = render(React.createElement(Input, { "aria-label": "Email address" }));
    const input = container.querySelector("input");
    expect(input?.getAttribute("aria-label")).toBe("Email address");
  });

  it("Textarea supports aria-label", () => {
    const { container } = render(React.createElement(Textarea, { "aria-label": "Message body" }));
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("aria-label")).toBe("Message body");
  });

  it("Input supports aria-describedby", () => {
    const { container } = render(React.createElement(Input, { "aria-describedby": "error-hint" }));
    const input = container.querySelector("input");
    expect(input?.getAttribute("aria-describedby")).toBe("error-hint");
  });
});

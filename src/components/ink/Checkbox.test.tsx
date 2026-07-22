import { describe, it, expect } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  describe("render", () => {
    it("renders as a checkbox input", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox).toBeTruthy();
    });

    it("renders with default unchecked state", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("aria-checked")).toBe("false");
    });
  });

  describe("checked state", () => {
    it("renders in checked state when checked prop is true", () => {
      const { container } = render(<Checkbox checked={true} />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("aria-checked")).toBe("true");
    });

    it("renders in unchecked state when checked prop is false", () => {
      const { container } = render(<Checkbox checked={false} />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("aria-checked")).toBe("false");
    });

    it("displays check icon when checked", () => {
      const { container } = render(<Checkbox checked={true} />);
      const indicator = container.querySelector("[role='checkbox'] svg");
      expect(indicator).toBeTruthy();
    });

    it("does not display check icon when unchecked", () => {
      const { container } = render(<Checkbox checked={false} />);
      const indicator = container.querySelector("[role='checkbox'] svg");
      expect(indicator).toBeFalsy();
    });
  });

  describe("indeterminate state", () => {
    it("renders in indeterminate state when checked prop is 'indeterminate'", () => {
      const { container } = render(<Checkbox checked="indeterminate" />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("aria-checked")).toBe("mixed");
    });

    it("applies indeterminate styling", () => {
      const { container } = render(<Checkbox checked="indeterminate" />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("data-[state=indeterminate]");
    });

    it("displays check icon in indeterminate state", () => {
      const { container } = render(<Checkbox checked="indeterminate" />);
      const indicator = container.querySelector("[role='checkbox'] svg");
      expect(indicator).toBeTruthy();
    });
  });

  describe("state transitions", () => {
    it("calls onCheckedChange when clicked", () => {
      let callCount = 0;
      let lastValue = null;
      const onChange = (checked) => {
        callCount++;
        lastValue = checked;
      };

      const { container } = render(<Checkbox onCheckedChange={onChange} />);
      const checkbox = container.querySelector("[role='checkbox']");

      fireEvent.click(checkbox);
      expect(callCount).toBe(1);
      expect(lastValue).toBe(true);
    });

    it("toggles state on multiple clicks", () => {
      const states = [];
      const onChange = (checked) => states.push(checked);

      const { container } = render(<Checkbox onCheckedChange={onChange} />);
      const checkbox = container.querySelector("[role='checkbox']");

      fireEvent.click(checkbox);
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);

      expect(states).toEqual([true, false, true]);
    });
  });

  describe("keyboard accessibility", () => {
    it("toggles on Space key", () => {
      let toggleCount = 0;
      const onChange = () => toggleCount++;

      const { container } = render(<Checkbox onCheckedChange={onChange} />);
      const checkbox = container.querySelector("[role='checkbox']");

      fireEvent.keyDown(checkbox, { key: " ", code: "Space" });
      expect(toggleCount).toBe(1);
    });

    it("is accessible via Tab navigation", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("tabindex")).not.toBe("-1");
    });

    it("focuses when tabbed to", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']") as HTMLElement;

      expect(document.activeElement).not.toBe(checkbox);
      checkbox.focus();
      expect(document.activeElement).toBe(checkbox);
    });
  });

  describe("disabled state", () => {
    it("renders as disabled when disabled prop is true", () => {
      const { container } = render(<Checkbox disabled={true} />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("aria-disabled")).toBe("true");
    });

    it("does not call onCheckedChange when disabled", () => {
      let callCount = 0;
      const onChange = () => callCount++;

      const { container } = render(<Checkbox disabled={true} onCheckedChange={onChange} />);
      const checkbox = container.querySelector("[role='checkbox']");

      fireEvent.click(checkbox);
      expect(callCount).toBe(0);
    });

    it("applies disabled styling", () => {
      const { container } = render(<Checkbox disabled={true} />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("disabled:opacity-50");
    });
  });

  describe("focus ring", () => {
    it("applies focus ring styling on focus", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']") as HTMLElement;

      checkbox.focus();
      expect(checkbox.className).toContain("focus-visible:ring");
    });

    it("uses correct focus color", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("focus-visible:ring-[var(--ds-focus-color)]");
    });
  });

  describe("className merge", () => {
    it("merges custom className with default styles", () => {
      const { container } = render(<Checkbox className="custom-class" />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("custom-class");
      expect(checkbox?.className).toContain("peer");
    });

    it("allows className override of default styles", () => {
      const { container } = render(<Checkbox className="!bg-red-500" />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("!bg-red-500");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to checkbox root element", () => {
      const ref = { current: null };
      render(<Checkbox ref={ref} />);
      expect(ref.current).toBeTruthy();
      expect(ref.current?.getAttribute("role")).toBe("checkbox");
    });
  });

  describe("checked style variants", () => {
    it("applies checked background color when checked", () => {
      const { container } = render(<Checkbox checked={true} />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("data-[state=checked]:bg-[var(--ds-ember-600)]");
    });

    it("applies indeterminate background color when indeterminate", () => {
      const { container } = render(<Checkbox checked="indeterminate" />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("data-[state=indeterminate]:bg-[var(--ds-ember-600)]");
    });
  });

  describe("hover state", () => {
    it("applies hover styling", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("hover:border-[var(--ds-gray-500)]");
    });

    it("applies checked hover styling", () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.className).toContain("hover:data-[state=checked]:bg-[var(--ds-ember-700)]");
    });
  });

  describe("HTMLAttributes", () => {
    it("accepts standard HTML attributes", () => {
      const { container } = render(
        <Checkbox data-testid="my-checkbox" id="checkbox-id" title="Select this">
          {null}
        </Checkbox>,
      );
      const checkbox = container.querySelector("[data-testid='my-checkbox']");
      expect(checkbox).toBeTruthy();
      expect(checkbox?.id).toBe("checkbox-id");
      expect(checkbox?.title).toBe("Select this");
    });

    it("accepts aria attributes", () => {
      const { container } = render(<Checkbox aria-label="Accept terms" aria-describedby="terms" />);
      const checkbox = container.querySelector("[role='checkbox']");
      expect(checkbox?.getAttribute("aria-label")).toBe("Accept terms");
      expect(checkbox?.getAttribute("aria-describedby")).toBe("terms");
    });
  });
});

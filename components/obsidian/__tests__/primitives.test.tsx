import { describe, expect, test, vi, beforeEach, afterEach } from "bun:test";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { rgba } from "../primitives";
import { STATUS_STYLES, STATUS_WORD, type StatusState } from "../status";
import { VerdictChip, type VerdictTone } from "../verdict";
import { createToastController, TOAST_DURATION_MS } from "../toast";
import { CallCard } from "../callcard";
import { MissionRow } from "../missionrow";
import { SlideOver } from "../slideover";

// These are pure-logic / shallow-element tests (call components as plain
// functions, no DOM renderer), matching this codebase's existing test
// convention (no jsdom/happy-dom dependency exists anywhere in the repo).
// Visual + interactive verification runs manually per the OBS-03 spec §5
// test steps (double-toast, slide-over Tab-trap, reduced-motion kill).

const ALL_STATES: StatusState[] = [
  "working",
  "gate",
  "waiting",
  "done",
  "shipped",
  "queued",
  "thinking",
  "in-review",
  "blocked",
];

describe("rgba", () => {
  test("converts a hex + alpha to an rgba() string", () => {
    expect(rgba("#FF6B2C", 0.25)).toBe("rgba(255, 107, 44, 0.25)");
    expect(rgba("#7FBF8E", 0.12)).toBe("rgba(127, 191, 142, 0.12)");
  });
});

describe("StatusDot state -> style map", () => {
  test("covers every StatusState with a word and a color", () => {
    for (const state of ALL_STATES) {
      expect(STATUS_WORD[state]).toBeTruthy();
      expect(STATUS_STYLES[state].color).toBeTruthy();
    }
  });

  test("the four core states match the token-traced glow + color (2026-07-11 color-mix migration)", () => {
    expect(STATUS_STYLES.working).toEqual({
      color: "var(--glacier)",
      glow: "0 0 8px 1px color-mix(in srgb, var(--glacier) 60%, transparent)",
      animation: "cadPulse 2s ease-in-out infinite",
    });
    expect(STATUS_STYLES.gate).toEqual({
      color: "var(--ember)",
      glow: "0 0 10px 2px color-mix(in srgb, var(--ember) 55%, transparent)",
      animation: "cadGlow 1.8s ease-in-out infinite",
    });
    expect(STATUS_STYLES.done).toEqual({
      color: "var(--moss)",
      glow: "0 0 8px 1px color-mix(in srgb, var(--moss) 50%, transparent)",
      animation: null,
    });
    expect(STATUS_STYLES.queued).toEqual({
      color: "var(--text-faint)",
      glow: null,
      animation: null,
    });
  });

  test("gate and waiting share the WAITING ON YOU word; done and shipped share SHIPPED", () => {
    expect(STATUS_WORD.gate).toBe("WAITING ON YOU");
    expect(STATUS_WORD.waiting).toBe("WAITING ON YOU");
    expect(STATUS_WORD.done).toBe("SHIPPED");
    expect(STATUS_WORD.shipped).toBe("SHIPPED");
  });

  test("status words carry no AI-fingerprint punctuation (humanized-output law)", () => {
    for (const word of Object.values(STATUS_WORD)) {
      expect(word).not.toMatch(/[–—]/); // en dash, em dash
      expect(word).not.toMatch(/!/);
    }
  });
});

describe("VerdictChip tone -> hue map", () => {
  const TONES: VerdictTone[] = [
    "SHIP",
    "VALIDATED",
    "KEPT",
    "KILL",
    "MISSED",
    "REVISE",
    "CRITIC REVIEW",
    "WATCH",
    "DRAFTING",
    "PENDING",
  ];

  test("every tone renders a 12%-fill / 45%-border chip except PENDING (neutral)", () => {
    for (const tone of TONES) {
      const el = (
        VerdictChip as unknown as { render: (props: { tone: VerdictTone }, ref: null) => any }
      ).render({ tone }, null);
      if (tone === "PENDING") {
        expect(el.props.style.backgroundColor).toBe("transparent");
        expect(el.props.style.color).toBe("var(--text-faint)");
      } else {
        // Token-traced (2026-07-11): fills derive from role tokens via
        // color-mix so both themes resolve; the old rgba() literals only
        // held in dark.
        expect(el.props.style.backgroundColor).toMatch(/^color-mix\(in oklab, var\(--/);
        expect(el.props.style.backgroundColor).toContain("12%");
        expect(el.props.style.border).toContain("45%");
      }
    }
  });

  test("moss family (SHIP/VALIDATED/KEPT) shares the exact moss-bright text hue", () => {
    const render = (tone: VerdictTone) =>
      (
        VerdictChip as unknown as { render: (props: { tone: VerdictTone }, ref: null) => any }
      ).render({ tone }, null);
    expect(render("SHIP").props.style.color).toBe("var(--moss-bright)");
    expect(render("VALIDATED").props.style.color).toBe("var(--moss-bright)");
    expect(render("KEPT").props.style.color).toBe("var(--moss-bright)");
  });

  test("REVISE uses the distinct ember text step, not raw --ember", () => {
    const el = (
      VerdictChip as unknown as { render: (props: { tone: VerdictTone }, ref: null) => any }
    ).render({ tone: "REVISE" }, null);
    expect(el.props.style.color).toBe("var(--ember-text, var(--ember))");
  });
});

describe("Toast singleton controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("show() sets the message", () => {
    const controller = createToastController();
    expect(controller.getState()).toBeNull();
    controller.show("Good call. The PR is open.");
    expect(controller.getState()).toBe("Good call. The PR is open.");
  });

  test("auto-clears after exactly TOAST_DURATION_MS", () => {
    const controller = createToastController();
    controller.show("Sent back to Scout. Revising now.");
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(controller.getState()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(controller.getState()).toBeNull();
  });

  test("a second show() replaces the message and resets the timer (never stacks)", () => {
    const controller = createToastController();
    const seen: (string | null)[] = [];
    controller.subscribe(() => seen.push(controller.getState()));

    controller.show("First toast.");
    vi.advanceTimersByTime(2000);
    controller.show("Second toast.");
    // 2000ms after the SECOND show (3600ms window, not yet expired even
    // though 4000ms have passed since the FIRST show) - proves the timer
    // reset, not just a longer overall window.
    vi.advanceTimersByTime(2000);
    expect(controller.getState()).toBe("Second toast.");

    vi.advanceTimersByTime(1600);
    expect(controller.getState()).toBeNull();

    // Only two distinct non-null states were ever observed: a replace, not a stack.
    expect(seen.filter(Boolean)).toEqual(["First toast.", "Second toast."]);
  });
});

describe("MissionRow renders as a real <button>", () => {
  test("root element type is the literal button tag", () => {
    const el = (MissionRow as unknown as { render: (props: any, ref: null) => any }).render(
      {
        status: "working",
        title: "Ship the checkout fix",
        stepLabel: "SCOUT · STEP 2/5",
        cost: "$0.84",
        onOpen: () => {},
      },
      null,
    );
    expect(el.type).toBe("button");
    expect(el.props.type).toBe("button");
    expect(el.props.onClick).toBeInstanceOf(Function);
  });

  test("shows a verdict chip only when status is done", () => {
    const render = (status: "working" | "done", verdict?: VerdictTone) =>
      (MissionRow as unknown as { render: (props: any, ref: null) => any }).render(
        { status, title: "x", stepLabel: "x", cost: "x", onOpen: () => {}, verdict },
        null,
      );

    const working = render("working", "SHIP");
    const children = working.props.children as any[];
    expect(children.some((c) => c && c.type && c.type.displayName === "VerdictChip")).toBe(false);

    const done = render("done", "SHIP");
    const doneChildren = done.props.children as any[];
    expect(doneChildren.some((c) => c && c.type && c.type.displayName === "VerdictChip")).toBe(
      true,
    );
  });
});

describe("CallCard wires its actions to real <button>s via the primitive Button", () => {
  test("onOk/onNo reach the primary and secondary Button elements", () => {
    const onOk = () => {};
    const onNo = () => {};
    const el = (CallCard as unknown as { render: (props: any, ref: null) => any }).render(
      {
        kind: "SHIP IT?",
        expiry: "EXPIRES IN 6H",
        title: "Ship the checkout fix?",
        body: "x",
        ev: [],
        okLabel: "Approve",
        noLabel: "Send back",
        consequence: "Opens the pull request · nothing ships without you",
        onOk,
        onNo,
      },
      null,
    );

    const flatten = (node: any): any[] => {
      if (!node || typeof node !== "object") return [];
      const kids = node.props?.children;
      const kidArray = Array.isArray(kids) ? kids : kids ? [kids] : [];
      return [node, ...kidArray.flatMap(flatten)];
    };

    const all = flatten(el);
    const buttons = all.filter((n) => n.props?.onClick === onOk || n.props?.onClick === onNo);
    expect(buttons.length).toBe(2);
  });
});

describe("CallCard opens its detail on click and its actions stop propagation (dim 17)", () => {
  test("onOpen makes the card a button; Approve/Send back call the handler and stopPropagation", () => {
    let opened = 0;
    let okd = 0;
    let nod = 0;
    const el = (CallCard as unknown as { render: (props: any, ref: null) => any }).render(
      {
        kind: "SHIP IT?",
        expiry: "",
        title: "Ship the checkout fix?",
        body: "x",
        ev: [],
        okLabel: "Approve",
        noLabel: "Send back",
        consequence: "c",
        onOk: () => {
          okd++;
        },
        onNo: () => {
          nod++;
        },
        onOpen: () => {
          opened++;
        },
      },
      null,
    );

    // The whole card body opens the detail.
    expect(el.props.role).toBe("button");
    expect(el.props.tabIndex).toBe(0);
    expect(typeof el.props.onClick).toBe("function");
    el.props.onClick();
    expect(opened).toBe(1);

    const flatten = (node: any): any[] => {
      if (!node || typeof node !== "object") return [];
      const kids = node.props?.children;
      const kidArray = Array.isArray(kids) ? kids : kids ? [kids] : [];
      return [node, ...kidArray.flatMap(flatten)];
    };
    const all = flatten(el);
    const approve = all.find((n) => n.props?.children === "Approve");
    const sendBack = all.find((n) => n.props?.children === "Send back");
    expect(approve).toBeTruthy();
    expect(sendBack).toBeTruthy();

    // Each action stops the bubble so it never also fires the card open.
    let stopped = 0;
    approve.props.onClick({ stopPropagation: () => stopped++ });
    expect(okd).toBe(1);
    expect(stopped).toBe(1);
    sendBack.props.onClick({ stopPropagation: () => stopped++ });
    expect(nod).toBe(1);
    expect(stopped).toBe(2);
    // The open handler did not fire again from the actions.
    expect(opened).toBe(1);
  });
});

describe("SlideOver wires onOpenChange(false) to onClose (Esc / scrim close)", () => {
  test("closing via Radix's onOpenChange calls the passed onClose", () => {
    let closed = false;
    const el = SlideOver({
      open: true,
      onClose: () => {
        closed = true;
      },
      title: "Mission",
      children: "body",
    });

    expect(el.type).toBe(DialogPrimitive.Root);
    expect(el.props.open).toBe(true);
    // We never disable Radix's default modal focus-trap/restore behavior.
    expect(el.props.modal).toBeUndefined();

    el.props.onOpenChange(false);
    expect(closed).toBe(true);
  });
});

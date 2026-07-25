import * as React from "react";

export const TOAST_DURATION_MS = 3600;

export interface ToastController {
  getState: () => string | null;
  subscribe: (listener: () => void) => () => void;
  show: (message: string) => void;
}

/**
 * Framework-free singleton store: a new `show()` replaces the current
 * message and resets the timer, never stacks. Exported standalone so its
 * replace/timer-reset contract is unit-testable without React.
 */
export function createToastController(): ToastController {
  let state: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    show: (message: string) => {
      if (timer) clearTimeout(timer);
      state = message;
      emit();
      timer = setTimeout(() => {
        state = null;
        timer = null;
        emit();
      }, TOAST_DURATION_MS);
    },
  };
}

const ToastContext = React.createContext<ToastController | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const controllerRef = React.useRef<ToastController | null>(null);
  if (!controllerRef.current) controllerRef.current = createToastController();

  return (
    <ToastContext.Provider value={controllerRef.current}>
      {children}
      <ToastHost />
    </ToastContext.Provider>
  );
}

/** `showToast(message)` from anywhere inside a `ToastProvider`. */
export function useToast(): (message: string) => void {
  const controller = React.useContext(ToastContext);
  if (!controller) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return controller.show;
}

export function ToastHost() {
  const controller = React.useContext(ToastContext);
  const message = React.useSyncExternalStore(
    controller?.subscribe ?? (() => () => {}),
    () => controller?.getState() ?? null,
    () => null,
  );
  return <Toast message={message} />;
}

/**
 * The `aria-live="polite"` container is always mounted, even when idle -
 * only its text and visibility toggle. Some screen-reader/browser pairings
 * (VoiceOver/Safari, older NVDA/Firefox) only announce a live region whose
 * container already existed in the DOM before the content changed; mounting
 * a populated live region in the same DOM mutation can silently drop the
 * announcement (adversarial review finding, 2026-07-02).
 */
export function Toast({ message }: { message: string | null }) {
  const visible = message !== null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
      style={{
        backgroundColor: "var(--raised)",
        // Token-traced moss tint (was a hardcoded hex; both themes resolve).
        border: "1px solid color-mix(in srgb, var(--moss) 40%, transparent)",
        borderRadius: "var(--radius-pill)",
        padding: "12px 20px",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        boxShadow:
          "var(--shadow-overlay), 0 0 18px color-mix(in srgb, var(--moss) 12%, transparent)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        animation: visible ? "cadRise 200ms var(--ease)" : undefined,
      }}
    >
      {message ?? ""}
    </div>
  );
}

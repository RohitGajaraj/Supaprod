/*
 * The one confirm and the one prompt, used by 32 surfaces.
 *
 * Ported onto the rebuild's primitives 2026-07-30. Its CONTENTS were the last
 * large legacy leak in the product: every destructive confirm in the app
 * rendered shadcn utility classes (text-muted-foreground, bg-destructive) over
 * the new theme, which is exactly the founder's "if something opens up, it
 * should not render in the legacy theme".
 *
 * The Radix AlertDialog/Dialog MECHANISM is kept on purpose. anti-slop ban 11
 * is about modal ABUSE, a whole surface behind an overlay, and its own stated
 * exception is a short irreversible question, which is precisely this. Radix
 * also brings the focus trap, the escape key, the focus return and the inert
 * background, and re-implementing those badly is an accessibility regression
 * wearing a primitive's name (the same reasoning recorded in primitives.tsx
 * for why no pane primitive was built).
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Action } from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// In-app replacements for window.confirm / window.prompt.
// Promise-based, themed, keyboard-friendly. Mount the provider once in __root.

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  // If set, the user must type this string to enable the confirm button.
  typedConfirm?: string;
};

type PromptOptions = {
  title: string;
  body?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type Ctx = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [promptState, setPromptState] = useState<PromptOptions | null>(null);
  const [typed, setTyped] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const confirmResolver = useRef<((v: boolean) => void) | null>(null);
  const promptResolver = useRef<((v: string | null) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setTyped("");
    setConfirmState(opts);
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    setPromptValue(opts.defaultValue ?? "");
    setPromptState(opts);
    return new Promise<string | null>((resolve) => {
      promptResolver.current = resolve;
    });
  }, []);

  function resolveConfirm(v: boolean) {
    confirmResolver.current?.(v);
    confirmResolver.current = null;
    setConfirmState(null);
  }

  function resolvePrompt(v: string | null) {
    promptResolver.current?.(v);
    promptResolver.current = null;
    setPromptState(null);
  }

  const typedOk = !confirmState?.typedConfirm || typed === confirmState.typedConfirm;

  // Without this, every keystroke in a confirm/prompt dialog re-renders the app.
  const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <AlertDialog
        open={!!confirmState}
        onOpenChange={(o) => {
          if (!o) resolveConfirm(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            {confirmState?.body && (
              <AlertDialogDescription>{confirmState.body}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {confirmState?.typedConfirm && (
            <Field label={`Type ${confirmState.typedConfirm} to confirm`} htmlFor="confirm-typed">
              <Input
                id="confirm-typed"
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmState.typedConfirm}
              />
            </Field>
          )}
          <AlertDialogFooter>
            <Action onClick={() => resolveConfirm(false)}>
              {confirmState?.cancelLabel ?? "Cancel"}
            </Action>
            <Action variant="primary" disabled={!typedOk} onClick={() => resolveConfirm(true)}>
              {confirmState?.confirmLabel ?? "Confirm"}
            </Action>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!promptState}
        onOpenChange={(o) => {
          if (!o) resolvePrompt(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promptState?.title}</DialogTitle>
            {promptState?.body && <DialogDescription>{promptState.body}</DialogDescription>}
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              resolvePrompt(promptValue.trim() ? promptValue.trim() : null);
            }}
            className="space-y-3"
          >
            <Field label={promptState?.label ?? ""} htmlFor="prompt-value">
              <Input
                id="prompt-value"
                autoFocus
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={promptState?.placeholder}
              />
            </Field>
            <DialogFooter>
              <Action type="button" onClick={() => resolvePrompt(null)}>
                {promptState?.cancelLabel ?? "Cancel"}
              </Action>
              <Action type="submit" variant="primary" disabled={!promptValue.trim()}>
                {promptState?.confirmLabel ?? "Save"}
              </Action>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("usePrompt must be used inside ConfirmProvider");
  return ctx.prompt;
}

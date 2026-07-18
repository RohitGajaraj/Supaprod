import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ink Modal — Tempo v5 design system, built on Radix Dialog.
 *
 * Structure:
 * - Modal: root provider + backdrop
 * - ModalTrigger: opens the modal (button or any trigger)
 * - ModalContent: the dialog box itself (aria-describedby supported)
 * - ModalHeader/Title/Description: title area
 * - ModalBody: main content
 * - ModalFooter: action buttons
 * - ModalClose: close button (X icon top-right)
 *
 * Usage:
 *   <Modal>
 *     <ModalTrigger asChild>
 *       <Button>Open</Button>
 *     </ModalTrigger>
 *     <ModalContent>
 *       <ModalHeader>
 *         <ModalTitle>Title</ModalTitle>
 *         <ModalDescription>Description</ModalDescription>
 *       </ModalHeader>
 *       <ModalBody>Content</ModalBody>
 *       <ModalFooter>
 *         <ModalClose asChild>
 *           <Button variant="secondary">Cancel</Button>
 *         </ModalClose>
 *       </ModalFooter>
 *     </ModalContent>
 *   </Modal>
 *
 * Accessibility: focus trap, ESC to close, backdrop click to close, ARIA roles.
 * Motion: fade-in with scale, respects prefers-reduced-motion.
 * Dark/Light: resolves from --ds-* tokens.
 */

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;

const ModalPortal = DialogPrimitive.Portal;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/50",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[motion=off]:no-animation",
      className,
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
        "rounded-lg border border-[var(--ds-gray-400)]",
        "bg-[var(--ds-background-100)]",
        "shadow-lg duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "data-[motion=off]:no-animation",
        className,
      )}
      {...props}
    />
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);
ModalHeader.displayName = "ModalHeader";

const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-end gap-3 p-6 pt-0", className)} {...props} />
);
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-heading-20 font-semibold leading-none tracking-tight",
      "text-[var(--ds-gray-1000)]",
      className,
    )}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-label-14 text-[var(--ds-gray-900)]", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

const ModalBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-4", className)} {...props} />
);
ModalBody.displayName = "ModalBody";

const ModalCloseButton = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-4 top-4 rounded-md",
      "text-[var(--ds-gray-900)] hover:text-[var(--ds-gray-1000)]",
      "hover:bg-[var(--ds-gray-100)]",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[var(--ds-focus-color)]",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-[var(--ds-background-100)]",
      "disabled:pointer-events-none disabled:opacity-50",
      "transition-colors data-[motion=off]:transition-none",
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
));
ModalCloseButton.displayName = DialogPrimitive.Close.displayName;

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalBody,
};

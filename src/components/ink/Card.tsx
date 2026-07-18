import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Ink Card — Tempo v5 design system component.
 *
 * Surface containers for grouped content.
 *
 * Structure:
 * - Card: main container (gray-100 bg, subtle border, small shadow)
 * - CardHeader: title section (often with flex between title + action)
 * - CardContent: main content area (padding)
 * - CardFooter: action buttons or secondary content
 *
 * Usage:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Title</CardTitle>
 *       <CardDescription>Description</CardDescription>
 *     </CardHeader>
 *     <CardContent>Content</CardContent>
 *     <CardFooter>
 *       <Button>Action</Button>
 *     </CardFooter>
 *   </Card>
 *
 * Responsive: padding adjusts at 768px breakpoint (sm: p-4, md: p-6).
 * Dark/Light: resolves from --ds-* tokens.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md border border-[var(--ds-gray-400)]",
      "bg-[var(--ds-gray-100)]",
      "shadow-sm",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      "p-6 sm:p-4",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-heading-20",
      "font-semibold leading-none tracking-tight",
      "text-[var(--ds-gray-1000)]",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-label-14",
      "text-[var(--ds-gray-900)]",
      className,
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 sm:p-4",
      "pt-0",
      className,
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3",
      "p-6 sm:p-4",
      "pt-0",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

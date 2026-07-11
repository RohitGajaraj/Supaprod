import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Anatomy per tempo-v5/research/badge.md: a static, fully pill-shaped label.
// Badges are never interactive (no onClick, no hover, no focus ring); anything
// clickable gets promoted to a Button or the Pill composition instead.
const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium capitalize tabular-nums [&_[data-slot=icon]]:block [&_[data-slot=icon]]:shrink-0",
  {
    variants: {
      variant: {
        gray: "",
        blue: "",
        purple: "",
        amber: "",
        red: "",
        pink: "",
        green: "",
        teal: "",
        // Full inversion: near-black fill, near-white text; flips per theme via the tokens.
        inverted: "bg-(--ds-gray-1000) text-(--ds-gray-100)",
      },
      contrast: {
        solid: "",
        subtle: "",
      },
      size: {
        // Geometry table from badge.md: height, type size, padding, gap, and icon size per step.
        sm: "h-5 gap-1 px-1.5 text-[11px] tracking-[0.2px] [&_[data-slot=icon]]:size-3",
        // The md icon takes a small negative left margin so it tucks into the rounded edge.
        md: "h-6 gap-1 px-3 text-[12px] [&_[data-slot=icon]]:size-3.5 [&_[data-slot=icon]]:-ml-0.5",
        lg: "h-8 gap-1.5 px-3 text-sm [&_[data-slot=icon]]:size-4",
      },
    },
    // Color matrix from badge.md: solid = {hue}-800 fill with contrast-fg text;
    // subtle = {hue}-200 fill with {hue}-900 text. Same generator for all 8 hues.
    compoundVariants: [
      {
        variant: "gray",
        contrast: "solid",
        className: "bg-(--ds-gray-800) text-(--ds-contrast-fg)",
      },
      { variant: "gray", contrast: "subtle", className: "bg-(--ds-gray-200) text-(--ds-gray-900)" },
      {
        variant: "blue",
        contrast: "solid",
        className: "bg-(--ds-blue-800) text-(--ds-contrast-fg)",
      },
      { variant: "blue", contrast: "subtle", className: "bg-(--ds-blue-200) text-(--ds-blue-900)" },
      {
        variant: "purple",
        contrast: "solid",
        className: "bg-(--ds-purple-800) text-(--ds-contrast-fg)",
      },
      {
        variant: "purple",
        contrast: "subtle",
        className: "bg-(--ds-purple-200) text-(--ds-purple-900)",
      },
      {
        variant: "amber",
        contrast: "solid",
        className: "bg-(--ds-amber-800) text-(--ds-contrast-fg)",
      },
      {
        variant: "amber",
        contrast: "subtle",
        className: "bg-(--ds-amber-200) text-(--ds-amber-900)",
      },
      { variant: "red", contrast: "solid", className: "bg-(--ds-red-800) text-(--ds-contrast-fg)" },
      { variant: "red", contrast: "subtle", className: "bg-(--ds-red-200) text-(--ds-red-900)" },
      {
        variant: "pink",
        contrast: "solid",
        className: "bg-(--ds-pink-800) text-(--ds-contrast-fg)",
      },
      { variant: "pink", contrast: "subtle", className: "bg-(--ds-pink-200) text-(--ds-pink-900)" },
      {
        variant: "green",
        contrast: "solid",
        className: "bg-(--ds-green-800) text-(--ds-contrast-fg)",
      },
      {
        variant: "green",
        contrast: "subtle",
        className: "bg-(--ds-green-200) text-(--ds-green-900)",
      },
      {
        variant: "teal",
        contrast: "solid",
        className: "bg-(--ds-teal-800) text-(--ds-contrast-fg)",
      },
      { variant: "teal", contrast: "subtle", className: "bg-(--ds-teal-200) text-(--ds-teal-900)" },
    ],
    defaultVariants: {
      variant: "gray",
      contrast: "solid",
      size: "md",
    },
  },
);

type TempoBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

// Deprecated shadcn variant keys, kept compiling so existing call sites render sanely.
// Do not use in new code; pick a hue + contrast instead.
type LegacyBadgeVariant = "default" | "secondary" | "destructive" | "outline";

const legacyVariantMap: Record<
  LegacyBadgeVariant,
  { variant: TempoBadgeVariant; contrast?: "solid" | "subtle"; extraClassName?: string }
> = {
  default: { variant: "inverted" },
  secondary: { variant: "gray", contrast: "subtle" },
  destructive: { variant: "red", contrast: "solid" },
  outline: {
    variant: "gray",
    contrast: "subtle",
    // The old outline variant read as a bordered chip; keep a visible border on the alias.
    extraClassName: "border border-(--ds-gray-400)",
  },
};

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, "variant"> {
  variant?: TempoBadgeVariant | LegacyBadgeVariant;
  /** Optional leading icon; sized automatically per badge size (12/14/16px). */
  icon?: React.ReactNode;
}

function Badge({ className, variant, contrast, size, icon, children, ...props }: BadgeProps) {
  let resolvedVariant = variant;
  let resolvedContrast = contrast;
  let legacyClassName: string | undefined;

  if (variant && variant in legacyVariantMap) {
    const legacy = legacyVariantMap[variant as LegacyBadgeVariant];
    resolvedVariant = legacy.variant;
    // A legacy key encodes its own tone; only fall back to it when the caller
    // did not pass an explicit contrast alongside it.
    resolvedContrast = contrast ?? legacy.contrast;
    legacyClassName = legacy.extraClassName;
  }

  return (
    <span
      className={cn(
        badgeVariants({
          variant: resolvedVariant as TempoBadgeVariant | undefined,
          contrast: resolvedContrast,
          size,
        }),
        legacyClassName,
        className,
      )}
      {...props}
    >
      {icon ? (
        // data-slot lets the size variants govern icon geometry; svg fills the slot box.
        <span aria-hidden="true" className="[&>svg]:size-full" data-slot="icon">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };

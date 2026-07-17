/**
 * Icon — enforces DESIGN-TEMPO.md §8 sizing and stroke rules.
 *
 * Wraps Lucide icons to prevent size/stroke inconsistency. Use this for
 * UI icons; display/brand moments (CadenceMark, MarkGlint) use custom sizes.
 *
 * Usage:
 *   import { Icon } from '@/components/cadence/Icon';
 *   <Icon name="ChevronDown" size="nav" aria-hidden />
 *
 * Or with direct Lucide import:
 *   import { ChevronDown } from 'lucide-react';
 *   <Icon as={ChevronDown} size="nav" aria-hidden />
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { iconSize, iconStroke } from "@/lib/icon-sizing";

export type IconSizeVariant = "compact" | "standard" | "nav" | "large";

interface IconProps {
  /** Lucide icon component (e.g., ChevronDown) */
  as: LucideIcon;

  /** Size tier: compact (14px), standard (16px), nav (20px), large (24px) */
  size?: IconSizeVariant;

  /** Override stroke weight if needed (rare) */
  stroke?: number;

  /** Aria-hidden for decorative icons */
  ariaHidden?: boolean;

  /** Aria-label for icon-only buttons */
  ariaLabel?: string;

  /** Pass-through style */
  style?: React.CSSProperties;

  /** Pass-through className */
  className?: string;
}

/**
 * Enforced icon sizing ensures consistent visual weight and legibility.
 * All Cadence UI icons should use this component or match its constraints.
 */
export function Icon({
  as: LucideIcon,
  size = "standard",
  stroke,
  ariaHidden,
  ariaLabel,
  style,
  className,
}: IconProps) {
  const sizePixels = iconSize[size];
  const strokeWidth = stroke ?? iconStroke[size];

  return (
    <LucideIcon
      size={sizePixels}
      strokeWidth={strokeWidth}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      style={style}
      className={className}
    />
  );
}

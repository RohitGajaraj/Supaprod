import * as React from "react";
import { AuroraCard, type AuroraHue } from "@/components/obsidian/aurora";

export interface LoopHealthCardProps {
  /** The metric headline, e.g. "Runs itself" (rendered mono-caps by the card). */
  label?: string;
  /** The already-formatted value, e.g. "80%", or "-" when there is not enough
   * data yet. Pre-formatting here keeps the unit with the number. */
  value: React.ReactNode;
  note: string;
  hue?: AuroraHue;
}

/** The screen's ONE aurora (restraint budget). A thin wrapper over the
 * AuroraCard, bound to a single interpretable loop metric (how much of the work
 * ran without a human) rather than a blended, unreadable score, so the number
 * reads plainly at a glance. */
export function LoopHealthCard({
  label = "Runs itself",
  value,
  note,
  hue = "healthy",
}: LoopHealthCardProps) {
  return <AuroraCard label={label} value={value} note={note} hue={hue} />;
}

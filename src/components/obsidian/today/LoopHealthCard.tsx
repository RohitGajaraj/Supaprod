import * as React from "react";
import { AuroraCard, type AuroraHue } from "@/components/obsidian/aurora";

export interface LoopHealthCardProps {
  score: number | null;
  note: string;
  hue?: AuroraHue;
}

/** The screen's ONE aurora (restraint budget §4). Thin wrapper over the
 * OBS-03 AuroraCard bound to the acceptance/autonomy score. */
export function LoopHealthCard({ score, note, hue = "healthy" }: LoopHealthCardProps) {
  return (
    <AuroraCard label="LOOP HEALTH" value={score != null ? score : "-"} note={note} hue={hue} />
  );
}

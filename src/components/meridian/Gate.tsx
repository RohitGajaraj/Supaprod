/**
 * Gate — question + evidence + actions.
 * Meridian design system component for decision points.
 * Replaces primitives.Gate with premium styling.
 */
import * as React from "react";
import { Surface } from "@/components/shell/primitives";

export interface GateProps {
  question?: React.ReactNode;
  title?: React.ReactNode;
  sub?: React.ReactNode;
  marks?: React.ReactNode;
  lines?: React.ReactNode[];
  children?: React.ReactNode;
}

export function Gate({ question, title, sub, marks, lines, children }: GateProps) {
  const heading = question || title;

  return (
    <Surface data-mrd="">
      <div className="space-y-mrd-s3">
        <div className="space-y-mrd-s1">
          {heading && <h2 className="text-mrd-t-body font-mrd-w-600 text-mrd-ink">{heading}</h2>}
          {sub && <p className="text-mrd-t-sm text-mrd-body">{sub}</p>}
        </div>
        {marks && <div className="text-mrd-t-sm text-mrd-mute">{marks}</div>}
        {lines && lines.length > 0 && <div className="space-y-mrd-s1">{lines}</div>}
        {children && <div className="space-y-mrd-s2">{children}</div>}
      </div>
    </Surface>
  );
}

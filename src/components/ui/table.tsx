import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Numeric/technical cell class: ids, counts, hashes, durations, timestamps.
 * Geist Mono at the 13px label step plus tabular figures so digits align
 * vertically across rows (tempo-v5 research/table.md and
 * patterns/tables-data-grids.md, "Mono" column type). Apply on TableCell:
 *
 *   <TableCell className={tableNumericCellClass}>8f21ab...9c04</TableCell>
 */
export const tableNumericCellClass = "text-label-13-mono tabular-nums";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-copy-14 text-(--ds-gray-1000)", className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b [&_tr]:border-(--ds-gray-400)", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Zebra-stripe rows for scanability on dense data (research/table.md). */
  striped?: boolean;
  /** Draw explicit cell borders instead of relying on row dividers alone. */
  bordered?: boolean;
  /** Rows read as clickable targets (drill-in lists); adds cursor + press state. */
  interactive?: boolean;
}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, striped, bordered, interactive, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn(
        "[&_tr:last-child]:border-0",
        // Stripe on the gray-100 background step (component background role).
        striped && "[&_tr:nth-child(even)]:bg-(--ds-gray-100)",
        bordered && "[&_td]:border [&_td]:border-(--ds-gray-400)",
        // Hover affordance lives on TableRow; interactive adds the click cursor
        // and a pressed step one alpha deeper than hover.
        interactive && "[&_tr]:cursor-pointer [&_tr:active]:bg-(--ds-gray-alpha-200)",
        className,
      )}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      // Opaque gray-100 (not an alpha wash): the footer is a distinct summary band.
      "border-t border-(--ds-gray-400) bg-(--ds-gray-100) font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        // Alpha steps layer safely over striped/selected backgrounds; selected is
        // one step deeper than hover so both states stay distinguishable.
        "border-b border-(--ds-gray-400) transition-colors duration-150 ease-(--ds-motion-timing-swift) motion-reduce:transition-none hover:bg-(--ds-gray-alpha-100) data-[state=selected]:bg-(--ds-gray-alpha-200)",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // h-10 = 40px, on the control-height grid; headers use the label step one
      // size down from body copy, in the secondary text color.
      "h-10 px-2 text-left align-middle text-label-13 text-(--ds-gray-900) [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-copy-13 text-(--ds-gray-900)", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };

import { cloneElement, isValidElement } from "react";

/**
 * Responsive table shell: horizontal scroll + sticky first column on all
 * screen sizes, including phones (no mobile "card list" fallback).
 *
 * Usage:
 *   <TableShell minWidth={720}>
 *     <Table>...</Table>
 *   </TableShell>
 *
 * The single child is expected to be the shadcn <Table> component. It is
 * cloned with `disableWrapper` (so it doesn't add its own nested
 * overflow-auto div — TableShell already provides the single scroll
 * container) and with the `tbl` class added (the sticky-first-column CSS in
 * src/index.css targets `.table-shell--sticky .tbl thead th:first-child` /
 * `tbody td:first-child`).
 */
export default function TableShell({
  children,
  minWidth = 640,
  stickyFirst = true,
  className = "",
  "data-testid": testId,
}) {
  const shellClass = [
    "h-scroll",
    "table-shell",
    stickyFirst ? "table-shell--sticky" : "",
    className,
  ].filter(Boolean).join(" ");

  const table = isValidElement(children)
    ? cloneElement(children, {
        className: [children.props.className, "tbl"].filter(Boolean).join(" "),
        disableWrapper: true,
      })
    : children;

  return (
    <div className={shellClass} data-testid={testId ? `${testId}-scroll` : undefined}>
      <div style={{ minWidth }}>{table}</div>
    </div>
  );
}

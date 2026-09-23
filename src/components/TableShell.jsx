import { Children, cloneElement, isValidElement } from "react";

/**
 * Responsive table shell: horizontal scroll + sticky first column on all
 * screen sizes, including phones (no mobile "card list" fallback).
 *
 * Usage:
 *   <TableShell minWidth={720}>
 *     <Table>...</Table>
 *   </TableShell>
 *
 * Some callers render extra markup (e.g. a bulk-delete banner) alongside the
 * table, so children may be an array rather than a single element. Whichever
 * child is the shadcn <Table> component (identified by its displayName) is
 * cloned with `disableWrapper` (so it doesn't add its own nested
 * overflow-auto div — TableShell already provides the single scroll
 * container) and with the `tbl` class added (the sticky-first-column CSS in
 * src/index.css targets `.table-shell--sticky .tbl thead th:first-child` /
 * `tbody td:first-child`). Other children are passed through unchanged.
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

  const content = Children.map(children, (child) => {
    if (!isValidElement(child) || child.type?.displayName !== "Table") return child;
    return cloneElement(child, {
      className: [child.props.className, "tbl"].filter(Boolean).join(" "),
      disableWrapper: true,
    });
  });

  return (
    <div className={shellClass} data-testid={testId ? `${testId}-scroll` : undefined}>
      <div style={{ minWidth }}>{content}</div>
    </div>
  );
}

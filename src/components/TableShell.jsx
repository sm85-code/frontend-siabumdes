/**
 * Responsive table shell: horizontal scroll + sticky first column on desktop/tablet,
 * optional card list on mobile.
 *
 * Usage:
 *   <TableShell minWidth={720} mobileCards={...}>
 *     <table className="tbl">...</table>
 *   </TableShell>
 */
export default function TableShell({
  children,
  minWidth = 640,
  stickyFirst = true,
  mobileCards = null,
  className = "",
  "data-testid": testId,
}) {
  const shellClass = [
    "h-scroll",
    "table-shell",
    stickyFirst ? "table-shell--sticky" : "",
    mobileCards ? "hidden sm:block" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <>
      {mobileCards ? (
        <div className="table-cards sm:hidden space-y-3" data-testid={testId ? `${testId}-cards` : undefined}>
          {mobileCards}
        </div>
      ) : null}
      <div className={shellClass} data-testid={testId ? `${testId}-scroll` : undefined}>
        <div style={{ minWidth }}>{children}</div>
      </div>
    </>
  );
}

/** Small labeled row inside a mobile card */
export function TableCardField({ label, children, emphasize = false }) {
  return (
    <div className={`table-card-field${emphasize ? " table-card-field--em" : ""}`}>
      <span className="table-card-label">{label}</span>
      <span className="table-card-value">{children}</span>
    </div>
  );
}

export function TableCard({ title, subtitle, children, footer, className = "" }) {
  return (
    <div className={`table-card ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="table-card-head">
          {title ? <div className="table-card-title">{title}</div> : null}
          {subtitle ? <div className="table-card-sub">{subtitle}</div> : null}
        </div>
      )}
      <div className="table-card-body">{children}</div>
      {footer ? <div className="table-card-footer">{footer}</div> : null}
    </div>
  );
}

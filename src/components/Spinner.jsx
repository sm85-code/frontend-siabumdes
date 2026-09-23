/**
 * Themed dual-ring loading spinner.
 *
 * Two concentric rings in the theme's own accent color (`--legacy-primary`),
 * rotating in opposite directions at different speeds for a "solid" look.
 * Colors come entirely from CSS variables already wired to the 5 themes +
 * dark mode, so no hex color is hardcoded here.
 *
 * Usage:
 *   <Spinner />                          // inline, default label "Memuat..."
 *   <Spinner size={48} label="Memuat dashboard..." />
 *   <Spinner label={null} />             // rings only, no text
 */
export default function Spinner({ size = 32, label = "Memuat...", className = "", ...rest }) {
  const outerBorder = Math.max(3, Math.round(size * 0.1));
  const innerSize = Math.round(size * 0.7);
  const innerBorder = Math.max(2, Math.round(size * 0.08));

  return (
    <span
      className={`spinner-wrap ${className}`.trim()}
      role="status"
      aria-live="polite"
      data-testid="spinner"
      {...rest}
    >
      <span
        className="spinner-rings"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span
          className="spinner-ring spinner-ring--outer"
          style={{
            width: size,
            height: size,
            borderWidth: outerBorder,
          }}
        />
        <span
          className="spinner-ring spinner-ring--inner"
          style={{
            width: innerSize,
            height: innerSize,
            borderWidth: innerBorder,
            top: (size - innerSize) / 2,
            left: (size - innerSize) / 2,
          }}
        />
      </span>
      {label ? <span className="spinner-label">{label}</span> : <span className="sr-only">Memuat...</span>}
    </span>
  );
}

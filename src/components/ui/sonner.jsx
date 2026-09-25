import { Toaster as Sonner, toast } from "sonner"
import { useTheme } from "@/lib/theme"

const Toaster = ({ ...props }) => {
  const { mode } = useTheme();
  return (
    <Sonner
      theme={mode}
      className="toaster group"
      style={{
        "--success-bg": "color-mix(in srgb, var(--status-success) 12%, white)",
        "--success-border": "color-mix(in srgb, var(--status-success) 35%, white)",
        "--success-text": "var(--status-success)",
        "--error-bg": "color-mix(in srgb, var(--status-error) 12%, white)",
        "--error-border": "color-mix(in srgb, var(--status-error) 35%, white)",
        "--error-text": "var(--status-error)",
        "--warning-bg": "color-mix(in srgb, var(--status-warning) 12%, white)",
        "--warning-border": "color-mix(in srgb, var(--status-warning) 35%, white)",
        "--warning-text": "var(--status-warning)",
        "--info-bg": "color-mix(in srgb, var(--legacy-primary) 10%, white)",
        "--info-border": "color-mix(in srgb, var(--legacy-primary) 30%, white)",
        "--info-text": "var(--legacy-primary)",
      }}
      toastOptions={{
        classNames: {
          toast: "group toast bg-[var(--surface)] text-[var(--text-primary)] border-[var(--legacy-border)] shadow-lg rounded-xl",
          description: "text-[var(--text-secondary)]",
          actionButton: "bg-[var(--legacy-primary)] text-[color:hsl(var(--primary-foreground))]",
          cancelButton: "bg-[var(--bg)] text-[var(--legacy-primary)]",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }

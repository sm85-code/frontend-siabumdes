import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast bg-[var(--surface)] text-[var(--text-primary)] border-[var(--legacy-border)] shadow-lg rounded-xl",
          description: "text-[var(--text-secondary)]",
          actionButton: "bg-[var(--legacy-primary)] text-white",
          cancelButton: "bg-[var(--bg)] text-[var(--legacy-primary)]",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }

import { cn } from "@/lib/utils";

/**
 * Komponen Typography resmi shadcn/ui (https://ui.shadcn.com/docs/components/typography)
 * -- skala ukuran/berat/tracking teks standar shadcn untuk konten naratif
 * panjang (laporan, catatan kebijakan, dsb). Dipakai terutama di CaLK
 * (Catatan atas Laporan Keuangan) dan bagian naratif lain yang butuh hierarki
 * teks jelas, bukan untuk menggantikan tabel data (.tbl) yang sudah punya
 * gaya sendiri. Warna/font-family tetap ikut aturan global h1-h4 di
 * index.css (var(--font-heading)/var(--primary-dark)) -- kelas di sini cuma
 * mengatur ukuran, berat, dan spacing.
 */

export function TypographyH2({ className, ...props }) {
  return (
    <h2
      className={cn("scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0", className)}
      {...props}
    />
  );
}

export function TypographyH3({ className, ...props }) {
  return (
    <h3 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props} />
  );
}

export function TypographyH4({ className, ...props }) {
  return (
    <h4 className={cn("scroll-m-20 text-lg font-semibold tracking-tight", className)} {...props} />
  );
}

export function TypographyP({ className, ...props }) {
  return <p className={cn("leading-7 [&:not(:first-child)]:mt-4", className)} {...props} />;
}

export function TypographyLead({ className, ...props }) {
  return <p className={cn("text-lg text-muted-foreground", className)} {...props} />;
}

export function TypographyLarge({ className, ...props }) {
  return <div className={cn("text-lg font-semibold", className)} {...props} />;
}

export function TypographySmall({ className, ...props }) {
  return <small className={cn("text-sm font-medium leading-none", className)} {...props} />;
}

export function TypographyMuted({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function TypographyBlockquote({ className, ...props }) {
  return <blockquote className={cn("mt-4 border-l-2 pl-6 italic", className)} {...props} />;
}

export function TypographyList({ className, ...props }) {
  return <ul className={cn("my-4 ml-6 list-disc [&>li]:mt-2", className)} {...props} />;
}

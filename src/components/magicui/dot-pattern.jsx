import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Diadaptasi dari komponen "DotPattern" Magic UI (magicui.design), sebuah
 * registry komponen dekoratif yang memang dibuat kompatibel dengan
 * shadcn/ui + Tailwind. Versi TS aslinya animasi tiap titik pakai
 * framer-motion -- di sini sengaja diganti murni SVG statis (glow) supaya
 * tidak menambah dependency baru dan tetap ringan dipakai sebagai layer
 * latar penuh viewport.
 */
export function DotPattern({ width = 18, height = 18, cx = 1, cy = 1, cr = 1, className, ...props }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn("wallpaper-dots-svg h-full w-full", className)}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

import { cn } from "@/lib/utils";

/**
 * Diadaptasi dari komponen "Ripple" Magic UI (magicui.design). Animasinya
 * murni CSS keyframes (lihat .wallpaper-ripple-circle di index.css), sama
 * seperti versi asli Magic UI sendiri -- tidak butuh framer-motion.
 */
export function Ripple({ mainCircleSize = 220, mainCircleOpacity = 0.3, numCircles = 7, className, ...props }) {
  return (
    <div className={cn("absolute inset-0", className)} {...props}>
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 80;
        const opacity = mainCircleOpacity - i * 0.03;
        return (
          <div
            key={i}
            className="wallpaper-ripple-circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${i * 0.3}s`,
              "--ripple-opacity": opacity,
            }}
          />
        );
      })}
    </div>
  );
}

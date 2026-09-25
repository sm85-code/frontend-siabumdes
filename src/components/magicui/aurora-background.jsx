/**
 * Diadaptasi dari pola "Aurora Background" yang populer di registry
 * shadcn-compatible seperti Magic UI/Aceternity UI: beberapa blob gradient
 * warna tema yang melayang pelan. Animasinya murni CSS (lihat
 * .wallpaper-aurora-blob di index.css) -- tidak butuh framer-motion.
 */
export function AuroraBackground() {
  return (
    <div className="absolute inset-0">
      <div
        className="wallpaper-aurora-blob"
        style={{
          width: "30vw", height: "30vw", top: "-10%", left: "-8%",
          background: "hsl(var(--primary) / 0.10)",
        }}
      />
      <div
        className="wallpaper-aurora-blob"
        style={{
          width: "26vw", height: "26vw", top: "-6%", right: "-10%",
          background: "hsl(var(--ring) / 0.08)",
          animationDelay: "-4s",
        }}
      />
      <div
        className="wallpaper-aurora-blob"
        style={{
          width: "34vw", height: "34vw", bottom: "-18%", left: "20%",
          background: "hsl(var(--primary) / 0.06)",
          animationDelay: "-9s",
        }}
      />
    </div>
  );
}

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
          width: "42vw", height: "42vw", top: "-10%", left: "-8%",
          background: "hsl(var(--primary) / 0.22)",
        }}
      />
      <div
        className="wallpaper-aurora-blob"
        style={{
          width: "38vw", height: "38vw", top: "-6%", right: "-10%",
          background: "hsl(var(--ring) / 0.18)",
          animationDelay: "-4s",
        }}
      />
      <div
        className="wallpaper-aurora-blob"
        style={{
          width: "46vw", height: "46vw", bottom: "-18%", left: "20%",
          background: "hsl(var(--primary) / 0.14)",
          animationDelay: "-9s",
        }}
      />
    </div>
  );
}

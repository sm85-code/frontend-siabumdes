import { useTheme } from "@/lib/theme";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Ripple } from "@/components/magicui/ripple";
import { AuroraBackground } from "@/components/magicui/aurora-background";

/** Layer dekoratif tetap (fixed, di belakang sidebar & konten) yang merender
 * komponen Magic UI sesuai pilihan "Wallpaper" di popover Tampilan. */
export default function WallpaperLayer() {
  const { wallpaper } = useTheme();
  if (wallpaper === "none") return null;
  return (
    <div className="wallpaper-layer" aria-hidden="true">
      {wallpaper === "dots" && <DotPattern />}
      {wallpaper === "glow" && <Ripple />}
      {wallpaper === "aurora" && <AuroraBackground />}
    </div>
  );
}

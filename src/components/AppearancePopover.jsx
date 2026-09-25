import { useTheme, FONTS, THEMES, BASE_COLORS, WALLPAPERS, MODES } from "@/lib/theme";
import { PaintBrush } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Tombol + popover "Tampilan" (Tema/Base Warna/Wallpaper/Mode/Font) --
 * dipakai di sidebar (Layout.jsx) untuk pengguna yang sudah login, dan di
 * halaman publik (Login.jsx, Landing.jsx) supaya pengunjung yang belum
 * login juga bisa mengatur tampilan.
 */
export default function AppearancePopover({ triggerClassName, align = "start" }) {
  const {
    font, setFont,
    colorTheme, setColorTheme,
    baseColor, setBaseColor,
    wallpaper, setWallpaper,
    mode, setMode,
  } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button data-testid="appearance-trigger" variant="outline" size="sm" className={triggerClassName || "gap-2"}>
          <PaintBrush size={16} /> Tampilan
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-64 space-y-3" data-testid="appearance-popover">
        <div>
          <label className="label" htmlFor="theme-switcher">Tema</label>
          <Select value={colorTheme} onValueChange={(v) => setColorTheme(v)}>
            <SelectTrigger id="theme-switcher" data-testid="theme-switcher" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label" htmlFor="base-color-switcher">Base Warna</label>
          <Select value={baseColor} onValueChange={(v) => setBaseColor(v)}>
            <SelectTrigger id="base-color-switcher" data-testid="base-color-switcher" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_COLORS.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label" htmlFor="wallpaper-switcher">Wallpaper</label>
          <Select value={wallpaper} onValueChange={(v) => setWallpaper(v)}>
            <SelectTrigger id="wallpaper-switcher" data-testid="wallpaper-switcher" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WALLPAPERS.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label" htmlFor="mode-switcher">Mode</label>
          <Select value={mode} onValueChange={(v) => setMode(v)}>
            <SelectTrigger id="mode-switcher" data-testid="mode-switcher" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label" htmlFor="font-switcher">Font</label>
          <Select value={font} onValueChange={(v) => setFont(v)}>
            <SelectTrigger id="font-switcher" data-testid="font-switcher" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { createContext, useContext, useEffect, useState } from "react";

export const FONTS = [
  { id: "jakarta", label: "Jakarta" },
  { id: "inter", label: "Inter" },
  { id: "serif", label: "Serif Klasik" },
  { id: "elegan", label: "Elegan" },
  { id: "rounded", label: "Rounded" },
];

// Preset warna resmi shadcn/ui -- lihat blok :root[data-theme="..."] di index.css.
export const THEMES = [
  { id: "blue", label: "Biru" },
  { id: "zinc", label: "Zinc (Monokrom)" },
  { id: "red", label: "Merah" },
  { id: "orange", label: "Oranye" },
  { id: "yellow", label: "Kuning" },
  { id: "green", label: "Hijau" },
  { id: "violet", label: "Violet" },
  { id: "rose", label: "Rose" },
];

export const MODES = [
  { id: "light", label: "Terang" },
  { id: "dark", label: "Gelap" },
];

const FONT_KEY = "bumdes-font";
const THEME_KEY = "bumdes-theme";
const MODE_KEY = "bumdes-mode";
const VALID_FONTS = FONTS.map((f) => f.id);
const VALID_THEMES = THEMES.map((t) => t.id);
const VALID_MODES = MODES.map((m) => m.id);

function readStored(key, validIds, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return validIds.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

const ThemeContext = createContext({
  theme: "modern",
  font: "jakarta", setFont: () => {},
  colorTheme: "blue", setColorTheme: () => {},
  mode: "light", setMode: () => {},
});

/**
 * "Modern" is now the app's only layout theme, so `theme` here is a constant
 * kept for back-compat with any code reading it from context. The actual
 * user-facing pickers are:
 * - font: typeface (data-font attribute)
 * - colorTheme: shadcn/ui color preset (data-theme attribute, --primary/--ring)
 * - mode: light/dark (.dark class on <html>, per Tailwind's darkMode:"class")
 */
export function ThemeProvider({ children }) {
  const [font, setFont] = useState(() => readStored(FONT_KEY, VALID_FONTS, "jakarta"));
  const [colorTheme, setColorTheme] = useState(() => readStored(THEME_KEY, VALID_THEMES, "blue"));
  const [mode, setMode] = useState(() => readStored(MODE_KEY, VALID_MODES, "light"));

  useEffect(() => {
    document.documentElement.setAttribute("data-font", font);
    try {
      localStorage.setItem(FONT_KEY, font);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [font]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorTheme);
    try {
      localStorage.setItem(THEME_KEY, colorTheme);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme: "modern", font, setFont, colorTheme, setColorTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

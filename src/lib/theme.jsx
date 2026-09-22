import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "playful", label: "Playful" },
  { id: "minimalis", label: "Minimalis" },
  { id: "elegant", label: "Elegant" },
];

export const FONTS = [
  { id: "jakarta", label: "Jakarta" },
  { id: "inter", label: "Inter" },
  { id: "serif", label: "Serif Klasik" },
  { id: "elegan", label: "Elegan" },
  { id: "rounded", label: "Rounded" },
];

const THEME_KEY = "bumdes-theme";
const FONT_KEY = "bumdes-font";
const VALID_THEMES = THEMES.map((t) => t.id);
const VALID_FONTS = FONTS.map((f) => f.id);

function readStored(key, validIds, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return validIds.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

const ThemeContext = createContext({
  theme: "modern", setTheme: () => {},
  font: "jakarta", setFont: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readStored(THEME_KEY, VALID_THEMES, "modern"));
  const [font, setFont] = useState(() => readStored(FONT_KEY, VALID_FONTS, "jakarta"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font", font);
    try {
      localStorage.setItem(FONT_KEY, font);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [font]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

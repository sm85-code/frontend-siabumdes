import { createContext, useContext, useEffect, useState } from "react";

export const FONTS = [
  { id: "jakarta", label: "Jakarta" },
  { id: "inter", label: "Inter" },
  { id: "serif", label: "Serif Klasik" },
  { id: "elegan", label: "Elegan" },
  { id: "rounded", label: "Rounded" },
];

const FONT_KEY = "bumdes-font";
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
  theme: "modern",
  font: "jakarta", setFont: () => {},
});

/**
 * "Modern" is now the app's only theme, so this provider is font-only: it
 * still exposes `theme: "modern"` (constant, never changes) so any code
 * reading it from context keeps working, but there is no more
 * setTheme/localStorage persistence for it.
 */
export function ThemeProvider({ children }) {
  const [font, setFont] = useState(() => readStored(FONT_KEY, VALID_FONTS, "jakarta"));

  useEffect(() => {
    document.documentElement.setAttribute("data-font", font);
    try {
      localStorage.setItem(FONT_KEY, font);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [font]);

  return (
    <ThemeContext.Provider value={{ theme: "modern", font, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

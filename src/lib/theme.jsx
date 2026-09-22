import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "modern", label: "Modern", description: "Teal, ikon garis tipis" },
  { id: "classic", label: "Classic", description: "Navy-emas, ikon solid" },
  { id: "playful", label: "Playful", description: "Warna cerah, ikon duotone" },
];

const STORAGE_KEY = "bumdes-theme";
const VALID_IDS = THEMES.map((t) => t.id);

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_IDS.includes(stored) ? stored : "modern";
  } catch {
    return "modern";
  }
}

const ThemeContext = createContext({ theme: "modern", setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore (private mode / storage blocked)
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

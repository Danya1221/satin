"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  dark: boolean;
  setDark: (value: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    let selected = false;
    try { selected = localStorage.getItem("netizen-theme") === "dark"; } catch { /* Storage may be disabled. */ }
    setDarkState(selected);
    document.documentElement.classList.toggle("dark", selected);
  }, []);

  function setDark(value: boolean) {
    setDarkState(value);
    try { localStorage.setItem("netizen-theme", value ? "dark" : "light"); } catch { /* Theme still changes for this visit. */ }

    if (value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    setDark(!dark);
  }

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
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
  const [dark, setDarkState] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("netizen-theme");

    if (savedTheme === "light") {
      setDarkState(false);
      document.documentElement.classList.remove("dark");
      return;
    }

    setDarkState(true);
    document.documentElement.classList.add("dark");
  }, []);

  function setDark(value: boolean) {
    setDarkState(value);
    localStorage.setItem("netizen-theme", value ? "dark" : "light");

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
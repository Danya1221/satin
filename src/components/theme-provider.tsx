"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useStoreSettings } from "@/components/store-settings";

type ThemeContextValue = {
  dark: boolean;
  setDark: (value: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);
  const site = useStoreSettings();

  useEffect(() => {
    let selected: string | null = null;
    try { selected = localStorage.getItem("netizen-theme"); } catch {}
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const preferred = selected || site?.branding?.defaultTheme || "light";
      const value = preferred === "dark" || (preferred === "system" && media.matches);
      setDarkState(value); document.documentElement.classList.toggle("dark", value);
    };
    apply(); media.addEventListener("change", apply);
    for (const [field, property] of [["accentColor", "--store-accent"], ["primaryColor", "--store-primary"]] as const) {
      const value = site?.branding?.[field];
      if (value && /^#[0-9a-f]{6}$/i.test(value)) document.documentElement.style.setProperty(property, value);
    }
    if (site?.branding?.favicon && /^(\/|https:\/\/|data:image\/)/.test(site.branding.favicon)) {
      let icon = document.querySelector<HTMLLinkElement>('link[data-store-favicon]');
      if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; icon.dataset.storeFavicon = "true"; document.head.append(icon); }
      icon.href = site.branding.favicon;
    }
    return () => media.removeEventListener("change", apply);
  }, [site]);

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
"use client";

import { useEffect, useState } from "react";

type AdminTheme = "dark" | "light" | "blue" | "compact";

const adminThemes: Array<{ value: AdminTheme; label: string }> = [
  { value: "dark", label: "Тёмная" },
  { value: "light", label: "Светлая" },
  { value: "blue", label: "Синяя" },
  { value: "compact", label: "Компактная" },
];

function isAdminTheme(value: string | null): value is AdminTheme {
  return value === "dark" || value === "light" || value === "blue" || value === "compact";
}

export function AdminThemeSwitcher() {
  const [theme, setTheme] = useState<AdminTheme>("dark");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("netizen-admin-theme");
    const savedCollapsed = window.localStorage.getItem("netizen-admin-theme-collapsed");

    if (isAdminTheme(savedTheme)) {
      setTheme(savedTheme);
    }

    setCollapsed(savedCollapsed === "true");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    document.body.dataset.adminTheme = theme;
    window.localStorage.setItem("netizen-admin-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("netizen-admin-theme-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <>
      <div className="admin-theme-bar sticky top-0 z-[70] border-b border-white/10 bg-[#020814]/95 px-4 py-2 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/60 transition-colors hover:border-blue-500/40 hover:text-white"
          >
            {collapsed ? "Показать тему" : "Скрыть тему"}
          </button>

          {!collapsed && (
            <label className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Тема оформления админки
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value as AdminTheme)}
                className="h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition-colors hover:border-blue-500/50"
              >
                {adminThemes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      <AdminThemeStyle />
    </>
  );
}

function AdminThemeStyle() {
  return (
    <style jsx global>{`
      .admin-theme-bar option {
        background: #020814;
        color: #ffffff;
      }

      [data-admin-theme="light"] .admin-theme-bar {
        background: rgba(255, 255, 255, 0.96) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-bar button,
      [data-admin-theme="light"] .admin-theme-bar select {
        background: #ffffff !important;
        border-color: rgba(15, 23, 42, 0.16) !important;
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope,
      [data-admin-theme="light"] .admin-theme-scope * {
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-white/"] {
        color: rgba(16, 24, 40, 0.55) !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-blue-"] {
        color: #2563eb !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-green-"] {
        color: #16a34a !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-red-"] {
        color: #dc2626 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-amber-"] {
        color: #d97706 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="bg-blue-6"],
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-blue-6"] *,
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-blue-500"]:not([class*="bg-blue-500/"]):not([class*="bg-blue-500\\5b"]),
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-blue-500"]:not([class*="bg-blue-500/"]):not([class*="bg-blue-500\\5b"]) *,
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-red-6"],
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-red-6"] *,
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-red-500"]:not([class*="bg-red-500/"]),
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-red-500"]:not([class*="bg-red-500/"]) *,
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-green-6"],
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-green-6"] *,
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-green-500"]:not([class*="bg-green-500/"]),
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-green-500"]:not([class*="bg-green-500/"]) * {
        color: #ffffff !important;
      }

      [data-admin-theme="light"] .admin-theme-scope main,
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-[#020814]"] {
        background: #f4f7fb !important;
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="bg-white/"],
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-white["],
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-black/"],
      [data-admin-theme="light"] .admin-theme-scope [class*="bg-black["] {
        background: rgba(255, 255, 255, 0.9) !important;
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="border-white/"] {
        border-color: rgba(15, 23, 42, 0.12) !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-white"] {
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-white/"] {
        color: rgba(16, 24, 40, 0.55) !important;
      }

      [data-admin-theme="light"] .admin-theme-scope h1,
      [data-admin-theme="light"] .admin-theme-scope h2,
      [data-admin-theme="light"] .admin-theme-scope h3,
      [data-admin-theme="light"] .admin-theme-scope h4,
      [data-admin-theme="light"] .admin-theme-scope p,
      [data-admin-theme="light"] .admin-theme-scope span,
      [data-admin-theme="light"] .admin-theme-scope td,
      [data-admin-theme="light"] .admin-theme-scope th,
      [data-admin-theme="light"] .admin-theme-scope label,
      [data-admin-theme="light"] .admin-theme-scope li {
        color: inherit;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="text-blue-4"],
      [data-admin-theme="light"] .admin-theme-scope [class*="text-blue-5"] {
        color: #2563eb !important;
      }

      [data-admin-theme="light"] .admin-theme-scope input,
      [data-admin-theme="light"] .admin-theme-scope select,
      [data-admin-theme="light"] .admin-theme-scope textarea,
      [data-admin-theme="light"] .admin-theme-scope .admin-input,
      [data-admin-theme="light"] .admin-theme-scope .admin-textarea {
        background: #ffffff !important;
        border-color: rgba(15, 23, 42, 0.16) !important;
        color: #101828 !important;
      }

      [data-admin-theme="light"] .admin-theme-scope option {
        background: #ffffff !important;
        color: #101828 !important;
      }





      [data-admin-theme="light"] .admin-theme-scope,
      [data-admin-theme="light"] .admin-theme-scope * {
        color-scheme: light;
      }

      [data-admin-theme="light"] .admin-theme-scope a:not([class*="bg-blue-"]),
      [data-admin-theme="light"] .admin-theme-scope button:not([class*="bg-blue-"]):not([class*="bg-red-"]):not([class*="bg-green-"]):not([class*="bg-amber-"]) {
        color: #101828 !important;
      }



      [data-admin-theme="light"] .admin-theme-scope input::placeholder,
      [data-admin-theme="light"] .admin-theme-scope textarea::placeholder {
        color: rgba(16, 24, 40, 0.42) !important;
      }

      [data-admin-theme="light"] .admin-theme-scope [class*="border-blue-500/50"],
      [data-admin-theme="light"] .admin-theme-scope [class*="border-blue-500/35"] {
        border-color: rgba(37, 99, 235, 0.35) !important;
      }

      [data-admin-theme="blue"] .admin-theme-bar,
      [data-admin-theme="blue"] .admin-theme-scope main,
      [data-admin-theme="blue"] .admin-theme-scope [class*="bg-[#020814]"] {
        background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.32), transparent 35%), #020814 !important;
      }

      [data-admin-theme="blue"] .admin-theme-scope [class*="bg-white/"],
      [data-admin-theme="blue"] .admin-theme-scope [class*="bg-black/"] {
        background: rgba(15, 23, 42, 0.68) !important;
      }

      [data-admin-theme="compact"] .admin-theme-scope main {
        background: #030712 !important;
      }

      [data-admin-theme="compact"] .admin-theme-scope [class*="rounded-[34px]"] {
        border-radius: 1.25rem !important;
      }

      [data-admin-theme="compact"] .admin-theme-scope [class*="p-8"] {
        padding: 1.25rem !important;
      }

      [data-admin-theme="compact"] .admin-theme-scope [class*="mt-8"] {
        margin-top: 1rem !important;
      }

      [data-admin-theme="compact"] .admin-theme-scope [class*="gap-8"] {
        gap: 1rem !important;
      }
    `}</style>
  );
}

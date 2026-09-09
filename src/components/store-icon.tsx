import type { CSSProperties } from "react";

export type StoreIconName = "search" | "arrow" | "back" | "bag" | "heart" | "user" | "grid" | "home" | "sparkles" | "help" | "phone" | "sun" | "moon" | "close" | "check" | "menu" | "plus";

const paths: Record<StoreIconName, React.ReactNode> = {
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  back: <><path d="M20 12H5m6-6-6 6 6 6" /></>,
  bag: <><path d="M5 7.5h14l1 13H4l1-13Z" /><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" /></>,
  heart: <path d="M20.4 5.7a5.1 5.1 0 0 0-7.2 0L12 6.9l-1.2-1.2a5.1 5.1 0 0 0-7.2 7.2L12 21l8.4-8.1a5.1 5.1 0 0 0 0-7.2Z" />,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 21v-1.3a7.5 7.5 0 0 1 15 0V21" /></>,
  grid: <><rect x="3.5" y="3.5" width="6" height="6" rx="1.3" /><rect x="14.5" y="3.5" width="6" height="6" rx="1.3" /><rect x="3.5" y="14.5" width="6" height="6" rx="1.3" /><rect x="14.5" y="14.5" width="6" height="6" rx="1.3" /></>,
  home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" /></>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></>,
  help: <><path d="M5 13v-2a7 7 0 0 1 14 0v2M19 17v1a3 3 0 0 1-3 3h-3" /><rect x="3" y="11" width="4" height="7" rx="2" /><rect x="17" y="11" width="4" height="7" rx="2" /></>,
  phone: <path d="m8 3 2 5-3 2a15 15 0 0 0 7 7l2-3 5 2v3a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2h3Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
  moon: <path d="M20.6 14A9 9 0 0 1 10 3.4 9 9 0 1 0 20.6 14Z" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

export function StoreIcon({ name, className = "", style }: { name: StoreIconName; className?: string; style?: CSSProperties }) {
  return <svg className={`store-icon ${className}`} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

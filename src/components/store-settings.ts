"use client";

import { useEffect, useState } from "react";

export type PublicStoreSettings = {
  branding?: { storeName?: string; logoLight?: string; logoDark?: string; mobileLogo?: string; navIconHome?: string; navIconCatalog?: string; navIconNew?: string; navIconSupport?: string; navIconCart?: string };
  contacts?: { phone?: string; phoneText?: string; workingHours?: string; city?: string; email?: string; telegram?: string };
};

let settingsRequest: Promise<PublicStoreSettings | null> | undefined;
export function useStoreSettings(initial?: PublicStoreSettings | null) {
  const [settings, setSettings] = useState<PublicStoreSettings | null>(initial ?? null);
  useEffect(() => {
    if (initial) { setSettings(initial); return; }
    let active = true;
    if (!settingsRequest) {
      settingsRequest = fetch("/api/site-settings", { cache: "no-store" })
        .then(async response => response.ok ? (await response.json()).site ?? null : null)
        .catch(() => { settingsRequest = undefined; return null; });
    }
    settingsRequest.then(value => { if (active) setSettings(value); });
    return () => { active = false; };
  }, [initial]);
  return settings;
}

export function storeContact(value?: string) {
  const text = value?.trim() || "";
  return /123.?45.?67|netizen[_.]|netizen\.store|адрес будет/i.test(text) ? "" : text;
}

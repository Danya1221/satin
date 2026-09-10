"use client";

import { useEffect, useState } from "react";

import type { SiteEditorSettings } from "@/lib/site-settings-db";
export type PublicStoreSettings = { branding?: Partial<SiteEditorSettings["branding"]>; contacts?: Partial<SiteEditorSettings["contacts"]>; catalog?: Partial<SiteEditorSettings["catalog"]>; productPage?: Partial<SiteEditorSettings["productPage"]>; seo?: Partial<SiteEditorSettings["seo"]> };
let settingsRequest: Promise<PublicStoreSettings | null> | undefined;
let requestedAt = 0;
export function useStoreSettings(initial?: PublicStoreSettings | null) {
  const [settings, setSettings] = useState<PublicStoreSettings | null>(initial ?? null);
  useEffect(() => {
    let active = true;
    function reload(force = false) {
      if (!force && initial) { setSettings(initial); return; }
      if (force || !settingsRequest || Date.now() - requestedAt > 10000) {
        requestedAt = Date.now();
        settingsRequest = fetch("/api/site-settings", { cache: "no-store" }).then(async r => r.ok ? (await r.json()).site ?? null : null).catch(() => null);
      }
      settingsRequest.then(value => { if (active && value) setSettings(value); });
    }
    const refresh = () => reload(true);
    const storage = (event: StorageEvent) => { if (event.key === "store-settings-updated") refresh(); };
    reload(); window.addEventListener("store-settings-updated", refresh); window.addEventListener("storage", storage);
    return () => { active = false; window.removeEventListener("store-settings-updated", refresh); window.removeEventListener("storage", storage); };
  }, [initial]);
  return settings;
}

export function storeContact(value?: string) {
  const text = value?.trim() || "";
  return /123.?45.?67|79990000000|netizen[_.]|netizen\.store|адрес будет/i.test(text) ? "" : text;
}

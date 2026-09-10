"use client";
import { useEffect, useState } from "react";
import { HomeModule, type HomePayload } from "@/app/home-client";
import type { PageKey, PageBlockType } from "@/lib/page-builder-db";
const requests = new Map<string, { time: number; promise: Promise<HomePayload | null> }>();
export function usePageContent(page: PageKey) {
  const [data, setData] = useState<HomePayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    function reload(force = false) {
      if (force || !requests.has(page) || Date.now() - requests.get(page)!.time > 10000) requests.set(page, { time: Date.now(), promise: fetch(`/api/page-content?page=${page}`, { cache: "no-store" }).then(async r => r.ok ? r.json() : null).catch(() => null) });
      requests.get(page)!.promise.then(value => { if (active) { if (value) { setData(value); setFailed(false); } else setFailed(true); } });
    }
    const refresh = () => reload(true);
    const onStorage = (event: StorageEvent) => { if (event.key === "store-settings-updated") refresh(); };
    reload(); window.addEventListener("store-settings-updated", refresh); window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener("store-settings-updated", refresh); window.removeEventListener("storage", onStorage); };
  }, [page, attempt]);
  const block = (type: PageBlockType) => data?.pageBlocks?.find(item => item.type === type);
  return {
    data, failed, retry: () => { requests.delete(page); setFailed(false); setAttempt(value => value + 1); },
    visible: (type: PageBlockType) => !data || Boolean(block(type)?.enabled),
    settings: (type: PageBlockType) => block(type)?.settings ?? {},
    text: (type: PageBlockType, key: string, fallback: string) => { const value = block(type)?.settings?.[key]; return typeof value === "string" ? value : fallback; },
  };
}
export function PageExtras({ content }: { content: ReturnType<typeof usePageContent> }) {
  const supported = ["support", "promo-banner", "text-image", "product-carousel", "popular-products"];
  return <>{content.data?.pageBlocks?.filter(block => block.enabled && supported.includes(block.type)).sort((a, b) => a.sortOrder - b.sortOrder).map(block => <HomeModule key={block.id} block={block} data={content.data!} />)}</>;
}

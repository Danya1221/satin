"use client";

import { useEffect } from "react";

const BRAND_NAME = "Neontech";
const FAVICON_VERSION = "neontech-6";

function upsertLink(
  selector: string,
  rel: string,
  href: string,
  options?: { type?: string; sizes?: string }
) {
  let link = document.querySelector<HTMLLinkElement>(selector);

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;

  if (options?.type) {
    link.type = options.type;
  } else {
    link.removeAttribute("type");
  }

  if (options?.sizes) {
    link.setAttribute("sizes", options.sizes);
  } else {
    link.removeAttribute("sizes");
  }
}

function forceNeontechHead() {
  if (typeof document === "undefined") return;

  document.title = BRAND_NAME;

  const oldIcons = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="manifest"]'
    )
  );

  oldIcons.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("netizen") || href.includes("/logo-") || href.includes("/favicon")) {
      link.remove();
    }
  });

  upsertLink(
    'link[data-neontech-favicon="ico"]',
    "icon",
    `/neontech-favicon.ico?v=${FAVICON_VERSION}`,
    { sizes: "any" }
  );
  document.querySelector<HTMLLinkElement>('link[data-neontech-favicon="ico"]')?.setAttribute("data-neontech-favicon", "ico");

  upsertLink(
    'link[data-neontech-favicon="svg"]',
    "icon",
    `/neontech-favicon.svg?v=${FAVICON_VERSION}`,
    { type: "image/svg+xml" }
  );
  document.querySelector<HTMLLinkElement>('link[data-neontech-favicon="svg"]')?.setAttribute("data-neontech-favicon", "svg");

  upsertLink(
    'link[data-neontech-favicon="apple"]',
    "apple-touch-icon",
    `/apple-touch-icon.png?v=${FAVICON_VERSION}`,
    { sizes: "180x180" }
  );
  document.querySelector<HTMLLinkElement>('link[data-neontech-favicon="apple"]')?.setAttribute("data-neontech-favicon", "apple");

  upsertLink(
    'link[data-neontech-favicon="manifest"]',
    "manifest",
    `/site.webmanifest?v=${FAVICON_VERSION}`
  );
  document.querySelector<HTMLLinkElement>('link[data-neontech-favicon="manifest"]')?.setAttribute("data-neontech-favicon", "manifest");
}

export function ForceBrandHead() {
  useEffect(() => {
    forceNeontechHead();

    const timers = [100, 500, 1500, 3000].map((delay) => window.setTimeout(forceNeontechHead, delay));
    const onVisibility = () => forceNeontechHead();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", forceNeontechHead);

    return () => {
      timers.forEach(window.clearTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", forceNeontechHead);
    };
  }, []);

  return null;
}

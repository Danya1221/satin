"use client";

import { useEffect } from "react";

function shouldIgnoreClick(event: MouseEvent, link: HTMLAnchorElement) {
  if (event.defaultPrevented) return true;
  if (event.button !== 0) return true;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
  if (link.target && link.target !== "_self") return true;
  if (link.hasAttribute("download")) return true;
  if (link.dataset.softNav === "true") return true;

  const rawHref = link.getAttribute("href") || "";
  if (!rawHref || rawHref.startsWith("#")) return true;
  if (/^(mailto:|tel:|sms:|javascript:)/i.test(rawHref)) return true;

  return false;
}

export function HardLinkNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || shouldIgnoreClick(event, link)) return;

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) return;

      const isSamePageAnchor =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash &&
        nextUrl.hash !== currentUrl.hash;

      if (isSamePageAnchor) return;

      const isSameUrl = nextUrl.href === currentUrl.href;
      if (isSameUrl) return;

      event.preventDefault();
      event.stopPropagation();
      window.location.href = nextUrl.href;
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}

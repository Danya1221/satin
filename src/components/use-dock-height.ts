"use client";

import { useEffect, useRef } from "react";

/** Reserve the actual dock size, including wrapped labels and enlarged text. */
export function useDockHeight<T extends HTMLElement>(property: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => document.documentElement.style.setProperty(property, `${Math.ceil(element.getBoundingClientRect().height)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(property);
    };
  }, [property]);
  return ref;
}

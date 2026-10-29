"use client";

import { useSyncExternalStore } from "react";

// matchMedia 구독. 서버 렌더에서는 false
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

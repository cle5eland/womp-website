"use client";

import { useEffect, useState } from "react";

/**
 * Increments when the document is restored from the browser back/forward cache
 * (bfcache). Framer Motion `initial` + `animate` often does not replay on that
 * path, leaving hero content stuck invisible — keyed remount forces a clean run.
 */
export function useBfCacheRemountKey(): number {
  const [k, setK] = useState(0);
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setK((n) => n + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  return k;
}

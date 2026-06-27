import { useSyncExternalStore, useCallback } from "react";

// Kevyt URL-query-tila ilman reititinkirjastoa.
// Synkronoi valinnat osoitepalkkiin (?tab=...&comp=...) niin että näkymät ovat linkitettäviä.

function subscribe(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("urlchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("urlchange", callback);
  };
}

function getSnapshot() {
  return window.location.search;
}

export function useUrlParam(key, defaultValue = "") {
  const search = useSyncExternalStore(subscribe, getSnapshot);
  const value = new URLSearchParams(search).get(key) ?? defaultValue;

  const setValue = useCallback(
    (next) => {
      const params = new URLSearchParams(window.location.search);
      if (next === null || next === undefined || next === "") params.delete(key);
      else params.set(key, String(next));
      const qs = params.toString();
      window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
      window.dispatchEvent(new Event("urlchange"));
    },
    [key]
  );

  return [value, setValue];
}

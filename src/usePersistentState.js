import { useEffect, useState } from "react";

const STORAGE_PREFIX = "allun-kesakisat:";

export function usePersistentState(key, defaultValue) {
  const storageKey = STORAGE_PREFIX + key;

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // localStorage ei käytettävissä (esim. yksityinen selaustila) - jatketaan ilman tallennusta
    }
  }, [storageKey, value]);

  return [value, setValue];
}

export function clearAllPersistedState() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

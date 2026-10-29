"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { readStored, subscribeStored, writeStored } from "@/lib/storage/local-store";

const noopSubscribe = () => () => {};

// localStorage 값을 읽고 쓴다. fallback은 렌더마다 바뀌지 않는 값(모듈 상수)이어야 한다.
// hydrated는 브라우저에서 저장된 값을 실제로 읽은 뒤에만 true다.
export function useStoredValue<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribeStored,
    () => readStored(key),
    () => null
  );
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback((next: T) => writeStored(key, next), [key]);

  return [value, setValue, hydrated] as const;
}

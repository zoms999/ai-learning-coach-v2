'use client';

import { useEffect, useState } from 'react';

/**
 * SSR 하이드레이션 문제를 해결하기 위한 안전한 스토어 훅
 * 클라이언트 사이드에서만 스토어 값을 사용하도록 보장
 */
export function useHydratedStore<T>(
  storeHook: () => T,
  fallback?: T
): T | undefined {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = storeHook();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 하이드레이션이 완료되지 않았으면 fallback 값 반환
  if (!isHydrated) {
    return fallback;
  }

  return store;
}

/**
 * 하이드레이션 상태를 확인하는 훅
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
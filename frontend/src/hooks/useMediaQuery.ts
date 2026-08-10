'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface Breakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export type BreakpointKey = keyof Breakpoints;

// ============================================================
// DEFAULT BREAKPOINTS
// ============================================================

export const defaultBreakpoints: Breakpoints = {
  xs: '(max-width: 639px)',
  sm: '(min-width: 640px) and (max-width: 767px)',
  md: '(min-width: 768px) and (max-width: 1023px)',
  lg: '(min-width: 1024px) and (max-width: 1279px)',
  xl: '(min-width: 1280px) and (max-width: 1535px)',
  '2xl': '(min-width: 1536px)',
};

export const minBreakpoints: Record<BreakpointKey, string> = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

export const maxBreakpoints: Record<BreakpointKey, string> = {
  xs: '(max-width: 639px)',
  sm: '(max-width: 767px)',
  md: '(max-width: 1023px)',
  lg: '(max-width: 1279px)',
  xl: '(max-width: 1535px)',
  '2xl': '(max-width: 9999px)',
};

// ============================================================
// HOOK
// ============================================================

/**
 * Hook to match a media query
 * @param query - Media query string
 * @param defaultState - Default state for SSR (default: false)
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string, defaultState: boolean = false): boolean {
  const [matches, setMatches] = useState<boolean>(defaultState);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return (): void => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// ============================================================
// BREAKPOINT HOOKS
// ============================================================

/**
 * Hook to check if the current screen is a specific breakpoint or wider
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const query = minBreakpoints[breakpoint] || `(min-width: 0px)`;
  return useMediaQuery(query);
}

/**
 * Hook to check if the current screen is a specific breakpoint or narrower
 */
export function useMaxBreakpoint(breakpoint: BreakpointKey): boolean {
  const query = maxBreakpoints[breakpoint] || '(max-width: 639px)';
  return useMediaQuery(query);
}

/**
 * Hook to check the current breakpoint
 * @returns The current breakpoint key
 */
export function useCurrentBreakpoint(): BreakpointKey {
  const isXs = useMediaQuery(defaultBreakpoints.xs);
  const isSm = useMediaQuery(defaultBreakpoints.sm);
  const isMd = useMediaQuery(defaultBreakpoints.md);
  const isLg = useMediaQuery(defaultBreakpoints.lg);
  const isXl = useMediaQuery(defaultBreakpoints.xl);
  const is2xl = useMediaQuery(defaultBreakpoints['2xl']);

  if (isXs) return 'xs';
  if (isSm) return 'sm';
  if (isMd) return 'md';
  if (isLg) return 'lg';
  if (isXl) return 'xl';
  if (is2xl) return '2xl';

  return 'xs';
}

// ============================================================
// SPECIFIC BREAKPOINT HELPERS
// ============================================================

/**
 * Hook to check if the screen is mobile (xs or sm)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to check if the screen is tablet (md)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to check if the screen is desktop (lg or larger)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to check if the screen is small desktop (lg)
 */
export function useIsSmallDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
}

/**
 * Hook to check if the screen is large desktop (xl or 2xl)
 */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/**
 * Hook to check if the screen is extra large (2xl)
 */
export function useIsExtraLarge(): boolean {
  return useMediaQuery('(min-width: 1536px)');
}

// ============================================================
// RESPONSIVE UTILITIES
// ============================================================

/**
 * Hook to get responsive value based on breakpoint
 */
export function useResponsiveValue<T>(
  values: Partial<Record<BreakpointKey, T>>,
  defaultValue: T
): T {
  const breakpoint = useCurrentBreakpoint();

  // Check from largest to smallest
  const breakpoints: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  for (const bp of breakpoints) {
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }

  return defaultValue;
}

/**
 * Hook to get responsive class names based on breakpoint
 */
export function useResponsiveClasses(
  classes: Partial<Record<BreakpointKey, string>>,
  defaultClass: string = ''
): string {
  const breakpoint = useCurrentBreakpoint();

  const breakpoints: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  for (const bp of breakpoints) {
    if (classes[bp]) {
      return classes[bp] as string;
    }
  }

  return defaultClass;
}

// ============================================================
// ORIENTATION HOOKS
// ============================================================

/**
 * Hook to check if the device is in portrait mode
 */
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

/**
 * Hook to check if the device is in landscape mode
 */
export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}

/**
 * Hook to check if the device prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook to check if the device prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// ============================================================
// WINDOW DIMENSION HOOK
// ============================================================

/**
 * Hook to get window dimensions
 */
export function useWindowSize(): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Debounce resize for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = (): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);

    return (): void => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return windowSize;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useMediaQuery;

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface DebounceOptions {
  /** Delay in milliseconds (default: 300) */
  delay?: number;
  /** Whether to use leading edge execution (default: false) */
  leading?: boolean;
  /** Whether to use trailing edge execution (default: true) */
  trailing?: boolean;
  /** Maximum wait time before forcing execution (default: Infinity) */
  maxWait?: number;
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook that debounces a value or callback
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @param options - Additional options
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300, options: DebounceOptions = {}): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const valueRef = useRef<T>(value);

  const { leading = false, trailing = true, maxWait = Infinity } = options;

  useEffect(() => {
    valueRef.current = value;
    const now = Date.now();

    // Update last call time
    lastCallTimeRef.current = now;

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Leading edge execution
    if (leading && !maxWaitTimeoutRef.current && lastCallTimeRef.current - now === 0) {
      setDebouncedValue(value);
      return;
    }

    // Set max wait timeout
    if (maxWait !== Infinity && !maxWaitTimeoutRef.current) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setDebouncedValue(valueRef.current);
        maxWaitTimeoutRef.current = null;
      }, maxWait);
    }

    // Set trailing timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(valueRef.current);
        timeoutRef.current = null;

        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current);
          maxWaitTimeoutRef.current = null;
        }
      }, delay);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = null;
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return debouncedValue;
}

// ============================================================
// HOOK FOR FUNCTION DEBOUNCING
// ============================================================

/**
 * Hook that returns a debounced version of a callback function
 * @param callback - The callback function to debounce
 * @param delay - Debounce delay in milliseconds
 * @param options - Additional options
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  options: DebounceOptions = {}
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const pendingArgsRef = useRef<any[] | null>(null);

  const { leading = false, trailing = true, maxWait = Infinity } = options;

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      // Store latest args
      pendingArgsRef.current = args;

      // Update last call time
      lastCallTimeRef.current = now;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Leading edge execution
      if (leading && !maxWaitTimeoutRef.current) {
        callback(...args);
        return;
      }

      // Set max wait timeout
      if (maxWait !== Infinity && !maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (pendingArgsRef.current) {
            callback(...pendingArgsRef.current);
            pendingArgsRef.current = null;
          }
          maxWaitTimeoutRef.current = null;
        }, maxWait);
      }

      // Set trailing timeout
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          if (pendingArgsRef.current) {
            callback(...pendingArgsRef.current);
            pendingArgsRef.current = null;
          }
          timeoutRef.current = null;

          if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current);
            maxWaitTimeoutRef.current = null;
          }
        }, delay);
      }
    },
    [callback, delay, leading, trailing, maxWait]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = null;
      }
    };
  }, []);

  return debouncedFunction as T;
}

// ============================================================
// HOOK FOR THROTTLING
// ============================================================

/**
 * Hook that throttles a callback function
 * @param callback - The callback function to throttle
 * @param delay - Throttle delay in milliseconds
 * @returns Throttled callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunRef = useRef<number>(0);
  const pendingArgsRef = useRef<any[] | null>(null);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      // Store latest args
      pendingArgsRef.current = args;

      // Check if we can run immediately
      if (now - lastRunRef.current >= delay) {
        lastRunRef.current = now;
        callback(...args);
        pendingArgsRef.current = null;
        return;
      }

      // Schedule trailing execution
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(
          () => {
            if (pendingArgsRef.current) {
              callback(...pendingArgsRef.current);
              pendingArgsRef.current = null;
            }
            timeoutRef.current = null;
            lastRunRef.current = Date.now();
          },
          delay - (now - lastRunRef.current)
        );
      }
    },
    [callback, delay]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return throttledFunction as T;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useDebounce;

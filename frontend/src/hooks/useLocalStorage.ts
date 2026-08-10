'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

export type StorageValue<T> = T | undefined;

export interface UseLocalStorageOptions<T> {
  /** Serializer function for storing value (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Deserializer function for retrieving value (default: JSON.parse) */
  deserializer?: (value: string) => T;
  /** Whether to sync across tabs (default: true) */
  syncAcrossTabs?: boolean;
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook to sync state with localStorage
 * @param key - The localStorage key
 * @param initialValue - Initial value or function to get initial value
 * @param options - Configuration options
 * @returns [storedValue, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serializer = JSON.stringify, deserializer = JSON.parse, syncAcrossTabs = true } = options;

  // Use ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Get initial value from localStorage or initialValue
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return deserializer(item);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }

    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }, [key, initialValue, deserializer]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          const serialized = serializer(valueToStore);
          window.localStorage.setItem(key, serialized);

          // Dispatch storage event for cross-tab sync
          if (syncAcrossTabs) {
            window.dispatchEvent(
              new StorageEvent('storage', {
                key,
                newValue: serialized,
                storageArea: window.localStorage,
              })
            );
          }
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer, syncAcrossTabs]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key,
              newValue: null,
              storageArea: window.localStorage,
            })
          );
        }
      }
      // Reset to initial value
      const initial =
        typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      setStoredValue(initial);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, syncAcrossTabs]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === localStorage) {
        try {
          const newValue = event.newValue !== null ? deserializer(event.newValue) : null;
          if (newValue === null) {
            // Value was removed
            const initial =
              typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
            setStoredValue(initial);
          } else {
            setStoredValue(newValue);
          }
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}" across tabs:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, deserializer, initialValue, syncAcrossTabs]);

  // Initialize if value changes from another tab on mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const current = getStoredValue();
      setStoredValue(current);
    }
  }, [getStoredValue]);

  return [storedValue, setValue, removeValue];
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useLocalStorage;

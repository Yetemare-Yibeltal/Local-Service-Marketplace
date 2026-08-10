'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

export type Serializer<T> = (value: T) => string;
export type Deserializer<T> = (value: string) => T;

export interface UseLocalStorageOptions<T> {
  /** Initial value if no value exists in localStorage */
  initialValue?: T;
  /** Custom serializer function */
  serializer?: Serializer<T>;
  /** Custom deserializer function */
  deserializer?: Deserializer<T>;
  /** Whether to sync across tabs/windows */
  syncAcrossTabs?: boolean;
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook that synchronizes state with localStorage
 * @param key - localStorage key
 * @param options - Configuration options
 * @returns [storedValue, setValue, removeValue, isLoaded]
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void, () => void, boolean] {
  const {
    initialValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncAcrossTabs = true,
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(deserializer(item));
      } else {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    } finally {
      setIsLoaded(true);
    }
  }, [key, initialValue, deserializer]);

  // Set value and sync to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T | undefined) => T)) => {
      setStoredValue((prev) => {
        const newValue =
          typeof value === 'function' ? (value as (prev: T | undefined) => T)(prev) : value;
        try {
          localStorage.setItem(key, serializer(newValue));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
        return newValue;
      });
    },
    [key, serializer]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  // Sync across tabs/windows
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserializer(e.newValue));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserializer, initialValue, syncAcrossTabs]);

  return [storedValue, setValue, removeValue, isLoaded];
}

// ============================================================
// HOOK WITH CUSTOM SERIALIZER FOR OBJECTS
// ============================================================

/**
 * Hook for storing objects with custom serialization
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue?: T
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void, () => void, boolean] {
  return useLocalStorage<T>(key, {
    initialValue,
    serializer: (val) => JSON.stringify(val, null, 2),
    deserializer: (str) => JSON.parse(str),
  });
}

// ============================================================
// HOOK FOR PRIMITIVE VALUES
// ============================================================

/**
 * Hook for storing strings
 */
export function useLocalStorageString(
  key: string,
  initialValue?: string
): [
  string | undefined,
  (value: string | ((prev: string | undefined) => string)) => void,
  () => void,
  boolean,
] {
  return useLocalStorage<string>(key, {
    initialValue,
    serializer: (val) => val,
    deserializer: (str) => str,
  });
}

/**
 * Hook for storing numbers
 */
export function useLocalStorageNumber(
  key: string,
  initialValue?: number
): [
  number | undefined,
  (value: number | ((prev: number | undefined) => number)) => void,
  () => void,
  boolean,
] {
  return useLocalStorage<number>(key, {
    initialValue,
    serializer: (val) => String(val),
    deserializer: (str) => Number(str),
  });
}

/**
 * Hook for storing booleans
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue?: boolean
): [
  boolean | undefined,
  (value: boolean | ((prev: boolean | undefined) => boolean)) => void,
  () => void,
  boolean,
] {
  return useLocalStorage<boolean>(key, {
    initialValue,
    serializer: (val) => String(val),
    deserializer: (str) => str === 'true',
  });
}

/**
 * Hook for storing arrays
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue?: T[]
): [T[] | undefined, (value: T[] | ((prev: T[] | undefined) => T[])) => void, () => void, boolean] {
  return useLocalStorage<T[]>(key, {
    initialValue,
    serializer: (val) => JSON.stringify(val),
    deserializer: (str) => JSON.parse(str),
  });
}

// ============================================================
// HOOK WITH VALIDATION
// ============================================================

/**
 * Hook with custom validation on load
 */
export function useLocalStorageWithValidation<T>(
  key: string,
  validate: (value: any) => boolean,
  options: UseLocalStorageOptions<T> = {}
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void, () => void, boolean] {
  const [storedValue, setStoredValue, removeValue, isLoaded] = useLocalStorage<T>(key, {
    ...options,
    deserializer: (str) => {
      try {
        const parsed = options.deserializer ? options.deserializer(str) : JSON.parse(str);
        return validate(parsed) ? parsed : options.initialValue;
      } catch {
        return options.initialValue;
      }
    },
  });

  return [storedValue, setStoredValue, removeValue, isLoaded];
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useLocalStorage;

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface UseLocalStorageOptions<T> {
  /** Initial value if no value exists in localStorage */
  defaultValue: T | (() => T);
  /** Whether to sync between tabs (default: true) */
  syncAcrossTabs?: boolean;
  /** Custom serializer (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Custom deserializer (default: JSON.parse) */
  deserializer?: (value: string) => T;
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook that syncs state with localStorage
 * @param key - The localStorage key
 * @param defaultValue - Default value if not found in localStorage
 * @param options - Additional options
 * @returns [storedValue, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { syncAcrossTabs = true, serializer = JSON.stringify, deserializer = JSON.parse } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return deserializer(item);
      }
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue instanceof Function ? defaultValue() : defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = deserializer(event.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}" from storage event:`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        // Item was removed
        setStoredValue(defaultValue instanceof Function ? defaultValue() : defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, deserializer, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}

// ============================================================
// HOOK WITH OBJECT SYNTAX (Alternative)
// ============================================================

/**
 * Hook that syncs state with localStorage using object syntax
 * Returns an object with value, set, remove, and isPersisted properties
 */
export function useLocalStorageObject<T>(
  key: string,
  defaultValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {}
): {
  value: T;
  set: (value: T | ((prev: T) => T)) => void;
  remove: () => void;
  isPersisted: boolean;
} {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue, options);
  const [isPersisted, setIsPersisted] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  });

  // Update isPersisted when value changes
  useEffect(() => {
    try {
      setIsPersisted(window.localStorage.getItem(key) !== null);
    } catch {
      setIsPersisted(false);
    }
  }, [key, value]);

  return {
    value,
    set: setValue,
    remove: removeValue,
    isPersisted,
  };
}

// ============================================================
// HOOK FOR SESSION STORAGE
// ============================================================

/**
 * Hook that syncs state with sessionStorage
 * @param key - The sessionStorage key
 * @param defaultValue - Default value if not found in sessionStorage
 * @param options - Additional options
 * @returns [storedValue, setValue, removeValue] tuple
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T | (() => T),
  options: Omit<UseLocalStorageOptions<T>, 'syncAcrossTabs'> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serializer = JSON.stringify, deserializer = JSON.parse } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        return deserializer(item);
      }
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer]
  );

  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(defaultValue instanceof Function ? defaultValue() : defaultValue);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

// ============================================================
// HOOK FOR JSON OBJECT VALIDATION
// ============================================================

/**
 * Hook that syncs state with localStorage with JSON schema validation
 * @param key - The localStorage key
 * @param defaultValue - Default value if not found in localStorage
 * @param validator - Function to validate the stored value (returns boolean)
 * @param options - Additional options
 * @returns [storedValue, setValue, removeValue] tuple
 */
export function useValidatedLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
  validator: (value: T) => boolean,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serializer = JSON.stringify, deserializer = JSON.parse, syncAcrossTabs = true } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = deserializer(item);
        if (validator(parsed)) {
          return parsed;
        }
        // Invalid data, fallback to default
        console.warn(`Invalid data for key "${key}", using default`);
        return defaultValue instanceof Function ? defaultValue() : defaultValue;
      }
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        if (!validator(valueToStore)) {
          console.warn(`Invalid value for key "${key}", not saving`);
          return;
        }
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer, validator]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue instanceof Function ? defaultValue() : defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const parsed = deserializer(event.newValue);
          if (validator(parsed)) {
            setStoredValue(parsed);
          }
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}" from storage event:`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(defaultValue instanceof Function ? defaultValue() : defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, deserializer, validator, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useLocalStorage;

'use client';

import { useEffect, useRef, useCallback, RefObject } from 'react';

// ============================================================
// TYPES
// ============================================================

export type ClickOutsideHandler = (event: MouseEvent | TouchEvent) => void;

export interface UseClickOutsideOptions {
  /** Whether the handler should be active (default: true) */
  enabled?: boolean;
  /** Whether to use capture phase (default: false) */
  capture?: boolean;
  /** Whether to handle touch events (default: true) */
  handleTouch?: boolean;
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook to detect clicks outside a referenced element
 * @param ref - React ref object for the target element
 * @param handler - Function to call when clicking outside
 * @param options - Configuration options
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: ClickOutsideHandler,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, capture = false, handleTouch = true } = options;

  const handlerRef = useRef<ClickOutsideHandler>(handler);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node;

      // Check if click/touch is outside the referenced element
      if (ref.current && !ref.current.contains(target)) {
        handlerRef.current(event);
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside, capture);

    if (handleTouch) {
      document.addEventListener('touchstart', handleClickOutside, capture);
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside, capture);

      if (handleTouch) {
        document.removeEventListener('touchstart', handleClickOutside, capture);
      }
    };
  }, [ref, enabled, capture, handleTouch]);
}

// ============================================================
// HOOK WITH MULTIPLE REFS
// ============================================================

/**
 * Hook to detect clicks outside multiple referenced elements
 * @param refs - Array of React ref objects for the target elements
 * @param handler - Function to call when clicking outside all refs
 * @param options - Configuration options
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T | null>[],
  handler: ClickOutsideHandler,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, capture = false, handleTouch = true } = options;

  const handlerRef = useRef<ClickOutsideHandler>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node;

      // Check if click/touch is outside all referenced elements
      const isOutside = refs.every((ref) => {
        return !ref.current || !ref.current.contains(target);
      });

      if (isOutside) {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, capture);

    if (handleTouch) {
      document.addEventListener('touchstart', handleClickOutside, capture);
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside, capture);

      if (handleTouch) {
        document.removeEventListener('touchstart', handleClickOutside, capture);
      }
    };
  }, [refs, enabled, capture, handleTouch]);
}

// ============================================================
// HOOK WITH IGNORE REFS
// ============================================================

/**
 * Hook to detect clicks outside a target element, ignoring specific refs
 * @param ref - React ref object for the target element
 * @param ignoreRefs - Array of refs to ignore (click on these won't trigger the handler)
 * @param handler - Function to call when clicking outside
 * @param options - Configuration options
 */
export function useClickOutsideWithIgnore<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  ignoreRefs: RefObject<HTMLElement | null>[],
  handler: ClickOutsideHandler,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, capture = false, handleTouch = true } = options;

  const handlerRef = useRef<ClickOutsideHandler>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node;

      // Check if click is inside the target element or any ignored refs
      const isInsideTarget = ref.current && ref.current.contains(target);
      const isInsideIgnored = ignoreRefs.some((ignoreRef) => {
        return ignoreRef.current && ignoreRef.current.contains(target);
      });

      if (!isInsideTarget && !isInsideIgnored) {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, capture);

    if (handleTouch) {
      document.addEventListener('touchstart', handleClickOutside, capture);
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside, capture);

      if (handleTouch) {
        document.removeEventListener('touchstart', handleClickOutside, capture);
      }
    };
  }, [ref, ignoreRefs, enabled, capture, handleTouch]);
}

// ============================================================
// HELPER HOOK FOR SPECIFIC USE CASES
// ============================================================

/**
 * Hook to close a component when clicking outside
 * @param ref - React ref object for the target element
 * @param onClose - Function to call when clicking outside (to close the component)
 * @param isOpen - Whether the component is open
 * @param options - Configuration options
 */
export function useClickOutsideToClose<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  onClose: () => void,
  isOpen: boolean = true,
  options: Omit<UseClickOutsideOptions, 'enabled'> = {}
): void {
  const { capture = false, handleTouch = true } = options;

  const handler = useCallback((): void => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useClickOutside(ref, handler, {
    enabled: isOpen,
    capture,
    handleTouch,
  });
}

// ============================================================
// EXPORTS
// ============================================================

export default useClickOutside;

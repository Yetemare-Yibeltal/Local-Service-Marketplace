'use client';

import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';

// ============================================================
// TYPES
// ============================================================

export type FormValidator<T> = (values: T) => Partial<Record<keyof T, string>>;

export interface UseFormOptions<T> {
  /** Initial form values */
  initialValues: T;
  /** Validation function */
  validate?: FormValidator<T>;
  /** Submit handler */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Whether to validate on submit (default: true) */
  validateOnSubmit?: boolean;
}

export interface FieldProps<T> {
  name: keyof T;
  value: T[keyof T];
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
}

export interface FormReturn<T> {
  /** Form values */
  values: T;
  /** Form errors */
  errors: Partial<Record<keyof T, string>>;
  /** Field touched status */
  touched: Partial<Record<keyof T, boolean>>;
  /** Whether the form is submitting */
  isSubmitting: boolean;
  /** Whether the form is valid (no errors) */
  isValid: boolean;
  /** Whether the form has been submitted */
  isSubmitted: boolean;
  /** Set a field value */
  setFieldValue: (name: keyof T, value: any) => void;
  /** Set a field touched status */
  setFieldTouched: (name: keyof T, touched?: boolean) => void;
  /** Set all field values */
  setValues: (values: T) => void;
  /** Reset form to initial values */
  resetForm: () => void;
  /** Handle form submission */
  handleSubmit: (e: FormEvent) => Promise<void>;
  /** Get field props for a specific field */
  getFieldProps: (name: keyof T) => FieldProps<T>;
  /** Register a field (for use with custom components) */
  register: (name: keyof T) => {
    name: keyof T;
    value: T[keyof T];
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
    touched: boolean;
  };
}

// ============================================================
// HOOK
// ============================================================

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>): FormReturn<T> {
  const {
    initialValues,
    validate,
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validate function
  const validateForm = useCallback((): Partial<Record<keyof T, string>> => {
    if (!validate) return {};
    return validate(values);
  }, [validate, values]);

  // Run validation and update errors
  const runValidation = useCallback((): boolean => {
    if (!validate) return true;
    const validationErrors = validate(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [validate, values]);

  // Set a field value
  const setFieldValue = useCallback(
    (name: keyof T, value: any): void => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if enabled
      if (validateOnChange && validate) {
        const validationErrors = validate({ ...values, [name]: value });
        setErrors(validationErrors);
      }
    },
    [validateOnChange, validate, values]
  );

  // Set a field touched status
  const setFieldTouched = useCallback(
    (name: keyof T, touchedValue: boolean = true): void => {
      setTouched((prev) => ({ ...prev, [name]: touchedValue }));

      // Validate on blur if enabled and touched becomes true
      if (validateOnBlur && touchedValue && validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
      }
    },
    [validateOnBlur, validate, values]
  );

  // Set all values
  const setValuesAll = useCallback(
    (newValues: T): void => {
      setValues(newValues);
      if (validateOnChange && validate) {
        const validationErrors = validate(newValues);
        setErrors(validationErrors);
      }
    },
    [validateOnChange, validate]
  );

  // Reset form
  const resetForm = useCallback((): void => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, [initialValues]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();

      if (!onSubmit) return;

      // Validate on submit if enabled
      if (validateOnSubmit && validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);

        // Set all fields as touched
        const allTouched: Partial<Record<keyof T, boolean>> = {};
        Object.keys(values).forEach((key) => {
          allTouched[key as keyof T] = true;
        });
        setTouched(allTouched);

        if (Object.keys(validationErrors).length > 0) {
          return;
        }
      }

      setIsSubmitting(true);
      setIsSubmitted(true);

      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validateOnSubmit, validate, values]
  );

  // Get field props
  const getFieldProps = useCallback(
    (name: keyof T): FieldProps<T> => {
      const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ): void => {
        const value =
          e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFieldValue(name, value);
      };

      const handleBlur = (): void => {
        setFieldTouched(name, true);
      };

      return {
        name,
        value: values[name],
        onChange: handleChange,
        onBlur: handleBlur,
        error: errors[name],
        touched: !!touched[name],
      };
    },
    [values, errors, touched, setFieldValue, setFieldTouched]
  );

  // Register field (for custom components)
  const register = useCallback(
    (name: keyof T) => {
      return {
        name,
        value: values[name],
        onChange: (value: any) => setFieldValue(name, value),
        onBlur: () => setFieldTouched(name, true),
        error: errors[name],
        touched: !!touched[name],
      };
    },
    [values, errors, touched, setFieldValue, setFieldTouched]
  );

  // Compute validity
  const isValid = useMemo(() => {
    const errorKeys = Object.keys(errors);
    return errorKeys.length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isSubmitted,
    setFieldValue,
    setFieldTouched,
    setValues: setValuesAll,
    resetForm,
    handleSubmit,
    getFieldProps,
    register,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create a validation schema for useForm
 */
export function createValidator<T>(
  schema: (values: T) => Partial<Record<keyof T, string>>
): (values: T) => Partial<Record<keyof T, string>> {
  return schema;
}

/**
 * Required field validator
 */
export function required(
  message: string = 'This field is required'
): (value: any) => string | undefined {
  return (value: any) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    if (Array.isArray(value) && value.length === 0) {
      return message;
    }
    return undefined;
  };
}

/**
 * Email validator
 */
export function email(
  message: string = 'Invalid email address'
): (value: string) => string | undefined {
  return (value: string) => {
    if (!value) return undefined;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return message;
    }
    return undefined;
  };
}

/**
 * Min length validator
 */
export function minLength(min: number, message?: string): (value: string) => string | undefined {
  return (value: string) => {
    if (!value) return undefined;
    if (value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return undefined;
  };
}

/**
 * Max length validator
 */
export function maxLength(max: number, message?: string): (value: string) => string | undefined {
  return (value: string) => {
    if (!value) return undefined;
    if (value.length > max) {
      return message || `Must not exceed ${max} characters`;
    }
    return undefined;
  };
}

/**
 * Pattern validator
 */
export function pattern(regex: RegExp, message: string): (value: string) => string | undefined {
  return (value: string) => {
    if (!value) return undefined;
    if (!regex.test(value)) {
      return message;
    }
    return undefined;
  };
}

/**
 * Phone number validator (Ethiopian)
 */
export function ethiopianPhone(
  message: string = 'Invalid Ethiopian phone number'
): (value: string) => string | undefined {
  return (value: string) => {
    if (!value) return undefined;
    const cleaned = value.replace(/[^0-9+]/g, '');
    const phoneRegex = /^(09|\+2519)[0-9]{8}$/;
    if (!phoneRegex.test(cleaned)) {
      return message;
    }
    return undefined;
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useForm;

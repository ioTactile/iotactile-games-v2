'use client';

import { createContext, useCallback, useContext } from 'react';
import type { FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import type { z } from 'zod';

type FormSchemaContextValue = {
  schema?: z.ZodTypeAny;
};

const FormSchemaContext = createContext<FormSchemaContextValue>({});

export const useFormSchema = () => useContext(FormSchemaContext);

/**
 * Finds the closest scrollable parent element
 */
function findScrollableParent(element: Element): Element | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent);
    if (
      (overflow === 'auto' ||
        overflow === 'scroll' ||
        overflowY === 'auto' ||
        overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Finds a collapsible section trigger that contains the given field path
 */
function findSectionTriggerForField(fieldPath: string): Element | null {
  const triggers = document.querySelectorAll('[data-section-fields]');
  for (const trigger of triggers) {
    const fields = trigger.getAttribute('data-section-fields')?.split(',') || [];
    if (fields.some((field) => fieldPath.startsWith(field) || field.startsWith(fieldPath))) {
      return trigger;
    }
  }
  return null;
}

/**
 * Scrolls to the first form field with an error.
 * Falls back to scrolling to the collapsible section trigger if the field is not in the DOM.
 */
export function scrollToFirstError<T extends FieldValues>(errors: FieldErrors<T>) {
  // Flatten nested FieldErrors into dotted paths
  const getErrorPaths = (obj: FieldErrors<T>, prefix = ''): string[] => {
    const paths: string[] = [];
    for (const key in obj) {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (value?.message) {
        paths.push(path);
      } else if (typeof value === 'object' && value !== null) {
        paths.push(...getErrorPaths(value as FieldErrors<T>, path));
      }
    }
    return paths;
  };

  const errorPaths = getErrorPaths(errors);
  if (errorPaths.length === 0) return;

  for (const path of errorPaths) {
    let element =
      document.querySelector(`[name="${path}"]`) ||
      document.querySelector(`[data-name="${path}"]`) ||
      document.getElementById(path);

    // Field may be inside a collapsed section — scroll its trigger instead
    if (!element) {
      element = findSectionTriggerForField(path);
    }

    if (element) {
      // Wait for React to finish rendering before scrolling
      setTimeout(() => {
        const scrollableParent = findScrollableParent(element);

        if (scrollableParent) {
          const elementRect = element.getBoundingClientRect();
          const parentRect = scrollableParent.getBoundingClientRect();
          const relativeTop = elementRect.top - parentRect.top + scrollableParent.scrollTop;

          const targetScroll =
            relativeTop - scrollableParent.clientHeight / 2 + elementRect.height / 2;
          scrollableParent.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth',
          });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Focus after scroll starts so preventScroll keeps the intended position
        if (element instanceof HTMLElement) {
          element.focus({ preventScroll: true });
        }
      }, 50);
      break;
    }
  }
}

type FormProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  schema: z.ZodTypeAny;
  onSubmit?: (values: T) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

export function Form<T extends FieldValues>({
  form,
  schema,
  onSubmit,
  children,
  className,
}: FormProps<T>) {
  const handleInvalid = useCallback((errors: FieldErrors<T>) => {
    scrollToFirstError(errors);
  }, []);

  return (
    <FormSchemaContext.Provider value={{ schema }}>
      <FormProvider {...form}>
        <form
          onSubmit={onSubmit ? form.handleSubmit(onSubmit, handleInvalid) : undefined}
          className={className}
          autoComplete="off"
          noValidate
        >
          {children}
        </form>
      </FormProvider>
    </FormSchemaContext.Provider>
  );
}

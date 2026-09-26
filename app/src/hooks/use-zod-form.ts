import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Generic hook to wire a Zod schema to React Hook Form.
 * @param schema Zod schema used for validation.
 * @param options Additional useForm options.
 */
export function useZodForm<TValues extends FieldValues>(
  schema: ZodType<TValues, TValues>,
  options?: Omit<UseFormProps<TValues>, 'resolver'>,
): UseFormReturn<TValues> {
  return useForm<TValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    ...options,
  });
}

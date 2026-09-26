import type { ControllerRenderProps, FieldValues, Path, UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface ZodFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  showMessage?: boolean;
  children: (field: Omit<ControllerRenderProps<T, Path<T>>, 'value'>) => React.ReactNode;
  className?: string;
}

export function ZodFormField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  showMessage = true,
  children,
  className,
}: ZodFormFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex min-h-[72px] flex-col', className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>{children(field)}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {showMessage && <FormMessage />}
        </FormItem>
      )}
    />
  );
}

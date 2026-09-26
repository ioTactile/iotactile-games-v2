'use client';

import { PasswordInput } from '@/components/inputs/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/zod/zod-form';
import { ZodFormField } from '@/components/zod/zod-form-field';
import { useAuth } from '@/hooks/use-auth';
import { useZodForm } from '@/hooks/use-zod-form';
import { registerFormSchema, type RegisterFormValues } from '@/lib/auth/auth-schema';

interface RegisterFormProps {
  onSwitchToLogin?: (email?: string) => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const form = useZodForm(registerFormSchema, {
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const { registerMutation } = useAuth();
  const { isPending, isError, error } = registerMutation;

  const onSubmit = async (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        onSwitchToLogin?.(data.email);
      },
    });
  };

  return (
    <Form
      form={form}
      schema={registerFormSchema}
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <ZodFormField form={form} name="email" label="Email">
        {(field) => <Input placeholder="john@example.com" autoComplete="email" {...field} />}
      </ZodFormField>

      <ZodFormField form={form} name="username" label="Pseudo">
        {(field) => <Input placeholder="John" autoComplete="username" {...field} />}
      </ZodFormField>

      <ZodFormField form={form} name="password" label="Mot de passe">
        {(field) => <PasswordInput placeholder="********" autoComplete="new-password" {...field} />}
      </ZodFormField>

      {isError && <p className="text-sm text-destructive">{error.message}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Création…' : 'Créer mon compte'}
      </Button>

      {onSwitchToLogin && (
        <Button type="button" variant="link" onClick={() => onSwitchToLogin()}>
          Déjà un compte ? Se connecter
        </Button>
      )}
    </Form>
  );
}

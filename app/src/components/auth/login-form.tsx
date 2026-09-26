'use client';

import { PasswordInput } from '@/components/inputs/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/zod/zod-form';
import { ZodFormField } from '@/components/zod/zod-form-field';
import { useAuth } from '@/hooks/use-auth';
import { useZodForm } from '@/hooks/use-zod-form';
import { loginFormSchema, type LoginFormValues } from '@/lib/auth/auth-schema';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
}

export function LoginForm({ onSwitchToRegister, onSuccess, defaultEmail }: LoginFormProps) {
  const form = useZodForm(loginFormSchema, {
    defaultValues: {
      email: defaultEmail ?? '',
      password: '',
    },
  });

  const { loginMutation } = useAuth();
  const { isPending, isError, error } = loginMutation;

  const onSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, { onSuccess: () => onSuccess?.() });
  };

  return (
    <Form
      form={form}
      schema={loginFormSchema}
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <ZodFormField form={form} name="email" label="Email">
        {(field) => <Input placeholder="vous@exemple.com" autoComplete="email" {...field} />}
      </ZodFormField>

      <ZodFormField form={form} name="password" label="Mot de passe">
        {(field) => (
          <PasswordInput placeholder="********" autoComplete="current-password" {...field} />
        )}
      </ZodFormField>

      {isError && <p className="text-sm text-destructive">{error.message}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Connexion…' : 'Se connecter'}
      </Button>

      {onSwitchToRegister && (
        <Button type="button" variant="link" onClick={onSwitchToRegister}>
          Créer un compte
        </Button>
      )}
    </Form>
  );
}

'use client';

import { useState } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginEmailPrefill, setLoginEmailPrefill] = useState<string | null>(null);

  const handleSwitchToRegister = () => {
    setLoginEmailPrefill(null);
    setMode('register');
  };

  const handleSwitchToLogin = (email?: string) => {
    setLoginEmailPrefill(email ?? null);
    setMode('login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {mode === 'login' ? (
            <LoginForm
              defaultEmail={loginEmailPrefill ?? undefined}
              onSwitchToRegister={handleSwitchToRegister}
              onSuccess={() => onOpenChange(false)}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={(email) => {
                handleSwitchToLogin(email);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

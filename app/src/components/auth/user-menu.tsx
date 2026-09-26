'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function UserMenu() {
  const { user, isAuthenticated, logoutMutation } = useAuth();

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-foreground">{user.username}</span>
      <Button
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        variant="outline"
      >
        Déconnexion
      </Button>
    </div>
  );
}

'use client';

import { Dices, Gamepad2, Grid3X3, LogIn, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { UserMenu } from '@/components/auth/user-menu';
import { AuthModal } from '@/components/home/AuthModal';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/I18nProvider';
import { games } from '@/lib/games/games';

const GAME_ICONS: Record<string, LucideIcon> = {
  Dices,
  Gamepad2,
  Grid3X3,
};

function GameCardIcon({ icon }: { icon?: string }) {
  const Icon = icon ? GAME_ICONS[icon] : Dices;
  return <Icon className="size-6" />;
}

export default function Home() {
  const { isAuthenticated, isInitialized } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,var(--home-bg-top)_0%,var(--home-bg-bottom)_100%)]">
      <header className="border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <span className="text-xl">{t('common.appName')}</span>
          </Link>
          <div className="flex items-center gap-3">
            {!isInitialized ? (
              <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
            ) : isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthModalOpen(true)}>
                <LogIn className="size-4" />
                {t('auth.login')}
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <section className="mb-14 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('home.title')}
          </h1>
          <p className="text-lg text-muted-foreground">{t('home.subtitle')}</p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-background hover:shadow-xl"
            >
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                <GameCardIcon icon={game.icon} />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">{game.name}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`games.${game.id}.description`)}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
                {t('home.playCta')}
              </span>
            </Link>
          ))}
        </section>
      </main>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

'use client';

import Link from 'next/link';

import { SoundToggle } from '@/components/dice/SoundToggle';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export type Player = { id: string; name: string };

type PlayerBarProps = {
  players: Player[];
  currentPlayerId: string;
  backHref?: string;
  className?: string;
};

export function PlayerBar({ players, currentPlayerId, backHref = '/', className }: PlayerBarProps) {
  const { t } = useI18n();

  return (
    <div className={cn('flex items-center gap-2 bg-dice-main-primary/80 px-3 py-2', className)}>
      <Link
        href={backHref}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-dice-main-tertiary text-dice-tertiary-foreground hover:opacity-90"
        aria-label={t('common.back')}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {players.map((p) => (
        <button
          key={p.id}
          type="button"
          className={cn(
            'rounded-sm px-4 py-2 text-sm font-medium transition-colors',
            p.id === currentPlayerId
              ? 'bg-dice-main-tertiary text-dice-tertiary-foreground'
              : 'bg-dice-foreground/10 text-dice-foreground hover:bg-dice-foreground/20',
          )}
        >
          {p.name}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1">
        <SoundToggle />
        {/* <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-dice-foreground/10 text-dice-foreground hover:bg-dice-foreground/20"
          aria-label="Chat"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
        </button> */}
      </div>
    </div>
  );
}

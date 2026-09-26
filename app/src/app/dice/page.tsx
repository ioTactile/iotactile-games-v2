'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/I18nProvider';
import { getOrCreateGuestId } from '@/lib/auth/guest-id';
import {
  createDiceSession,
  getMyDiceSessions,
  getPublicDiceSessions,
  joinDiceSession,
  joinDiceSessionByCode,
} from '@/lib/dice/dice-api';
import { queryKeys } from '@/lib/query/query-keys';

export default function DiceLobbyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user, isInitialized } = useAuth();
  const [createName, setCreateName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createIsPublic, setCreateIsPublic] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const defaultDisplayName = user?.username ?? '';
  const guestId = accessToken ? undefined : getOrCreateGuestId();
  const { data: mySessions = [] } = useQuery({
    queryKey: queryKeys.dice.mySessions(guestId, accessToken ?? null),
    queryFn: async () => {
      const res = await getMyDiceSessions({
        guestId: guestId ?? null,
        accessToken: accessToken ?? null,
      });
      if (!res.ok) return [];
      return res.data;
    },
    enabled: isInitialized,
  });

  const { data: publicSessions = [] } = useQuery({
    queryKey: queryKeys.dice.publicSessions(),
    queryFn: async () => {
      const res = await getPublicDiceSessions();
      if (!res.ok) return [];
      return res.data;
    },
    enabled: isInitialized,
  });

  const mySessionIds = useMemo(() => new Set(mySessions.map((s) => s.id)), [mySessions]);
  const publicSessionsToShow = useMemo(
    () => publicSessions.filter((s) => !mySessionIds.has(s.id)),
    [publicSessions, mySessionIds],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = createName.trim();
    if (!name) {
      setError(t('dice.errorMissingName'));
      return;
    }
    const displayName = (createDisplayName || defaultDisplayName).trim();
    if (!displayName) {
      setError(t('dice.errorMissingDisplayName'));
      return;
    }
    setLoading('create');
    const result = await createDiceSession({
      name,
      isPublic: createIsPublic,
      displayName: displayName || undefined,
      guestId: accessToken ? undefined : getOrCreateGuestId(),
      accessToken: accessToken ?? null,
    });
    setLoading(null);
    if (result.ok) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dice.mySessions(guestId, accessToken ?? null),
      });
      if (createIsPublic) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.dice.publicSessions(),
        });
      }
      router.push(`/dice/${result.data.id}`);
    } else {
      setError(result.error);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const codeInput = joinCode.trim();
    if (!codeInput) {
      setError(t('dice.errorMissingCode'));
      return;
    }
    const displayName = (joinDisplayName || defaultDisplayName).trim();
    if (!displayName) {
      setError(t('dice.errorMissingDisplayName'));
      return;
    }
    setLoading('join');
    const isShortCode =
      codeInput.length >= 4 && codeInput.length <= 10 && /^[A-Za-z0-9]+$/.test(codeInput);
    const result = isShortCode
      ? await joinDiceSessionByCode({
          joinCode: codeInput,
          displayName: displayName || undefined,
          guestId: accessToken ? undefined : getOrCreateGuestId(),
          accessToken: accessToken ?? null,
        })
      : await joinDiceSession({
          sessionId: codeInput,
          displayName: displayName || undefined,
          guestId: accessToken ? undefined : getOrCreateGuestId(),
          accessToken: accessToken ?? null,
        });
    setLoading(null);
    if (result.ok) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dice.mySessions(guestId, accessToken ?? null),
      });
      const targetId = isShortCode && 'sessionId' in result ? result.sessionId : codeInput;
      router.push(`/dice/${targetId}`);
    } else {
      setError(result.error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dice-main-secondary">
        <p className="text-dice-foreground/80">{t('dice.loadingLobby')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-dice-main-secondary">
      <header className="bg-dice-main-primary/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-sm bg-dice-main-tertiary text-dice-tertiary-foreground hover:opacity-90"
            aria-label={t('common.back')}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-dice-foreground">{t('dice.title')}</h1>
          <LanguageSwitcher variant="dice" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <p className="text-center text-dice-foreground/90">{t('dice.intro')}</p>

        {publicSessionsToShow.length > 0 && (
          <section
            className="flex w-full max-w-sm flex-col gap-2 rounded-md bg-dice-main-primary/60 p-4"
            aria-label={t('dice.publicSessionsTitle')}
          >
            <h2 className="font-medium text-dice-foreground">{t('dice.publicSessionsTitle')}</h2>
            <p className="text-sm text-dice-foreground/70">{t('dice.publicSessionsDescription')}</p>
            <ul className="flex flex-col gap-2">
              {publicSessionsToShow.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setJoinCode(s.joinCode ?? '');
                      setError(null);
                      const joinForm = document.getElementById('join-form');
                      joinForm?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex w-full items-center justify-between rounded-sm border border-dice-foreground/20 bg-dice-foreground/10 px-3 py-2 text-left text-dice-foreground hover:bg-dice-foreground/20"
                  >
                    <span className="truncate font-medium">{s.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-dice-foreground/70">
                      {s.joinCode ?? '—'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mySessions.length > 0 && (
          <section
            className="flex w-full max-w-sm flex-col gap-2 rounded-md bg-dice-main-primary/60 p-4"
            aria-label={t('dice.mySessionsTitle')}
          >
            <h2 className="font-medium text-dice-foreground">{t('dice.mySessionsTitle')}</h2>
            <ul className="flex flex-col gap-2">
              {mySessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dice/${s.id}`}
                    className="flex items-center justify-between rounded-sm border border-dice-foreground/20 bg-dice-foreground/10 px-3 py-2 text-dice-foreground hover:bg-dice-foreground/20"
                  >
                    <span className="truncate font-medium">{s.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-dice-foreground/70">
                      {s.status === 'WAITING'
                        ? t('dice.statusWaiting')
                        : s.status === 'PLAYING'
                          ? t('dice.statusPlaying')
                          : s.status === 'FINISHED'
                            ? t('dice.statusFinished')
                            : s.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {error && (
          <div
            className="w-full max-w-sm rounded-sm border border-dice-error/50 bg-dice-error/20 px-4 py-2 text-center text-sm text-dice-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-6">
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 rounded-md bg-dice-main-primary/60 p-4"
          >
            <h2 className="font-medium text-dice-foreground">{t('dice.createSectionTitle')}</h2>
            <input
              type="text"
              placeholder={t('dice.createNamePlaceholder')}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="rounded-sm border border-dice-foreground/20 bg-dice-foreground/10 px-3 py-2 text-dice-foreground placeholder:text-dice-foreground/50"
              maxLength={100}
            />
            {!accessToken && (
              <input
                type="text"
                placeholder={t('dice.createDisplayNamePlaceholder')}
                value={createDisplayName}
                onChange={(e) => setCreateDisplayName(e.target.value)}
                className="rounded-sm border border-dice-foreground/20 bg-dice-foreground/10 px-3 py-2 text-dice-foreground placeholder:text-dice-foreground/50"
                maxLength={50}
              />
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-dice-foreground/90">
              <input
                type="checkbox"
                checked={createIsPublic}
                onChange={(e) => setCreateIsPublic(e.target.checked)}
                className="rounded-xs border-dice-foreground/30 bg-dice-foreground/10 text-dice-main-tertiary focus:ring-dice-main-tertiary"
              />
              {t('dice.createIsPublicLabel')}
            </label>
            <button
              type="submit"
              disabled={loading !== null}
              className="rounded-sm bg-dice-main-tertiary px-4 py-2 font-medium text-dice-tertiary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === 'create' ? t('dice.createSubmitLoading') : t('dice.createSubmitIdle')}
            </button>
          </form>

          <form
            id="join-form"
            onSubmit={handleJoin}
            className="flex flex-col gap-3 rounded-md bg-dice-main-primary/60 p-4"
          >
            <h2 className="font-medium text-dice-foreground">{t('dice.joinSectionTitle')}</h2>
            <p className="text-sm text-dice-foreground/70">{t('dice.joinHelp')}</p>
            <input
              type="text"
              placeholder={t('dice.joinCodePlaceholder')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="rounded-sm border border-dice-foreground/20 bg-dice-foreground/10 px-3 py-2 text-dice-foreground placeholder:text-dice-foreground/50"
            />
            {!accessToken && (
              <input
                type="text"
                placeholder={t('dice.joinDisplayNamePlaceholder')}
                value={joinDisplayName}
                onChange={(e) => setJoinDisplayName(e.target.value)}
                className="rounded-sm border border-dice-foreground/20 bg-dice-foreground/10 px-3 py-2 text-dice-foreground placeholder:text-dice-foreground/50"
                maxLength={50}
              />
            )}
            <button
              type="submit"
              disabled={loading !== null}
              className="rounded-sm bg-dice-main-tertiary px-4 py-2 font-medium text-dice-tertiary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading === 'join' ? t('dice.joinSubmitLoading') : t('dice.joinSubmitIdle')}
            </button>
          </form>
        </div>

        <Link href="/" className="text-sm text-dice-foreground/70 hover:text-dice-foreground">
          {t('dice.backToHome')}
        </Link>
      </main>
    </div>
  );
}

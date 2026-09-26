import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/hooks/use-auth';
import { I18nProvider } from '@/i18n/I18nProvider';
import { games } from '@/lib/games/games';

import Home from './page';

vi.mock('@/hooks/use-auth');

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      userLoading: false,
      userError: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: true,
      loginMutation: {} as never,
      registerMutation: {} as never,
      logoutMutation: {} as never,
    });
  });

  const renderWithI18n = () =>
    render(
      <I18nProvider>
        <Home />
      </I18nProvider>,
    );

  it('affiche le titre et la liste des jeux', () => {
    renderWithI18n();
    expect(screen.getByRole('heading', { name: /choisissez un jeu/i })).toBeInTheDocument();
    for (const game of games) {
      const link = screen.getByRole('link', { name: new RegExp(game.name, 'i') });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', game.href);
    }
  });

  it("affiche le bouton Se connecter quand l'utilisateur n'est pas connecté", () => {
    renderWithI18n();
    const buttons = screen.getAllByRole('button', { name: /se connecter/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    expect(buttons[0]).toBeInTheDocument();
  });

  it("affiche le menu utilisateur quand l'utilisateur est connecté", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'u1',
        email: 'u@test.com',
        username: 'TestUser',
        role: 'USER',
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
      userLoading: false,
      userError: null,
      accessToken: 'token',
      isAuthenticated: true,
      isInitialized: true,
      loginMutation: {} as never,
      registerMutation: {} as never,
      logoutMutation: {} as never,
    });
    renderWithI18n();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /déconnexion/i })).toBeInTheDocument();
  });
});

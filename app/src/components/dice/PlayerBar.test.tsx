import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import { PlayerBar } from './PlayerBar';

function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nProvider>
      <SoundProvider>{ui}</SoundProvider>
    </I18nProvider>,
  );
}

describe('PlayerBar', () => {
  afterEach(() => {
    cleanup();
  });

  it("affiche le lien retour avec l'href par défaut", () => {
    renderWithProviders(<PlayerBar players={[{ id: 'p1', name: 'Alice' }]} currentPlayerId="p1" />);
    const backLink = screen.getByRole('link', { name: /retour/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('affiche le lien retour avec backHref personnalisé', () => {
    renderWithProviders(
      <PlayerBar players={[{ id: 'p1', name: 'Joueur' }]} currentPlayerId="p1" backHref="/dice" />,
    );
    expect(screen.getByRole('link', { name: /retour/i })).toHaveAttribute('href', '/dice');
  });

  it('affiche les noms des joueurs', () => {
    renderWithProviders(
      <PlayerBar
        players={[
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
        ]}
        currentPlayerId="p1"
      />,
    );
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bob' })).toBeInTheDocument();
  });

  it('affiche le bouton de son (SoundToggle)', () => {
    renderWithProviders(<PlayerBar players={[{ id: 'p1', name: 'Alice' }]} currentPlayerId="p1" />);
    const soundButton = screen.getByRole('button', {
      name: /couper le son|activer le son/i,
    });
    expect(soundButton).toBeInTheDocument();
  });
});

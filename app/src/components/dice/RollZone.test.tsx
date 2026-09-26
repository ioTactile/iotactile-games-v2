import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import type { DiceState } from './DiceRow';
import { RollZone } from './RollZone';

function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nProvider>
      <SoundProvider>{ui}</SoundProvider>
    </I18nProvider>,
  );
}

const dicesWithFaces: DiceState[] = [
  { id: 1, face: 1, locked: false },
  { id: 2, face: 3, locked: false },
  { id: 3, face: 5, locked: true },
  { id: 4, face: 2, locked: false },
  { id: 5, face: 4, locked: false },
];

describe('RollZone', () => {
  afterEach(() => {
    cleanup();
  });

  it('a le rôle button et est cliquable quand onRoll est fourni et pas disabled', () => {
    vi.useFakeTimers();
    const onRoll = vi.fn();
    renderWithProviders(
      <RollZone
        rolling={false}
        dices={[{ id: 1, face: 1, locked: false }]}
        showDices={false}
        onRoll={onRoll}
        onRollEnd={() => {}}
      />,
    );
    const zone = screen.getByRole('button');
    expect(zone).toBeInTheDocument();
    fireEvent.click(zone);
    expect(onRoll).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(onRoll).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("n'a pas le rôle button quand onRoll n'est pas fourni et aucun dé affiché", () => {
    renderWithProviders(<RollZone rolling={false} dices={[]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('affiche les dés non verrouillés quand showDices et hasRolled', () => {
    renderWithProviders(
      <RollZone rolling={false} dices={dicesWithFaces} showDices onToggleLock={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /sélectionner le dé 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sélectionner le dé 3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sélectionner le dé 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sélectionner le dé 4/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sélectionner le dé 5/i })).not.toBeInTheDocument();
  });

  it("appelle onToggleLock avec l'index au clic sur un dé", () => {
    const onToggleLock = vi.fn();
    renderWithProviders(
      <RollZone rolling={false} dices={dicesWithFaces} showDices onToggleLock={onToggleLock} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /sélectionner le dé 3/i }));
    expect(onToggleLock).toHaveBeenCalledWith(1);
  });

  it('affiche une image de tasse quand rolling est true', () => {
    const { container } = renderWithProviders(<RollZone rolling dices={[]} />);
    const img = container.querySelector('img[alt=""]');
    expect(img).toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import { DiceRow, type DiceState } from './DiceRow';

function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nProvider>
      <SoundProvider>{ui}</SoundProvider>
    </I18nProvider>,
  );
}

const defaultDices: DiceState[] = [
  { id: 1, face: 1, locked: false },
  { id: 2, face: 4, locked: true },
  { id: 3, face: 6, locked: false },
];

describe('DiceRow', () => {
  afterEach(() => {
    cleanup();
  });

  it('affiche un bouton par dé avec face définie', () => {
    renderWithProviders(<DiceRow dices={defaultDices} onToggleLock={() => {}} />);
    expect(screen.getByRole('button', { name: /dé 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dé 4.*verrouillé/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dé 6/i })).toBeInTheDocument();
  });

  it("n'affiche pas de bouton pour les dés sans face", () => {
    const dices: DiceState[] = [
      { id: 1, face: undefined, locked: false },
      { id: 2, face: 2, locked: false },
    ];
    renderWithProviders(<DiceRow dices={dices} onToggleLock={() => {}} />);
    expect(screen.queryByRole('button', { name: /dé 1/i })).toBeNull();
    expect(screen.getByRole('button', { name: /dé 2/i })).toBeInTheDocument();
  });

  it("appelle onToggleLock avec l'index du dé au clic", () => {
    const onToggleLock = vi.fn();
    renderWithProviders(<DiceRow dices={defaultDices} onToggleLock={onToggleLock} />);
    fireEvent.click(screen.getByRole('button', { name: /dé 4.*verrouillé/i }));
    expect(onToggleLock).toHaveBeenCalledWith(1);
  });

  it('désactive les boutons quand disabled est true', () => {
    renderWithProviders(<DiceRow dices={defaultDices} onToggleLock={() => {}} disabled />);
    const diceButtons = screen.getAllByRole('button', { name: /dé \d/i });
    expect(diceButtons.length).toBe(3);
    for (const btn of diceButtons) {
      expect(btn).toBeDisabled();
    }
  });
});

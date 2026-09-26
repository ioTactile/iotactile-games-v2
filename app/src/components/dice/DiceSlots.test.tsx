import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import type { DiceState } from './DiceRow';
import { DiceSlots } from './DiceSlots';

function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nProvider>
      <SoundProvider>{ui}</SoundProvider>
    </I18nProvider>,
  );
}

const dices: DiceState[] = [
  { id: 1, face: 3, locked: true },
  { id: 2, face: 5, locked: true },
  { id: 3, face: 1, locked: false },
  { id: 4, face: 2, locked: false },
  { id: 5, face: 6, locked: false },
];

describe('DiceSlots', () => {
  afterEach(() => {
    cleanup();
  });

  it('affiche 5 emplacements (slots)', () => {
    const { container } = renderWithProviders(
      <DiceSlots dices={dices} lockedOrder={[0, 1, 2, 3, 4]} onUnlockSlot={() => {}} />,
    );
    const slots = container.querySelectorAll('[class*="size-16"]');
    expect(slots.length).toBe(5);
  });

  it('affiche un dé dans chaque slot quand showDices et locked', () => {
    renderWithProviders(
      <DiceSlots dices={dices} lockedOrder={[0, 1]} showDices onUnlockSlot={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /dé 3.*verrouillé/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dé 5.*verrouillé/i })).toBeInTheDocument();
  });

  it('appelle onUnlockSlot avec slotIndex et diceIndex au clic sur un dé', () => {
    const onUnlockSlot = vi.fn();
    renderWithProviders(
      <DiceSlots
        dices={dices}
        lockedOrder={[0, 1, 2, 3, 4]}
        showDices
        onUnlockSlot={onUnlockSlot}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /dé 3.*verrouillé/i }));
    expect(onUnlockSlot).toHaveBeenCalledWith(0, 0);
  });

  it('désactive les boutons des dés quand disabled est true', () => {
    renderWithProviders(
      <DiceSlots dices={dices} lockedOrder={[0, 1]} showDices onUnlockSlot={() => {}} disabled />,
    );
    const diceButtons = screen.getAllByRole('button', { name: /dé \d/i });
    expect(diceButtons.length).toBeGreaterThan(0);
    for (const btn of diceButtons) {
      expect(btn).toBeDisabled();
    }
  });
});

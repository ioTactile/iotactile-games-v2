import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import { DiceCup } from './DiceCup';

function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nProvider>
      <SoundProvider>{ui}</SoundProvider>
    </I18nProvider>,
  );
}

describe('DiceCup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('affiche le bouton de lancer avec le nombre de tentatives restantes', () => {
    renderWithProviders(<DiceCup onRoll={() => {}} triesLeft={3} />);
    const button = screen.getByRole('button', { name: /lancer les dés/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/lancer \(3 restants\)/i);
  });

  it('affiche « Choisir une ligne » quand triesLeft vaut 0', () => {
    renderWithProviders(<DiceCup onRoll={() => {}} triesLeft={0} />);
    const button = screen.getByRole('button', { name: /lancer les dés/i });
    expect(button).toHaveTextContent(/choisir une ligne/i);
  });

  it('désactive le bouton quand triesLeft vaut 0', () => {
    renderWithProviders(<DiceCup onRoll={() => {}} triesLeft={0} />);
    const button = screen.getByRole('button', { name: /lancer les dés/i });
    expect(button).toBeDisabled();
  });

  it('désactive le bouton quand disabled est true', () => {
    renderWithProviders(<DiceCup onRoll={() => {}} triesLeft={2} disabled />);
    const button = screen.getByRole('button', { name: /lancer les dés/i });
    expect(button).toBeDisabled();
  });

  it("appelle onRoll après le délai d'animation au clic", () => {
    const onRoll = vi.fn();
    renderWithProviders(<DiceCup onRoll={onRoll} triesLeft={2} />);
    const button = screen.getByRole('button', { name: /lancer les dés/i });
    fireEvent.click(button);
    expect(onRoll).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250 + 2500);
    expect(onRoll).toHaveBeenCalledTimes(1);
  });
});

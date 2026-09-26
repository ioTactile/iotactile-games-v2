import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import { RollButton } from './RollButton';

function renderWithProviders(ui: ReactElement) {
  return render(
    <I18nProvider>
      <SoundProvider>{ui}</SoundProvider>
    </I18nProvider>,
  );
}

describe('RollButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('affiche le bouton avec le nombre de tentatives restantes', () => {
    renderWithProviders(<RollButton onRoll={() => {}} triesLeft={3} />);
    const button = screen.getByRole('button', { name: /lancer.*3.*restants/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('désactive le bouton quand triesLeft vaut 0', () => {
    renderWithProviders(<RollButton onRoll={() => {}} triesLeft={0} />);
    const button = screen.getByRole('button', { name: /choisir une ligne/i });
    expect(button).toBeDisabled();
  });

  it('désactive le bouton quand rolling est true', () => {
    renderWithProviders(<RollButton onRoll={() => {}} triesLeft={2} rolling />);
    const button = screen.getByRole('button', { name: /lancer.*2.*restant/i });
    expect(button).toBeDisabled();
  });

  it('appelle onRoll après le délai au clic', () => {
    const onRoll = vi.fn();
    renderWithProviders(<RollButton onRoll={onRoll} triesLeft={2} />);
    const button = screen.getByRole('button', { name: /lancer.*2.*restant/i });
    fireEvent.click(button);
    expect(onRoll).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(onRoll).toHaveBeenCalledTimes(1);
  });
});

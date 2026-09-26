import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { SoundProvider } from '@/contexts/sound-context';
import { I18nProvider } from '@/i18n/I18nProvider';

import { SoundToggle } from './SoundToggle';

function renderWithProvider() {
  return render(
    <I18nProvider>
      <SoundProvider>
        <SoundToggle />
      </SoundProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  cleanup();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('dice-sound-muted');
  }
});

describe('SoundToggle', () => {
  it('affiche le bouton avec l’étiquette « Couper le son » quand le son est activé', () => {
    renderWithProvider();
    expect(screen.getByRole('button', { name: /couper le son/i })).toBeInTheDocument();
  });

  it('au clic, bascule vers « Activer le son » (son coupé)', () => {
    const { container } = renderWithProvider();
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    if (!button) return;
    expect(button).toHaveAttribute('aria-label', 'Couper le son');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-label', 'Activer le son');
  });

  it('un second clic réactive le son', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: /couper le son/i }));
    fireEvent.click(screen.getByRole('button', { name: /activer le son/i }));
    expect(screen.getByRole('button', { name: /couper le son/i })).toBeInTheDocument();
  });
});

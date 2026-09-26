import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/i18n/I18nProvider';

import { RulesModal } from './RulesModal';

function renderWithProvider(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('RulesModal', () => {
  it("n'affiche pas le dialogue quand open est false", () => {
    renderWithProvider(<RulesModal open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog', { name: /règles du jeu/i })).not.toBeInTheDocument();
  });

  it('affiche le dialogue des règles quand open est true', () => {
    renderWithProvider(<RulesModal open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: /règles du jeu/i })).toBeInTheDocument();
    expect(screen.getByText(/NOMBRE DE 1/)).toBeInTheDocument();
    expect(screen.getByText(/BRELAN/)).toBeInTheDocument();
    expect(screen.getByText(/BONUS \+35/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fermer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compris/i })).toBeInTheDocument();
  });

  it('appelle onClose au clic sur le bouton X', () => {
    const onClose = vi.fn();
    renderWithProvider(<RulesModal open onClose={onClose} />);
    const closeButtons = screen.getAllByRole('button', {
      name: /fermer/i,
    });
    const lastCloseButton = closeButtons[closeButtons.length - 1];
    expect(lastCloseButton).toBeDefined();
    if (lastCloseButton) fireEvent.click(lastCloseButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose au clic sur COMPRIS !', () => {
    const onClose = vi.fn();
    renderWithProvider(<RulesModal open onClose={onClose} />);
    const comprisButtons = screen.getAllByRole('button', { name: /compris/i });
    const lastComprisButton = comprisButtons[comprisButtons.length - 1];
    expect(lastComprisButton).toBeDefined();
    if (lastComprisButton) fireEvent.click(lastComprisButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('affiche un overlay quand la modale est ouverte', () => {
    renderWithProvider(<RulesModal open onClose={() => {}} />);
    const overlays = document.querySelectorAll('[data-slot="dialog-overlay"]');
    expect(overlays.length).toBeGreaterThan(0);
  });

  it('ferme au clé Escape quand la modale est ouverte', () => {
    const onClose = vi.fn();
    renderWithProvider(<RulesModal open onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: /règles du jeu/i });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

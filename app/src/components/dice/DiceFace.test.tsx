import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/i18n/I18nProvider';

import { DiceFace } from './DiceFace';

function renderWithProvider(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('DiceFace', () => {
  it("affiche un bouton avec l'aria-label pour la face et l'état verrouillé", () => {
    renderWithProvider(<DiceFace face={3} locked={false} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /dé 3/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('affiche aria-pressed true quand le dé est verrouillé', () => {
    renderWithProvider(<DiceFace face={5} locked onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /dé 5.*verrouillé/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('appelle onClick au clic', () => {
    const onClick = vi.fn();
    renderWithProvider(<DiceFace face={1} locked={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /dé 1/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('désactive le bouton quand disabled est true', () => {
    renderWithProvider(<DiceFace face={2} locked={false} onClick={() => {}} disabled />);
    expect(screen.getByRole('button', { name: /dé 2/i })).toBeDisabled();
  });
});

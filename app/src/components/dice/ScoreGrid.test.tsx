import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/i18n/I18nProvider';

import { ScoreGrid } from './ScoreGrid';

function renderWithProvider(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('ScoreGrid', () => {
  it('affiche un bouton ? pour ouvrir les règles et ouvre la modale au clic', () => {
    renderWithProvider(
      <ScoreGrid
        players={[{ id: 'p1', name: 'Alice' }]}
        currentPlayerId="p1"
        scoresByPlayer={{}}
        dices={[]}
        onChooseScore={() => {}}
        canChoose={false}
      />,
    );
    const rulesButton = screen.getByRole('button', {
      name: /voir les règles du jeu/i,
    });
    expect(rulesButton).toHaveTextContent('?');
    fireEvent.click(rulesButton);
    expect(screen.getByRole('dialog', { name: /règles du jeu/i })).toBeInTheDocument();
  });

  it("n'affiche pas de propositions de score quand aucun dé n'a encore été lancé", () => {
    renderWithProvider(
      <ScoreGrid
        players={[{ id: 'p1', name: 'Alice' }]}
        currentPlayerId="p1"
        scoresByPlayer={{}}
        // Simulate pre-roll state: parent passes an empty array
        dices={[]}
        onChooseScore={() => {}}
        canChoose
      />,
    );

    // Assert at least one score cell shows "—" (no proposed value) for the current player.
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThan(0);
  });
});

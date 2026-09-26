import { describe, expect, it } from 'vitest';

import { games } from './games';

describe('games', () => {
  it('expose un tableau non vide de jeux', () => {
    expect(Array.isArray(games)).toBe(true);
    expect(games.length).toBeGreaterThan(0);
  });

  it('chaque entrée a id, name, href et optionnellement icon', () => {
    for (const game of games) {
      expect(game).toHaveProperty('id', expect.any(String));
      expect(game).toHaveProperty('name', expect.any(String));
      expect(game).toHaveProperty('href', expect.any(String));
      expect(game.id.length).toBeGreaterThan(0);
      expect(game.name.length).toBeGreaterThan(0);
      expect(game.href.startsWith('/')).toBe(true);
    }
  });

  it('contient le jeu Dice avec href /dice', () => {
    const dice = games.find((g) => g.id === 'dice');
    expect(dice).toBeDefined();
    expect(dice?.name).toBe('Dice');
    expect(dice?.href).toBe('/dice');
  });
});

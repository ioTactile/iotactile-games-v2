import { describe, expect, it } from 'vitest';

import type { DiceSessionViewDto } from '@/types/dice';

import {
  isGameOver,
  viewToCurrentPlayerId,
  viewToDices,
  viewToPlayers,
  viewToScoresByPlayer,
  viewToTriesLeft,
} from './dice-view-mappers';

function minimalView(overrides: Partial<DiceSessionViewDto> = {}): DiceSessionViewDto {
  return {
    session: {
      id: 's1',
      name: 'Partie',
      status: 'PLAYING',
      createdAt: '',
      updatedAt: '',
    },
    players: [
      {
        id: 'p1',
        sessionId: 's1',
        slot: 0,
        userId: null,
        guestId: 'g1',
        displayName: 'Alice',
        orderIndex: 0,
        createdAt: '',
      },
      {
        id: 'p2',
        sessionId: 's1',
        slot: 1,
        userId: null,
        guestId: null,
        displayName: 'Bob',
        orderIndex: 1,
        createdAt: '',
      },
    ],
    state: {
      id: 'st1',
      sessionId: 's1',
      currentPlayerSlot: 0,
      remainingTurns: 5,
      dices: [
        { face: 1, locked: false },
        { face: 3, locked: true },
        { face: 5, locked: false },
      ],
      triesLeft: 2,
      scores: {
        0: {
          one: 3,
          two: null,
          three: null,
          four: null,
          five: null,
          six: null,
          bonus: 0,
          threeOfAKind: null,
          fourOfAKind: null,
          fullHouse: null,
          smallStraight: null,
          largeStraight: null,
          dice: null,
          chance: null,
          total: 3,
        },
      },
      updatedAt: '',
    },
    ...overrides,
  };
}

describe('dice-view-mappers', () => {
  describe('viewToPlayers', () => {
    it('retourne les joueurs triés par orderIndex avec id et name', () => {
      const view = minimalView();
      const players = viewToPlayers(view);
      expect(players).toEqual([
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ]);
    });
  });

  describe('viewToCurrentPlayerId', () => {
    it("retourne l'id du joueur dont le slot correspond à currentPlayerSlot", () => {
      const view = minimalView();
      expect(viewToCurrentPlayerId(view)).toBe('p1');
    });

    it('retourne le premier joueur si state est null', () => {
      const view = minimalView({ state: null });
      expect(viewToCurrentPlayerId(view)).toBe('p1');
    });
  });

  describe('viewToDices', () => {
    it('retourne les dés avec id (index), face et locked', () => {
      const view = minimalView();
      const dices = viewToDices(view);
      expect(dices).toEqual([
        { id: 0, face: 1, locked: false },
        { id: 1, face: 3, locked: true },
        { id: 2, face: 5, locked: false },
      ]);
    });

    it('retourne un tableau vide si state est null', () => {
      const view = minimalView({ state: null });
      expect(viewToDices(view)).toEqual([]);
    });
  });

  describe('viewToScoresByPlayer', () => {
    it('retourne les scores par id joueur', () => {
      const view = minimalView();
      const scores = viewToScoresByPlayer(view);
      expect(scores['p1']).toEqual(expect.objectContaining({ one: 3, two: null }));
      expect(scores['p2']).toBeUndefined();
    });

    it('retourne un objet vide si state est null', () => {
      const view = minimalView({ state: null });
      expect(viewToScoresByPlayer(view)).toEqual({});
    });
  });

  describe('viewToTriesLeft', () => {
    it('retourne triesLeft du state ou 3 par défaut', () => {
      const view = minimalView();
      expect(viewToTriesLeft(view)).toBe(2);
    });

    it('retourne 3 si state est null', () => {
      const view = minimalView({ state: null });
      expect(viewToTriesLeft(view)).toBe(3);
    });
  });

  describe('isGameOver', () => {
    it('retourne true si session.status est FINISHED', () => {
      const view = minimalView({
        session: {
          ...minimalView().session,
          status: 'FINISHED',
        },
      });
      expect(isGameOver(view)).toBe(true);
    });

    it('retourne true si remainingTurns <= 0', () => {
      const base = minimalView();
      const state = base.state;
      const view = minimalView({
        state: state ? { ...state, remainingTurns: 0 } : null,
      });
      expect(isGameOver(view)).toBe(true);
    });

    it('retourne false si PLAYING et remainingTurns > 0', () => {
      const view = minimalView();
      expect(isGameOver(view)).toBe(false);
    });
  });
});

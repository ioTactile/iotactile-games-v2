import { describe, expect, it } from 'vitest';

import {
  computeBonus,
  computeScore,
  computeTotal,
  type DiceFaceInput,
  SCORE_KEYS,
} from './dice-scores';

const five = (faces: number[]): DiceFaceInput[] => faces.map((face) => ({ face }));

describe('dice-scores', () => {
  describe('computeScore', () => {
    it('retourne 0 si pas exactement 5 dés', () => {
      expect(computeScore('one', [])).toBe(0);
      expect(computeScore('one', five([1, 2, 3, 4]))).toBe(0);
      expect(computeScore('one', five([1, 2, 3, 4, 5, 6]))).toBe(0);
    });

    it('calcule les lignes 1-6 (somme des faces correspondantes)', () => {
      expect(computeScore('one', five([1, 1, 2, 3, 4]))).toBe(2);
      expect(computeScore('two', five([2, 2, 2, 1, 1]))).toBe(6);
      expect(computeScore('six', five([6, 6, 6, 6, 6]))).toBe(30);
    });

    it('brelan : 3+ identiques donne la somme des 5 dés', () => {
      expect(computeScore('threeOfAKind', five([3, 3, 3, 1, 2]))).toBe(12);
      expect(computeScore('threeOfAKind', five([1, 2, 3, 4, 5]))).toBe(0);
    });

    it('carré : 4+ identiques donne la somme des 5 dés', () => {
      expect(computeScore('fourOfAKind', five([4, 4, 4, 4, 1]))).toBe(17);
      expect(computeScore('fourOfAKind', five([1, 2, 3, 4, 5]))).toBe(0);
    });

    it('full : 3+2 donne 25, sinon 0', () => {
      expect(computeScore('fullHouse', five([2, 2, 2, 5, 5]))).toBe(25);
      expect(computeScore('fullHouse', five([1, 1, 2, 2, 3]))).toBe(0);
      expect(computeScore('fullHouse', five([4, 4, 4, 4, 4]))).toBe(0);
    });

    it('petite suite (1-2-3-4 ou 2-3-4-5 ou 3-4-5-6) donne 30', () => {
      expect(computeScore('smallStraight', five([1, 2, 3, 4, 6]))).toBe(30);
      expect(computeScore('smallStraight', five([2, 3, 4, 5, 5]))).toBe(30);
      expect(computeScore('smallStraight', five([3, 4, 5, 6, 6]))).toBe(30);
      expect(computeScore('smallStraight', five([1, 2, 4, 5, 6]))).toBe(0);
    });

    it('grande suite (1-2-3-4-5 ou 2-3-4-5-6) donne 40', () => {
      expect(computeScore('largeStraight', five([1, 2, 3, 4, 5]))).toBe(40);
      expect(computeScore('largeStraight', five([2, 3, 4, 5, 6]))).toBe(40);
      expect(computeScore('largeStraight', five([1, 2, 3, 4, 6]))).toBe(0);
    });

    it('dice (yahtzee) : 5 identiques donne 50', () => {
      expect(computeScore('dice', five([5, 5, 5, 5, 5]))).toBe(50);
      expect(computeScore('dice', five([1, 1, 1, 1, 2]))).toBe(0);
    });

    it('chance : somme des 5 dés', () => {
      expect(computeScore('chance', five([1, 2, 3, 4, 5]))).toBe(15);
    });
  });

  describe('computeBonus', () => {
    it('retourne 35 si la somme des lignes 1-6 >= 63', () => {
      expect(
        computeBonus({
          one: 5,
          two: 10,
          three: 15,
          four: 20,
          five: 25,
          six: 30,
        }),
      ).toBe(35);
      expect(computeBonus({ one: 63 })).toBe(35);
    });

    it('retourne 0 si la somme des lignes 1-6 < 63', () => {
      expect(computeBonus({ one: 0, two: 0, three: 0, four: 0, five: 0, six: 0 })).toBe(0);
      expect(computeBonus({})).toBe(0);
    });
  });

  describe('computeTotal', () => {
    it('somme upper + bonus (si >= 63) + lower', () => {
      const scores = {
        one: 3,
        two: 6,
        three: 9,
        four: 12,
        five: 15,
        six: 18,
        threeOfAKind: 20,
        chance: 15,
      };
      const total = computeTotal(scores);
      expect(total).toBe(63 + 35 + 20 + 15);
    });
  });

  describe('SCORE_KEYS', () => {
    it('contient les 13 clés de score', () => {
      expect(SCORE_KEYS).toHaveLength(13);
      expect(SCORE_KEYS).toContain('one');
      expect(SCORE_KEYS).toContain('chance');
    });
  });
});

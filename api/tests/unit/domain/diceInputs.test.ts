import { describe, expect, it } from 'vitest';
import { computeBonusAndTotal, computeScoreFor, SCORE_KEYS } from '@/domain/dice/diceInputs.ts';

const fiveDices = (faces: number[]) => faces.map((face) => ({ face, locked: false }));

describe('diceInputs', () => {
  describe('SCORE_KEYS', () => {
    it('contient les 13 clés de score attendues', () => {
      expect(SCORE_KEYS).toHaveLength(13);
      expect(SCORE_KEYS).toContain('one');
      expect(SCORE_KEYS).toContain('six');
      expect(SCORE_KEYS).toContain('threeOfAKind');
      expect(SCORE_KEYS).toContain('fullHouse');
      expect(SCORE_KEYS).toContain('chance');
      expect(SCORE_KEYS).toContain('dice');
    });
  });

  describe('computeScoreFor', () => {
    it('one: somme des 1', () => {
      expect(computeScoreFor('one', fiveDices([1, 1, 2, 3, 4]))).toBe(2);
      expect(computeScoreFor('one', fiveDices([1, 1, 1, 1, 1]))).toBe(5);
      expect(computeScoreFor('one', fiveDices([2, 3, 4, 5, 6]))).toBe(0);
    });

    it('two à six: somme des faces correspondantes', () => {
      expect(computeScoreFor('two', fiveDices([2, 2, 2, 1, 1]))).toBe(6);
      expect(computeScoreFor('six', fiveDices([6, 6, 6, 6, 5]))).toBe(24);
    });

    it('threeOfAKind: somme des 5 dés si au moins 3 identiques', () => {
      expect(computeScoreFor('threeOfAKind', fiveDices([3, 3, 3, 1, 2]))).toBe(12);
      expect(computeScoreFor('threeOfAKind', fiveDices([1, 2, 3, 4, 5]))).toBe(0);
    });

    it('fourOfAKind: somme des 5 dés si au moins 4 identiques', () => {
      expect(computeScoreFor('fourOfAKind', fiveDices([4, 4, 4, 4, 1]))).toBe(17);
      expect(computeScoreFor('fourOfAKind', fiveDices([1, 1, 1, 2, 3]))).toBe(0);
    });

    it('fullHouse: 25 si 3+2 identiques, 0 sinon', () => {
      expect(computeScoreFor('fullHouse', fiveDices([2, 2, 2, 5, 5]))).toBe(25);
      expect(computeScoreFor('fullHouse', fiveDices([1, 1, 1, 1, 1]))).toBe(0);
      expect(computeScoreFor('fullHouse', fiveDices([1, 2, 3, 4, 5]))).toBe(0);
    });

    it('smallStraight: 30 si séquence de 4', () => {
      expect(computeScoreFor('smallStraight', fiveDices([1, 2, 3, 4, 6]))).toBe(30);
      expect(computeScoreFor('smallStraight', fiveDices([2, 3, 4, 5, 6]))).toBe(30);
      expect(computeScoreFor('smallStraight', fiveDices([1, 3, 4, 5, 6]))).toBe(30);
    });

    it('largeStraight: 40 si 1-2-3-4-5 ou 2-3-4-5-6', () => {
      expect(computeScoreFor('largeStraight', fiveDices([1, 2, 3, 4, 5]))).toBe(40);
      expect(computeScoreFor('largeStraight', fiveDices([2, 3, 4, 5, 6]))).toBe(40);
      expect(computeScoreFor('largeStraight', fiveDices([1, 2, 3, 4, 6]))).toBe(0);
    });

    it('chance: somme des 5 dés', () => {
      expect(computeScoreFor('chance', fiveDices([1, 2, 3, 4, 5]))).toBe(15);
    });

    it('dice (Yams): 50 si 5 identiques, 0 sinon', () => {
      expect(computeScoreFor('dice', fiveDices([5, 5, 5, 5, 5]))).toBe(50);
      expect(computeScoreFor('dice', fiveDices([1, 1, 1, 1, 2]))).toBe(0);
    });

    it('retourne 0 si tableau de dés invalide (pas 5 dés)', () => {
      expect(computeScoreFor('one', [])).toBe(0);
      expect(computeScoreFor('one', fiveDices([1, 2, 3]))).toBe(0);
    });
  });

  describe('computeBonusAndTotal', () => {
    it('bonus 0 si section haute < 63', () => {
      const scores = {
        one: 2,
        two: 4,
        three: 6,
        four: 8,
        five: 10,
        six: 12,
        bonus: 0,
        threeOfAKind: null,
        fourOfAKind: null,
        fullHouse: null,
        smallStraight: null,
        largeStraight: null,
        chance: null,
        dice: null,
        total: 0,
      };
      const { bonus, total } = computeBonusAndTotal(scores);
      expect(bonus).toBe(0);
      expect(total).toBe(42);
    });

    it('bonus 35 si section haute >= 63', () => {
      const scores = {
        one: 3,
        two: 6,
        three: 9,
        four: 12,
        five: 15,
        six: 18,
        bonus: 0,
        threeOfAKind: 20,
        fourOfAKind: null,
        fullHouse: null,
        smallStraight: null,
        largeStraight: null,
        chance: null,
        dice: null,
        total: 0,
      };
      const { bonus, total } = computeBonusAndTotal(scores);
      expect(bonus).toBe(35);
      expect(total).toBe(63 + 35 + 20);
    });

    it('total = section haute + bonus + section basse', () => {
      const scores = {
        one: 5,
        two: 10,
        three: 15,
        four: 20,
        five: 25,
        six: 30,
        bonus: 35,
        threeOfAKind: 18,
        fourOfAKind: null,
        fullHouse: null,
        smallStraight: null,
        largeStraight: null,
        chance: null,
        dice: null,
        total: 0,
      };
      const { bonus, total } = computeBonusAndTotal(scores);
      expect(bonus).toBe(35);
      const upper = 5 + 10 + 15 + 20 + 25 + 30;
      expect(total).toBe(upper + bonus + 18);
    });
  });
});

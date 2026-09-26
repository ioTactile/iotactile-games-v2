import { describe, expect, it } from 'vitest';
import {
  createDiceSessionBodySchema,
  diceSessionIdParamsSchema,
  joinByCodeBodySchema,
  joinDiceSessionBodySchema,
  listMyDiceSessionsQuerySchema,
} from '@/adapters/primary/http/schemas/dice.schemas.ts';

describe('dice.schemas', () => {
  describe('createDiceSessionBodySchema', () => {
    it('valide un body correct avec name et displayName', () => {
      const result = createDiceSessionBodySchema.safeParse({
        name: 'Ma partie',
        displayName: 'Alice',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Ma partie');
        expect(result.data.displayName).toBe('Alice');
        expect(result.data.isPublic).toBeUndefined();
        expect(result.data.guestId).toBeUndefined();
      }
    });

    it('accepte isPublic et guestId optionnels', () => {
      const result = createDiceSessionBodySchema.safeParse({
        name: 'Partie',
        displayName: 'Bob',
        isPublic: true,
        guestId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
        expect(result.data.guestId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('rejette un name vide', () => {
      const result = createDiceSessionBodySchema.safeParse({
        name: '',
        displayName: 'Alice',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un name trop long (> 100)', () => {
      const result = createDiceSessionBodySchema.safeParse({
        name: 'a'.repeat(101),
        displayName: 'Alice',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un guestId non UUID', () => {
      const result = createDiceSessionBodySchema.safeParse({
        name: 'Partie',
        displayName: 'Alice',
        guestId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('joinDiceSessionBodySchema', () => {
    it('valide displayName et guestId optionnels', () => {
      const result = joinDiceSessionBodySchema.safeParse({
        displayName: 'Alice',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe('Alice');
      }
    });

    it('rejette displayName trop long (> 50)', () => {
      const result = joinDiceSessionBodySchema.safeParse({
        displayName: 'a'.repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('joinByCodeBodySchema', () => {
    it('valide joinCode et displayName optionnel', () => {
      const result = joinByCodeBodySchema.safeParse({
        joinCode: 'ABC123',
        displayName: 'Bob',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.joinCode).toBe('ABC123');
        expect(result.data.displayName).toBe('Bob');
      }
    });

    it('rejette joinCode vide', () => {
      const result = joinByCodeBodySchema.safeParse({
        joinCode: '',
        displayName: 'Alice',
      });
      expect(result.success).toBe(false);
    });

    it('rejette joinCode trop long (> 10)', () => {
      const result = joinByCodeBodySchema.safeParse({
        joinCode: 'a'.repeat(11),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('diceSessionIdParamsSchema', () => {
    it('valide un sessionId UUID', () => {
      const result = diceSessionIdParamsSchema.safeParse({
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('rejette un sessionId non UUID', () => {
      const result = diceSessionIdParamsSchema.safeParse({
        sessionId: 'not-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listMyDiceSessionsQuerySchema', () => {
    it('valide une query vide (guestId optionnel)', () => {
      const result = listMyDiceSessionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('valide guestId UUID optionnel', () => {
      const result = listMyDiceSessionsQuerySchema.safeParse({
        guestId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guestId).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('rejette guestId non UUID', () => {
      const result = listMyDiceSessionsQuerySchema.safeParse({
        guestId: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});

import { z } from 'zod';

export const createDiceSessionBodySchema = z.object({
  name: z.string().min(1).max(100),
  isPublic: z.boolean().optional(),
  displayName: z.string().min(1).max(50).optional(),
  guestId: z.uuid().optional(),
});

export const joinDiceSessionBodySchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  guestId: z.uuid().optional(),
});

export const joinByCodeBodySchema = z.object({
  joinCode: z.string().min(1).max(10),
  displayName: z.string().min(1).max(50).optional(),
  guestId: z.uuid().optional(),
});

export const diceSessionIdParamsSchema = z.object({
  sessionId: z.uuid(),
});

export const listMyDiceSessionsQuerySchema = z.object({
  guestId: z.uuid().optional(),
});

export type CreateDiceSessionBody = z.infer<typeof createDiceSessionBodySchema>;
export type JoinDiceSessionBody = z.infer<typeof joinDiceSessionBodySchema>;
export type JoinByCodeBody = z.infer<typeof joinByCodeBodySchema>;
export type DiceSessionIdParams = z.infer<typeof diceSessionIdParamsSchema>;
export type ListMyDiceSessionsQuery = z.infer<typeof listMyDiceSessionsQuerySchema>;

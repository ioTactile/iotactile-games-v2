import { Result } from 'typescript-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateDiceSessionUsecase } from '@/application/command/usecases/dice/create-dice-session.usecase.ts';
import type { DiceSessionRepository } from '@/domain/dice/dice.repository.ts';
import type { DiceSessionType } from '@/domain/dice/dice.type.ts';

function createSession(overrides: Partial<DiceSessionType> = {}): DiceSessionType {
  return {
    id: 'session-1',
    name: 'Ma partie',
    joinCode: 'ABC123',
    isPublic: true,
    status: 'WAITING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CreateDiceSessionUsecase', () => {
  let sessionRepo: DiceSessionRepository;

  beforeEach(() => {
    sessionRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByJoinCode: vi.fn(),
      findPublicWaiting: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('retourne DISPLAY_NAME_REQUIRED si displayName vide', async () => {
    const usecase = new CreateDiceSessionUsecase(sessionRepo);
    const result = await usecase.execute({
      name: 'Partie',
      userId: 'user-1',
      guestId: null,
      displayName: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DISPLAY_NAME_REQUIRED');
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  it('retourne DISPLAY_NAME_REQUIRED si displayName uniquement espaces', async () => {
    const usecase = new CreateDiceSessionUsecase(sessionRepo);
    const result = await usecase.execute({
      name: 'Partie',
      userId: 'user-1',
      guestId: null,
      displayName: '   ',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('DISPLAY_NAME_REQUIRED');
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  it('retourne USER_OR_GUEST_REQUIRED si ni userId ni guestId', async () => {
    const usecase = new CreateDiceSessionUsecase(sessionRepo);
    const result = await usecase.execute({
      name: 'Partie',
      userId: null,
      guestId: null,
      displayName: 'Alice',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('USER_OR_GUEST_REQUIRED');
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  it('crée la session avec name trimé et isPublic optionnel', async () => {
    const session = createSession({ name: 'Ma partie', isPublic: false });
    vi.mocked(sessionRepo.create).mockResolvedValue(Result.ok(session));

    const usecase = new CreateDiceSessionUsecase(sessionRepo);
    const result = await usecase.execute({
      name: '  Ma partie  ',
      isPublic: false,
      userId: 'user-1',
      guestId: null,
      displayName: ' Alice ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Ma partie');
      expect(result.value.isPublic).toBe(false);
    }
    expect(sessionRepo.create).toHaveBeenCalledWith({
      name: 'Ma partie',
      isPublic: false,
      createdBy: {
        userId: 'user-1',
        guestId: null,
        displayName: 'Alice',
      },
    });
  });

  it('utilise isPublic false par défaut si non fourni', async () => {
    const session = createSession();
    vi.mocked(sessionRepo.create).mockResolvedValue(Result.ok(session));

    const usecase = new CreateDiceSessionUsecase(sessionRepo);
    await usecase.execute({
      name: 'Partie',
      userId: null,
      guestId: 'guest-1',
      displayName: 'Bob',
    });

    expect(sessionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ isPublic: false }));
  });

  it("propage l'erreur si create échoue", async () => {
    vi.mocked(sessionRepo.create).mockResolvedValue(Result.error(new Error('CREATE_FAILED')));

    const usecase = new CreateDiceSessionUsecase(sessionRepo);
    const result = await usecase.execute({
      name: 'Partie',
      userId: 'user-1',
      guestId: null,
      displayName: 'Alice',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('CREATE_FAILED');
  });
});

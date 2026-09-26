'use client';

import { useCallback, useEffect, useRef } from 'react';

import { DICE_ASSETS } from '@/constants/assets.constant';
import { useSound } from '@/contexts/sound-context';

/**
 * Hook to play dice sounds. No-ops when muted.
 */
export function useDiceSounds() {
  const { muted } = useSound();
  const rollDiceRef = useRef<HTMLAudioElement | null>(null);
  const shakeAndRollRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    rollDiceRef.current = new Audio(DICE_ASSETS.ROLL_DICE);
    shakeAndRollRef.current = new Audio(DICE_ASSETS.SHAKE_AND_ROLL);
    shakeAndRollRef.current.load();
    rollDiceRef.current.load();
    return () => {
      rollDiceRef.current = null;
      shakeAndRollRef.current = null;
    };
  }, []);

  const playRollDice = useCallback(() => {
    if (muted || typeof window === 'undefined' || !rollDiceRef.current) return;
    rollDiceRef.current.currentTime = 0;
    const p = rollDiceRef.current.play();
    if (typeof p?.catch === 'function') p.catch(() => {});
  }, [muted]);

  const playShakeAndRoll = useCallback(() => {
    if (muted || typeof window === 'undefined' || !shakeAndRollRef.current) return;
    shakeAndRollRef.current.currentTime = 0;
    const p = shakeAndRollRef.current.play();
    if (typeof p?.catch === 'function') p.catch(() => {});
  }, [muted]);

  const stopShakeAndRoll = useCallback(() => {
    if (shakeAndRollRef.current) {
      shakeAndRollRef.current.pause();
      shakeAndRollRef.current.currentTime = 0;
    }
  }, []);

  return { playRollDice, playShakeAndRoll, stopShakeAndRoll };
}

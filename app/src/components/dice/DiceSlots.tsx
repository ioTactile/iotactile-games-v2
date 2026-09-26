'use client';

import { useDiceSounds } from '@/hooks/use-dice-sounds';

import { DiceFace } from './DiceFace';
import type { DiceState } from './DiceRow';

const SLOT_KEYS = ['slot-0', 'slot-1', 'slot-2', 'slot-3', 'slot-4'] as const;

type DiceSlotsProps = {
  dices: DiceState[];
  lockedOrder: number[];
  showDices?: boolean;
  onUnlockSlot: (slotIndex: number, diceIndex: number) => void;
  disabled?: boolean;
  useWhiteTheme?: boolean;
};

export function DiceSlots({
  dices,
  lockedOrder,
  showDices = true,
  onUnlockSlot,
  disabled = false,
  useWhiteTheme = true,
}: DiceSlotsProps) {
  const { playRollDice } = useDiceSounds();

  const handleClick = (slotIndex: number, diceIndex: number) => {
    onUnlockSlot(slotIndex, diceIndex);
    playRollDice();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {SLOT_KEYS.map((slotKey, slotIndex) => {
        const diceIndex = lockedOrder[slotIndex];
        const d = diceIndex !== undefined ? dices[diceIndex] : undefined;
        const isSelected = showDices && d?.locked && d?.face !== undefined;
        return (
          <div
            key={slotKey}
            className="flex size-16 shrink-0 items-center justify-center rounded-md border-2 border-dice-foreground/20 bg-dice-foreground/10 sm:size-18"
          >
            {isSelected && d && d.face !== undefined ? (
              <DiceFace
                face={d.face}
                locked
                onClick={() => diceIndex !== undefined && handleClick(slotIndex, diceIndex)}
                disabled={disabled}
                useWhite={useWhiteTheme}
                size="md"
              />
            ) : (
              <div className="size-12 rounded-sm bg-dice-foreground/5 sm:size-14" />
            )}
          </div>
        );
      })}
    </div>
  );
}

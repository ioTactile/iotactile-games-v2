'use client';

import { useDiceSounds } from '@/hooks/use-dice-sounds';

import { DiceFace } from './DiceFace';

export type DiceState = {
  id: number;
  face: number | undefined;
  locked: boolean;
};

type DiceRowProps = {
  dices: DiceState[];
  onToggleLock: (index: number) => void;
  disabled?: boolean;
  useWhiteTheme?: boolean;
};

export function DiceRow({
  dices,
  onToggleLock,
  disabled = false,
  useWhiteTheme = false,
}: DiceRowProps) {
  const { playRollDice } = useDiceSounds();

  const handleClick = (index: number) => {
    onToggleLock(index);
    playRollDice();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {dices.map(
        (d, i) =>
          d.face !== undefined && (
            <DiceFace
              key={d.id}
              face={d.face}
              locked={d.locked}
              onClick={() => handleClick(i)}
              disabled={disabled}
              useWhite={useWhiteTheme}
              size="md"
            />
          ),
      )}
    </div>
  );
}

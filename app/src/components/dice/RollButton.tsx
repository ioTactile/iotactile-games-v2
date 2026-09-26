'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';

import { DICE_ASSETS } from '@/constants/assets.constant';
import { ANIMATION_DURATION_MS, SOUND_LEAD_MS } from '@/constants/dice.constant';
import { useDiceSounds } from '@/hooks/use-dice-sounds';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

type RollButtonProps = {
  onRoll: () => void;
  disabled?: boolean;
  triesLeft: number;
  rolling?: boolean;
  className?: string;
};

export function RollButton({
  onRoll,
  disabled = false,
  triesLeft,
  rolling = false,
  className,
}: RollButtonProps) {
  const { t } = useI18n();

  const [shaking, setShaking] = useState(false);
  const { playShakeAndRoll, stopShakeAndRoll } = useDiceSounds();

  const handleClick = useCallback(() => {
    if (disabled || shaking || rolling || triesLeft <= 0) return;
    playShakeAndRoll();
    setTimeout(() => {
      setShaking(true);
      onRoll();
    }, SOUND_LEAD_MS);
    setTimeout(() => {
      setShaking(false);
      stopShakeAndRoll();
    }, SOUND_LEAD_MS + ANIMATION_DURATION_MS);
  }, [disabled, shaking, rolling, triesLeft, onRoll, playShakeAndRoll, stopShakeAndRoll]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || shaking || rolling || triesLeft <= 0}
      aria-label={t('dice.rollDiceButtonLabel', triesLeft)}
      className={cn(
        'relative flex h-14 w-20 ml-auto sm:ml-0 shrink-0 tems-center justify-center rounded-sm bg-dice-main-tertiary text-dice-tertiary-foreground shadow-lg transition-opacity hover:opacity-95 disabled:opacity-50 sm:h-16 sm:w-24',
        className,
      )}
    >
      <Image
        src={DICE_ASSETS.CUP}
        alt="Tasse"
        width={48}
        height={42}
        className="h-8 w-8 object-contain sm:h-10 sm:w-10 rotate-[-130deg] absolute top-0 right-2"
        unoptimized
      />
      <Image
        src={DICE_ASSETS.THREE_WHITE}
        alt="Dé trois"
        width={48}
        height={42}
        className="h-4 w-4 object-contain sm:h-5 sm:w-5 rotate-[-150deg] absolute top-5 left-3.5 sm:left-2.5"
        unoptimized
      />
      <Image
        src={DICE_ASSETS.FIVE_WHITE}
        alt="Dé cinq"
        width={48}
        height={42}
        className="h-4 w-4 object-contain sm:h-5 sm:w-5 rotate-[-190deg] absolute top-9 sm:top-10 left-8"
        unoptimized
      />
      <span
        className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-sm bg-dice-main-secondary text-xs font-bold text-dice-foreground"
        aria-hidden
      >
        {triesLeft}
      </span>
    </button>
  );
}

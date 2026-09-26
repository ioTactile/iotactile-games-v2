'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DICE_ASSETS } from '@/constants/assets.constant';
import { ANIMATION_DURATION_MS, SOUND_LEAD_MS } from '@/constants/dice.constant';
import { useDiceSounds } from '@/hooks/use-dice-sounds';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

type DiceCupProps = {
  onRoll: () => void;
  disabled?: boolean;
  triesLeft: number;
  className?: string;
};

export function DiceCup({ onRoll, disabled = false, triesLeft, className }: DiceCupProps) {
  const { t } = useI18n();

  const [shaking, setShaking] = useState(false);
  const { playShakeAndRoll, stopShakeAndRoll } = useDiceSounds();

  const handleRoll = useCallback(() => {
    if (disabled || shaking || triesLeft <= 0) return;
    playShakeAndRoll();
    setTimeout(() => setShaking(true), SOUND_LEAD_MS);
    setTimeout(() => {
      setShaking(false);
      stopShakeAndRoll();
      onRoll();
    }, SOUND_LEAD_MS + ANIMATION_DURATION_MS);
  }, [disabled, shaking, triesLeft, onRoll, playShakeAndRoll, stopShakeAndRoll]);

  return (
    <div className={cn('relative flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex min-h-[120px] min-w-[140px] items-center justify-center transition-transform',
          shaking && 'animate-dice-shake',
        )}
      >
        <Image
          src={shaking ? DICE_ASSETS.CUP_ANIMATION : DICE_ASSETS.CUP}
          alt="Tasse"
          width={160}
          height={140}
          className="h-auto w-full max-w-[160px] select-none object-contain"
          unoptimized
          priority
        />
        <Button
          type="button"
          size="lg"
          onClick={handleRoll}
          disabled={disabled || shaking || triesLeft <= 0}
          className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:bg-primary focus:opacity-100 focus-visible:opacity-100"
          aria-label={t('dice.rollDice')}
        >
          {t('dice.rollDiceButtonLabel', triesLeft)}
        </Button>
      </div>
      {!shaking && triesLeft > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Clique sur la tasse ou le bouton pour lancer
        </p>
      )}
    </div>
  );
}

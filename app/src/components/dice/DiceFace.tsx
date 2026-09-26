'use client';

import Image from 'next/image';

import { DICE_FACE_IMAGES, DICE_FACE_IMAGES_WHITE } from '@/constants/assets.constant';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

type DiceFaceProps = {
  face: number; // 1-6
  locked: boolean;
  onClick: () => void;
  disabled?: boolean;
  useWhite?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function DiceFace({
  face,
  locked,
  onClick,
  disabled = false,
  useWhite = false,
  className,
}: DiceFaceProps) {
  const { t } = useI18n();

  const images = useWhite ? DICE_FACE_IMAGES_WHITE : DICE_FACE_IMAGES;
  const src = images[Math.max(0, Math.min(face - 1, 5))];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={locked}
      aria-label={t('dice.diceFaceLabel', face, locked)}
      className={cn(
        'relative transition-all size-12 sm:size-14',
        !disabled && 'cursor-pointer hover:scale-105 active:scale-95',
        disabled && 'cursor-not-allowed opacity-70',
        className,
      )}
    >
      <Image
        src={src}
        alt={`Dé ${face}`}
        width={48}
        height={48}
        className="h-full w-full select-none object-contain"
        unoptimized
      />
    </button>
  );
}

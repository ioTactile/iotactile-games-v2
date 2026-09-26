'use client';

import { XIcon } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { DICE_ASSETS } from '@/constants/assets.constant';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const DICE_FACES = [
  DICE_ASSETS.ONE_WHITE,
  DICE_ASSETS.TWO_WHITE,
  DICE_ASSETS.THREE_WHITE,
  DICE_ASSETS.FOUR_WHITE,
  DICE_ASSETS.FIVE_WHITE,
  DICE_ASSETS.SIX_WHITE,
] as const;

const NUMBER_RULES = [
  { label: 'NOMBRE DE 1', faceIndex: 0 },
  { label: 'NOMBRE DE 2', faceIndex: 1 },
  { label: 'NOMBRE DE 3', faceIndex: 2 },
  { label: 'NOMBRE DE 4', faceIndex: 3 },
  { label: 'NOMBRE DE 5', faceIndex: 4 },
  { label: 'NOMBRE DE 6', faceIndex: 5 },
] as const;

const COMBO_RULES = [
  {
    icon: DICE_ASSETS.THREE_OF_A_KIND,
    img: DICE_ASSETS.THREE_OF_A_KIND,
    label: 'BRELAN',
  },
  {
    icon: DICE_ASSETS.FOUR_OF_A_KIND,
    img: DICE_ASSETS.FOUR_OF_A_KIND,
    label: 'CARRÉ',
  },
  {
    icon: DICE_ASSETS.FULL_HOUSE,
    img: DICE_ASSETS.FULL_HOUSE,
    label: 'FULL HOUSE',
  },
  {
    icon: DICE_ASSETS.SMALL_STRAIGHT,
    img: DICE_ASSETS.SMALL_STRAIGHT,
    label: 'SUITE DE 4 DÉS',
  },
  {
    icon: DICE_ASSETS.LARGE_STRAIGHT,
    img: DICE_ASSETS.LARGE_STRAIGHT,
    label: 'SUITE DE 5 DÉS',
  },
  {
    icon: DICE_ASSETS.FIVE_OF_A_KIND,
    img: DICE_ASSETS.FIVE_OF_A_KIND,
    label: '5 DÉS IDENTIQUES',
  },
  { icon: DICE_ASSETS.CHANCE, img: DICE_ASSETS.CHANCE, label: 'CHANCE' },
] as const;

const COMBO_EXAMPLES = [
  {
    icon: DICE_ASSETS.THREE_OF_A_KIND,
    imgs: [
      { src: DICE_ASSETS.FOUR_WHITE, key: 'brelan-1' },
      { src: DICE_ASSETS.FOUR_WHITE, key: 'brelan-2' },
      { src: DICE_ASSETS.FOUR_WHITE, key: 'brelan-3' },
    ],
  },
  {
    icon: DICE_ASSETS.FOUR_OF_A_KIND,
    imgs: [
      { src: DICE_ASSETS.TWO_WHITE, key: 'carre-1' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'carre-2' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'carre-3' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'carre-4' },
    ],
  },
  {
    icon: DICE_ASSETS.FULL_HOUSE,
    imgs: [
      { src: DICE_ASSETS.TWO_WHITE, key: 'full-1' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'full-2' },
      { src: DICE_ASSETS.THREE_WHITE, key: 'full-3' },
      { src: DICE_ASSETS.THREE_WHITE, key: 'full-4' },
      { src: DICE_ASSETS.THREE_WHITE, key: 'full-5' },
    ],
  },
  {
    icon: DICE_ASSETS.SMALL_STRAIGHT,
    imgs: [
      { src: DICE_ASSETS.ONE_WHITE, key: 'small-1' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'small-2' },
      { src: DICE_ASSETS.THREE_WHITE, key: 'small-3' },
      { src: DICE_ASSETS.FOUR_WHITE, key: 'small-4' },
    ],
  },
  {
    icon: DICE_ASSETS.LARGE_STRAIGHT,
    imgs: [
      { src: DICE_ASSETS.ONE_WHITE, key: 'large-1' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'large-2' },
      { src: DICE_ASSETS.THREE_WHITE, key: 'large-3' },
      { src: DICE_ASSETS.FOUR_WHITE, key: 'large-4' },
      { src: DICE_ASSETS.FIVE_WHITE, key: 'large-5' },
    ],
  },
  {
    icon: DICE_ASSETS.FIVE_OF_A_KIND,
    imgs: [
      { src: DICE_ASSETS.SIX_WHITE, key: 'five-1' },
      { src: DICE_ASSETS.SIX_WHITE, key: 'five-2' },
      { src: DICE_ASSETS.SIX_WHITE, key: 'five-3' },
      { src: DICE_ASSETS.SIX_WHITE, key: 'five-4' },
      { src: DICE_ASSETS.SIX_WHITE, key: 'five-5' },
    ],
  },
  {
    icon: DICE_ASSETS.CHANCE,
    imgs: [
      { src: DICE_ASSETS.ONE_WHITE, key: 'chance-1' },
      { src: DICE_ASSETS.TWO_WHITE, key: 'chance-2' },
      { src: DICE_ASSETS.THREE_WHITE, key: 'chance-3' },
      { src: DICE_ASSETS.FOUR_WHITE, key: 'chance-4' },
      { src: DICE_ASSETS.FIVE_WHITE, key: 'chance-5' },
    ],
  },
] as const;

type RulesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RulesModal({ open, onClose }: RulesModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn('max-w-lg gap-0 overflow-hidden rounded-2xl p-0', 'text-dice-main-secondary')}
      >
        <div className="flex items-center justify-end p-2 pr-3 pt-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="dice"
              className="rounded-lg p-0"
              aria-label={t('common.close')}
            >
              <XIcon className="size-5" />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          </DialogClose>
        </div>

        <div className="px-4 pb-2">
          <DialogTitle className="sr-only">{t('dice.rulesTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('dice.rulesDescription')}</DialogDescription>

          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            <div className="flex flex-col justify-between">
              {NUMBER_RULES.map(({ label, faceIndex }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={DICE_FACES[faceIndex]}
                      alt="Icone de nombre"
                      width={24}
                      height={24}
                      className="size-6 shrink-0 object-contain"
                      unoptimized
                    />
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Image
                          key={i}
                          src={DICE_FACES[faceIndex]}
                          alt="Exemple de nombre"
                          width={20}
                          height={20}
                          className="size-5 object-contain"
                          unoptimized
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-dice-main-secondary">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {COMBO_RULES.map(({ icon, label }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center text-sm font-bold text-dice-main-secondary"
                      aria-hidden
                    >
                      <Image
                        src={icon}
                        alt="Icone de combinaison"
                        width={24}
                        height={24}
                        className="size-6 shrink-0 object-contain"
                        unoptimized
                      />
                    </span>
                    <div className="flex gap-0.5">
                      {COMBO_EXAMPLES.find((example) => example.icon === icon)?.imgs.map((item) => (
                        <Image
                          key={item.key}
                          src={item.src}
                          alt="Exemple de combinaison"
                          width={20}
                          height={20}
                          className="size-5 object-contain"
                          unoptimized
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-dice-main-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-medium text-dice-main-tertiary">
            {t('dice.bonus35Description')}
          </p>

          <div className="mt-4 flex justify-center pb-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="dice"
                className="rounded-xl px-8"
                aria-label={t('dice.understood')}
              >
                {t('dice.understood')}
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

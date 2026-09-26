export const DICE_ASSETS = {
  // Colors
  ONE: '/assets/dice/colors/dice-one.png',
  TWO: '/assets/dice/colors/dice-two.png',
  THREE: '/assets/dice/colors/dice-three.png',
  FOUR: '/assets/dice/colors/dice-four.png',
  FIVE: '/assets/dice/colors/dice-five.png',
  SIX: '/assets/dice/colors/dice-six.png',
  ONE_WHITE: '/assets/dice/colors/dice-white-one.png',
  TWO_WHITE: '/assets/dice/colors/dice-white-two.png',
  THREE_WHITE: '/assets/dice/colors/dice-white-three.png',
  FOUR_WHITE: '/assets/dice/colors/dice-white-four.png',
  FIVE_WHITE: '/assets/dice/colors/dice-white-five.png',
  SIX_WHITE: '/assets/dice/colors/dice-white-six.png',
  // Inputs
  CHANCE: '/assets/dice/inputs/chance.png',
  FIVE_OF_A_KIND: '/assets/dice/inputs/five-of-a-kind.png',
  FOUR_OF_A_KIND: '/assets/dice/inputs/four-of-a-kind.png',
  THREE_OF_A_KIND: '/assets/dice/inputs/three-of-a-kind.png',
  FULL_HOUSE: '/assets/dice/inputs/full-house.png',
  SMALL_STRAIGHT: '/assets/dice/inputs/small-straight.png',
  LARGE_STRAIGHT: '/assets/dice/inputs/large-straight.png',
  // Sounds
  ROLL_DICE: '/assets/dice/sounds/dice.mp3',
  SHAKE_AND_ROLL: '/assets/dice/sounds/shake-and-roll.mp3',
  // UI
  CUP_ANIMATION: '/assets/dice/ui/cup-animation.png',
  CUP: '/assets/dice/ui/cup-no-bg.png',
} as const;

/** Face images 1–6 (theme colors) for dice display. */
export const DICE_FACE_IMAGES = [
  DICE_ASSETS.ONE,
  DICE_ASSETS.TWO,
  DICE_ASSETS.THREE,
  DICE_ASSETS.FOUR,
  DICE_ASSETS.FIVE,
  DICE_ASSETS.SIX,
] as const;

/** White face images (dark mode). */
export const DICE_FACE_IMAGES_WHITE = [
  DICE_ASSETS.ONE_WHITE,
  DICE_ASSETS.TWO_WHITE,
  DICE_ASSETS.THREE_WHITE,
  DICE_ASSETS.FOUR_WHITE,
  DICE_ASSETS.FIVE_WHITE,
  DICE_ASSETS.SIX_WHITE,
] as const;

/** Mapping scoreKey → special input image. */
export const SCORE_INPUT_IMAGES: Record<string, string> = {
  one: DICE_ASSETS.ONE_WHITE, // placeholder; no dedicated icon for 1
  two: DICE_ASSETS.TWO_WHITE,
  three: DICE_ASSETS.THREE_WHITE,
  four: DICE_ASSETS.FOUR_WHITE,
  five: DICE_ASSETS.FIVE_WHITE,
  six: DICE_ASSETS.SIX_WHITE,
  threeOfAKind: DICE_ASSETS.THREE_OF_A_KIND,
  fourOfAKind: DICE_ASSETS.FOUR_OF_A_KIND,
  fullHouse: DICE_ASSETS.FULL_HOUSE,
  smallStraight: DICE_ASSETS.SMALL_STRAIGHT,
  largeStraight: DICE_ASSETS.LARGE_STRAIGHT,
  dice: DICE_ASSETS.FIVE_OF_A_KIND,
  chance: DICE_ASSETS.CHANCE,
};

/**
 * Games shown on the home screen.
 * Add an object here for a game to appear in the grid.
 */
export interface GameEntry {
  id: string;
  name: string;
  href: string;
  icon?: string;
}

export const games: GameEntry[] = [
  {
    id: 'dice',
    name: 'Dice',
    href: '/dice',
    icon: 'Dices',
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    href: '/minesweeper',
    icon: 'Grid3X3',
  },
];

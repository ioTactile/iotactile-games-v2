export { Cell } from './cell';
export { type IMineSweeper, MineSweeper } from './mine-sweeper';
export { Timer } from './timer';
export type { Difficulty, GameOptions, GameStatus } from './types';

/**
 * Format a duration in ms as MM:SS:cs (with centiseconds) or MM:SS depending on withMs.
 */
export function formatTimer(value: number, withMs: boolean): string {
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.floor((value % 60_000) / 1000);
  if (withMs) {
    const centiseconds = Math.floor((value % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(centiseconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

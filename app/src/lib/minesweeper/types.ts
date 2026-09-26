export type GameStatus = 'waiting' | 'inProgress' | 'won' | 'lost';

export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'custom';

export interface GameOptions {
  numRows: number;
  numCols: number;
  numMines: number;
  difficulty: Difficulty;
}

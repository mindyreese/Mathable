// shared types used by both client and server

export type Coordinate = [number, number]; // row, col 0-based

export type Tile = {
  coord: Coordinate;
  value: string; // number or operator
};

export type OperatorMode = 'addsub' | 'muldiv';

export type Round = {
  grid: Tile[]; // length 16
  target: number;
  operatorMode: OperatorMode;
  seed?: string;
};

export type Path = Coordinate[];

export type Submission = {
  playerId: string;
  path: Path;
};

export type ScoreDetail = {
  path: Path;
  expression: string;
  base: number;
  uniqueBonus: number;
  longestBonus: number;
};

export type ScoreBreakdown = {
  playerId: string;
  total: number;
  details: ScoreDetail[];
};

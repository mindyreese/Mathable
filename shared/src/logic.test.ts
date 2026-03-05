import { describe, it, expect } from 'vitest';
import {
  isAdjacent,
  evaluateTokensLeftToRight,
  validatePath,
  findAllSolutions,
  normalizePath,
  scoreRound,
  generateRound
} from './logic';
import { Tile, OperatorMode, Path } from './types';

describe('shared logic', () => {
  it('isAdjacent works for 8 directions', () => {
    expect(isAdjacent([0, 0], [0, 1])).toBe(true);
    expect(isAdjacent([0, 0], [1, 1])).toBe(true);
    expect(isAdjacent([1, 1], [3, 3])).toBe(false);
    expect(isAdjacent([2, 2], [2, 2])).toBe(false);
  });

  it('evaluate left to right with exact division', () => {
    expect(evaluateTokensLeftToRight(['4', '÷', '2', '×', '6']).value).toBe(12);
    expect(evaluateTokensLeftToRight(['5', '÷', '2']).ok).toBe(false);
    expect(evaluateTokensLeftToRight(['5', '×', '3']).value).toBe(15);
  });

  it('validatePath catches invalid patterns', () => {
    const grid: Tile[] = [
      { coord: [0, 0], value: '4' },
      { coord: [0, 1], value: '×' },
      { coord: [1, 1], value: '2' }
    ];
    const opMode: OperatorMode = 'muldiv';
    expect(validatePath([[0, 0], [0, 1], [1, 1]], grid, opMode).ok).toBe(true);
    expect(validatePath([[0, 0], [1, 1]], grid, opMode).ok).toBe(false);
  });

  it('sample round solver finds solutions', () => {
    // sample from spec: operators × ÷, target 12.
    const grid: Tile[] = [];
    const values = [
      '4', '×', '2', '×',
      '3', '÷', '6', '1',
      '2', '3', '4', '6',
      '5', '2', '×', '3'
    ];
    let idx = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        grid.push({ coord: [r, c], value: values[idx++] });
      }
    }
    const sols = findAllSolutions(grid, 12, 'muldiv');
    expect(sols.length).toBeGreaterThan(0);
    // check at least one path evaluates to 12 (e.g., 4×3 or 6×2)
    expect(sols.some(s => s.expression === '4×3' || s.expression === '6×2' || s.expression === '2×6' || s.expression === '3×4')).toBe(true);
  });

  it('scoreRound awards base points correctly', () => {
    const grid: Tile[] = [];
    const values = Array(16).fill('1').map((v, i) => v);
    let idx = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        grid.push({ coord: [r, c], value: values[idx++] });
      }
    }
    const allSols: { path: Path; expression: string }[] = [
      { path: [[0, 0], [0, 1], [0, 2]], expression: '1+1+1' },
      { path: [[1, 0], [1, 1], [1, 2]], expression: '1+1+1' }
    ];
    const submissions: { [playerId: string]: Path[] } = {
      alice: [allSols[0].path],
      bob: [allSols[1].path]
    };
    const breakdowns = scoreRound(submissions, allSols, grid as any);
    expect(breakdowns.find(b => b.playerId === 'alice')?.total).toBe(2);
    expect(breakdowns.find(b => b.playerId === 'bob')?.total).toBe(2);
  });

  it('generateRound produces valid round and solutions', () => {
    const r = generateRound('testseed');
    expect(r.grid.length).toBe(16);
    expect(r.operatorMode).toMatch(/addsub|muldiv/);
    const sols = findAllSolutions(r.grid, r.target, r.operatorMode);
    expect(Array.isArray(sols)).toBe(true);
  });
});

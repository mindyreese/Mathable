import { Coordinate, Tile, Path, OperatorMode, Round, ScoreBreakdown, ScoreDetail } from './types';

// adjacency: difference in row and col <=1 and not same
export function isAdjacent(a: Coordinate, b: Coordinate): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return (dr <= 1 && dc <= 1) && !(dr === 0 && dc === 0);
}

export function normalizePath(path: Path): string {
  // canonical string representation e.g. "0,0|0,1|1,1"
  return path.map(([r, c]) => `${r},${c}`).join('|');
}

export function pathToTokens(path: Path, grid: Tile[]): string[] {
  const map = new Map(grid.map(t => [normalizePath([t.coord]), t.value]));
  return path.map(p => {
    const key = `${p[0]},${p[1]}`;
    const val = map.get(key);
    if (val === undefined) {
      throw new Error('Invalid coordinate in path');
    }
    return val;
  });
}

export function evaluateTokensLeftToRight(tokens: string[]): { ok: boolean; value?: number } {
  if (tokens.length === 0) {
    return { ok: false };
  }
  // tokens alternate number/op/number...
  let result = parseInt(tokens[0], 10);
  if (isNaN(result)) return { ok: false };
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const num = parseInt(tokens[i + 1], 10);
    if (isNaN(num)) return { ok: false };
    switch (op) {
      case '+':
        result = result + num;
        break;
      case '-':
        result = result - num;
        break;
      case '×':
      case 'x':
      case '*':
        result = result * num;
        break;
      case '÷':
      case '/':
        if (num === 0 || result % num !== 0) {
          return { ok: false };
        }
        result = result / num;
        break;
      default:
        return { ok: false };
    }
    if (!Number.isInteger(result)) {
      return { ok: false };
    }
  }
  return { ok: true, value: result };
}

export function validatePath(path: Path, grid: Tile[], operatorMode: OperatorMode): { ok: boolean; reason?: string } {
  if (path.length < 3) {
    return { ok: false, reason: 'path too short' };
  }
  const seen = new Set<string>();
  let expectNumber = true;
  for (let i = 0; i < path.length; i++) {
    const coord = path[i];
    const key = normalizePath([coord]);
    if (seen.has(key)) {
      return { ok: false, reason: 'reused tile' };
    }
    seen.add(key);
    if (i > 0) {
      const prev = path[i - 1];
      if (!isAdjacent(prev, coord)) {
        return { ok: false, reason: 'non-adjacent tile' };
      }
    }
    const val = grid.find(t => t.coord[0] === coord[0] && t.coord[1] === coord[1])?.value;
    if (!val) {
      return { ok: false, reason: 'invalid tile' };
    }
    const isNum = /^\d+$/.test(val);
    const isOp = /^[+\-×÷x/*]$/.test(val);

    if (expectNumber && !isNum) {
      return { ok: false, reason: 'expected number' };
    }
    if (!expectNumber && !isOp) {
      return { ok: false, reason: 'expected operator' };
    }
    if (!isNum) {
      // check allowed operator
      if (operatorMode === 'addsub' && !/[+\-]/.test(val)) {
        return { ok: false, reason: 'operator not allowed' };
      }
      if (operatorMode === 'muldiv' && !/[×÷x/*]/.test(val)) {
        return { ok: false, reason: 'operator not allowed' };
      }
    }
    expectNumber = !expectNumber;
  }
  // must end with number
  const lastVal = grid.find(t => t.coord[0] === path[path.length - 1][0] && t.coord[1] === path[path.length - 1][1])?.value;
  if (!lastVal || !/^\d+$/.test(lastVal)) {
    return { ok: false, reason: 'must end with number' };
  }

  const tokens = pathToTokens(path, grid);
  const evalRes = evaluateTokensLeftToRight(tokens);
  if (!evalRes.ok) {
    return { ok: false, reason: 'math invalid' };
  }
  return { ok: true };
}

// findAllSolutions with DFS
export function findAllSolutions(
  grid: Tile[],
  target: number,
  operatorMode: OperatorMode
): { path: Path; expression: string }[] {
  const solutions: { path: Path; expression: string }[] = [];
  const posMap = new Map<string, Tile>();
  const coordSet = new Set<string>();
  
  grid.forEach((t) => {
    posMap.set(`${t.coord[0]},${t.coord[1]}`, t);
    coordSet.add(`${t.coord[0]},${t.coord[1]}`);
  });

  function dfs(currentPath: Path, expectNumber: boolean, currentValue: number | null, expression: string, lastOperator: string | null) {
    // when we have a path ending in number and len>=3, evaluate currentValue
    if (currentPath.length >= 3 && !expectNumber) {
      // we just added a number, so the path ends with a number
      if (currentValue === target) {
        solutions.push({ path: [...currentPath], expression });
      }
    }

    // continue exploring neighbors
    const [r, c] = currentPath[currentPath.length - 1];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        const key = `${nr},${nc}`;
        if (!coordSet.has(key)) continue; // coordinate not in grid
        if (currentPath.some(p => p[0] === nr && p[1] === nc)) continue; // already visited
        
        const tile = posMap.get(key);
        if (!tile) continue;
        const val = tile.value;
        const isNum = /^\d+$/.test(val);
        const isOp = /^[\+\-×÷x\/*]$/.test(val);
        if (expectNumber && !isNum) continue;
        if (!expectNumber && !isOp) continue;
        // check allowed operator
        if (isOp) {
          if (operatorMode === 'addsub' && !/[\+\-]/.test(val)) continue;
          if (operatorMode === 'muldiv' && !/[×÷x\/*]/.test(val)) continue;
        }
        // evaluate new currentValue if adding a number after an operator
        let newValue = currentValue;
        if (!expectNumber) {
          // we're adding an operator, just add it to expression
          newValue = currentValue;
        } else {
          // we're adding a number after an operator
          const num = parseInt(val, 10);
          if (currentValue !== null && lastOperator !== null) {
            switch (lastOperator) {
              case '+':
                newValue = currentValue + num;
                break;
              case '-':
                newValue = currentValue - num;
                break;
              case '×':
              case 'x':
              case '*':
                newValue = currentValue * num;
                break;
              case '÷':
              case '/':
                if (num === 0 || currentValue % num !== 0) {
                  newValue = null;
                } else {
                  newValue = currentValue / num;
                }
                break;
              default:
                newValue = null;
            }
            if (newValue === null || !Number.isInteger(newValue)) {
              continue; // prune
            }
          }
        }
        const nextPath = [...currentPath, [nr, nc] as Coordinate];
        const nextExpr = expression + val;
        const nextLastOp = !expectNumber ? val : lastOperator;
        dfs(nextPath, !expectNumber, newValue, nextExpr, nextLastOp);
      }
    }
  }

  // start from any number tile
  grid.forEach((tile) => {
    if (/^\d+$/.test(tile.value)) {
      const coord = tile.coord;
      const num = parseInt(tile.value, 10);
      dfs([coord], false, num, tile.value, null);
    }
  });

  // filter duplicates
  const uniq: { [key: string]: { path: Path; expression: string } } = {};
  solutions.forEach(sol => {
    const key = normalizePath(sol.path);
    if (!uniq[key]) uniq[key] = sol;
  });
  return Object.values(uniq);
}

// generateRound
export function generateRound(seed?: string): Round {
  // simple deterministic pseudo-random from seed
  const rnd = (function (s = seed || Math.random().toString()) {
    let x = 0;
    for (let i = 0; i < s.length; i++) {
      x = (x * 31 + s.charCodeAt(i)) % 1000000007;
    }
    return () => {
      x = (x * 16807) % 2147483647;
      return x / 2147483647;
    };
  })();

  const operatorMode: OperatorMode = rnd() < 0.5 ? 'addsub' : 'muldiv';
  const ops = operatorMode === 'addsub' ? ['+', '-'] : ['×', '÷'];
  const grid: Tile[] = [];
  const coords: Coordinate[] = [];
  // always create 4x4 grid
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      coords.push([r, c]);
    }
  }
  // shuffle coords
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
  const opPositions = coords.slice(0, 5);
  coords.forEach(coord => {
    if (opPositions.some(o => o[0] === coord[0] && o[1] === coord[1])) {
      const op = ops[Math.floor(rnd() * ops.length)];
      grid.push({ coord, value: op });
    } else {
      const num = Math.floor(rnd() * 9) + 1;
      grid.push({ coord, value: num.toString() });
    }
  });

  // choose target with at least 1 solution
  let target = 0;
  let sols: { path: Path; expression: string }[] = [];
  for (let attempt = 0; attempt < 50; attempt++) {
    sols = findAllSolutions(grid, 0, operatorMode);
    if (sols.length >= 1) {
      // pick a random solution and evaluate it to get the target
      const selectedSol = sols[Math.floor(rnd() * sols.length)];
      const tokens = pathToTokens(selectedSol.path, grid);
      const evalRes = evaluateTokensLeftToRight(tokens);
      if (evalRes.ok && evalRes.value !== undefined) {
        target = evalRes.value;
        break;
      }
    }
  }
  if (target === 0) {
    target = Math.floor(rnd() * 20) + 1;
  }
  return { grid, target, operatorMode, seed };
}

// scoreRound
export function scoreRound(
  submissionsByPlayer: { [playerId: string]: Path[] },
  allSolutions: { path: Path; expression: string }[],
  grid: Tile[]
): ScoreBreakdown[] {
  // count submissions per normalized path across players
  const countMap = new Map<string, number>();
  Object.values(submissionsByPlayer).flat().forEach(p => {
    const key = normalizePath(p);
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });
  // find longest length in allSolutions
  let longest = 0;
  allSolutions.forEach(s => {
    if (s.path.length > longest) longest = s.path.length;
  });

  const breakdowns: ScoreBreakdown[] = [];
  for (const [playerId, paths] of Object.entries(submissionsByPlayer)) {
    let total = 0;
    const details: ScoreDetail[] = [];
    paths.forEach(path => {
        const key = normalizePath(path);
        const sol = allSolutions.find(s => normalizePath(s.path) === key);
        if (!sol) return; // invalid or not solution
        const base = path.length <= 2 ? 1 : path.length === 3 ? 2 : 3;
        const uniqueBonus = (countMap.get(key) === 1 ? 2 : 0);
        const longestBonus = (path.length === longest ? 5 : 0);
        const detail: ScoreDetail = {
          path,
          expression: sol.expression,
          base,
          uniqueBonus,
          longestBonus
        };
        total += base + uniqueBonus + longestBonus;
        details.push(detail);
    });
    breakdowns.push({ playerId, total, details });
  }
  return breakdowns;
}

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Round, Tile, Path, OperatorMode } from '@shared/types';
import { 
  generateRound, 
  findAllSolutions, 
  normalizePath, 
  validatePath, 
  pathToTokens, 
  evaluateTokensLeftToRight 
} from '@shared/logic';

interface SubmissionInfo {
  path: Path;
  expression: string;
  value: number;
  valid: boolean;
  reason?: string;
}

interface GameState {
  round: Round | null;
  solutions: { path: Path; expression: string }[];
  submissions: SubmissionInfo[];
  startNewRound: (seed?: string) => void;
  submitPath: (path: Path) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export const useGame = (): GameState => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [round, setRound] = useState<Round | null>(null);
  const [solutions, setSolutions] = useState<{ path: Path; expression: string }[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionInfo[]>([]);

  const startNewRound = (seed?: string) => {
    const r = generateRound(seed);
    setRound(r);
    const sols = findAllSolutions(r.grid, r.target, r.operatorMode);
    setSolutions(sols);
    setSubmissions([]);
  };

  const submitPath = (path: Path) => {
    if (!round) return;
    const norm = normalizePath(path);
    if (submissions.some(s => normalizePath(s.path) === norm)) {
      // already submitted
      setSubmissions(prev => [
        ...prev,
        { path, expression: '', value: 0, valid: false, reason: 'duplicate' }
      ]);
      return;
    }
    const { ok, reason } = validatePath(path, round.grid, round.operatorMode);
    if (!ok) {
      setSubmissions(prev => [...prev, { path, expression: '', value: 0, valid: false, reason }]);
      return;
    }
    const tokens = pathToTokens(path, round.grid);
    const evalRes = evaluateTokensLeftToRight(tokens);
    if (!evalRes.ok) {
      setSubmissions(prev => [...prev, { path, expression: '', value: 0, valid: false, reason: 'math invalid' }]);
      return;
    }
    const val = evalRes.value!;
    const expression = tokens.join('');
    const valid = val === round.target;
    setSubmissions(prev => [...prev, { path, expression, value: val, valid }]);
  };

  return (
    <GameContext.Provider value={{ round, solutions, submissions, startNewRound, submitPath }}>
      {children}
    </GameContext.Provider>
  );
};

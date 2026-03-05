import React, { useEffect } from 'react';
import { GameProvider, useGame } from './GameContext';
import Board from './components/Board';
import SubmissionList from './components/SubmissionList';

const Inner: React.FC = () => {
  const { round, startNewRound } = useGame();
  const [timeLeft, setTimeLeft] = React.useState(60);

  useEffect(() => {
    startNewRound();
  }, []);

  useEffect(() => {
    if (!round) return;
    setTimeLeft(60);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [round]);

  if (!round) return null;

  return (
    <div>
      <h1>Mathable</h1>
      <div>Target: {round.target}</div>
      <div>Operators: {round.operatorMode === 'addsub' ? '+ -' : '× ÷'}</div>
      <div>Time: {timeLeft}s</div>
      {timeLeft === 0 && (
        <button onClick={() => startNewRound()}>
          Next Round
        </button>
      )}
      <Board />
      <SubmissionList />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <Inner />
    </GameProvider>
  );
};

export default App;

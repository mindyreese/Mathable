import React, { useState, useRef } from 'react';
import styles from './Board.module.css';
import { useGame } from '../GameContext';
import { Coordinate } from '@shared/types';
import { pathToTokens } from '@shared/logic';

interface TileProps {
  coord: Coordinate;
  value: string;
  onMouseDown: (coord: Coordinate) => void;
  onMouseEnter: (coord: Coordinate) => void;
  selected: boolean;
}

const TileComp: React.FC<TileProps> = ({ coord, value, onMouseDown, onMouseEnter, selected }) => {
  return (
    <div
      data-testid="tile"
      className={`${styles.tile} ${selected ? styles.selected : ''}`}
      onMouseDown={() => onMouseDown(coord)}
      onMouseEnter={() => onMouseEnter(coord)}
    >
      {value}
    </div>
  );
};

const Board: React.FC = () => {
  const { round } = useGame();
  const [path, setPath] = useState<Coordinate[]>([]);
  const isMouseDown = useRef(false);

  if (!round) return null;

  const { grid } = round;

  const handleMouseDown = (coord: Coordinate) => {
    isMouseDown.current = true;
    setPath([coord]);
  };
  const { submitPath } = useGame();

  const handleMouseUp = () => {
    isMouseDown.current = false;
    if (path.length > 0) {
      submitPath(path);
    }
    setPath([]);
  };
  const handleMouseEnter = (coord: Coordinate) => {
    if (isMouseDown.current) {
      setPath(prev => {
        if (prev.find(p => p[0] === coord[0] && p[1] === coord[1])) {
          return prev;
        }
        return [...prev, coord];
      });
    }
  };

  const currentExpression = path.length > 0 ? pathToTokens(path, grid).join('') : '';

  return (
    <div>
      <div className={styles.board} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {grid.map(tile => (
          <TileComp
            key={`${tile.coord[0]},${tile.coord[1]}`}
            coord={tile.coord}
            value={tile.value}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            selected={!!path.find(p => p[0] === tile.coord[0] && p[1] === tile.coord[1])}
          />
        ))}
      </div>
      {currentExpression && <div className={styles.current}>{currentExpression}</div>}
    </div>
  );
};

export default Board;

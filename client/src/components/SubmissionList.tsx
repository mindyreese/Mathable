import React from 'react';
import { useGame } from '../GameContext';

const SubmissionList: React.FC = () => {
  const { submissions, round } = useGame();
  if (!round) return null;
  const scoreFor = (s: typeof submissions[0]) => {
    if (!s.valid) return 0;
    const len = s.path.length;
    const base = len <= 2 ? 1 : len === 3 ? 2 : 3;
    return base; // bonuses not calculated here
  };
  const total = submissions.reduce((acc, s) => acc + scoreFor(s), 0);

  return (
    <div>
      <h2>Submissions</h2>
      <ul>
        {submissions.map((s, idx) => (
          <li key={idx} style={{ color: s.valid ? 'green' : 'red' }}>
            {s.valid
              ? `${s.expression} = ${s.value} (+${scoreFor(s)})`
              : `Invalid (${s.reason || 'bad'})`}
          </li>
        ))}
      </ul>
      <div>Total score: {total}</div>
    </div>
  );
};

export default SubmissionList;

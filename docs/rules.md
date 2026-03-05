# Mathable Rules Summary

Mathable is played on a 4×4 grid of tiles containing numbers and operators. Each round has a target number and an operator mode (addition/subtraction or multiplication/division).

## Path Rules

- Tiles must be adjacent in 8 directions; cannot reuse a tile within the same path.
- Expressions must alternate number → operator → number...
- Must start and end with a number.
- Only operators allowed for the round may be used.
- Division must be exact; all intermediate results must remain integers.
- Evaluation is left-to-right, ignoring typical precedence.

## Scoring

- Base points: shortest valid expression counts as 2-tile (number-operator-number).
  - 2-tile (3 tiles) → +1 point
  - 3-tile (4 tiles) → +2 points
  - 4+ tiles → +3 points
- Longest solution bonus: +5 points for any path matching the length of the longest possible solution on the board.
- Unique solution bonus: +2 points if no other player submitted the exact same path.

Paths may earn base + longest + unique bonuses.

## Assumptions

- Ambiguity around "2-tile" scoring is resolved by treating it as the shortest valid expression length (3 tiles), documented above.


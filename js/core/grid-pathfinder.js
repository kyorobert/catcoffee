const cellKey = (x, y) => `${x},${y}`;

export function findPath({start, goal, cols, rows, isWalkable}) {
  if (!start || !goal || cols <= 0 || rows <= 0 || typeof isWalkable !== 'function') return [];
  const inside = ({x, y}) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < cols && y < rows;
  if (!inside(start) || !inside(goal)) return [];
  if (start.x === goal.x && start.y === goal.y) return [{x: start.x, y: start.y}];
  if (!isWalkable(goal.x, goal.y)) return [];

  const queue = [{x: start.x, y: start.y}];
  const previous = new Map([[cellKey(start.x, start.y), null]]);
  let cursor = 0;
  const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  while (cursor < queue.length) {
    const current = queue[cursor++];
    for (const [dx, dy] of directions) {
      const next = {x: current.x + dx, y: current.y + dy};
      const key = cellKey(next.x, next.y);
      if (!inside(next) || previous.has(key)) continue;
      if (!(next.x === start.x && next.y === start.y) && !isWalkable(next.x, next.y)) continue;
      previous.set(key, current);
      if (next.x === goal.x && next.y === goal.y) {
        const path = [next];
        let step = current;
        while (step) {
          path.push(step);
          step = previous.get(cellKey(step.x, step.y));
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return [];
}

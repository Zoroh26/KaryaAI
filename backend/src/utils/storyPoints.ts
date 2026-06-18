/**
 * Hours → Story Points mapping (Fibonacci scale)
 *
 * | Estimated Hours | Story Points |
 * |----------------|--------------|
 * | 1 – 4h         | 1            |
 * | 5 – 8h         | 2            |
 * | 9 – 16h        | 3            |
 * | 17 – 24h       | 5            |
 * | 25 – 40h       | 8            |
 * | 41h+           | 13           |
 */
export function hoursToStoryPoints(hours: number): number {
  if (hours <= 4)  return 1;
  if (hours <= 8)  return 2;
  if (hours <= 16) return 3;
  if (hours <= 24) return 5;
  if (hours <= 40) return 8;
  return 13;
}

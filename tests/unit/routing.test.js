import { describe, it, expect } from 'vitest';
import { load } from './page.js';

const { simplify, roundedPath, uniqSorted, heapPush, heapPop, segHits, dirIndex } = load(
  ['utils', 'routing'],
  ['simplify', 'roundedPath', 'uniqSorted', 'heapPush', 'heapPop', 'segHits', 'dirIndex']
);

const p = (x, y) => ({ x, y });

describe('routing', () => {
  it('drops a point that sits on a straight run', () => {
    expect(simplify([p(0, 0), p(5, 0), p(10, 0), p(10, 5), p(10, 9)])).toEqual([
      p(0, 0),
      p(10, 0),
      p(10, 9),
    ]);
  });

  it('draws a corner as a curve, and two points as one line', () => {
    expect(roundedPath([p(0, 0), p(10, 0)], 4)).toBe('M0.0,0.0L10.0,0.0');
    expect(roundedPath([p(0, 0), p(10, 0), p(10, 10)], 4)).toBe(
      'M0.0,0.0L6.0,0.0Q10.0,0.0 10.0,4.0L10.0,10.0'
    );
  });

  it('keeps each coordinate once, in order', () => {
    expect(uniqSorted([30, 10, 30, 20, 10])).toEqual([10, 20, 30]);
  });

  it('pops the cheapest state first', () => {
    const heap = [];
    [[5, 'e'], [1, 'a'], [3, 'c'], [4, 'd'], [2, 'b']].forEach(([cost, state]) =>
      heapPush(heap, cost, state)
    );
    expect([1, 2, 3, 4, 5].map(() => heapPop(heap))).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('finds a segment that crosses a box, and passes one that runs beside it', () => {
    const boxes = [{ x1: 3, y1: 0, x2: 5, y2: 10 }];
    expect(segHits(0, 5, 10, 5, boxes)).toBe(true);
    expect(segHits(0, 20, 10, 20, boxes)).toBe(false);
    expect(segHits(4, -5, 4, 15, boxes)).toBe(true);
  });

  it('numbers the four directions', () => {
    expect([dirIndex(1, 0), dirIndex(-1, 0), dirIndex(0, 1), dirIndex(0, -1)]).toEqual([0, 1, 2, 3]);
  });
});

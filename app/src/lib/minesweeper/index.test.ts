import { describe, expect, test } from 'vitest';

import { formatTimer } from './index';

describe('formatTimer', () => {
  test('formats with milliseconds', () => {
    expect(formatTimer(0, true)).toBe('00:00:00');
    expect(formatTimer(65_230, true)).toBe('01:05:23'); // 1 min 5 s 23 cs
    expect(formatTimer(125_500, true)).toBe('02:05:50'); // 2 min 5 s 50 cs
  });

  test('formats without milliseconds', () => {
    expect(formatTimer(0, false)).toBe('00:00');
    expect(formatTimer(60_000, false)).toBe('01:00'); // 1 min
    expect(formatTimer(125_000, false)).toBe('02:05'); // 2 min 5 s
  });
});

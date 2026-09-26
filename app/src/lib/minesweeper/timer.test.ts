import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Timer } from './timer';

describe('Timer', () => {
  let timer: Timer;

  beforeEach(() => {
    vi.useFakeTimers();
    timer = new Timer();
  });

  test('should initialize with default values', () => {
    expect(timer.getElapsedTime()).toBe(0);
    expect(timer.isStarted()).toBe(false);
    expect(timer.getIsPaused()).toBe(false);
  });

  test('should start the timer', () => {
    timer.start();
    expect(timer.isStarted()).toBe(true);
    expect(timer.getIsPaused()).toBe(false);
  });

  test('should pause the timer', () => {
    timer.start();
    timer.togglePause();
    expect(timer.isStarted()).toBe(true);
    expect(timer.getIsPaused()).toBe(true);
  });

  test('should resume the timer', () => {
    timer.start();
    timer.togglePause();
    timer.togglePause();
    expect(timer.isStarted()).toBe(true);
    expect(timer.getIsPaused()).toBe(false);
  });

  test('should stop the timer', () => {
    timer.start();
    timer.stop();
    expect(timer.isStarted()).toBe(true);
  });

  test('should reset the timer', () => {
    timer.start();
    timer.reset();
    expect(timer.isStarted()).toBe(false);
    expect(timer.getElapsedTime()).toBe(0);
    expect(timer.getIsPaused()).toBe(false);
  });
});

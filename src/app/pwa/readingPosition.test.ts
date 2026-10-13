import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearReadingPosition,
  peekReadingPosition,
  restoreScroll,
  saveReadingPosition,
} from './readingPosition';

const KEY = 'nihongo-notes:after-update';

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('reading position', () => {
  it('saves, peeks and clears the position', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640.4 });
    saveReadingPosition(1000);
    expect(peekReadingPosition(1500)).toBe(640);
    expect(peekReadingPosition(1500)).toBe(640); // peeking does not remove it
    clearReadingPosition();
    expect(peekReadingPosition(1500)).toBeNull();
  });

  it('ignores an old or malformed position', () => {
    saveReadingPosition(1000);
    expect(peekReadingPosition(1000 + 61_000)).toBeNull();
    window.sessionStorage.setItem(KEY, 'not json');
    expect(peekReadingPosition()).toBeNull();
    window.sessionStorage.setItem(KEY, JSON.stringify({ y: 'x', at: 1 }));
    expect(peekReadingPosition(2)).toBeNull();
  });

  it('does not fail when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => saveReadingPosition()).not.toThrow();
    expect(peekReadingPosition()).toBeNull();
  });
});

describe('restoreScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('scrolls at once when the page is already tall enough', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 4000,
    });
    restoreScroll(1000);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000, left: 0, behavior: 'instant' });
  });

  it('waits for the content to load, then scrolls', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    let height = 900;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: () => height,
    });
    restoreScroll(1000);
    expect(scrollTo).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(scrollTo).not.toHaveBeenCalled();
    height = 5000;
    vi.advanceTimersByTime(60);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000, left: 0, behavior: 'instant' });
  });

  it('gives up after the allowed attempts and scrolls as far as it can', () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 900,
    });
    restoreScroll(1000, 3);
    vi.advanceTimersByTime(1000);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});

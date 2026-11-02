import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  isValidMonthDay,
  loadSettings,
  saveSettings,
} from './quizSettings';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('quiz settings', () => {
  it('start with a random day off and no birthday', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('are saved in this browser and read back', () => {
    saveSettings({ randomToday: true, birthday: { month: 9, day: 21 } });
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '')).toEqual({
      randomToday: true,
      birthday: { month: 9, day: 21 },
    });
    expect(loadSettings()).toEqual({ randomToday: true, birthday: { month: 9, day: 21 } });
  });

  it('accept 29 February but no other impossible date', () => {
    expect(isValidMonthDay(2, 29)).toBe(true);
    expect(isValidMonthDay(2, 30)).toBe(false);
    expect(isValidMonthDay(4, 31)).toBe(false);
    expect(isValidMonthDay(13, 1)).toBe(false);
    expect(isValidMonthDay(0, 5)).toBe(false);
    expect(isValidMonthDay('9', 21)).toBe(false);
    expect(isValidMonthDay(9, 2.5)).toBe(false);
  });

  it('fall back to the default for anything broken or out of range', () => {
    for (const raw of ['not json', 'null', '"text"', '[]', '{"birthday":{"month":2,"day":31}}']) {
      localStorage.setItem(SETTINGS_KEY, raw);
      expect(loadSettings().birthday, raw).toBeNull();
    }
    localStorage.setItem(SETTINGS_KEY, '{"randomToday":"yes","birthday":{"month":9,"day":21}}');
    expect(loadSettings()).toEqual({ randomToday: false, birthday: { month: 9, day: 21 } });
  });

  it('work when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
  });
});

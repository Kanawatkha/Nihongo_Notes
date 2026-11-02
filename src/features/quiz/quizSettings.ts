import { daysInMonth } from '@/lib/readings56';

/**
 * What the student sets for the date cards, kept in this browser only (`localStorage`), so each
 * person and each device has its own: the own birthday and whether "today" picks a random day.
 */
export type QuizSettings = {
  /** `วันนี้` deals a random date instead of the date of the device. */
  randomToday: boolean;
  /** The own birthday, or null while it is not set. */
  birthday: { month: number; day: number } | null;
};

export const DEFAULT_SETTINGS: QuizSettings = { randomToday: false, birthday: null };

export const SETTINGS_KEY = 'nihongo-quiz-settings';

/** A month and day that exist (29 February counts: birthdays do). */
export const isValidMonthDay = (month: unknown, day: unknown): boolean =>
  typeof month === 'number' &&
  typeof day === 'number' &&
  Number.isInteger(month) &&
  Number.isInteger(day) &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= daysInMonth(2024, month);

/** Reads the saved settings; anything missing, broken or out of range falls back to the default. */
export function loadSettings(): QuizSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return DEFAULT_SETTINGS;
    const { randomToday, birthday } = data as Record<string, unknown>;
    const entry = birthday as { month?: unknown; day?: unknown } | null | undefined;
    return {
      randomToday: randomToday === true,
      birthday:
        entry && isValidMonthDay(entry.month, entry.day)
          ? { month: entry.month as number, day: entry.day as number }
          : null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saves the settings; where storage is not available (a private window) they last for the visit. */
export function saveSettings(settings: QuizSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage blocked or full: nothing to do
  }
}

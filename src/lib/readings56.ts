import { READING_TABLES } from './readings';

/**
 * Chapter 5-6 readings: counters, months, days, weekdays, years and the -masu forms. Built only
 * from content/vocab/ch5-6.md (sections 2 to 4); tests/readings56.test.ts checks every table here
 * against the tables of that file, so the quiz cannot teach a reading that is not in the slides.
 */

const { DIGITS, TENS } = READING_TABLES;

export type CounterKind = 'general' | 'mai' | 'hon';

const GENERAL_COUNTER = [
  '',
  'hitotsu',
  'futatsu',
  'mittsu',
  'yottsu',
  'itsutsu',
  'muttsu',
  'nanatsu',
  'yattsu',
  'kokonotsu',
  'tō',
];
const MAI_COUNTER = [
  '',
  'ichi-mai',
  'ni-mai',
  'san-mai',
  'yon-mai',
  'go-mai',
  'roku-mai',
  'nana-mai',
  'hachi-mai',
  'kyū-mai',
  'jū-mai',
];
const HON_COUNTER = [
  '',
  'ippon',
  'ni-hon',
  'sam-bon',
  'yon-hon',
  'go-hon',
  'roppon',
  'nana-hon',
  'happon',
  'kyū-hon',
  'juppon',
];
/** Boxed in red in the slides (counter -hon). */
const HON_IRREGULAR = new Set(['ippon', 'roppon', 'happon', 'juppon']);

const COUNTERS: Record<CounterKind, { readings: string[]; label: string }> = {
  general: { readings: GENERAL_COUNTER, label: 'อัน/ชิ้น' },
  mai: { readings: MAI_COUNTER, label: 'แผ่น/ตัว' },
  hon: { readings: HON_COUNTER, label: 'ขวด/ด้าม/แท่ง' },
};

const MONTHS = [
  '',
  'ichi gatsu',
  'ni gatsu',
  'san gatsu',
  'shi gatsu',
  'go gatsu',
  'roku gatsu',
  'shichi gatsu',
  'hachi gatsu',
  'ku gatsu',
  'jū gatsu',
  'jū ichi gatsu',
  'jū ni gatsu',
];
export const MONTH_NAMES = [
  '',
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const DAYS_1_10 = [
  '',
  'tsuitachi',
  'futsu-ka',
  'mik-ka',
  'yok-ka',
  'itsu-ka',
  'mui-ka',
  'nano-ka',
  'yō-ka',
  'kokono-ka',
  'tō-ka',
];
const DAY_UNITS = ['', 'ichi', 'ni', 'san', '', 'go', 'roku', 'shichi', 'hachi', ''];
/** Index = `Date#getUTCDay()`: 0 is Sunday. */
const WEEKDAYS = [
  { thai: 'วันอาทิตย์', stem: 'nichi', meaning: 'sun' },
  { thai: 'วันจันทร์', stem: 'getsu', meaning: 'moon' },
  { thai: 'วันอังคาร', stem: 'ka', meaning: 'fire' },
  { thai: 'วันพุธ', stem: 'sui', meaning: 'water' },
  { thai: 'วันพฤหัสบดี', stem: 'moku', meaning: 'wood' },
  { thai: 'วันศุกร์', stem: 'kin', meaning: 'gold' },
  { thai: 'วันเสาร์', stem: 'do', meaning: 'soil' },
] as const;
/** Spelled with spaces like the slide: `ni sen nijū san nen`, `sen kyū hyaku hachijū kyū nen`. */
const YEAR_THOUSANDS = [
  '',
  'sen',
  'ni sen',
  'san zen',
  'yon sen',
  'go sen',
  'roku sen',
  'nana sen',
  'hassen',
  'kyū sen',
];
const YEAR_HUNDREDS = [
  '',
  'hyaku',
  'ni hyaku',
  'san byaku',
  'yon hyaku',
  'go hyaku',
  'rop pyaku',
  'nana hyaku',
  'hap pyaku',
  'kyū hyaku',
];

export const TABLES_56 = {
  GENERAL_COUNTER,
  MAI_COUNTER,
  HON_COUNTER,
  HON_IRREGULAR,
  MONTHS,
  DAYS_1_10,
  WEEKDAYS,
};

export const counterLabel = (kind: CounterKind): string => COUNTERS[kind].label;

/** The counter word for 1-10 items, for example `ni-mai`. */
export function counterReading(kind: CounterKind, count: number): string {
  const reading = COUNTERS[kind].readings[count];
  if (!Number.isInteger(count) || !reading) {
    throw new RangeError(`counterReading supports 1-10, got ${count}`);
  }
  return reading;
}

export const isCounterIrregular = (kind: CounterKind, count: number): boolean =>
  kind === 'hon' && HON_IRREGULAR.has(counterReading(kind, count));

export function monthReading(month: number): string {
  const reading = MONTHS[month];
  if (!Number.isInteger(month) || !reading) {
    throw new RangeError(`monthReading supports 1-12, got ${month}`);
  }
  return reading;
}

/** Shown in bold in the slides: April and September. */
export const isMonthIrregular = (month: number): boolean => month === 4 || month === 9;

/** Day of the month 1-31: -ka for 1-10, -nichi after, with the exceptions of the slide. */
export function dayReading(day: number): string {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`dayReading supports 1-31, got ${day}`);
  }
  if (day <= 10) return DAYS_1_10[day] ?? '';
  if (day === 20) return 'hatsu-ka';
  const tens = day < 20 ? 'jū' : day < 30 ? 'nijū' : 'sanjū';
  const unit = day % 10;
  if (unit === 0) return `${tens}-nichi`;
  if (unit === 4) return `${tens} yok-ka`;
  if (unit === 9) return `${tens} ku-nichi`;
  return `${tens} ${DAY_UNITS[unit]}-nichi`;
}

/** Bold in the slides: 1-10, 14, 19, 20, 24 and 29. */
export const isDayIrregular = (day: number): boolean =>
  day <= 10 || day === 14 || day === 19 || day === 20 || day === 24 || day === 29;

export const weekdayThai = (index: number): string => WEEKDAYS[index]?.thai ?? '';
export const weekdayReading = (index: number): string => `${WEEKDAYS[index]?.stem}-yōbi`;
export const weekdayMeaning = (index: number): string => WEEKDAYS[index]?.meaning ?? '';

/** Year (Christian era) 1000-9999 as in section 3.2: thousands, hundreds, tens, units, `nen`. */
export function yearReading(year: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError(`yearReading supports 1000-9999, got ${year}`);
  }
  const rest = year % 100;
  const units = rest % 10;
  return [
    YEAR_THOUSANDS[Math.floor(year / 1000)],
    YEAR_HUNDREDS[Math.floor(year / 100) % 10],
    TENS[Math.floor(rest / 10)],
    units ? DIGITS[units] : '',
    'nen',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Thai (Buddhist era) year to Christian era, as in the slide: 2566 is 2023. */
export const buddhistToChristian = (year: number): number => year - 543;

export type VerbForm = 'masu' | 'masen' | 'mashita' | 'masendeshita';

export const VERB_FORMS: Record<VerbForm, { tense: string; polarity: string }> = {
  masu: { tense: 'ปัจจุบัน / อนาคต', polarity: 'บอกเล่า' },
  masen: { tense: 'ปัจจุบัน / อนาคต', polarity: 'ปฏิเสธ' },
  mashita: { tense: 'อดีต', polarity: 'บอกเล่า' },
  masendeshita: { tense: 'อดีต', polarity: 'ปฏิเสธ' },
};

/** Verb stems from section 4.2: the form is the stem plus `masu`, `masen`, `mashita` or `masendeshita`. */
export const VERBS = [
  { stem: 'iki', thai: 'ไป' },
  { stem: 'ki', thai: 'มา' },
  { stem: 'kaeri', thai: 'กลับ' },
] as const;

/** Days in a month of the Gregorian calendar. */
export const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** 0 is Sunday ... 6 is Saturday, from the real calendar. */
export const weekdayIndex = (year: number, month: number, day: number): number =>
  new Date(Date.UTC(year, month - 1, day)).getUTCDay();

/**
 * Romaji readings of numbers, clock times, prices and phone numbers, built only from the tables in
 * content/vocab/ch3-4.md (sections 2.2, 3.1, 3.2) and spelled like the answers in
 * content/exam/quiz2-ch3-4.md: thousands, hundreds and tens are written as one word (`sanzen`,
 * `roppyaku`, `nijū`), `man` stays separate (`ichi man`). Where the slides give two readings the
 * one used in the exam answers is taken (4 = yon, 7 = nana). tests/readings.test.ts checks every
 * table here against the slides, so a wrong reading fails the build instead of reaching a card.
 */

/** One spoken chunk with the number it stands for, for the answer breakdown on a card. */
export type ReadingPart = {
  label: string;
  reading: string;
  /** The reading must be memorized: it is bold in the slides. */
  irregular: boolean;
};

const DIGITS = ['zero', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyū'] as const;
const TENS = ['', 'jū', 'nijū', 'sanjū', 'yonjū', 'gojū', 'rokujū', 'nanajū', 'hachijū', 'kyūjū'];
const HUNDREDS = [
  '',
  'hyaku',
  'nihyaku',
  'sanbyaku',
  'yonhyaku',
  'gohyaku',
  'roppyaku',
  'nanahyaku',
  'happyaku',
  'kyūhyaku',
];
const THOUSANDS = [
  '',
  'sen',
  'nisen',
  'sanzen',
  'yonsen',
  'gosen',
  'rokusen',
  'nanasen',
  'hassen',
  'kyūsen',
];
const HOURS = [
  '',
  'ichi-ji',
  'ni-ji',
  'san-ji',
  'yo-ji',
  'go-ji',
  'roku-ji',
  'shichi-ji',
  'hachi-ji',
  'ku-ji',
  'jū-ji',
  'jū ichi-ji',
  'jū ni-ji',
];
const MINUTE_UNITS = [
  '',
  'ip-pun',
  'ni-fun',
  'san-pun',
  'yon-pun',
  'go-fun',
  'rop-pun',
  'nana-fun',
  'hap-pun',
  'kyū-fun',
];

/** Readings printed in bold in the slides (spaces removed), see section 2.2 and 3.2. */
const IRREGULAR = new Set([
  'yo-ji',
  'shichi-ji',
  'ku-ji',
  'ip-pun',
  'san-pun',
  'yon-pun',
  'rop-pun',
  'hap-pun',
  'jup-pun',
  'sanjup-pun',
  'hyap-pun',
  'sanbyaku',
  'roppyaku',
  'happyaku',
  'sen',
  'sanzen',
  'hassen',
]);

export const READING_TABLES = { DIGITS, TENS, HUNDREDS, THOUSANDS, HOURS, MINUTE_UNITS, IRREGULAR };

const isIrregular = (reading: string): boolean => IRREGULAR.has(reading.replace(/\s+/g, ''));

const part = (label: string, reading: string): ReadingPart => ({
  label,
  reading,
  irregular: isIrregular(reading),
});

export const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Upper bound of the number reader: up to the ten-thousands, as the slides drill. */
export const MAX_NUMBER = 99_999;

/** 1 to 99,999, read place by place from the left (section 3.3). */
export function numberParts(value: number): ReadingPart[] {
  if (!Number.isInteger(value) || value < 1 || value > MAX_NUMBER) {
    throw new RangeError(`numberParts supports 1-${MAX_NUMBER}, got ${value}`);
  }
  const man = Math.floor(value / 10_000);
  const thousands = Math.floor(value / 1000) % 10;
  const hundreds = Math.floor(value / 100) % 10;
  const tens = Math.floor(value / 10) % 10;
  const units = value % 10;

  const parts: ReadingPart[] = [];
  if (man) parts.push(part(formatNumber(man * 10_000), `${DIGITS[man]} man`));
  if (thousands) parts.push(part(formatNumber(thousands * 1000), THOUSANDS[thousands] ?? ''));
  if (hundreds) parts.push(part(String(hundreds * 100), HUNDREDS[hundreds] ?? ''));
  const rest = tens * 10 + units;
  if (rest) {
    const reading = [TENS[tens], units ? DIGITS[units] : ''].filter(Boolean).join(' ');
    parts.push(part(String(rest), reading));
  }
  return parts;
}

export const joinParts = (parts: ReadingPart[]): string =>
  parts.map((item) => item.reading).join(' ');

export const readNumber = (value: number): string => joinParts(numberParts(value));

/** Minutes 1-59: `-fun` or `-pun` by the last digit; whole tens end in `-jup-pun` (section 2.2). */
export function minuteReading(minute: number): string {
  if (!Number.isInteger(minute) || minute < 1 || minute > 59) {
    throw new RangeError(`minuteReading supports 1-59, got ${minute}`);
  }
  const tens = Math.floor(minute / 10);
  const units = minute % 10;
  if (units === 0) return tens === 1 ? 'jup-pun' : `${DIGITS[tens]}jup-pun`;
  return [TENS[tens], MINUTE_UNITS[units]].filter(Boolean).join(' ');
}

/** Hours 1-12 (`yo-ji`, `shichi-ji`, `ku-ji` are the irregular ones). */
export function hourReading(hour: number): string {
  const reading = HOURS[hour];
  if (!Number.isInteger(hour) || !reading) {
    throw new RangeError(`hourReading supports 1-12, got ${hour}`);
  }
  return reading;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** `16.30 น.` as written in the exam guide. */
export const formatClock = (hour24: number, minute: number): string =>
  `${pad(hour24)}.${pad(minute)} น.`;

/**
 * A 24-hour clock time (hours 1-11 and 13-23, so gozen and gogo are never ambiguous) as spoken:
 * `gogo yo-ji han`. Half past is `han`, as in the exam answers.
 */
export function clockParts(hour24: number, minute: number): ReadingPart[] {
  if (hour24 < 1 || hour24 > 23 || hour24 === 12 || minute < 0 || minute > 59) {
    throw new RangeError(`clockParts supports 1-11 and 13-23 hours, got ${hour24}:${minute}`);
  }
  const morning = hour24 < 12;
  const hour = morning ? hour24 : hour24 - 12;
  const parts: ReadingPart[] = [
    part(morning ? 'ก่อนเที่ยง' : 'หลังเที่ยง', morning ? 'gozen' : 'gogo'),
    part(`${hour} โมง`, hourReading(hour)),
  ];
  if (minute === 30) parts.push(part('ครึ่ง', 'han'));
  else if (minute > 0) parts.push(part(`${minute} นาที`, minuteReading(minute)));
  return parts;
}

/** Phone number digits, one by one; each hyphen becomes `no` (section 3 of the exam guide). */
export function phoneParts(phone: string): ReadingPart[] {
  if (!/^\d+(-\d+)*$/.test(phone)) throw new RangeError(`Not a phone number: ${phone}`);
  return phone
    .split('-')
    .map((group) => part(group, [...group].map((digit) => DIGITS[Number(digit)]).join(' ')));
}

export const phoneReading = (phone: string): string =>
  phoneParts(phone)
    .map((item) => item.reading)
    .join(' no ');

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

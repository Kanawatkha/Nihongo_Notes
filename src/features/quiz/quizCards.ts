import type { QuizKind, QuizSetConfig } from '@/config/quiz';
import type { ContentFile, ContentNode, VocabEntry } from '@/content/types';
import {
  capitalize,
  clockParts,
  formatClock,
  formatNumber,
  joinParts,
  numberParts,
  phoneParts,
  phoneReading,
  type ReadingPart,
} from '@/lib/readings';
import {
  MONTH_NAMES,
  VERBS,
  VERB_FORMS,
  buddhistToChristian,
  counterLabel,
  counterReading,
  dayReading,
  daysInMonth,
  isCounterIrregular,
  isDayIrregular,
  isMonthIrregular,
  monthReading,
  weekdayIndex,
  weekdayMeaning,
  weekdayReading,
  weekdayThai,
  yearReading,
  type VerbForm,
} from '@/lib/readings56';
import { plainText } from '@/lib/text';

/** Returns a number in [0, 1), like Math.random. Tests pass a seeded one. */
export type Rng = () => number;

/** One word from the vocabulary file. */
export type QuizWord = {
  /** Romaji exactly as in the slides, alternatives included (`konpyūtā = pasokon`). */
  romaji: string;
  /** First spelling, used inside an answer sentence. */
  word: string;
  /** Other spellings (`pasokon`). */
  alternatives: string[];
  thai: string;
  /** A trailing `(...)` remark of the meaning, shown smaller. */
  note?: string;
};

export type QuizCard = {
  /** Unique per deal, so a new card always animates in. */
  id: string;
  kind: QuizKind;
  /** Same value for the same word or number, used to avoid showing it twice in a row. */
  key: string;
  /** The examiner's question in romaji; absent for Thai -> Japanese words. */
  question?: string;
  /** What the examiner shows: a Thai word, a time, a phone number or a price. */
  prompt: string;
  promptIsThai: boolean;
  note?: string;
  /** The full answer to say. */
  answer: string;
  alternatives?: string[];
  /** Chunks of the answer with the number each one stands for. */
  parts?: ReadingPart[];
};

export type QuizDeck = {
  kinds: QuizKind[];
  words: Partial<Record<QuizKind, QuizWord[]>>;
  config: QuizSetConfig;
};

const PLACEHOLDER = /\.\.|\+/;

function splitMeaning(meaning: string): { thai: string; note?: string } {
  const match = /^(.+?)\s*\(([^()]*)\)$/.exec(meaning.trim());
  return match?.[1] && match[2] ? { thai: match[1], note: match[2] } : { thai: meaning.trim() };
}

export function toQuizWord(entry: VocabEntry): QuizWord {
  const romaji = plainText(entry.romaji).trim();
  const [word = romaji, ...alternatives] = romaji.split(/\s+[=/]\s+/);
  return { romaji, word, alternatives, ...splitMeaning(plainText(entry.meaning)) };
}

function entriesBelow(node: ContentNode, out: VocabEntry[] = []): VocabEntry[] {
  for (const block of node.blocks) if (block.t === 'vocab') out.push(...block.entries);
  for (const child of node.children) entriesBelow(child, out);
  return out;
}

/** Rows of the two-column `ประโยค | ความหมาย` tables below a node: a sentence and its Thai meaning. */
function sentencesBelow(node: ContentNode, out: QuizWord[] = []): QuizWord[] {
  for (const block of node.blocks) {
    if (block.t !== 'table' || plainText(block.head[0] ?? []) !== 'ประโยค') continue;
    for (const row of block.rows) {
      const sentence = plainText(row[0] ?? []).trim();
      const meaning = plainText(row[1] ?? []).trim();
      if (sentence && meaning)
        out.push({ romaji: sentence, word: sentence, alternatives: [], thai: meaning });
    }
  }
  for (const child of node.children) sentencesBelow(child, out);
  return out;
}

function findNode(nodes: ContentNode[], number: string): ContentNode | undefined {
  for (const node of nodes) {
    if (node.number?.replace(/\.$/, '') === number) return node;
    const found = findNode(node.children, number);
    if (found) return found;
  }
  return undefined;
}

/** Which words of a section fit a sentence kind (countries and languages share one section). */
const KEEP: Partial<Record<QuizKind, (word: QuizWord) => boolean>> = {
  country: (word) => word.thai.startsWith('ประเทศ'),
  magazine: (word) => word.thai.startsWith('ภาษา'),
  kochira: (word) => !word.note?.includes('ชื่อสมมุติ'),
};

function unique(words: QuizWord[]): QuizWord[] {
  const seen = new Set<string>();
  return words.filter((word) => {
    const key = `${word.romaji}|${word.thai}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Collects the words of every word-based kind of a set. Generated kinds need no words. */
export function buildDeck(file: ContentFile, config: QuizSetConfig): QuizDeck {
  const words: QuizDeck['words'] = {};
  words.vocab = unique(
    config.vocabParts
      .flatMap((part) => {
        const node = findNode(file.nodes, part);
        return node ? entriesBelow(node) : [];
      })
      .filter((entry) => !PLACEHOLDER.test(plainText(entry.romaji)))
      .map(toQuizWord),
  );
  for (const [kind, number] of Object.entries(config.groups) as [QuizKind, string][]) {
    const node = findNode(file.nodes, number);
    if (kind === 'sentence') {
      words[kind] = unique(node ? sentencesBelow(node) : []);
      continue;
    }
    const keep = KEEP[kind] ?? (() => true);
    words[kind] = unique(
      (node ? entriesBelow(node) : [])
        .filter((entry) => !PLACEHOLDER.test(plainText(entry.romaji)))
        .map(toQuizWord)
        .filter(keep),
    );
  }
  // A word kind with no words (a section renamed in the Markdown) is left out rather than broken
  const kinds = config.kinds.filter((kind) => !(kind in words) || (words[kind]?.length ?? 0) > 0);
  return { kinds, words, config };
}

const pick = <T>(rng: Rng, items: readonly T[]): T => {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick from an empty list');
  return item;
};

const between = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

const SENTENCES: Partial<Record<QuizKind, (word: string) => string>> = {
  thing: (word) => `Kore wa ${word} desu.`,
  person: (word) => `Anohito wa ${word} desu.`,
  country: (word) => `Anohito wa ${word} kara kimashita.`,
  magazine: (word) => `Kore wa ${word} no zasshi desu.`,
  kochira: (word) => `Kochira wa ${word} desu.`,
  place: (word) => `Koko wa ${word} desu.`,
};

type CardBody = Omit<QuizCard, 'id'>;

/** A word card: Thai -> Japanese, or the sentence answer of a picture question. */
export function wordCard(kind: QuizKind, word: QuizWord, config: QuizSetConfig): CardBody {
  const sentence = SENTENCES[kind];
  const question = config.questions[kind];
  return {
    kind,
    key: `${kind}:${word.romaji}`,
    ...(question ? { question } : {}),
    prompt: kind === 'magazine' ? `นิตยสาร${word.thai}` : word.thai,
    promptIsThai: true,
    ...(word.note ? { note: word.note } : {}),
    answer: sentence ? sentence(word.word) : word.romaji,
    ...(sentence && word.alternatives.length > 0 ? { alternatives: word.alternatives } : {}),
  };
}

/** Exam pattern 2: a clock time, gozen or gogo. */
export function timeCard(hour24: number, minute: number, config: QuizSetConfig): CardBody {
  const parts = clockParts(hour24, minute);
  return {
    kind: 'time',
    key: `time:${hour24}:${minute}`,
    question: config.questions.time ?? '',
    prompt: formatClock(hour24, minute),
    promptIsThai: false,
    answer: `Ima ${joinParts(parts)} desu.`,
    parts,
  };
}

/** Exam pattern 3: digits one by one, groups joined with `no`. */
export function phoneCard(phone: string, config: QuizSetConfig): CardBody {
  return {
    kind: 'phone',
    key: `phone:${phone}`,
    question: config.questions.phone ?? '',
    prompt: phone,
    promptIsThai: false,
    answer: `${capitalize(phoneReading(phone))} desu.`,
    parts: phoneParts(phone),
  };
}

/** Exam pattern 4: a price in yen. */
export function priceCard(value: number, config: QuizSetConfig): CardBody {
  const parts = numberParts(value);
  return {
    kind: 'price',
    key: `price:${value}`,
    question: config.questions.price ?? '',
    prompt: `${formatNumber(value)} เยน`,
    promptIsThai: false,
    answer: `${capitalize(joinParts(parts))} en desu.`,
    parts,
  };
}

type Clock = { hour: number; minute: number };

/** Exam pattern 5: from a start time to an end time. */
export function hoursCard(
  start: Clock,
  end: Clock,
  subject: { question: string; thai: string },
): CardBody {
  const from = clockParts(start.hour, start.minute);
  const to = clockParts(end.hour, end.minute);
  const clock = (time: Clock) => formatClock(time.hour, time.minute).replace(' น.', '');
  return {
    kind: 'hours',
    key: `hours:${subject.thai}:${start.hour}:${start.minute}-${end.hour}:${end.minute}`,
    question: subject.question,
    prompt: `${subject.thai} ${clock(start)}-${clock(end)} น.`,
    promptIsThai: false,
    answer: `${capitalize(joinParts(from))} kara ${joinParts(to)} made desu.`,
    parts: [
      ...from,
      { label: 'ตั้งแต่', reading: 'kara', irregular: false },
      ...to,
      { label: 'ถึง', reading: 'made', irregular: false },
    ],
  };
}

const FIRST_OF = (text: string): string => capitalize(text);

/** Counter card: order something with the right counter, for example `Ringo o futatsu kudasai.` */
export function counterCard(
  item: { word: string; thai: string; counter: 'general' | 'mai' | 'hon' },
  count: number,
): CardBody {
  const reading = counterReading(item.counter, count);
  return {
    kind: 'counter',
    key: `counter:${item.word}:${count}`,
    prompt: `${item.thai} × ${count}`,
    promptIsThai: false,
    note: 'ขอซื้อ',
    answer: `${FIRST_OF(item.word)} o ${reading} kudasai.`,
    parts: [
      { label: item.thai, reading: item.word, irregular: false },
      { label: 'คำช่วย', reading: 'o', irregular: false },
      {
        label: `${count} · ${counterLabel(item.counter)}`,
        reading,
        irregular: isCounterIrregular(item.counter, count),
      },
      { label: 'ขอ', reading: 'kudasai', irregular: false },
    ],
  };
}

export function monthCard(month: number, config: QuizSetConfig): CardBody {
  const reading = monthReading(month);
  return {
    kind: 'month',
    key: `month:${month}`,
    question: config.questions.month ?? '',
    prompt: MONTH_NAMES[month] ?? '',
    promptIsThai: true,
    answer: `${capitalize(reading)} desu.`,
    parts: [{ label: `เดือน ${month}`, reading, irregular: isMonthIrregular(month) }],
  };
}

export function dayCard(day: number, config: QuizSetConfig): CardBody {
  const reading = dayReading(day);
  return {
    kind: 'day',
    key: `day:${day}`,
    question: config.questions.day ?? '',
    prompt: `วันที่ ${day}`,
    promptIsThai: true,
    answer: `${capitalize(reading)} desu.`,
    parts: [{ label: `วันที่ ${day}`, reading, irregular: isDayIrregular(day) }],
  };
}

export function weekdayCard(index: number, config: QuizSetConfig): CardBody {
  const reading = weekdayReading(index);
  return {
    kind: 'weekday',
    key: `weekday:${index}`,
    question: config.questions.weekday ?? '',
    prompt: weekdayThai(index),
    promptIsThai: true,
    answer: `${capitalize(reading)} desu.`,
    parts: [
      { label: weekdayMeaning(index), reading: reading.replace('-yōbi', ''), irregular: false },
      { label: 'วัน', reading: 'yōbi', irregular: false },
    ],
  };
}

/** A full date as in the slide practice: Thai year (Buddhist era) in, Christian-era reading out. */
export function dateCard(
  buddhistYear: number,
  month: number,
  day: number,
  weekday: number = weekdayIndex(buddhistToChristian(buddhistYear), month, day),
): CardBody {
  const year = buddhistToChristian(buddhistYear);
  const yearText = yearReading(year);
  const monthText = monthReading(month);
  const dayText = dayReading(day);
  const weekdayText = weekdayReading(weekday);
  return {
    kind: 'date',
    key: `date:${buddhistYear}-${month}-${day}-${weekday}`,
    prompt: `${weekdayThai(weekday)}ที่ ${day} ${MONTH_NAMES[month]} ${buddhistYear}`,
    promptIsThai: true,
    answer: `${capitalize(yearText)} ${monthText} ${dayText} ${weekdayText} desu.`,
    parts: [
      { label: `ค.ศ. ${year}`, reading: yearText, irregular: false },
      { label: MONTH_NAMES[month] ?? '', reading: monthText, irregular: isMonthIrregular(month) },
      { label: `วันที่ ${day}`, reading: dayText, irregular: isDayIrregular(day) },
      { label: weekdayThai(weekday), reading: weekdayText, irregular: false },
    ],
  };
}

/** `ไป · อดีต · ปฏิเสธ` -> `Ikimasendeshita.` */
export function verbCard(verb: (typeof VERBS)[number], form: VerbForm): CardBody {
  const info = VERB_FORMS[form];
  const reading = `${verb.stem}${form}`;
  return {
    kind: 'verb',
    key: `verb:${verb.stem}:${form}`,
    prompt: `${verb.thai} · ${info.tense} · ${info.polarity}`,
    promptIsThai: true,
    answer: `${capitalize(reading)}.`,
    parts: [
      { label: verb.thai, reading: verb.stem, irregular: false },
      { label: `${info.polarity} · ${info.tense}`, reading: form, irregular: false },
    ],
  };
}

function randomMinute(rng: Rng): number {
  const roll = rng();
  if (roll < 0.25) return 0;
  if (roll < 0.45) return 30;
  let minute = between(rng, 1, 59);
  if (minute === 30) minute = 31;
  return minute;
}

/** Hours 1-11 and 13-23, so the card never asks about noon or midnight. */
const randomHour24 = (rng: Rng): number => {
  const hour = between(rng, 1, 22);
  return hour >= 12 ? hour + 1 : hour;
};

function randomPhone(rng: Rng): string {
  const digits = (count: number) =>
    Array.from({ length: count }, () => String(between(rng, 0, 9))).join('');
  if (rng() < 0.7) return `0${pick(rng, [9, 8, 7])}0-${digits(4)}-${digits(4)}`;
  return `0${between(rng, 1, 9)}-${digits(4)}-${digits(4)}`;
}

/** Prices from 100 to 99,999 yen; often rounded, like prices in a shop. */
function randomPrice(rng: Rng): number {
  const [min, max] = pick(rng, [
    [100, 999],
    [1000, 9999],
    [10_000, 99_999],
  ] as const);
  const value = between(rng, min, max);
  const roll = rng();
  const step = roll < 0.35 ? Math.max(100, min / 10) : roll < 0.6 ? 10 : 1;
  return Math.max(min, Math.floor(value / step) * step);
}

function randomHours(rng: Rng): { start: Clock; end: Clock } {
  const half = () => (rng() < 0.25 ? 30 : 0);
  if (rng() < 0.75) {
    return {
      start: { hour: between(rng, 7, 11), minute: half() },
      end: { hour: between(rng, 13, 21), minute: half() },
    };
  }
  const startHour = between(rng, 13, 18);
  return {
    start: { hour: startHour, minute: half() },
    end: { hour: between(rng, startHour + 1, 22), minute: half() },
  };
}

/** A new random card of a generated kind. */
export function generatedCard(kind: QuizKind, config: QuizSetConfig, rng: Rng): CardBody {
  switch (kind) {
    case 'time':
      return timeCard(randomHour24(rng), randomMinute(rng), config);
    case 'phone':
      return phoneCard(randomPhone(rng), config);
    case 'price':
      return priceCard(randomPrice(rng), config);
    case 'hours': {
      const { start, end } = randomHours(rng);
      return hoursCard(start, end, pick(rng, config.hoursSubjects ?? []));
    }
    case 'counter':
      return counterCard(pick(rng, config.counters ?? []), between(rng, 1, 10));
    case 'month':
      return monthCard(between(rng, 1, 12), config);
    case 'day':
      return dayCard(between(rng, 1, 31), config);
    case 'weekday':
      return weekdayCard(between(rng, 0, 6), config);
    case 'date': {
      // Thai years around today, so the conversion to the Christian era is a real exercise
      const buddhistYear = between(rng, 2540, 2570);
      const month = between(rng, 1, 12);
      const day = between(rng, 1, daysInMonth(buddhistToChristian(buddhistYear), month));
      return dateCard(buddhistYear, month, day);
    }
    case 'verb':
      return verbCard(pick(rng, VERBS), pick(rng, Object.keys(VERB_FORMS) as VerbForm[]));
    default:
      throw new Error(`${kind} is not a generated kind`);
  }
}

export type Dealer = {
  /** Next card of `kind`, or of a random kind when `kind` is null. */
  deal: (kind: QuizKind | null) => QuizCard;
  /** Puts a word the student did not know back a few cards ahead. */
  again: (card: QuizCard) => void;
};

/**
 * Deals cards. Words come from a shuffled bag per kind, so every word is shown once before any
 * repeats; generated kinds make a new number each time. The same card never comes twice in a row.
 */
export function createDealer(deck: QuizDeck, rng: Rng = Math.random): Dealer {
  const bags = new Map<QuizKind, QuizWord[]>();
  let count = 0;
  let lastKey = '';

  const refill = (kind: QuizKind): QuizWord[] => {
    const bag = [...(deck.words[kind] ?? [])];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j] as QuizWord, bag[i] as QuizWord];
    }
    bags.set(kind, bag);
    return bag;
  };

  const chooseKind = (): QuizKind => {
    // Like the exam: about half the cards are plain words, the rest are the question patterns
    const others = deck.kinds.filter((kind) => kind !== 'vocab');
    if (deck.kinds.includes('vocab') && (others.length === 0 || rng() < 0.4)) return 'vocab';
    return pick(rng, others);
  };

  const draw = (kind: QuizKind): CardBody => {
    if (!(kind in deck.words)) return generatedCard(kind, deck.config, rng);
    let bag = bags.get(kind) ?? refill(kind);
    if (bag.length === 0) bag = refill(kind);
    const word = bag.pop();
    if (!word) throw new Error(`No words for ${kind}`);
    return wordCard(kind, word, deck.config);
  };

  return {
    deal: (kind) => {
      const chosen = kind && deck.kinds.includes(kind) ? kind : null;
      let body = draw(chosen ?? chooseKind());
      for (let tries = 0; body.key === lastKey && tries < 5; tries++) {
        body = draw(chosen ?? body.kind);
      }
      lastKey = body.key;
      count += 1;
      return { ...body, id: `card-${count}` };
    },
    again: (card) => {
      const word = deck.words[card.kind]?.find(
        (item) => `${card.kind}:${item.romaji}` === card.key,
      );
      const bag = bags.get(card.kind);
      if (!word || !bag) return;
      // The bag is drawn from the end: put the word 3 to 6 cards ahead
      const ahead = between(rng, 3, 6);
      bag.splice(Math.max(0, bag.length - ahead), 0, word);
    },
  };
}

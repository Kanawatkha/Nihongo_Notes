// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../scripts/build-content/index.ts';
import { textOf } from '../scripts/build-content/parse.ts';
import { QUIZ_SETS, setKinds, type QuizSetConfig } from '../src/config/quiz.ts';
import type { Block, ContentFile, ContentNode } from '../src/content/types.ts';
import {
  adjectiveCard,
  birthdayCard,
  buildDeck,
  counterCard,
  createDealer,
  dateAskCard,
  dateCard,
  dayCard,
  generatedCard,
  hoursCard,
  monthCard,
  originCard,
  phoneCard,
  priceCard,
  timeCard,
  todayCard,
  verbCard,
  weekdayCard,
  wordCard,
  type Rng,
} from '../src/features/quiz/quizCards.ts';
import { counterReading, MONTH_NAMES } from '../src/lib/readings56.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = buildContent(root).files;
const fileOf = (collection: string, key: string): ContentFile => {
  const file = files.find((item) => item.collection === collection && item.key === key);
  if (!file) throw new Error(`${collection}/${key} not found`);
  return file;
};
const set = (key: string): QuizSetConfig => {
  const config = QUIZ_SETS[key];
  if (!config) throw new Error(`no quiz set ${key}`);
  return config;
};
const deckOf = (key: string) =>
  buildDeck(
    set(key).files.map((file) => fileOf('vocab', file)),
    set(key),
  );

/** The exam guide that each set mirrors. */
const EXAM_OF: Record<string, string> = {
  'ch1-2': 'quiz1-ch1-2',
  'ch3-4': 'quiz2-ch3-4',
  'ch5-6': 'quiz3-ch5-6',
  final: 'final-ch1-6',
};

/** Deterministic random numbers (mulberry32), so failures can be replayed. */
function seeded(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every text string in a file, one per line, to search for sentences copied from the slides. */
function allText(file: ContentFile): string {
  const out: string[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.v === 'string') out.push(record.v);
      Object.values(record).forEach(visit);
    }
  };
  visit(file);
  return out.join('\n').toLowerCase();
}

/** Compares answers the way they are spoken: case, spaces, hyphens and full stops do not matter. */
const spoken = (text: string): string => text.toLowerCase().replace(/[\s.-]+/g, '');
/** Question marks and full stops are not compared: `Nan gatsu desuka?` is a table cell without `?`. */
const plain = (value: string) => value.toLowerCase().replace(/[?.]/g, '');

type Table = Extract<Block, { t: 'table' }>;

function tables(nodes: ContentNode[], out: Table[] = []) {
  for (const node of nodes) {
    for (const block of node.blocks) if (block.t === 'table') out.push(block);
    tables(node.children, out);
  }
  return out;
}

const patternTable = (key: string): Table | undefined =>
  tables(fileOf('exam', key).nodes).find(
    (table) => table.head.length === 4 && textOf(table.head[2] ?? []) === 'ตอบ',
  );

const practiceRows = (key: string): string[][] => {
  const table = tables(fileOf('exam', key).nodes).find(
    (item) => textOf(item.head[1] ?? []) === 'โจทย์',
  );
  return (table?.rows ?? []).map((row) => row.map(textOf));
};

describe('sets mirror the exam guides', () => {
  it('has the four sets in chip order with their own parameter', () => {
    expect(Object.keys(QUIZ_SETS)).toEqual(['ch1-2', 'ch3-4', 'ch5-6', 'final']);
    expect(Object.values(QUIZ_SETS).map((item) => item.param)).toEqual([
      '1-2',
      '3-4',
      '5-6',
      '1-6',
    ]);
  });

  it('has the parts and points of each exam', () => {
    const points = (key: string) =>
      set(key).sections.map((section) => [section.id, section.points]);
    expect(points('ch1-2')).toEqual([
      ['intro', 5],
      ['vocab', 5],
      ['answer', 5],
    ]);
    expect(points('ch3-4')).toEqual([
      ['vocab', 5],
      ['answer', 10],
    ]);
    expect(points('ch5-6')).toEqual([
      ['vocab', 5],
      ['answer', 10],
    ]);
    expect(points('final')).toEqual([['answer', 15]]);
  });

  it('has one pattern per question pattern of the exam guide', () => {
    const answerKinds = (key: string) =>
      set(key).sections.find((section) => section.id === 'answer')?.kinds ?? [];
    expect(answerKinds('ch1-2')).toHaveLength(5); // five picture questions
    expect(answerKinds('ch3-4')).toHaveLength(patternTable('quiz2-ch3-4')?.rows.length ?? -1);
    expect(answerKinds('ch5-6')).toHaveLength(patternTable('quiz3-ch5-6')?.rows.length ?? -1);
    expect(answerKinds('final')).toHaveLength(patternTable('final-ch1-6')?.rows.length ?? -1);
    // exam 3 has 10 questions: the pattern weights add up to them
    const weights = set('ch5-6').sections[1]?.kindWeights ?? {};
    expect(Object.values(weights).reduce((sum, value) => sum + (value ?? 0), 0)).toBe(10);
  });

  for (const key of Object.keys(QUIZ_SETS)) {
    it(`${key}: every question sentence is in the slides of that set`, () => {
      const config = set(key);
      const text = [
        ...config.files.map((file) => allText(fileOf('vocab', file))),
        allText(fileOf('exam', EXAM_OF[key] ?? '')),
      ].join('\n');
      const questions = [
        ...Object.values(config.questions),
        ...(config.hoursSubjects ?? []).map((subject) => subject.question),
      ];
      expect(questions.length).toBeGreaterThan(0);
      for (const question of questions) {
        expect(plain(text), question).toContain(plain(question));
      }
    });
  }

  for (const key of ['ch3-4', 'ch5-6', 'final']) {
    it(`${key}: each row of the exam pattern table has a pattern in the set`, () => {
      const config = set(key);
      const questions = [
        ...Object.values(config.questions),
        ...(config.hoursSubjects ?? []).map((subject) => subject.question),
        ...(config.origins ? [`Kore wa doko no ${config.origins.items[0]?.word} desuka?`] : []),
      ];
      for (const row of patternTable(EXAM_OF[key] ?? '')?.rows ?? []) {
        const cell = plain(textOf(row[1] ?? []));
        expect(
          questions.some((question) => cell.includes(plain(question))),
          cell,
        ).toBe(true);
      }
    });
  }

  it('the Thai word of each start-end subject is its meaning in the vocabulary', () => {
    const deck = deckOf('ch3-4');
    for (const subject of set('ch3-4').hoursSubjects ?? []) {
      const romaji = subject.question.split(' ')[0]?.toLowerCase();
      const word = deck.words.vocab?.find((item) => item.word.toLowerCase() === romaji);
      expect(word?.thai, romaji).toBe(subject.thai);
    }
  });

  it('the self-introduction lines are the ones of the exam 1 guide', () => {
    const table = tables(fileOf('exam', 'quiz1-ch1-2').nodes).find(
      (item) => textOf(item.head[0] ?? []) === 'บรรทัด',
    );
    const rows = (table?.rows ?? []).map((row) => row.map(textOf));
    const lines = set('ch1-2').introLines ?? [];
    expect(rows).toHaveLength(5);
    expect(lines).toHaveLength(5);
    rows.forEach(([, romaji, thai], index) => {
      expect(lines[index]?.romaji).toBe(romaji);
      expect(thai?.startsWith(lines[index]?.thai ?? '#')).toBe(true);
    });
  });

  it('every item, country, noun and adjective of the exam 3 cards is in the vocabulary', () => {
    const text = ['ch1-2', 'ch3-4', 'ch5-6'].map((key) => allText(fileOf('vocab', key))).join('\n');
    const config = set('ch5-6');
    const words = [
      ...(config.origins?.items ?? []),
      ...(config.origins?.countries ?? []),
      ...(config.adjectives?.nouns ?? []),
      ...(config.adjectives?.adjectives ?? []),
      ...(config.counters ?? []),
    ];
    for (const item of words) expect(text, item.word).toContain(item.word.toLowerCase());
    for (const item of words) expect(text, item.thai).toContain(item.thai.replace('สี', ''));
  });
});

describe('cards reproduce the worked answers of the exam guides', () => {
  it('quiz 2: time, phone, price and start-end examples', () => {
    const config = set('ch3-4');
    const rows = practiceRows('quiz2-ch3-4');
    expect(rows.length).toBeGreaterThanOrEqual(8);
    for (const [question = '', prompt = '', answer = ''] of rows) {
      const clock = /^(\d{1,2})\.(\d{2}) น\.$/.exec(prompt);
      const range = /^(\d{1,2})\.(\d{2})-(\d{1,2})\.(\d{2}) น\.$/.exec(prompt);
      let card;
      if (range) {
        const subject = config.hoursSubjects?.find((item) => item.question === question);
        if (!subject) throw new Error(question);
        card = hoursCard(
          { hour: Number(range[1]), minute: Number(range[2]) },
          { hour: Number(range[3]), minute: Number(range[4]) },
          subject,
        );
      } else if (clock) card = timeCard(Number(clock[1]), Number(clock[2]), config);
      else if (/^[\d-]+$/.test(prompt)) card = phoneCard(prompt, config);
      else card = priceCard(Number(prompt.replace(/[^\d]/g, '')), config);
      expect(card.question, prompt).toBe(question);
      expect(spoken(card.answer), prompt).toBe(spoken(answer));
    }
  });

  it('quiz 1: every picture question has a card with the same answer', () => {
    const config = set('ch1-2');
    const deck = deckOf('ch1-2');
    const pictures = tables(fileOf('exam', 'quiz1-ch1-2').nodes).find(
      (table) => textOf(table.head[0] ?? []) === 'คำถาม',
    );
    expect(pictures?.rows.length).toBe(5);
    for (const row of pictures?.rows ?? []) {
      const [question, answer] = row.map(textOf) as [string, string];
      const kind = (Object.keys(config.questions) as (keyof typeof config.questions)[]).find(
        (item) => config.questions[item] === question,
      );
      expect(kind, question).toBeDefined();
      const answers = (deck.words[kind ?? 'vocab'] ?? []).map((word) =>
        spoken(wordCard(kind ?? 'vocab', word, config).answer),
      );
      expect(answers, question).toContain(spoken(answer));
    }
  });

  it('quiz 3: every worked example has a card with the same answer', () => {
    const config = set('ch5-6');
    const rows = practiceRows('quiz3-ch5-6');
    expect(rows).toHaveLength(10);
    for (const [question = '', prompt = '', answer = ''] of rows) {
      let produced: string;
      if (question.startsWith('Kore wa doko no')) {
        const item = config.origins?.items.find((entry) => question.includes(entry.word));
        const country = config.origins?.countries.find((entry) =>
          answer.includes(entry.word.toLowerCase()),
        );
        produced = originCard(item ?? never(), country ?? never()).answer;
      } else if (question === 'Kore wa nan desuka?') {
        const [, adjective = '', noun = ''] = /^Kore wa (\S+) (\S+) desu\.$/.exec(answer) ?? [];
        produced = adjectiveCard(
          config.adjectives?.nouns.find((entry) => entry.word === noun) ?? never(),
          config.adjectives?.adjectives.find((entry) => entry.word === adjective) ?? never(),
          config,
        ).answer;
      } else if (question === 'Irasshaimase!') {
        const [, noun = '', reading = ''] = /^Sono (\S+) o (\S+) kudasai$/.exec(answer) ?? [];
        const item = config.counters?.find((entry) => entry.word === noun) ?? never();
        const count = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(
          (n) => counterReading(item.counter, n) === reading,
        );
        produced = counterCard(item, count ?? never(), config).answer;
      } else {
        const [, day = '', monthName = ''] = /^(\d+) (\S+)$/.exec(prompt) ?? [];
        produced = dateAskCard(MONTH_NAMES.indexOf(monthName), Number(day), config).answer;
      }
      expect(spoken(produced), `${question} ${prompt}`).toBe(spoken(answer));
    }
  });
});

function never(): never {
  throw new Error('missing item');
}

describe('decks', () => {
  const deck12 = deckOf('ch1-2');
  const deck34 = deckOf('ch3-4');

  it('keeps every configured kind', () => {
    expect(deck12.kinds).toEqual(setKinds(set('ch1-2')));
    expect(deck34.kinds).toEqual(setKinds(set('ch3-4')));
    expect(deckOf('ch5-6').kinds).toEqual(setKinds(set('ch5-6')));
    expect(deckOf('final').kinds).toEqual(setKinds(set('final')));
  });

  it('takes words only from the set, without pattern rows like `..ji` or `chōdo + เวลา`', () => {
    for (const deck of [deck12, deck34, deckOf('ch5-6')]) {
      for (const words of Object.values(deck.words)) {
        for (const word of words ?? []) {
          expect(word.romaji).not.toMatch(/\.\.|\+/);
          expect(word.thai.length).toBeGreaterThan(0);
        }
      }
    }
    expect(deck34.words.vocab?.map((word) => word.word)).toContain('kaigi-shitsu');
    expect(deck34.words.vocab?.map((word) => word.word)).not.toContain('watashi');
    expect(deck12.words.vocab?.map((word) => word.word)).not.toContain('kaigi-shitsu');
  });

  it('splits sections by meaning: countries, languages, real places', () => {
    expect(deck34.words.place).toHaveLength(14);
    expect(deck12.words.country?.map((word) => word.word)).toEqual([
      'Tai',
      'Nihon',
      'Chūgoku',
      'Amerika',
      'Igirisu',
      'Doitsu',
      'Ōsutoraria',
    ]);
    expect(deck12.words.magazine?.map((word) => word.word)).toEqual([
      'Nihongo',
      'Chūgokugo',
      'Kankokugo',
      'Eigo',
    ]);
    expect(deck12.words.kochira?.map((word) => word.word)).toEqual([
      'daigaku',
      'byōin',
      'uketsuke',
      'kaisha',
    ]);
  });

  it('keeps remarks and other spellings out of the sentence', () => {
    const furonto = deck34.words.place?.find((word) => word.word === 'furonto');
    expect(furonto?.thai).toBe('เคาน์เตอร์ต้อนรับ');
    expect(furonto?.note).toBe('ฟรอนต์ ตามรูปในสไลด์');
    const car = deck12.words.thing?.find((word) => word.word === 'jidōsha');
    const card = wordCard('thing', car ?? never(), deck12.config);
    expect(card.answer).toBe('Kore wa jidōsha desu.');
    expect(card.alternatives).toEqual(['kuruma']);
  });

  it('the final deck takes words of the first two chapter sets and has no vocabulary part', () => {
    const final = deckOf('final');
    expect(final.words.vocab).toBeUndefined();
    expect(final.words.person?.map((word) => word.word)).toContain('ginkō-in');
    expect(final.words.country).toHaveLength(7);
    expect(final.words.magazine).toHaveLength(4);
    expect(final.words.place).toHaveLength(14);
  });

  it('the self-introduction deck has five cards, one per line', () => {
    expect(deck12.words.intro).toHaveLength(5);
    const card = wordCard('intro', deck12.words.intro?.[0] ?? never(), deck12.config);
    expect(card.answer).toBe('Hajimemashite.');
    expect(card.prompt).toBe('ยินดีที่ได้รู้จัก');
    expect(card.note).toBe('บรรทัดที่ 1 ของบทพูดแนะนำตัว');
  });
});

describe('dealer', () => {
  const deck34 = deckOf('ch3-4');
  const none = { part: null, kind: null } as const;

  it('deals the requested pattern and never the same card twice in a row', () => {
    const dealer = createDealer(deck34, seeded(1));
    let last = '';
    for (let i = 0; i < 300; i++) {
      const kind = i % 3 === 0 ? null : (deck34.kinds[i % deck34.kinds.length] ?? null);
      const card = dealer.deal({ part: null, kind });
      if (kind) expect(card.kind).toBe(kind);
      expect(card.key).not.toBe(last);
      last = card.key;
    }
  });

  it('deals only the chosen part', () => {
    const dealer = createDealer(deck34, seeded(6));
    for (let i = 0; i < 200; i++) {
      expect(dealer.deal({ part: 'vocab', kind: null }).kind).toBe('vocab');
      expect(dealer.deal({ part: 'answer', kind: null }).kind).not.toBe('vocab');
    }
  });

  it('shows every word once before any word repeats', () => {
    const dealer = createDealer(deck34, seeded(2));
    const size = deck34.words.vocab?.length ?? 0;
    const keys = Array.from(
      { length: size },
      () => dealer.deal({ part: 'vocab', kind: 'vocab' }).key,
    );
    expect(new Set(keys).size).toBe(size);
  });

  it('brings a word marked "not yet" back within a few cards', () => {
    const dealer = createDealer(deck34, seeded(3));
    const missed = dealer.deal({ part: 'answer', kind: 'place' });
    dealer.again(missed);
    const next = Array.from(
      { length: 7 },
      () => dealer.deal({ part: 'answer', kind: 'place' }).key,
    );
    expect(next).toContain(missed.key);
  });

  it('mixes every pattern when nothing is chosen', () => {
    const dealer = createDealer(deck34, seeded(4));
    const kinds = new Set(Array.from({ length: 300 }, () => dealer.deal(none).kind));
    expect([...kinds].sort()).toEqual([...deck34.kinds].sort());
  });

  it('follows the exam: points per part and questions per pattern', () => {
    const deck = deckOf('ch5-6');
    const dealer = createDealer(deck, seeded(7), () => new Date(2026, 10, 4));
    const counts: Record<string, number> = {};
    const total = 9000;
    for (let i = 0; i < total; i++) {
      const kind = dealer.deal(none).kind;
      counts[kind] = (counts[kind] ?? 0) + 1;
    }
    // 5 of 15 points are words
    expect((counts.vocab ?? 0) / total).toBeGreaterThan(0.3);
    expect((counts.vocab ?? 0) / total).toBeLessThan(0.37);
    // of the 10 questions: 2 for each of four patterns and 1 for each of two
    const answers = total - (counts.vocab ?? 0);
    expect((counts.origin ?? 0) / answers).toBeGreaterThan(0.17);
    expect((counts.origin ?? 0) / answers).toBeLessThan(0.23);
    expect((counts.birthday ?? 0) / answers).toBeGreaterThan(0.07);
    expect((counts.birthday ?? 0) / answers).toBeLessThan(0.13);
  });

  it('deals every part of exam 1: self-introduction, words and picture questions', () => {
    const deck = deckOf('ch1-2');
    const dealer = createDealer(deck, seeded(8));
    const intro = Array.from(
      { length: 5 },
      () => dealer.deal({ part: 'intro', kind: null }).answer,
    );
    expect(new Set(intro).size).toBe(5);
    expect(intro).toContain('Dōzo yoroshiku o-negai itashimasu.');
    const kinds = new Set(Array.from({ length: 300 }, () => dealer.deal(none).kind));
    expect([...kinds].sort()).toEqual([...deck.kinds].sort());
  });

  it('generates valid numbers for thousands of cards', () => {
    const config = set('ch3-4');
    const rng = seeded(5);
    for (let i = 0; i < 3000; i++) {
      const price = generatedCard('price', config, rng);
      const value = Number(price.prompt.replace(/[^\d]/g, ''));
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(99_999);
      expect(price.answer).toMatch(/ en desu\.$/);

      const time = generatedCard('time', config, rng);
      expect(time.prompt).toMatch(/^\d{2}\.\d{2} น\.$/);
      expect(time.prompt.startsWith('12.')).toBe(false);
      expect(time.prompt.startsWith('00.')).toBe(false);
      expect(time.answer).toMatch(/^Ima (gozen|gogo) /);

      const phone = generatedCard('phone', config, rng);
      expect(phone.prompt).toMatch(/^0\d{1,2}-\d{4}-\d{4}$/);
      expect(phone.answer.split(' no ')).toHaveLength(3);

      const hours = generatedCard('hours', config, rng);
      expect(hours.answer).toMatch(/^(Gozen|Gogo) .+ kara (gozen|gogo) .+ made desu\.$/);
    }
  });
});

describe('exam 3 cards (chapter 5-6)', () => {
  const config = set('ch5-6');
  const deck = deckOf('ch5-6');

  it('takes vocabulary words only from section 1', () => {
    const words = deck.words.vocab?.map((word) => word.word) ?? [];
    expect(words).toContain('T-shatsu');
    expect(words).toContain('kyonen');
    expect(words).not.toContain('..ne');
    expect(words).not.toContain('watashi');
  });

  it('origin: item and country in Thai, answer with country + no + noun', () => {
    const card = originCard(
      { word: 'tokei', thai: 'นาฬิกา' },
      { word: 'Suisu', thai: 'สวิตเซอร์แลนด์' },
    );
    expect(card.question).toBe('Kore wa doko no tokei desuka?');
    expect(card.prompt).toBe('นาฬิกา · สวิตเซอร์แลนด์');
    expect(card.answer).toBe('Kore wa Suisu no tokei desu.');
    expect(card.parts?.map((part) => part.reading)).toEqual(['Suisu', 'no', 'tokei']);
  });

  it('adjective: color or size before the noun', () => {
    const card = adjectiveCard(
      { word: 'kasa', thai: 'ร่ม' },
      { word: 'kuroi', thai: 'สีดำ' },
      config,
    );
    expect(card.question).toBe('Kore wa nan desuka?');
    expect(card.prompt).toBe('ร่ม · สีดำ');
    expect(card.answer).toBe('Kore wa kuroi kasa desu.');
  });

  it('counter: starts with Sono and uses the counter the slides give the item', () => {
    const text = allText(fileOf('vocab', 'ch5-6'));
    for (const item of config.counters ?? [])
      expect(text, item.word).toContain(item.word.toLowerCase());
    const ringo = { word: 'ringo', thai: 'แอปเปิ้ล', counter: 'general' } as const;
    const card = counterCard(ringo, 6, config);
    expect(card.question).toBe('Irasshaimase!');
    expect(card.prompt).toBe('แอปเปิ้ล × 6');
    expect(card.answer).toBe('Sono ringo o muttsu kudasai.');
    expect(counterCard({ word: 'bīru', thai: 'เบียร์', counter: 'hon' }, 10).answer).toBe(
      'Sono bīru o juppon kudasai.',
    );
    // exercise VI of the slides: 2-hon of wine, muttsu of cups, 4-mai of towels; the dialogue: mittsu
    expect(counterCard({ word: 'wain', thai: 'ไวน์', counter: 'hon' }, 2).answer).toContain(
      'ni-hon',
    );
    expect(counterCard({ word: 'taoru', thai: 'ผ้าขนหนู', counter: 'mai' }, 4).answer).toContain(
      'yon-mai',
    );
    expect(counterCard({ word: 'shūkurīmu', thai: 'ครีมพัฟ', counter: 'general' }, 3).answer).toBe(
      'Sono shūkurīmu o mittsu kudasai.',
    );
  });

  it('marks the irregular -hon readings', () => {
    const six = counterCard({ word: 'bīru', thai: 'เบียร์', counter: 'hon' }, 6);
    expect(six.parts?.find((part) => part.reading === 'roppon')?.irregular).toBe(true);
    const three = counterCard({ word: 'bīru', thai: 'เบียร์', counter: 'hon' }, 3);
    expect(three.parts?.find((part) => part.reading === 'sam-bon')?.irregular).toBe(false);
  });

  it('date in the picture: day and month in Thai order in, month before day out', () => {
    const card = dateAskCard(9, 21, config);
    expect(card.question).toBe('Kore wa nan gatsu nan nichi desuka?');
    expect(card.prompt).toBe('21 กันยายน');
    expect(card.answer).toBe('Ku gatsu nijū ichi-nichi desu.');
    expect(card.parts?.[0]?.irregular).toBe(true);
    expect(dateAskCard(2, 6, config).answer).toBe('Ni gatsu mui-ka desu.');
  });

  it('birthday shows the form with a sample date; today uses the date of the device', () => {
    const birthday = birthdayCard(9, 21, config);
    expect(birthday.question).toBe('O tanjōbi wa nan gatsu nan nichi desuka?');
    expect(birthday.prompt).toBe('วันเกิดของคุณ');
    expect(birthday.answer).toBe('Ku gatsu nijū ichi-nichi desu.');
    const today = todayCard(new Date(2026, 10, 4), config);
    expect(today.question).toBe('Kyō wa nan gatsu nan nichi desuka?');
    expect(today.answer).toBe('Jū ichi gatsu yok-ka desu.');
    expect(today.note).toBe('4 พฤศจิกายน');
    expect(todayCard(new Date(2026, 1, 28), config).answer).toBe('Ni gatsu nijū hachi-nichi desu.');
  });

  it('the not-asked practice cards still work', () => {
    const sentences = deck.words.sentence ?? [];
    expect(sentences.length).toBe(15 + 11);
    const card = wordCard('sentence', sentences[0] ?? never(), config);
    expect(card.answer).toBe('Kono T-shatsu wa 3,000-en desu.');
    const date = dateCard(2566, 4, 6, 1);
    expect(date.answer).toBe('Ni sen nijū san nen shi gatsu mui-ka getsu-yōbi desu.');
    expect(monthCard(9, config).answer).toBe('Ku gatsu desu.');
    expect(dayCard(24, config).answer).toBe('Nijū yok-ka desu.');
    expect(weekdayCard(3, config).answer).toBe('Sui-yōbi desu.');
    expect(verbCard({ stem: 'kaeri', thai: 'กลับ' }, 'masendeshita').answer).toBe(
      'Kaerimasendeshita.',
    );
  });

  it('keeps generated cards in range for thousands of deals of every pattern', () => {
    const rng = seeded(31);
    const now = () => new Date(2026, 10, 4);
    for (let i = 0; i < 3000; i++) {
      for (const kind of setKinds(config)) {
        if (kind === 'vocab') continue;
        const card = generatedCard(kind, config, rng, now);
        expect(card.answer, kind).toMatch(/\S/);
        expect(card.parts?.length ?? 0, kind).toBeGreaterThan(0);
        expect(card.prompt, kind).toMatch(/\S/);
        if (kind === 'counter') expect(card.answer).toMatch(/^Sono .+ o .+ kudasai\.$/);
        if (kind === 'dateAsk' || kind === 'birthday') {
          expect(card.answer).toMatch(/^[A-Zjū][\w ū-]+ gatsu .+ desu\.$/);
        }
      }
    }
  });
});

describe('date cards and the settings of the student', () => {
  const config = set('ch5-6');
  const now = () => new Date(2026, 10, 4);

  it('birthday: the saved birthday is used and marked as the own one', () => {
    const rng = seeded(51);
    const own = generatedCard('birthday', config, rng, now, {
      randomToday: false,
      birthday: { month: 2, day: 29 },
    });
    expect(own.answer).toBe('Ni gatsu nijū ku-nichi desu.');
    expect(own.note).toBe('29 กุมภาพันธ์');
    for (let i = 0; i < 20; i++) {
      expect(
        generatedCard('birthday', config, rng, now, {
          randomToday: true,
          birthday: { month: 9, day: 21 },
        }).answer,
      ).toBe('Ku gatsu nijū ichi-nichi desu.');
    }
  });

  it('birthday: without a saved one it deals a random sample date and says how to set it', () => {
    const rng = seeded(52);
    const answers = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const card = generatedCard('birthday', config, rng, now);
      answers.add(card.answer);
      expect(card.note).toContain('ตั้งวันเกิดของคุณ');
    }
    expect(answers.size).toBeGreaterThan(10);
  });

  it('today: the date of the device by default, a random day when the switch is on', () => {
    const rng = seeded(53);
    for (let i = 0; i < 20; i++) {
      expect(generatedCard('today', config, rng, now).answer).toBe('Jū ichi gatsu yok-ka desu.');
    }
    const random = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const card = generatedCard('today', config, rng, now, { randomToday: true, birthday: null });
      expect(card.answer).toMatch(/^[A-Za-zū]+( [a-zū]+)? gatsu .+ desu\.$/);
      expect(card.question).toBe('Kyō wa nan gatsu nan nichi desuka?');
      random.add(card.answer);
    }
    expect(random.size).toBeGreaterThan(100);
  });

  it('the dealer passes the settings on, also in the mix of a part', () => {
    const dealer = createDealer(deckOf('ch5-6'), seeded(54), now);
    const settings = { randomToday: false, birthday: { month: 12, day: 31 } };
    const answers = new Set(
      Array.from(
        { length: 60 },
        () => dealer.deal({ part: 'answer', kind: 'birthday' }, settings).answer,
      ),
    );
    expect([...answers]).toEqual(['Jū ni gatsu sanjū ichi-nichi desu.']);
  });
});

describe('final exam cards', () => {
  it('deals the ten patterns of the final speaking test and nothing else', () => {
    const deck = deckOf('final');
    const dealer = createDealer(deck, seeded(41), () => new Date(2026, 10, 11));
    const kinds = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const card = dealer.deal({ part: null, kind: null });
      kinds.add(card.kind);
      expect(card.question, card.kind).toBeTruthy();
    }
    expect([...kinds].sort()).toEqual(
      [
        'adjective',
        'counter',
        'country',
        'magazine',
        'person',
        'phone',
        'place',
        'price',
        'time',
        'today',
      ].sort(),
    );
  });

  it('uses the question of its own pattern for each of the three chapter sets', () => {
    const deck = deckOf('final');
    const dealer = createDealer(deck, seeded(42));
    const ask = (kind: Parameters<typeof dealer.deal>[0]['kind']) =>
      dealer.deal({ part: null, kind }).question;
    expect(ask('country')).toBe('Anohito wa doko kara kimashitaka?');
    expect(ask('place')).toBe('Koko wa doko desuka?');
    expect(ask('counter')).toBe('Irasshaimase!');
    expect(ask('today')).toBe('Kyō wa nan gatsu nan nichi desuka?');
  });
});

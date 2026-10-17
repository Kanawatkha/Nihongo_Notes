// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../scripts/build-content/index.ts';
import { textOf } from '../scripts/build-content/parse.ts';
import { QUIZ_SETS, type QuizKind } from '../src/config/quiz.ts';
import type { Block, ContentFile, ContentNode } from '../src/content/types.ts';
import {
  buildDeck,
  counterCard,
  createDealer,
  dateCard,
  dayCard,
  generatedCard,
  hoursCard,
  phoneCard,
  priceCard,
  monthCard,
  timeCard,
  verbCard,
  weekdayCard,
  wordCard,
  type Rng,
} from '../src/features/quiz/quizCards.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = buildContent(root).files;
const fileOf = (collection: string, key: string): ContentFile => {
  const file = files.find((item) => item.collection === collection && item.key === key);
  if (!file) throw new Error(`${collection}/${key} not found`);
  return file;
};
/** The exam guide that belongs to each vocabulary set. */
const EXAM_OF: Record<string, string> = { 'ch1-2': 'quiz1-ch1-2', 'ch3-4': 'quiz2-ch3-4' };

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

/** Compares answers the way they are spoken: case, spaces and hyphens do not matter. */
const spoken = (text: string): string => text.toLowerCase().replace(/[\s-]+/g, '');

function tables(nodes: ContentNode[], out: Extract<Block, { t: 'table' }>[] = []) {
  for (const node of nodes) {
    for (const block of node.blocks) if (block.t === 'table') out.push(block);
    tables(node.children, out);
  }
  return out;
}

describe('quiz config is taken from the slides', () => {
  for (const [key, config] of Object.entries(QUIZ_SETS)) {
    it(`${key}: every question sentence appears in the slides of that set`, () => {
      const exam = EXAM_OF[key];
      const text = `${allText(fileOf('vocab', key))}\n${exam ? allText(fileOf('exam', exam)) : ''}`;
      // question marks and full stops are not compared: `Nan gatsu desuka?` is the table cell
      // `nan gatsu desuka` in the vocabulary file
      const plain = (value: string) => value.toLowerCase().replace(/[?.]/g, '');
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

  it('the Thai word of each start-end subject is its meaning in the vocabulary', () => {
    const deck = buildDeck(fileOf('vocab', 'ch3-4'), QUIZ_SETS['ch3-4'] ?? never());
    for (const subject of QUIZ_SETS['ch3-4']?.hoursSubjects ?? []) {
      const romaji = subject.question.split(' ')[0]?.toLowerCase();
      const word = deck.words.vocab?.find((item) => item.word.toLowerCase() === romaji);
      expect(word?.thai, romaji).toBe(subject.thai);
    }
  });
});

function never(): never {
  throw new Error('missing quiz config');
}

describe('cards reproduce the worked answers of the exam guides', () => {
  it('quiz 2: time, phone, price and start-end examples', () => {
    const config = QUIZ_SETS['ch3-4'] ?? never();
    const practice = tables(fileOf('exam', 'quiz2-ch3-4').nodes).find(
      (table) => textOf(table.head[1] ?? []) === 'โจทย์',
    );
    expect(practice?.rows.length).toBeGreaterThanOrEqual(8);
    for (const row of practice?.rows ?? []) {
      const [question, prompt, answer] = row.map(textOf) as [string, string, string];
      const clock = /^(\d{1,2})\.(\d{2}) น\.$/.exec(prompt);
      const range = /^(\d{1,2})\.(\d{2})-(\d{1,2})\.(\d{2}) น\.$/.exec(prompt);
      let card;
      if (range) {
        const subject = config.hoursSubjects?.find((item) => item.question === question);
        card = hoursCard(
          { hour: Number(range[1]), minute: Number(range[2]) },
          { hour: Number(range[3]), minute: Number(range[4]) },
          subject ?? never(),
        );
      } else if (clock) card = timeCard(Number(clock[1]), Number(clock[2]), config);
      else if (/^[\d-]+$/.test(prompt)) card = phoneCard(prompt, config);
      else card = priceCard(Number(prompt.replace(/[^\d]/g, '')), config);
      expect(card.question, prompt).toBe(question);
      expect(spoken(card.answer), prompt).toBe(spoken(answer));
    }
  });

  it('quiz 1: every picture question has a card with the same answer', () => {
    const config = QUIZ_SETS['ch1-2'] ?? never();
    const deck = buildDeck(fileOf('vocab', 'ch1-2'), config);
    const pictures = tables(fileOf('exam', 'quiz1-ch1-2').nodes).find(
      (table) => textOf(table.head[0] ?? []) === 'คำถาม',
    );
    expect(pictures?.rows.length).toBe(5);
    for (const row of pictures?.rows ?? []) {
      const [question, answer] = row.map(textOf) as [string, string];
      const kind = (Object.keys(config.questions) as QuizKind[]).find(
        (item) => config.questions[item] === question,
      );
      expect(kind, question).toBeDefined();
      const answers = (deck.words[kind ?? 'vocab'] ?? []).map((word) =>
        spoken(wordCard(kind ?? 'vocab', word, config).answer),
      );
      expect(answers, question).toContain(spoken(answer));
    }
  });
});

describe('decks', () => {
  const deck12 = buildDeck(fileOf('vocab', 'ch1-2'), QUIZ_SETS['ch1-2'] ?? never());
  const deck34 = buildDeck(fileOf('vocab', 'ch3-4'), QUIZ_SETS['ch3-4'] ?? never());

  it('keeps every configured kind', () => {
    expect(deck12.kinds).toEqual(QUIZ_SETS['ch1-2']?.kinds);
    expect(deck34.kinds).toEqual(QUIZ_SETS['ch3-4']?.kinds);
  });

  it('takes words only from the set, without pattern rows like `..ji` or `chōdo + เวลา`', () => {
    for (const deck of [deck12, deck34]) {
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
});

describe('dealer', () => {
  const deck34 = buildDeck(fileOf('vocab', 'ch3-4'), QUIZ_SETS['ch3-4'] ?? never());

  it('deals the requested kind and never the same card twice in a row', () => {
    const dealer = createDealer(deck34, seeded(1));
    let last = '';
    for (let i = 0; i < 300; i++) {
      const kind = i % 3 === 0 ? null : (deck34.kinds[i % deck34.kinds.length] ?? null);
      const card = dealer.deal(kind);
      if (kind) expect(card.kind).toBe(kind);
      expect(card.key).not.toBe(last);
      last = card.key;
    }
  });

  it('shows every word once before any word repeats', () => {
    const dealer = createDealer(deck34, seeded(2));
    const size = deck34.words.vocab?.length ?? 0;
    const keys = Array.from({ length: size }, () => dealer.deal('vocab').key);
    expect(new Set(keys).size).toBe(size);
  });

  it('brings a word marked "not yet" back within a few cards', () => {
    const dealer = createDealer(deck34, seeded(3));
    const missed = dealer.deal('place');
    dealer.again(missed);
    const next = Array.from({ length: 7 }, () => dealer.deal('place').key);
    expect(next).toContain(missed.key);
  });

  it('mixes kinds when no kind is chosen', () => {
    const dealer = createDealer(deck34, seeded(4));
    const kinds = new Set(Array.from({ length: 200 }, () => dealer.deal(null).kind));
    expect([...kinds].sort()).toEqual([...deck34.kinds].sort());
  });

  it('generates valid numbers for thousands of cards', () => {
    const config = QUIZ_SETS['ch3-4'] ?? never();
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

describe('chapter 5-6 cards', () => {
  const config = QUIZ_SETS['ch5-6'] ?? never();
  const file56 = fileOf('vocab', 'ch5-6');
  const deck = buildDeck(file56, config);

  it('keeps every configured kind and takes words only from section 1', () => {
    expect(deck.kinds).toEqual(config.kinds);
    const words = deck.words.vocab?.map((word) => word.word) ?? [];
    expect(words).toContain('T-shatsu');
    expect(words).toContain('kyonen');
    expect(words).not.toContain('..ne');
    expect(words).not.toContain('watashi');
    for (const word of deck.words.vocab ?? []) expect(word.romaji).not.toMatch(/\.\.|\+/);
  });

  it('reads the sentence cards from the two sentence tables', () => {
    const sentences = deck.words.sentence ?? [];
    expect(sentences.length).toBe(15 + 11);
    const card = wordCard('sentence', sentences[0] ?? never(), config);
    expect(card.answer).toBe('Kono T-shatsu wa 3,000-en desu.');
    expect(card.prompt).toBe('เสื้อยืดตัวนี้ 3,000 เยน');
    expect(card.question).toBeUndefined();
  });

  it('only orders things with the counter the slides give them', () => {
    const text = allText(file56);
    for (const item of config.counters ?? []) {
      expect(text, item.word).toContain(item.word.toLowerCase());
    }
    const apples = counterCard({ word: 'ringo', thai: 'แอปเปิ้ล', counter: 'general' }, 2);
    expect(apples.answer).toBe('Ringo o futatsu kudasai.');
    expect(counterCard({ word: 'T-shatsu', thai: 'เสื้อยืด', counter: 'mai' }, 2).answer).toBe(
      'T-shatsu o ni-mai kudasai.',
    );
    expect(counterCard({ word: 'kasa', thai: 'ร่ม', counter: 'hon' }, 2).answer).toBe(
      'Kasa o ni-hon kudasai.',
    );
    // exercise VI of the slides: 2-hon of wine, muttsu of cups, 4-mai of towels
    expect(counterCard({ word: 'wain', thai: 'ไวน์', counter: 'hon' }, 2).answer).toContain(
      'ni-hon',
    );
    expect(
      counterCard({ word: 'kōhī kappu', thai: 'แก้วกาแฟ', counter: 'general' }, 6).answer,
    ).toBe('Kōhī kappu o muttsu kudasai.');
    expect(counterCard({ word: 'taoru', thai: 'ผ้าขนหนู', counter: 'mai' }, 4).answer).toContain(
      'yon-mai',
    );
    // the dialogue: three cream puffs
    expect(counterCard({ word: 'shūkurīmu', thai: 'ครีมพัฟ', counter: 'general' }, 3).answer).toBe(
      'Shūkurīmu o mittsu kudasai.',
    );
  });

  it('marks the irregular counter readings of -hon', () => {
    const card = counterCard({ word: 'bīru', thai: 'เบียร์', counter: 'hon' }, 6);
    expect(card.parts?.find((part) => part.reading === 'roppon')?.irregular).toBe(true);
    const plain = counterCard({ word: 'bīru', thai: 'เบียร์', counter: 'hon' }, 3);
    expect(plain.parts?.find((part) => part.reading === 'sam-bon')?.irregular).toBe(false);
  });

  it('reproduces the date examples of the slides', () => {
    // slide practice: วันจันทร์ที่ 6 เมษายน 2566 (the weekday is the slide's)
    const card = dateCard(2566, 4, 6, 1);
    expect(card.prompt).toBe('วันจันทร์ที่ 6 เมษายน 2566');
    expect(card.answer).toBe('Ni sen nijū san nen shi gatsu mui-ka getsu-yōbi desu.');
    expect(card.parts?.map((part) => part.label)).toEqual([
      'ค.ศ. 2023',
      'เมษายน',
      'วันที่ 6',
      'วันจันทร์',
    ]);
    expect(monthCard(9, config).answer).toBe('Ku gatsu desu.');
    expect(dayCard(24, config).answer).toBe('Nijū yok-ka desu.');
    expect(weekdayCard(3, config).answer).toBe('Sui-yōbi desu.');
    expect(monthCard(4, config).question).toBe('Nan gatsu desuka?');
  });

  it('uses the real calendar for random dates', () => {
    const rng = seeded(11);
    for (let i = 0; i < 500; i++) {
      const card = generatedCard('date', config, rng);
      const [, weekday, day, month, year] =
        /^(วัน\S+)ที่ (\d+) (\S+) (\d{4})$/.exec(card.prompt)?.slice(0, 5) ?? [];
      expect(weekday, card.prompt).toBeDefined();
      expect(Number(day)).toBeGreaterThanOrEqual(1);
      expect(Number(day)).toBeLessThanOrEqual(31);
      expect(month).toBeTruthy();
      expect(Number(year)).toBeGreaterThanOrEqual(2540);
    }
  });

  it('forms every verb with the right ending', () => {
    expect(verbCard({ stem: 'kaeri', thai: 'กลับ' }, 'masendeshita').answer).toBe(
      'Kaerimasendeshita.',
    );
    expect(verbCard({ stem: 'iki', thai: 'ไป' }, 'masu').prompt).toBe(
      'ไป · ปัจจุบัน / อนาคต · บอกเล่า',
    );
    expect(verbCard({ stem: 'ki', thai: 'มา' }, 'mashita').answer).toBe('Kimashita.');
  });

  it('deals every kind of the set and keeps generated cards in range', () => {
    const dealer = createDealer(deck, seeded(21));
    const seen = new Set<string>();
    let last = '';
    for (let i = 0; i < 1500; i++) {
      const card = dealer.deal(null);
      seen.add(card.kind);
      expect(card.key).not.toBe(last);
      last = card.key;
      expect(card.answer.length).toBeGreaterThan(0);
    }
    expect([...seen].sort()).toEqual([...deck.kinds].sort());

    const rng = seeded(31);
    for (let i = 0; i < 3000; i++) {
      for (const kind of ['counter', 'month', 'day', 'weekday', 'date', 'verb'] as const) {
        const card = generatedCard(kind, config, rng);
        expect(card.answer, kind).toMatch(/\S/);
        expect(card.parts?.length ?? 0, kind).toBeGreaterThan(0);
      }
    }
  });
});

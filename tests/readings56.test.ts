// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../scripts/build-content/index.ts';
import { textOf } from '../scripts/build-content/parse.ts';
import type { Block, ContentNode, Reading } from '../src/content/types.ts';
import {
  MONTH_NAMES,
  TABLES_56,
  VERBS,
  VERB_FORMS,
  buddhistToChristian,
  counterReading,
  dayReading,
  daysInMonth,
  isCounterIrregular,
  isDayIrregular,
  isMonthIrregular,
  monthReading,
  weekdayIndex,
  weekdayReading,
  weekdayThai,
  yearReading,
  type CounterKind,
  type VerbForm,
} from '../src/lib/readings56.ts';

/*
 * The chapter 5-6 quiz builds counters, months, days, weekdays, years and verb forms from code.
 * This file checks every one of them against the tables of content/vocab/ch5-6.md (written from
 * the slides), so the quiz can never teach a reading that is not in them.
 */

const root = fileURLToPath(new URL('../', import.meta.url));
const file = buildContent(root).files.find((item) => item.key === 'ch5-6');
if (!file) throw new Error('ch5-6 not found');

function search(nodes: ContentNode[], number: string): ContentNode | undefined {
  for (const node of nodes) {
    if (node.number?.replace(/\.$/, '') === number) return node;
    const found = search(node.children, number);
    if (found) return found;
  }
  return undefined;
}

function findNode(nodes: ContentNode[], number: string): ContentNode {
  const node = search(nodes, number);
  if (!node) throw new Error(`section ${number} not found`);
  return node;
}

function readingsBelow(node: ContentNode, out: Reading[] = []): Reading[] {
  for (const block of node.blocks) {
    if (block.t === 'grid') out.push(...block.cells);
    if (block.t === 'readings') out.push(...block.rows);
    if (block.t === 'pairs') out.push(...block.halves[0].rows, ...block.halves[1].rows);
  }
  for (const child of node.children) readingsBelow(child, out);
  return out;
}

function tableOf(node: ContentNode): Extract<Block, { t: 'table' }> {
  const table = node.blocks.find((block) => block.t === 'table');
  if (!table || table.t !== 'table') throw new Error('no table');
  return table;
}

const options = (reading: string): string[] =>
  reading.split(' / ').map((item) => item.replace(/\s+/g, ' ').trim());
const numberOf = (label: string): number => Number(/\d+/.exec(label)?.[0]);

describe('counters (sections 2.1 to 2.3)', () => {
  const sections: [string, CounterKind][] = [
    ['2.1', 'general'],
    ['2.2', 'mai'],
    ['2.3', 'hon'],
  ];

  for (const [number, kind] of sections) {
    it(`${kind}: every reading and every irregular mark matches the table`, () => {
      const cells = readingsBelow(findNode(file.nodes, number));
      expect(cells).toHaveLength(10);
      for (const cell of cells) {
        const count = numberOf(textOf(cell.label));
        expect(textOf(cell.reading)).toBe(counterReading(kind, count));
        expect(cell.irregular, `${kind} ${count}`).toBe(isCounterIrregular(kind, count));
      }
    });
  }

  it('rejects counts outside 1-10', () => {
    expect(() => counterReading('mai', 0)).toThrow(RangeError);
    expect(() => counterReading('hon', 11)).toThrow(RangeError);
  });
});

describe('months (section 3.3)', () => {
  const cells = readingsBelow(findNode(file.nodes, '3.3'));

  it('has all twelve with the same Thai names and readings', () => {
    expect(cells).toHaveLength(12);
    for (const cell of cells) {
      const label = textOf(cell.label);
      const month = numberOf(label);
      expect(label).toBe(`${month} ${MONTH_NAMES[month]}`);
      expect(options(textOf(cell.reading))).toContain(monthReading(month));
      expect(cell.irregular, label).toBe(isMonthIrregular(month));
    }
  });

  it('rejects months outside 1-12', () => {
    expect(() => monthReading(0)).toThrow(RangeError);
    expect(() => monthReading(13)).toThrow(RangeError);
  });
});

describe('days (section 3.4)', () => {
  const cells = readingsBelow(findNode(file.nodes, '3.4'));

  it('has all 31 and every reading and irregular mark matches', () => {
    expect(cells).toHaveLength(31);
    for (const cell of cells) {
      const day = numberOf(textOf(cell.label));
      expect(textOf(cell.reading)).toBe(dayReading(day));
      expect(cell.irregular, `day ${day}`).toBe(isDayIrregular(day));
    }
  });

  it('rejects days outside 1-31', () => {
    expect(() => dayReading(0)).toThrow(RangeError);
    expect(() => dayReading(32)).toThrow(RangeError);
  });
});

describe('weekdays (section 3.5)', () => {
  it('matches Thai name, reading and the meaning of the first part', () => {
    const rows = tableOf(findNode(file.nodes, '3.5')).rows.map((row) => row.map(textOf));
    expect(rows).toHaveLength(7);
    for (const [thai, reading, origin] of rows) {
      const index = [0, 1, 2, 3, 4, 5, 6].find((item) => weekdayThai(item) === thai);
      expect(index, thai).toBeDefined();
      expect(weekdayReading(index ?? 0)).toBe(reading);
      expect(origin?.startsWith(`${reading?.replace('-yōbi', '')} = `)).toBe(true);
    }
  });

  it('follows the real calendar: Sunday is 0', () => {
    expect(weekdayThai(weekdayIndex(2023, 4, 6))).toBe('วันพฤหัสบดี');
    expect(weekdayThai(weekdayIndex(2024, 2, 29))).toBe('วันพฤหัสบดี');
    expect(weekdayThai(weekdayIndex(2000, 1, 1))).toBe('วันเสาร์');
  });

  it('knows the days of every month, leap years included', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2023, 4)).toBe(30);
    expect(daysInMonth(2023, 12)).toBe(31);
  });
});

describe('years (section 3.2)', () => {
  it('reproduces the two examples of the slide', () => {
    const rows = tableOf(findNode(file.nodes, '3.2')).rows.map((row) => row.map(textOf));
    expect(rows).toHaveLength(2);
    for (const [label, reading] of rows) {
      expect(yearReading(numberOf(label ?? ''))).toBe(reading);
    }
  });

  it('converts the Thai year of the practice example', () => {
    // slide: 2566 -> ni sen nijū san nen
    expect(buddhistToChristian(2566)).toBe(2023);
    expect(yearReading(buddhistToChristian(2566))).toBe('ni sen nijū san nen');
  });

  it('reads whole thousands and hundreds', () => {
    expect(yearReading(2000)).toBe('ni sen nen');
    expect(yearReading(1900)).toBe('sen kyū hyaku nen');
    expect(yearReading(2010)).toBe('ni sen jū nen');
    expect(() => yearReading(999)).toThrow(RangeError);
  });
});

describe('verb forms (section 4.2)', () => {
  it('every cell of the conjugation table is stem + ending', () => {
    const tables = findNode(file.nodes, '4.2').blocks.filter((block) => block.t === 'table');
    const rows = tables.flatMap((table) => table.rows.map((row) => row.map(textOf)));
    const conjugation = rows.filter((row) => /^(iki|ki|kaeri)-/.test(row[0] ?? ''));
    expect(conjugation).toHaveLength(3);
    for (const [name, ...forms] of conjugation) {
      const verb = VERBS.find((item) => name?.startsWith(`${item.stem}-`));
      expect(verb, name).toBeDefined();
      expect(forms).toEqual(
        (Object.keys(VERB_FORMS) as VerbForm[]).map((form) => `${verb?.stem}${form}`),
      );
    }
  });

  it('keeps the Thai name of each verb from the vocabulary', () => {
    const text = JSON.stringify(file);
    for (const verb of VERBS) expect(text).toContain(verb.thai);
    expect(TABLES_56.WEEKDAYS).toHaveLength(7);
  });
});

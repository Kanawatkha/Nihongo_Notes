// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../scripts/build-content/index.ts';
import { textOf } from '../scripts/build-content/parse.ts';
import type { ContentNode, Reading } from '../src/content/types.ts';
import {
  READING_TABLES,
  clockParts,
  hourReading,
  joinParts,
  minuteReading,
  numberParts,
  phoneReading,
  readNumber,
} from '../src/lib/readings.ts';

/*
 * The quiz builds readings for any time, price and phone number. This file checks every reading
 * table of src/lib/readings.ts against the slide tables in content/vocab/ch3-4.md, so the quiz can
 * never teach a reading that is not in the slides.
 */

const root = fileURLToPath(new URL('../', import.meta.url));
const file = buildContent(root).files.find((item) => item.key === 'ch3-4');
if (!file) throw new Error('ch3-4 not found');

function findNode(nodes: ContentNode[], number: string): ContentNode {
  for (const node of nodes) {
    if (node.number?.replace(/\.$/, '') === number) return node;
    const found = findNode(node.children, number) as ContentNode | undefined;
    if (found) return found;
  }
  return undefined as unknown as ContentNode;
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

/** Drops a trailing remark: `sanjup-pun (= han)` -> `sanjup-pun`. */
const withoutRemark = (reading: string): string => reading.replace(/\s*\([^)]*\)\s*$/, '');
/** `yon / shi` -> [`yon`, `shi`], spaces removed, lower case. */
const alternatives = (reading: string): string[] =>
  withoutRemark(reading)
    .split(' / ')
    .map((item) => item.replace(/\s+/g, '').toLowerCase());
const squash = (text: string): string => text.replace(/[\s/]+/g, '').toLowerCase();
const labelNumber = (label: string): number => Number(label.replace(/[,\s]/g, ''));

/** label -> reading text of every cell under a section. */
function table(number: string): Map<string, Reading> {
  const map = new Map<string, Reading>();
  for (const cell of readingsBelow(findNode(file?.nodes ?? [], number))) {
    map.set(textOf(cell.label), cell);
  }
  return map;
}

describe('readings match the slides (content/vocab/ch3-4.md)', () => {
  it('hours 1-12 (section 2.2)', () => {
    const hours = readingsBelow(findNode(file.nodes, '2.2').children[0] as ContentNode);
    expect(hours).toHaveLength(12);
    for (const cell of hours) {
      expect(alternatives(textOf(cell.reading))).toContain(
        hourReading(labelNumber(textOf(cell.label))).replace(/\s+/g, ''),
      );
    }
  });

  it('minutes 1-10 and 30 (section 2.2)', () => {
    const minutes = readingsBelow(findNode(file.nodes, '2.2').children[1] as ContentNode);
    const checked = minutes.filter((cell) => labelNumber(textOf(cell.label)) < 60);
    expect(checked.map((cell) => textOf(cell.label))).toEqual(
      expect.arrayContaining(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '30']),
    );
    for (const cell of checked) {
      expect(alternatives(textOf(cell.reading))).toContain(
        minuteReading(labelNumber(textOf(cell.label))).replace(/\s+/g, ''),
      );
    }
  });

  it('minute rules written under the table: 45 and 50', () => {
    expect(minuteReading(45)).toBe('yonjū go-fun');
    expect(minuteReading(50)).toBe('gojup-pun');
  });

  it('numbers 1-100, hundreds, thousands and ten-thousands (sections 3.1 and 3.2)', () => {
    let checked = 0;
    for (const number of ['3.1', '3.2']) {
      for (const [label, cell] of table(number)) {
        const value = labelNumber(label);
        if (!Number.isInteger(value) || value < 1 || value > 99_999) continue;
        expect(alternatives(textOf(cell.reading)), label).toContain(
          readNumber(value).replace(/\s+/g, ''),
        );
        checked += 1;
      }
    }
    // 1-10, 11-19, 20-100, 100-900, 1,000-9,000, 10,000-90,000
    expect(checked).toBeGreaterThanOrEqual(10 + 9 + 9 + 9 + 9 + 9);
  });

  it('multi-digit examples read place by place (section 3.3)', () => {
    for (const [label, cell] of table('3.3')) {
      expect(squash(readNumber(labelNumber(label))), label).toBe(squash(textOf(cell.reading)));
    }
  });

  it('marks exactly the readings printed in bold as irregular', () => {
    const bold = new Set(
      [...readingsBelow(findNode(file.nodes, '2.2')), ...readingsBelow(findNode(file.nodes, '3.2'))]
        // a cell is irregular when bold, wholly or in part (`**sanjup-pun** (= han)`)
        .filter((cell) => cell.irregular || cell.reading.some((inline) => inline.t === 'strong'))
        .map((cell) => withoutRemark(textOf(cell.reading)).replace(/\s+/g, '')),
    );
    expect([...READING_TABLES.IRREGULAR].sort()).toEqual([...bold].sort());
  });

  it('digits for phone numbers follow the exam answer', () => {
    // "Zero kyū zero no nana yon ni san no kyū ichi zero go desu." (exam guide, pattern 3)
    expect(phoneReading('090-7423-9105')).toBe(
      'zero kyū zero no nana yon ni san no kyū ichi zero go',
    );
  });
});

describe('number reader', () => {
  it('reads up to the ten-thousands and rejects anything else', () => {
    expect(readNumber(10_050)).toBe('ichi man gojū');
    expect(readNumber(99_999)).toBe('kyū man kyūsen kyūhyaku kyūjū kyū');
    expect(readNumber(1000)).toBe('sen');
    expect(readNumber(11)).toBe('jū ichi');
    expect(() => numberParts(0)).toThrow(RangeError);
    expect(() => numberParts(100_000)).toThrow(RangeError);
    expect(() => numberParts(1.5)).toThrow(RangeError);
  });

  it('labels each chunk with the number it stands for', () => {
    expect(numberParts(13_617).map((part) => [part.label, part.reading])).toEqual([
      ['10,000', 'ichi man'],
      ['3,000', 'sanzen'],
      ['600', 'roppyaku'],
      ['17', 'jū nana'],
    ]);
  });

  it('reads clock times with gozen / gogo and han, and refuses noon and midnight', () => {
    expect(joinParts(clockParts(16, 30))).toBe('gogo yo-ji han');
    expect(joinParts(clockParts(9, 45))).toBe('gozen ku-ji yonjū go-fun');
    expect(joinParts(clockParts(19, 0))).toBe('gogo shichi-ji');
    expect(() => clockParts(12, 0)).toThrow(RangeError);
    expect(() => clockParts(0, 10)).toThrow(RangeError);
  });

  it('has a reading for every minute and every hour it can be asked', () => {
    for (let minute = 1; minute < 60; minute++) expect(minuteReading(minute)).toMatch(/(fun|pun)$/);
    for (let hour = 1; hour <= 12; hour++) expect(hourReading(hour)).toMatch(/-ji$/);
  });
});

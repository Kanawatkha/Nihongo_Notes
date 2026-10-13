import { describe, expect, it } from 'vitest';
import { findFile } from '@/test/contentFixtures';
import { tickerWords } from '@/features/vocab/tickerWords';
import { contentsItems } from '@/features/vocab/contentsItems';
import { partParts, countsLabel, plainText } from '@/lib/text';

describe('text helpers', () => {
  it('flattens inline content to plain text', () => {
    expect(
      plainText([
        { t: 'text', v: 'a ' },
        { t: 'strong', c: [{ t: 'text', v: 'b' }] },
        { t: 'code', v: ' c' },
      ]),
    ).toBe('a b c');
  });

  it('splits a part heading into label and title', () => {
    const ch34 = findFile('vocab', 'ch3-4');
    expect(partParts(ch34.nodes[0]!)).toEqual({ label: 'PART 01', title: 'คำศัพท์ตามหมวด' });
    expect(partParts(ch34.nodes[3]!)).toEqual({ label: 'PART 04', title: 'รูปประโยคและบทสนทนา' });
    const ch12 = findFile('vocab', 'ch1-2');
    expect(partParts(ch12.nodes[2]!)).toEqual({ label: 'PART 03', title: 'ไวยากรณ์และรูปประโยค' });
  });

  it('formats counts and leaves nothing for empty headings', () => {
    expect(countsLabel(13, 0)).toBe('13 คำ');
    expect(countsLabel(0, 28)).toBe('28 รายการ');
    expect(countsLabel(5, 2)).toBe('5 คำ · 2 รายการ');
    expect(countsLabel(0, 0)).toBe('');
  });
});

describe('vocabulary navigation data', () => {
  it('lists parts and sections in order for the contents', () => {
    const items = contentsItems(findFile('vocab', 'ch3-4').nodes);
    expect(items[0]).toMatchObject({ level: 2, chip: 'คำศัพท์ตามหมวด', title: 'คำศัพท์ตามหมวด' });
    expect(items.find((item) => item.number === '2.2')).toMatchObject({
      level: 3,
      title: 'บอกเวลา',
    });
    expect(items.filter((item) => item.level === 2)).toHaveLength(4);
    expect(items.filter((item) => item.level === 3)).toHaveLength(15);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });

  it('takes the first word of each list for the ticker, capped by the limit', () => {
    const file = findFile('vocab', 'ch3-4');
    const words = tickerWords(file, 5);
    expect(words).toHaveLength(5);
    expect(words[0]).toBe('kyōshitsu');
    expect(tickerWords(file, 100).length).toBeGreaterThan(10);
  });
});

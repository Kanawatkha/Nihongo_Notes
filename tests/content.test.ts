// @vitest-environment node
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../scripts/build-content/index.ts';
import { textOf } from '../scripts/build-content/parse.ts';
import { EXAM_FILES, PATTERN_LINKS, VOCAB_FILES } from '../src/config/site.ts';
import type { Block, ContentNode } from '../src/content/types.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = buildContent(root);

function collectBlocks(nodes: ContentNode[], out: Block[] = []): Block[] {
  for (const node of nodes) {
    out.push(...node.blocks);
    collectBlocks(node.children, out);
  }
  return out;
}

describe('real content', () => {
  it('converts all five files without warnings', () => {
    expect(result.files.map((file) => `${file.collection}/${file.key}`).sort()).toEqual([
      'exam/quiz1-ch1-2',
      'exam/quiz2-ch3-4',
      'vocab/ch1-2',
      'vocab/ch3-4',
      'vocab/ch5-6',
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('matches the registry in src/config/site.ts', () => {
    const onDisk = (collection: string) =>
      readdirSync(join(root, 'content', collection))
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.replace(/\.md$/, ''))
        .sort();
    expect(onDisk('vocab')).toEqual([...VOCAB_FILES].sort());
    expect(onDisk('exam')).toEqual([...EXAM_FILES].sort());
  });

  it('lists the registry in the same order as the front matter `order` (the chip order)', () => {
    for (const [collection, registry] of [
      ['vocab', VOCAB_FILES],
      ['exam', EXAM_FILES],
    ] as const) {
      const byOrder = result.files
        .filter((file) => file.collection === collection)
        .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0))
        .map((file) => file.key);
      expect(byOrder).toEqual([...registry]);
    }
  });

  it('keeps vocabulary merged by topic: no heading splits the words by chapter', () => {
    const headings: string[] = [];
    const visit = (nodes: ContentNode[]) => {
      for (const node of nodes) {
        headings.push(textOf(node.title));
        visit(node.children);
      }
    };
    for (const file of result.files.filter((item) => item.collection === 'vocab'))
      visit(file.nodes);
    expect(headings.filter((title) => /^บทที่/.test(title))).toEqual([]);
  });

  it('points every exam pattern at a vocabulary group that exists', () => {
    for (const link of PATTERN_LINKS) {
      const file = result.files.find((item) => item.key === `ch${link.set}`);
      const ids: string[] = [];
      const visit = (nodes: ContentNode[]) => {
        for (const node of nodes) {
          ids.push(node.id);
          visit(node.children);
        }
      };
      visit(file?.nodes ?? []);
      expect(ids).toContain(`vocab/ch${link.set}/${link.group}`);
    }
  });

  it('gives every file a label and a unique order within its collection', () => {
    for (const collection of ['vocab', 'exam'] as const) {
      const files = result.files.filter((file) => file.collection === collection);
      expect(files.every((file) => Boolean(file.meta.label))).toBe(true);
      const orders = files.map((file) => file.meta.order);
      expect(orders.every((order) => typeof order === 'number')).toBe(true);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  it('keeps word and reading counts stable (review changes, do not accept blindly)', () => {
    const counts = Object.fromEntries(
      result.files.map((file) => [
        `${file.collection}/${file.key}`,
        {
          words: file.nodes.reduce((sum, node) => sum + node.wordCount, 0),
          readings: file.nodes.reduce((sum, node) => sum + node.readingCount, 0),
        },
      ]),
    );
    expect(counts).toMatchSnapshot();
  });

  it('classifies the irregular readings the study notes mark in bold', () => {
    const blocks = collectBlocks(result.files.find((file) => file.key === 'ch3-4')?.nodes ?? []);
    const irregular: string[] = [];
    for (const block of blocks) {
      if (block.t === 'grid') {
        for (const cell of block.cells) if (cell.irregular) irregular.push(textOf(cell.reading));
      } else if (block.t === 'pairs') {
        for (const half of block.halves) {
          for (const row of half.rows) if (row.irregular) irregular.push(textOf(row.reading));
        }
      } else if (block.t === 'readings') {
        for (const row of block.rows) if (row.irregular) irregular.push(textOf(row.reading));
      }
    }
    for (const reading of [
      'yo-ji',
      'shichi-ji',
      'ku-ji',
      'ip-pun',
      'san byaku',
      'rop pyaku',
      'hap pyaku',
      'san zen',
      'hassen',
      'sen',
    ]) {
      expect(irregular).toContain(reading);
    }
  });

  it('puts the five exam patterns in the quiz 2 table', () => {
    const quiz = result.files.find((file) => file.key === 'quiz2-ch3-4');
    const tables = collectBlocks(quiz?.nodes ?? []).filter((block) => block.t === 'table');
    const pattern = tables.find(
      (table) => table.t === 'table' && table.rows.length === 5 && table.head.length === 4,
    );
    expect(pattern).toBeDefined();
  });
});

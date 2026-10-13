import type { Block, ContentFile, ContentNode, Inline } from '../../src/content/types.ts';
import { ContentError } from './errors.ts';
import { textOf } from './parse.ts';

const KANA_OR_KANJI = /[぀-ヿ㐀-䶿一-鿿＀-￯]/u;
const COMBINING_MARK = /[̀-ͯ]/u;

/** Checks a whole source file. Romaji only: no kana, kanji or full-width forms; precomposed macrons. */
export function validateSource(source: string, file: string): void {
  if (source.normalize('NFC') !== source) {
    throw new ContentError(file, 1, 'file is not in Unicode NFC form (use precomposed characters)');
  }
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    const kana = KANA_OR_KANJI.exec(line);
    if (kana) {
      throw new ContentError(
        file,
        index + 1,
        `kana, kanji or full-width character "${kana[0]}" is not allowed (romaji only)`,
      );
    }
    const mark = COMBINING_MARK.exec(line);
    if (mark) {
      throw new ContentError(
        file,
        index + 1,
        'combining mark found; use a precomposed macron letter such as ā ī ū ē ō',
      );
    }
  });
}

function requireLatin(inlines: Inline[], file: string, line: number, what: string): void {
  if (!/[A-Za-z]/.test(textOf(inlines))) {
    throw new ContentError(file, line, `${what} has no Latin letter: "${textOf(inlines)}"`);
  }
}

function validateBlock(block: Block, file: string, line: number): void {
  switch (block.t) {
    case 'vocab':
      for (const entry of block.entries) requireLatin(entry.romaji, file, line, 'romaji cell');
      break;
    case 'readings':
      for (const row of block.rows) requireLatin(row.reading, file, line, 'reading cell');
      break;
    case 'pairs':
      for (const half of block.halves) {
        for (const row of half.rows) requireLatin(row.reading, file, line, 'reading cell');
      }
      break;
    case 'grid':
      for (const cell of block.cells) requireLatin(cell.reading, file, line, 'reading cell');
      break;
    default:
      break;
  }
}

function validateNode(node: ContentNode, file: string): void {
  for (const block of node.blocks) validateBlock(block, file, node.source.line);
  for (const child of node.children) validateNode(child, file);
}

/** Structural checks on parsed data. */
export function validateFile(content: ContentFile, file: string): void {
  for (const block of content.intro) validateBlock(block, file, 1);
  for (const node of content.nodes) validateNode(node, file);
}

/** Warns when the same romaji appears twice in one file with different meanings. */
export function findDuplicateRomaji(content: ContentFile): string[] {
  const seen = new Map<string, Set<string>>();
  const visit = (blocks: Block[], children: ContentNode[]) => {
    for (const block of blocks) {
      if (block.t !== 'vocab') continue;
      for (const entry of block.entries) {
        const key = textOf(entry.romaji).trim().toLowerCase();
        const meanings = seen.get(key) ?? new Set<string>();
        meanings.add(textOf(entry.meaning).trim());
        seen.set(key, meanings);
      }
    }
    for (const child of children) visit(child.blocks, child.children);
  };
  visit(content.intro, content.nodes);
  return [...seen.entries()]
    .filter(([, meanings]) => meanings.size > 1)
    .map(
      ([romaji, meanings]) =>
        `${content.collection}/${content.key}: "${romaji}" has ${[...meanings].join(' | ')}`,
    );
}

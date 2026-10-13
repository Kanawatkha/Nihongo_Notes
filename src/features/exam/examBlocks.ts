import type { Block, Inline } from '@/content/types';
import { plainText } from '@/lib/text';

export type TableBlock = Extract<Block, { t: 'table' }>;

/** The score table of the exam file: header `ส่วน | คะแนน | สิ่งที่ต้องทำ`. */
export function isScoreTable(block: Block): block is TableBlock {
  return (
    block.t === 'table' && block.head.length === 3 && plainText(block.head[1] ?? []) === 'คะแนน'
  );
}

/** The question patterns: 4 columns, third header `ตอบ`. */
export function isPatternTable(block: Block): block is TableBlock {
  return block.t === 'table' && block.head.length === 4 && plainText(block.head[2] ?? []) === 'ตอบ';
}

/** The worked examples: header `คำถาม | โจทย์ | คำตอบ`. */
export function isPracticeTable(block: Block): block is TableBlock {
  return (
    block.t === 'table' &&
    block.head.length === 3 &&
    plainText(block.head[0] ?? []) === 'คำถาม' &&
    plainText(block.head[1] ?? []) === 'โจทย์'
  );
}

/** Splits a leading `1.` style number off a title cell. */
export function splitNumber(text: string): { number: string | null; title: string } {
  const match = /^(\d+)\.\s*(.*)$/.exec(text);
  return match
    ? { number: match[1] ?? null, title: match[2] ?? text }
    : { number: null, title: text };
}

/** The first strong text of a cell (the question) and the rest of the cell (a hint). */
export function splitQuestion(cell: Inline[]): { question: Inline[]; hint: string } {
  const index = cell.findIndex((inline) => inline.t === 'strong');
  if (index === -1) return { question: cell, hint: '' };
  const strong = cell[index];
  const question = strong?.t === 'strong' ? strong.c : [];
  const hint = plainText(cell.filter((_, position) => position !== index)).trim();
  return { question, hint };
}

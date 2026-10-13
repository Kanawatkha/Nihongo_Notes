import type {
  Align,
  Block,
  Inline,
  Reading,
  Readings,
  VocabEntry,
} from '../../src/content/types.ts';
import { ContentError } from './errors.ts';
import { parseInline, textOf, type RawItem } from './parse.ts';

type RawTable = Extract<RawItem, { k: 'table' }>;

const VOCAB_HEAD = ['โรมาจิ', 'ความหมาย'];
const NUMBER_LABEL = /^[0-9][0-9,./\s]*(น\.)?$/;
const SPEAKER_LINE = /^([^:*`]{1,40}):\s+(.+)$/;

function alignOf(cell: string): Align {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'c';
  if (right) return 'r';
  if (left) return 'l';
  return 'n';
}

/** A cell that is entirely `**bold**` marks an irregular reading; the bold marker is dropped. */
function unwrapIrregular(cell: Inline[]): { inlines: Inline[]; irregular: boolean } {
  if (cell.length === 1 && cell[0]?.t === 'strong') {
    return { inlines: cell[0].c, irregular: true };
  }
  return { inlines: cell, irregular: false };
}

function hasLatin(inlines: Inline[]): boolean {
  return /[A-Za-z]/.test(textOf(inlines));
}

function parseCells(cells: string[], file: string, line: number): Inline[][] {
  return cells.map((cell) => parseInline(cell, file, line));
}

function toReadings(head: string[], rows: string[][], file: string, line: number): Readings {
  const headCells = parseCells(head, file, line);
  return {
    head: [headCells[0] ?? [], headCells[1] ?? []],
    rows: rows.map((row, index): Reading => {
      const label = parseInline(row[0] ?? '', file, line + 2 + index);
      const { inlines, irregular } = unwrapIrregular(
        parseInline(row[1] ?? '', file, line + 2 + index),
      );
      return { label, reading: inlines, irregular };
    }),
  };
}

function classifyPairs(table: RawTable, file: string): Block | null {
  const { head, rows } = table;
  if (head.length < 5) return null;
  const gap = head.findIndex(
    (cell, index) => cell === '' && rows.every((row) => (row[index] ?? '') === ''),
  );
  if (gap !== 2 || head.length !== 5) return null;

  const sides = [
    { head: head.slice(0, 2), rows: rows.map((row) => row.slice(0, 2)) },
    { head: head.slice(3, 5), rows: rows.map((row) => row.slice(3, 5)) },
  ];
  if (!sides.every((side) => side.head[1] === 'โรมาจิ')) return null;

  const halves = sides.map((side) => {
    // Only trailing rows may be empty (uneven halves). An empty row in the middle is an error.
    const rowsOfSide = [...side.rows];
    while (rowsOfSide.length > 0) {
      const last = rowsOfSide[rowsOfSide.length - 1];
      if (last && last.every((cell) => cell === '')) rowsOfSide.pop();
      else break;
    }
    for (const row of rowsOfSide) {
      if (row.some((cell) => cell === '')) {
        throw new ContentError(
          file,
          table.line,
          'a pairs table has an empty cell before its last row',
        );
      }
    }
    return toReadings(side.head, rowsOfSide, file, table.line);
  }) as [Readings, Readings];

  return { t: 'pairs', halves };
}

/** Classifies a table in the order of CONTENT-SCHEMA.md section 4. */
export function classifyTable(table: RawTable, file: string): Block {
  const { head, align, rows, line } = table;

  if (head.length === 2 && head[0] === VOCAB_HEAD[0] && head[1] === VOCAB_HEAD[1]) {
    const entries = rows.map((row, index): VocabEntry => {
      const rowLine = line + 2 + index;
      const { inlines, irregular } = unwrapIrregular(parseInline(row[0] ?? '', file, rowLine));
      return {
        romaji: inlines,
        meaning: parseInline(row[1] ?? '', file, rowLine),
        irregular,
      };
    });
    return { t: 'vocab', entries };
  }

  if (head.length === 2 && head[1] === 'โรมาจิ') {
    return { t: 'readings', ...toReadings(head, rows, file, line) };
  }

  const pairs = classifyPairs(table, file);
  if (pairs) return pairs;

  if (rows.length === 1 && head.every((cell) => NUMBER_LABEL.test(cell))) {
    const body = rows[0] ?? [];
    const cells = head.map((label, index): Reading => {
      const { inlines, irregular } = unwrapIrregular(
        parseInline(body[index] ?? '', file, line + 2),
      );
      return { label: parseInline(label, file, line), reading: inlines, irregular };
    });
    return { t: 'grid', cells };
  }

  return {
    t: 'table',
    align: align.map(alignOf),
    head: parseCells(head, file, line),
    rows: rows.map((row, index) => parseCells(row, file, line + 2 + index)),
  };
}

/** Turns raw items (everything except headings) into blocks, detecting dialogues. */
export function classifyBlocks(items: RawItem[], file: string): Block[] {
  const blocks: Block[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item) continue;

    switch (item.k) {
      case 'p': {
        const next = items[index + 1];
        const titleMatch = /^\*\*([^*]+)\*\*$/.exec(item.text);
        if (
          titleMatch &&
          next?.k === 'list' &&
          !next.ordered &&
          next.items.every((entry) => SPEAKER_LINE.test(entry))
        ) {
          blocks.push({
            t: 'dialogue',
            title: parseInline(titleMatch[1] ?? '', file, item.line),
            lines: next.items.map((entry, entryIndex) => {
              const match = SPEAKER_LINE.exec(entry);
              return {
                speaker: (match?.[1] ?? '').trim(),
                text: parseInline(match?.[2] ?? '', file, next.line + entryIndex),
              };
            }),
          });
          index += 1;
          break;
        }
        blocks.push({ t: 'p', c: parseInline(item.text, file, item.line) });
        break;
      }
      case 'list':
        blocks.push({
          t: 'list',
          ordered: item.ordered,
          items: item.items.map((entry, entryIndex) =>
            parseInline(entry, file, item.line + entryIndex),
          ),
        });
        break;
      case 'table':
        blocks.push(classifyTable(item, file));
        break;
      case 'quote':
        blocks.push({
          t: 'tip',
          c: item.lines.map((entry, entryIndex) =>
            parseInline(entry, file, item.line + entryIndex),
          ),
        });
        break;
      case 'title':
      case 'heading':
        throw new ContentError(file, item.line, 'headings are handled by the tree builder');
    }
  }
  return blocks;
}

export { hasLatin };

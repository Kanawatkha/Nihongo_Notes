import type { Inline } from '../../src/content/types.ts';
import { ContentError } from './errors.ts';

/** Raw items found by the line scanner, before tables are classified and the tree is built. */
export type RawItem =
  | { k: 'title'; text: string; line: number }
  | { k: 'heading'; level: 2 | 3 | 4; text: string; line: number }
  | { k: 'p'; text: string; line: number }
  | { k: 'list'; ordered: boolean; items: string[]; line: number }
  | { k: 'table'; head: string[]; align: string[]; rows: string[][]; line: number }
  | { k: 'quote'; lines: string[]; line: number };

const ESCAPABLE = '*|_`\\';

/** Position of the next unescaped `marker` at or after `from`, or -1. Skips code spans. */
function findClose(text: string, from: number, marker: '**' | '*'): number {
  let i = from;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '`') {
      const end = text.indexOf('`', i + 1);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (marker === '**' && text.startsWith('**', i)) return i;
    if (marker === '*' && c === '*' && text[i + 1] !== '*') return i;
    i += 1;
  }
  return -1;
}

/** Parses inline Markdown: `**strong**`, `*em*`, `` `code` `` and backslash escapes. */
export function parseInline(text: string, file: string, line: number): Inline[] {
  const out: Inline[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer !== '') {
      out.push({ t: 'text', v: buffer });
      buffer = '';
    }
  };

  let i = 0;
  while (i < text.length) {
    const c = text[i] ?? '';
    if (c === '\\' && i + 1 < text.length && ESCAPABLE.includes(text[i + 1] ?? '')) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }
    if (c === '`') {
      const end = text.indexOf('`', i + 1);
      if (end === -1) throw new ContentError(file, line, `unclosed code span in: ${text}`);
      flush();
      out.push({ t: 'code', v: text.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (text.startsWith('**', i)) {
      const end = findClose(text, i + 2, '**');
      if (end === -1) throw new ContentError(file, line, `unclosed ** in: ${text}`);
      flush();
      out.push({ t: 'strong', c: parseInline(text.slice(i + 2, end), file, line) });
      i = end + 2;
      continue;
    }
    if (c === '*') {
      const end = findClose(text, i + 1, '*');
      if (end === -1) throw new ContentError(file, line, `unclosed * in: ${text}`);
      flush();
      out.push({ t: 'em', c: parseInline(text.slice(i + 1, end), file, line) });
      i = end + 1;
      continue;
    }
    buffer += c;
    i += 1;
  }
  flush();
  return out;
}

/** Plain text of inline content (no markers). */
export function textOf(inlines: Inline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.t) {
        case 'text':
        case 'code':
          return inline.v;
        case 'strong':
        case 'em':
          return textOf(inline.c);
      }
    })
    .join('');
}

/** Splits a table row on unescaped pipes. `\|` stays escaped for the inline parser. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i] ?? '';
    if (c === '\\' && line[i + 1] === '|') {
      current += '\\|';
      i += 1;
    } else if (c === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current.trim());
  // A row written as `| a | b |` yields an empty first and last cell.
  return cells.slice(1, -1);
}

const ALIGN_CELL = /^:?-+:?$/;

function isTableLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 1;
}

const UNSUPPORTED: { pattern: RegExp; what: string }[] = [
  { pattern: /<\/?[A-Za-z!]/, what: 'HTML' },
  { pattern: /^\s*```/, what: 'fenced code' },
  { pattern: /!\[|\]\(/, what: 'image or link' },
  { pattern: /^\s{2,}\S/, what: 'indented line' },
  { pattern: /^[+*]\s/, what: 'unsupported list marker' },
  { pattern: /^\d+\)\s/, what: 'unsupported list marker' },
  { pattern: /^(=+|-{2,})\s*$/, what: 'setext heading' },
];

/**
 * Scans Markdown into raw items. Only the constructs of CONTENT-SCHEMA.md section 3 are accepted;
 * anything else is an error with its line number.
 */
export function scanMarkdown(body: string, file: string, startLine: number): RawItem[] {
  const lines = body.split('\n');
  const items: RawItem[] = [];
  let paragraph: { lines: string[]; line: number } | null = null;

  const flushParagraph = () => {
    if (paragraph) {
      items.push({ k: 'p', text: paragraph.lines.join(' '), line: paragraph.line });
      paragraph = null;
    }
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const lineNo = startLine + i;
    const trimmed = raw.trim();

    if (trimmed === '') {
      flushParagraph();
      i += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(raw);
    if (heading) {
      flushParagraph();
      const level = (heading[1] ?? '').length;
      const text = (heading[2] ?? '').trim();
      if (level === 1) items.push({ k: 'title', text, line: lineNo });
      else if (level <= 4)
        items.push({ k: 'heading', level: level as 2 | 3 | 4, text, line: lineNo });
      else throw new ContentError(file, lineNo, 'headings deeper than #### are not supported');
      i += 1;
      continue;
    }

    for (const { pattern, what } of UNSUPPORTED) {
      if (pattern.test(raw)) {
        throw new ContentError(file, lineNo, `unsupported construct (${what}): ${raw}`);
      }
    }
    if (/ {2}$/.test(raw)) {
      throw new ContentError(
        file,
        lineNo,
        'trailing double space (hard line break) is not supported',
      );
    }

    if (isTableLine(raw)) {
      flushParagraph();
      const head = splitRow(raw);
      const alignLine = lines[i + 1];
      if (alignLine === undefined || !isTableLine(alignLine)) {
        throw new ContentError(file, lineNo, 'table is missing its alignment row');
      }
      const align = splitRow(alignLine);
      if (align.length !== head.length || !align.every((cell) => ALIGN_CELL.test(cell))) {
        throw new ContentError(file, lineNo + 1, 'invalid table alignment row');
      }
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableLine(lines[j] ?? '')) {
        const row = splitRow(lines[j] ?? '');
        if (row.length !== head.length) {
          throw new ContentError(
            file,
            startLine + j,
            `table row has ${row.length} cells, expected ${head.length}`,
          );
        }
        rows.push(row);
        j += 1;
      }
      items.push({ k: 'table', head, align, rows, line: lineNo });
      i = j;
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      const quoteLines: string[] = [];
      let j = i;
      while (j < lines.length && (lines[j] ?? '').trim().startsWith('>')) {
        quoteLines.push((lines[j] ?? '').trim().replace(/^>\s?/, ''));
        j += 1;
      }
      items.push({ k: 'quote', lines: quoteLines, line: lineNo });
      i = j;
      continue;
    }

    const unordered = /^-\s+(.+)$/.exec(raw);
    const ordered = /^\d+\.\s+(.+)$/.exec(raw);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const pattern = isOrdered ? /^\d+\.\s+(.+)$/ : /^-\s+(.+)$/;
      const listItems: string[] = [];
      let j = i;
      while (j < lines.length) {
        const match = pattern.exec(lines[j] ?? '');
        if (!match) break;
        listItems.push((match[1] ?? '').trim());
        j += 1;
      }
      items.push({ k: 'list', ordered: isOrdered, items: listItems, line: lineNo });
      i = j;
      continue;
    }

    if (!paragraph) paragraph = { lines: [], line: lineNo };
    paragraph.lines.push(trimmed);
    i += 1;
  }

  flushParagraph();
  return items;
}

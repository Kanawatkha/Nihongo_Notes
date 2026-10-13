import type {
  Block,
  ContentFile,
  ContentNode,
  Inline,
  Reading,
  Readings,
} from '../../src/content/types.ts';
import { textOf } from './parse.ts';

/**
 * Round-trip oracle (TESTING.md section 3). Both the Markdown source and the generated data are
 * reduced to the same canonical text: syntax removed, whitespace removed. If they differ, data
 * was lost or changed on the way.
 */

function ws(text: string): string {
  return text.replace(/\s+/g, '');
}

/** Canonical text of the Markdown body (front matter already removed). Independent of the parser. */
export function canonicalSource(body: string): string {
  const out: string[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (line === '' || /^---+$/.test(line)) continue;
    if (/^\|[\s:|-]+\|$/.test(line) && line.includes('-')) continue; // table alignment row
    const isHeading = /^#{1,6}\s+/.test(line);
    const cleaned = (
      isHeading
        ? line.replace(/^#{1,6}\s+/, '')
        : line
            .replace(/^>\s?/, '')
            .replace(/^-\s+/, '')
            .replace(/^\d+\.\s+/, '')
    )
      .replace(/\\([*|_`\\])/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\|/g, '');
    out.push(ws(cleaned));
  }
  return out.join('');
}

function inl(inlines: Inline[]): string {
  return textOf(inlines);
}

function readingsHead(readings: Readings): string {
  return inl(readings.head[0]) + inl(readings.head[1]);
}

function readingRow(row: Reading): string {
  return inl(row.label) + inl(row.reading);
}

function blockText(block: Block): string {
  switch (block.t) {
    case 'p':
      return inl(block.c);
    case 'list':
      return block.items.map(inl).join('');
    case 'vocab':
      // The header is fixed by the classification rule, so it is not stored in the data.
      return (
        'โรมาจิความหมาย' +
        block.entries.map((entry) => inl(entry.romaji) + inl(entry.meaning)).join('')
      );
    case 'readings':
      return readingsHead(block) + block.rows.map(readingRow).join('');
    case 'pairs': {
      const [left, right] = block.halves;
      const rows = Math.max(left.rows.length, right.rows.length);
      let text = readingsHead(left) + readingsHead(right);
      for (let index = 0; index < rows; index += 1) {
        const l = left.rows[index];
        const r = right.rows[index];
        text += (l ? readingRow(l) : '') + (r ? readingRow(r) : '');
      }
      return text;
    }
    case 'grid':
      return (
        block.cells.map((cell) => inl(cell.label)).join('') +
        block.cells.map((cell) => inl(cell.reading)).join('')
      );
    case 'table':
      return block.head.map(inl).join('') + block.rows.map((row) => row.map(inl).join('')).join('');
    case 'tip':
      return block.c.map(inl).join('');
    case 'dialogue':
      return (
        inl(block.title) + block.lines.map((line) => `${line.speaker}:${inl(line.text)}`).join('')
      );
  }
}

function nodeText(node: ContentNode): string {
  return (
    (node.number ?? '') +
    inl(node.title) +
    node.blocks.map(blockText).join('') +
    node.children.map(nodeText).join('')
  );
}

/** Canonical text of the generated data. */
export function canonicalData(content: ContentFile): string {
  return ws(
    inl(content.title) +
      content.intro.map(blockText).join('') +
      content.nodes.map(nodeText).join(''),
  );
}

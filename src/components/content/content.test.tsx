import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockRenderer } from '@/components/content/BlockRenderer';
import { NodeView } from '@/components/content/NodeView';
import { contentFiles } from '@/test/contentFixtures';
import { partParts, plainText } from '@/lib/text';
import type { Block, ContentNode } from '@/content/types';

const t = (v: string) => [{ t: 'text' as const, v }];

describe('BlockRenderer', () => {
  it('renders a vocab block as paired terms and descriptions', () => {
    const block: Block = {
      t: 'vocab',
      entries: [{ romaji: t('kasa'), meaning: t('ร่ม'), irregular: false }],
    };
    const { container } = render(<BlockRenderer block={block} />);
    expect(container.querySelector('dt')).toHaveTextContent('kasa');
    expect(container.querySelector('dd')).toHaveTextContent('ร่ม');
  });

  it('marks an irregular reading for assistive technology', () => {
    const block: Block = {
      t: 'vocab',
      entries: [{ romaji: t('yo-ji'), meaning: t('สี่โมง'), irregular: true }],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getByText(/อ่านไม่ปกติ/)).toHaveClass('sr-only');
  });

  it('renders readings, pairs, grid, table, tip, dialogue, paragraph and list', () => {
    const blocks: Block[] = [
      { t: 'readings', head: [t('ตัวเลข'), t('โรมาจิ')], rows: [{ label: t('300'), reading: t('san byaku'), irregular: true }] },
      {
        t: 'pairs',
        halves: [
          { head: [t('นาที'), t('โรมาจิ')], rows: [{ label: t('1'), reading: t('ip-pun'), irregular: true }] },
          { head: [t('นาที'), t('โรมาจิ')], rows: [{ label: t('7'), reading: t('nana-fun'), irregular: false }] },
        ],
      },
      { t: 'grid', cells: [{ label: t('1'), reading: t('ichi'), irregular: false }] },
      { t: 'table', align: ['l', 'r'], head: [t('A'), t('B')], rows: [[t('a1'), t('b1')]] },
      { t: 'tip', c: [t('เคล็ดจำ: 4 = yo-ji')] },
      { t: 'dialogue', title: t('Shop'), lines: [{ speaker: 'Sumisu', text: t('Kore o kudasai.') }] },
      { t: 'p', c: t('ย่อหน้า') },
      { t: 'list', ordered: false, items: [t('หนึ่ง'), t('สอง')] },
    ];
    render(
      <div>
        {blocks.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}
      </div>,
    );
    for (const word of ['san byaku', 'ip-pun', 'nana-fun', 'ichi', 'a1', 'Sumisu', 'Kore o kudasai.', 'ย่อหน้า', 'สอง']) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
    expect(screen.getByText('เคล็ดจำ')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows an empty table header cell as a plain cell, not a column header', () => {
    const block: Block = {
      t: 'table',
      align: ['n', 'n'],
      head: [t(''), t('Ko')],
      rows: [[t('kore'), t('นี่')]],
    };
    render(<BlockRenderer block={block} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(1);
  });
});

function collectText(nodes: ContentNode[], out: string[] = []): string[] {
  for (const node of nodes) {
    // `##` headings of vocabulary files are shown as bands: label and title separately
    out.push(node.level === 2 ? partParts(node).title : plainText(node.title));
    for (const block of node.blocks) {
      if (block.t === 'vocab') {
        for (const entry of block.entries) out.push(plainText(entry.romaji), plainText(entry.meaning));
      } else if (block.t === 'readings') {
        for (const row of block.rows) out.push(plainText(row.label), plainText(row.reading));
      } else if (block.t === 'pairs') {
        for (const half of block.halves) {
          for (const row of half.rows) out.push(plainText(row.label), plainText(row.reading));
        }
      } else if (block.t === 'grid') {
        for (const cell of block.cells) out.push(plainText(cell.label), plainText(cell.reading));
      } else if (block.t === 'table') {
        for (const row of block.rows) for (const cell of row) out.push(plainText(cell));
      } else if (block.t === 'dialogue') {
        for (const line of block.lines) out.push(plainText(line.text));
      }
    }
    collectText(node.children, out);
  }
  return out;
}

describe('NodeView on the real content', () => {
  it.each(contentFiles.map((file) => [`${file.collection}/${file.key}`, file] as const))(
    'shows every word, reading and cell of %s',
    (_name, file) => {
      render(
        <div>
          {file.nodes.map((node, index) => (
            <NodeView key={node.id} node={node} index={index} bands={file.collection === 'vocab'} />
          ))}
        </div>,
      );
      const text = (document.body.textContent ?? '').replace(/\s+/g, ' ');
      const missing = collectText(file.nodes)
        .map((value) => value.replace(/\s+/g, ' ').trim())
        .filter((value) => value !== '' && !text.includes(value));
      expect(missing).toEqual([]);
    },
  );
});

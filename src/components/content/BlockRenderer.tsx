import type { Block } from '@/content/types';
import { DataTable } from './DataTable';
import { Dialogue } from './Dialogue';
import { InlineContent } from './InlineContent';
import { NumberGrid } from './NumberGrid';
import { PairsBlock } from './PairsBlock';
import { RowList } from './RowList';
import { TipCallout } from './TipCallout';

type BlockRendererProps = {
  block: Block;
};

/** Maps one content block to its component. The switch is exhaustive: a new block type fails typecheck. */
export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.t) {
    case 'p':
      return (
        <p className="type-body max-w-[70ch]">
          <InlineContent inlines={block.c} />
        </p>
      );
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List
          className={`type-body max-w-[70ch] space-y-2 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineContent inlines={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'vocab':
      return (
        <RowList
          variant="vocab"
          rows={block.entries.map((entry) => ({
            term: entry.romaji,
            description: entry.meaning,
            irregular: entry.irregular,
          }))}
        />
      );
    case 'readings':
      return (
        <RowList
          variant="reading"
          rows={block.rows.map((row) => ({
            term: row.label,
            description: row.reading,
            irregular: row.irregular,
          }))}
        />
      );
    case 'pairs':
      return <PairsBlock halves={block.halves} />;
    case 'grid':
      return <NumberGrid cells={block.cells} />;
    case 'table':
      return <DataTable align={block.align} head={block.head} rows={block.rows} />;
    case 'tip':
      return <TipCallout lines={block.c} />;
    case 'dialogue':
      return <Dialogue title={block.title} lines={block.lines} />;
  }
}

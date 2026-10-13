import type { Readings } from '@/content/types';
import { InlineContent } from './InlineContent';
import { RowList } from './RowList';

type PairsBlockProps = {
  halves: [Readings, Readings];
};

function Half({ half }: { half: Readings }) {
  return (
    <div>
      <p className="type-mono-label pb-2 text-body-muted">
        <InlineContent inlines={half.head[0]} /> / <InlineContent inlines={half.head[1]} />
      </p>
      <RowList
        variant="reading"
        rows={half.rows.map((row) => ({
          term: row.label,
          description: row.reading,
          irregular: row.irregular,
        }))}
      />
    </div>
  );
}

/** Two side-by-side reading lists (stacked on a phone), from a table with an empty middle column. */
export function PairsBlock({ halves }: PairsBlockProps) {
  return (
    <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      <Half half={halves[0]} />
      <Half half={halves[1]} />
    </div>
  );
}

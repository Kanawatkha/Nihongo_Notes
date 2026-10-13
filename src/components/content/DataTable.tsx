import type { Align, Inline } from '@/content/types';
import { cn } from '@/lib/cn';
import { plainText } from '@/lib/text';
import { InlineContent } from './InlineContent';
import { ScrollArea } from './ScrollArea';

type DataTableProps = {
  align: Align[];
  head: Inline[][];
  rows: Inline[][][];
};

const ALIGN_CLASS: Record<Align, string> = {
  n: 'text-left',
  l: 'text-left',
  c: 'text-center',
  r: 'text-right',
};

/** Generic Markdown table: rule-separated rows, mono-label header, scrolls sideways when too wide. */
export function DataTable({ align, head, rows }: DataTableProps) {
  return (
    <ScrollArea>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-ink">
            {head.map((cell, index) =>
              plainText(cell) === '' ? (
                // An empty header cell is a plain cell, not a column header
                <td key={index} />
              ) : (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    'type-mono-label px-3 py-3 font-normal text-body-muted',
                    ALIGN_CLASS[align[index] ?? 'n'],
                  )}
                >
                  <InlineContent inlines={cell} />
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-hairline align-top">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={cn('type-body px-3 py-3', ALIGN_CLASS[align[index] ?? 'n'])}
                >
                  <InlineContent inlines={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

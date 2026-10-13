import { InlineContent } from '@/components/content/InlineContent';
import { Stagger } from '@/components/motion/Stagger';
import type { TableBlock } from './examBlocks';

type PracticeRowsProps = {
  table: TableBlock;
};

/**
 * Worked examples as rule-separated rows (DESIGN `research-table`): question, prompt, answer.
 * On a phone each row stacks into three lines; column names stay available to screen readers.
 */
export function PracticeRows({ table }: PracticeRowsProps) {
  return (
    <Stagger
      className="border-t border-hairline"
      itemClassName="grid gap-1 border-b border-hairline py-4 md:grid-cols-[1.3fr_1fr_1.7fr] md:items-baseline md:gap-6"
    >
      {table.rows.map((row, index) => (
        <ul key={index} className="contents">
          <li lang="ja-Latn" className="type-caption text-body-muted">
            <span className="sr-only">คำถาม: </span>
            <InlineContent inlines={row[0] ?? []} />
          </li>
          <li className="type-feature-heading">
            <span className="sr-only">โจทย์: </span>
            <InlineContent inlines={row[1] ?? []} />
          </li>
          <li lang="ja-Latn" className="type-body-large">
            <span className="sr-only">คำตอบ: </span>
            <InlineContent inlines={row[2] ?? []} />
          </li>
        </ul>
      ))}
    </Stagger>
  );
}

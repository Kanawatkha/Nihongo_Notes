import { InlineContent } from '@/components/content/InlineContent';
import { Reveal } from '@/components/motion/Reveal';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { plainText } from '@/lib/text';
import { splitNumber, type TableBlock } from './examBlocks';

type ScoreSplitProps = {
  table: TableBlock;
};

/** One card per exam part (DESIGN `capability-card`: top rule only, no box). */
export function ScoreSplit({ table }: ScoreSplitProps) {
  return (
    <ul className="grid gap-8 md:grid-cols-2">
      {table.rows.map((row, index) => {
        const { number, title } = splitNumber(plainText(row[0] ?? []));
        return (
          <li key={index}>
            <Reveal delay={index * 0.08} className="border-t border-ink pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <MonoLabel className="text-body-muted">{number ? `0${number}` : ''}</MonoLabel>
                <MonoLabel className="text-body-muted">
                  <InlineContent inlines={row[1] ?? []} /> คะแนน
                </MonoLabel>
              </div>
              <h3 className="type-card-heading mt-3">{title}</h3>
              <p className="type-body-large mt-3 text-body-muted">
                <InlineContent inlines={row[2] ?? []} />
              </p>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}

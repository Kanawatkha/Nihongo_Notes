import { Fragment } from 'react';
import type { Reading } from '@/content/types';
import { Stagger } from '@/components/motion/Stagger';
import { cn } from '@/lib/cn';
import { InlineContent } from './InlineContent';

type NumberGridProps = {
  cells: Reading[];
};

/** Number tiles (DESIGN `product-card`): the number as a mono label, its reading below. */
export function NumberGrid({ cells }: NumberGridProps) {
  return (
    <Stagger
      as="dl"
      step={0.025}
      className="grid grid-cols-3 gap-3 xs:grid-cols-4 md:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]"
      itemClassName={(index) =>
        cn(
          'relative rounded-sm border bg-soft-stone p-4',
          cells[index]?.irregular ? 'border-coral' : 'border-transparent',
        )
      }
    >
      {cells.map((cell, index) => (
        <Fragment key={index}>
          <dt className="type-mono-label text-body-muted">
            <InlineContent inlines={cell.label} />
          </dt>
          <dd lang="ja-Latn" className="type-feature-heading m-0 mt-1 text-ink">
            {cell.irregular && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-3 size-1.5 rounded-full bg-coral"
                />
                <span className="sr-only">อ่านไม่ปกติ: </span>
              </>
            )}
            <InlineContent inlines={cell.reading} />
          </dd>
        </Fragment>
      ))}
    </Stagger>
  );
}

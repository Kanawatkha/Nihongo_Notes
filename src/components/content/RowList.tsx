import { Fragment } from 'react';
import type { Inline } from '@/content/types';
import { Stagger } from '@/components/motion/Stagger';
import { cn } from '@/lib/cn';
import { InlineContent } from './InlineContent';

export type Row = {
  term: Inline[];
  description: Inline[];
  irregular: boolean;
};

type RowListProps = {
  rows: Row[];
  /** `vocab`: romaji is the term. `reading`: a label (number) is the term and the romaji is the description. */
  variant: 'vocab' | 'reading';
};

/**
 * Rule-separated rows (DESIGN `research-table`), a real description list so each term stays paired
 * with its description. Irregular readings get a coral dot, an underline and hidden text.
 */
export function RowList({ rows, variant }: RowListProps) {
  const isVocab = variant === 'vocab';
  return (
    <Stagger
      as="dl"
      className="border-t border-hairline"
      itemClassName="grid min-h-16 gap-1 border-b border-hairline py-4 md:grid-cols-[2fr_3fr] md:items-baseline md:gap-6"
    >
      {rows.map((row, index) => (
        <Fragment key={index}>
          <dt
            lang={isVocab ? 'ja-Latn' : undefined}
            className={cn(
              'relative',
              isVocab ? 'type-feature-heading text-ink' : 'type-body-large text-body-muted',
              isVocab && row.irregular && 'pl-4',
            )}
          >
            {isVocab && row.irregular && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute top-[0.6em] left-0 size-1.5 rounded-full bg-coral"
                />
                <span className="sr-only">อ่านไม่ปกติ: </span>
              </>
            )}
            <span
              className={cn(
                isVocab &&
                  row.irregular &&
                  'underline decoration-coral-soft decoration-2 underline-offset-4',
              )}
            >
              <InlineContent inlines={row.term} />
            </span>
          </dt>
          <dd
            lang={isVocab ? undefined : 'ja-Latn'}
            className={cn(
              'm-0 relative',
              isVocab ? 'type-body-large text-body-muted' : 'type-feature-heading text-ink',
              !isVocab && row.irregular && 'pl-4',
            )}
          >
            {!isVocab && row.irregular && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute top-[0.6em] left-0 size-1.5 rounded-full bg-coral"
                />
                <span className="sr-only">อ่านไม่ปกติ: </span>
              </>
            )}
            <span
              className={cn(
                !isVocab &&
                  row.irregular &&
                  'underline decoration-coral-soft decoration-2 underline-offset-4',
              )}
            >
              <InlineContent inlines={row.description} />
            </span>
          </dd>
        </Fragment>
      ))}
    </Stagger>
  );
}

import { Fragment } from 'react';
import { InlineContent } from '@/components/content/InlineContent';
import { TipCallout } from '@/components/content/TipCallout';
import { Reveal } from '@/components/motion/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import type { ContentNode, Inline } from '@/content/types';
import { PATTERN_LINKS, UI_TEXT } from '@/config/site';
import { plainText } from '@/lib/text';
import { isPatternTable, splitQuestion } from './examBlocks';

/** Answer templates mark the parts to fill in as `[สถานที่]`; draw those as outlined chips. */
function AnswerText({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((inline, index) => {
        if (inline.t === 'code' || inline.t === 'text') {
          const parts = inline.v.split(/(\[[^\]]+\])/);
          return (
            <Fragment key={index}>
              {parts.map((part, partIndex) =>
                /^\[[^\]]+\]$/.test(part) ? (
                  <span
                    key={partIndex}
                    className="mx-0.5 inline-block rounded-xs border border-coral-soft px-1.5 text-coral-soft"
                  >
                    {part.slice(1, -1)}
                  </span>
                ) : (
                  part
                ),
              )}
            </Fragment>
          );
        }
        return <InlineContent key={index} inlines={[inline]} />;
      })}
    </>
  );
}

type PatternCardProps = {
  row: Inline[][];
  index: number;
};

function PatternCard({ row, index }: PatternCardProps) {
  const { question, hint } = splitQuestion(row[1] ?? []);
  const link = PATTERN_LINKS[index];
  return (
    <li>
      <Reveal delay={(index % 3) * 0.08} className="h-full">
        <article className="flex h-full flex-col rounded-sm bg-cohere-black/30 p-6">
          <p className="type-mono-label text-muted">Q{plainText(row[0] ?? [])}</p>
          <h4 lang="ja-Latn" className="type-feature-heading mt-3">
            <InlineContent inlines={question} />
          </h4>
          {hint && <p className="type-caption mt-1 text-muted">{hint}</p>}

          <div className="mt-5 border-t border-on-dark/20 pt-4">
            <Reveal delay={0.2}>
              <p className="type-mono-label text-muted">{UI_TEXT.answer}</p>
              <p lang="ja-Latn" className="type-body mt-1">
                <AnswerText inlines={row[2] ?? []} />
              </p>
            </Reveal>
            <Reveal delay={0.3} className="mt-4">
              <p className="type-mono-label text-muted">{UI_TEXT.example}</p>
              <p lang="ja-Latn" className="type-body mt-1 text-on-dark/80">
                <InlineContent inlines={row[3] ?? []} />
              </p>
            </Reveal>
          </div>

          {link && (
            <div className="mt-auto pt-5">
              <ButtonLink
                to={`/?set=${link.set}&g=${link.group}`}
                variant="outline"
                onDark
                className="w-full sm:w-auto"
              >
                {UI_TEXT.tableLink}
              </ButtonLink>
            </div>
          )}
        </article>
      </Reveal>
    </li>
  );
}

type PatternBandProps = {
  node: ContentNode;
};

/** Dark band with one console-style card per question pattern, plus the tips that follow them. */
export function PatternBand({ node }: PatternBandProps) {
  const table = node.blocks.find(isPatternTable);
  const tips = node.blocks.filter((block) => block.t === 'tip');
  if (!table) return null;

  return (
    <div className="mt-12 rounded-lg bg-deep-green p-6 text-on-dark md:p-12 lg:p-20">
      <h3 className="type-section-heading">
        <InlineContent inlines={node.title} />
      </h3>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {table.rows.map((row, index) => (
          <PatternCard key={index} row={row} index={index} />
        ))}
      </ul>
      {tips.map((tip, index) => (
        <div key={index} className="mt-6">
          <TipCallout lines={tip.c} onDark />
        </div>
      ))}
    </div>
  );
}

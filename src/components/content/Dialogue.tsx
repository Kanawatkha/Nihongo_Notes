import type { Inline } from '@/content/types';
import { InlineContent } from './InlineContent';

type DialogueProps = {
  title: Inline[];
  lines: { speaker: string; text: Inline[] }[];
};

/** Conversation as a dark console card (DESIGN `agent-console-card`): speaker label, then the line. */
export function Dialogue({ title, lines }: DialogueProps) {
  return (
    <figure className="m-0 rounded-sm bg-primary p-5 text-on-dark md:p-6">
      <figcaption className="type-mono-label text-muted">
        <InlineContent inlines={title} />
      </figcaption>
      <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 md:gap-x-6">
        {lines.map((line, index) => (
          <div key={index} className="contents">
            <dt className="type-mono-label pt-1 text-muted">{line.speaker}</dt>
            <dd lang="ja-Latn" className="type-body-large m-0">
              <InlineContent inlines={line.text} />
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

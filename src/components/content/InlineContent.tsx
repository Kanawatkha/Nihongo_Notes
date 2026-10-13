import type { Inline } from '@/content/types';

type InlineContentProps = {
  inlines: Inline[];
};

/** Renders inline Markdown data: text, **strong**, *em* and `code`. */
export function InlineContent({ inlines }: InlineContentProps) {
  return (
    <>
      {inlines.map((inline, index) => {
        switch (inline.t) {
          case 'text':
            return inline.v;
          case 'strong':
            return (
              <strong key={index} className="font-medium">
                <InlineContent inlines={inline.c} />
              </strong>
            );
          case 'em':
            return (
              <em key={index}>
                <InlineContent inlines={inline.c} />
              </em>
            );
          case 'code':
            return (
              <code key={index} className="rounded-xs bg-soft-stone px-1.5 py-0.5 text-[0.95em]">
                {inline.v}
              </code>
            );
        }
      })}
    </>
  );
}

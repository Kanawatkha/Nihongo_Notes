import type { ContentNode, Inline } from '@/content/types';

/** Plain text of inline content (no markers). */
export function plainText(inlines: Inline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.t) {
        case 'text':
        case 'code':
          return inline.v;
        case 'strong':
        case 'em':
          return plainText(inline.c);
      }
    })
    .join('');
}

/** Label such as `PART 01` and the title of a `##` heading without its number (`1. คำศัพท์`). */
export function partParts(node: ContentNode): { label: string; title: string } {
  const number = node.number?.replace(/\.$/, '');
  return {
    label: number ? `PART ${number.padStart(2, '0')}` : 'PART',
    title: plainText(node.title),
  };
}

/** Counts line for a heading, for example `13 คำ` or `28 รายการ`. Empty when there is nothing to count. */
export function countsLabel(words: number, readings: number): string {
  const parts: string[] = [];
  if (words > 0) parts.push(`${words} คำ`);
  if (readings > 0) parts.push(`${readings} รายการ`);
  return parts.join(' · ');
}

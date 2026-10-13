import type { ContentFile, ContentNode } from '@/content/types';
import { plainText } from '@/lib/text';

/** The first romaji of each word list in a file, in order. Used for the decorative ticker. */
export function tickerWords(file: ContentFile, limit = 24): string[] {
  const words: string[] = [];
  const visit = (nodes: ContentNode[]) => {
    for (const node of nodes) {
      const list = node.blocks.find((block) => block.t === 'vocab');
      const first = list?.t === 'vocab' ? list.entries[0] : undefined;
      if (first) words.push(plainText(first.romaji));
      visit(node.children);
    }
  };
  visit(file.nodes);
  return words.slice(0, limit);
}

import type { ContentNode } from '@/content/types';
import { partParts, plainText } from '@/lib/text';

export type ContentsItem = {
  id: string;
  level: 2 | 3;
  /** Short text for the chip row. */
  chip: string;
  /** Number shown before the title in the rail (`3.3`), when the heading has one. */
  number?: string;
  title: string;
};

/** The `##` (parts) and `###` (sections) headings of a file, in document order, for the contents rail and chip row. */
export function contentsItems(nodes: ContentNode[]): ContentsItem[] {
  const items: ContentsItem[] = [];
  for (const node of nodes) {
    const { title } = partParts(node);
    items.push({ id: node.id, level: 2, chip: title, title });
    for (const child of node.children) {
      const text = plainText(child.title);
      items.push({
        id: child.id,
        level: 3,
        chip: child.number ? `${child.number} ${text}` : text,
        ...(child.number ? { number: child.number } : {}),
        title: text,
      });
    }
  }
  return items;
}

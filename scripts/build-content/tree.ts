import type {
  Block,
  ContentCollection,
  ContentFile,
  ContentMeta,
  ContentNode,
} from '../../src/content/types.ts';
import { classifyBlocks } from './classify.ts';
import { ContentError } from './errors.ts';
import { parseInline, type RawItem } from './parse.ts';

/** `3.1 Title` and `1. Title` carry a number; `5 Title` does not. */
const HEADING_NUMBER = /^((?:\d+\.\d+(?:\.\d+)*)|(?:\d+\.))\s+(.+)$/;

function countBlock(block: Block): { words: number; readings: number } {
  switch (block.t) {
    case 'vocab':
      return { words: block.entries.length, readings: 0 };
    case 'readings':
      return { words: 0, readings: block.rows.length };
    case 'pairs':
      return {
        words: 0,
        readings: block.halves[0].rows.length + block.halves[1].rows.length,
      };
    case 'grid':
      return { words: 0, readings: block.cells.length };
    default:
      return { words: 0, readings: 0 };
  }
}

function sumCounts(node: ContentNode): void {
  let words = 0;
  let readings = 0;
  for (const block of node.blocks) {
    const counts = countBlock(block);
    words += counts.words;
    readings += counts.readings;
  }
  for (const child of node.children) {
    sumCounts(child);
    words += child.wordCount;
    readings += child.readingCount;
  }
  node.wordCount = words;
  node.readingCount = readings;
}

type Draft = { node: ContentNode; items: RawItem[]; childCounter: number; path: string };

/** Builds the heading tree of one file. Rules: CONTENT-SCHEMA.md section 6. */
export function buildFile(
  collection: ContentCollection,
  key: string,
  meta: ContentMeta,
  items: RawItem[],
  file: string,
): ContentFile {
  const titleItem = items.find((item) => item.k === 'title');
  if (!titleItem || titleItem.k !== 'title') {
    throw new ContentError(file, 1, 'file has no # title');
  }
  const titleCount = items.filter((item) => item.k === 'title').length;
  if (titleCount > 1) {
    const second = items.filter((item) => item.k === 'title')[1];
    throw new ContentError(file, second?.line ?? 1, 'file has more than one # title');
  }
  const firstContent = items[0];
  if (firstContent !== titleItem) {
    throw new ContentError(file, firstContent?.line ?? 1, 'the # title must come first');
  }

  const prefix = `${collection}/${key}`;
  const introItems: RawItem[] = [];
  const drafts: Draft[] = [];
  const roots: Draft[] = [];
  const stack: Draft[] = [];
  const rootCounters = { value: 0 };

  for (const item of items) {
    if (item.k === 'title') continue;

    if (item.k === 'heading') {
      while (stack.length > 0 && (stack[stack.length - 1]?.node.level ?? 0) >= item.level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      const expected = parent ? parent.node.level + 1 : 2;
      if (item.level !== expected) {
        throw new ContentError(
          file,
          item.line,
          `heading level ${item.level} cannot follow level ${parent ? parent.node.level : 1}`,
        );
      }

      const match = HEADING_NUMBER.exec(item.text);
      const number = match?.[1];
      const titleText = match?.[2] ?? item.text;
      const counter = parent ? (parent.childCounter += 1) : (rootCounters.value += 1);
      const path = `${parent ? `${parent.path}.` : ''}h${item.level}-${counter}`;
      const id = number ? `${prefix}/${number.replace(/\.$/, '')}` : `${prefix}/${path}`;

      const node: ContentNode = {
        id,
        level: item.level,
        ...(number ? { number } : {}),
        title: parseInline(titleText, file, item.line),
        blocks: [],
        children: [],
        wordCount: 0,
        readingCount: 0,
        source: { file, line: item.line },
      };
      const draft: Draft = { node, items: [], childCounter: 0, path };
      drafts.push(draft);
      if (parent) parent.node.children.push(node);
      else roots.push(draft);
      stack.push(draft);
      continue;
    }

    const target = stack[stack.length - 1];
    if (target) target.items.push(item);
    else introItems.push(item);
  }

  const seen = new Set<string>();
  for (const draft of drafts) {
    if (seen.has(draft.node.id)) {
      throw new ContentError(file, draft.node.source.line, `duplicate node id ${draft.node.id}`);
    }
    seen.add(draft.node.id);
    draft.node.blocks = classifyBlocks(draft.items, file);
  }

  const nodes = roots.map((draft) => draft.node);
  for (const node of nodes) sumCounts(node);

  return {
    collection,
    key,
    meta,
    title: parseInline(titleItem.text, file, titleItem.line),
    intro: classifyBlocks(introItems, file),
    nodes,
  };
}

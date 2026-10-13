import type { ContentMeta } from '../../src/content/types.ts';
import { ContentError } from './errors.ts';

export type FrontMatterResult = {
  meta: ContentMeta;
  /** Markdown after the front matter. */
  body: string;
  /** 1-based line number of the first body line in the original file. */
  bodyStartLine: number;
};

const KNOWN_KEYS = new Set(['label', 'order', 'facts']);

/** Reads the optional `key: value` block between `---` fences at the top of a file. */
export function parseFrontMatter(source: string, file: string): FrontMatterResult {
  const lines = source.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { meta: {}, body: source, bodyStartLine: 1 };
  }

  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end === -1) {
    throw new ContentError(file, 1, 'front matter is not closed with ---');
  }

  const meta: ContentMeta = {};
  for (let index = 1; index < end; index += 1) {
    const raw = lines[index] ?? '';
    if (raw.trim() === '') continue;
    const colon = raw.indexOf(':');
    if (colon === -1) {
      throw new ContentError(file, index + 1, `front matter line must be "key: value": ${raw}`);
    }
    const key = raw.slice(0, colon).trim();
    const value = raw.slice(colon + 1).trim();
    if (!KNOWN_KEYS.has(key)) {
      throw new ContentError(file, index + 1, `unknown front matter key "${key}"`);
    }
    if (value === '') {
      throw new ContentError(file, index + 1, `front matter key "${key}" has no value`);
    }
    if (key === 'order') {
      const order = Number(value);
      if (!Number.isInteger(order) || order < 1) {
        throw new ContentError(file, index + 1, `"order" must be a positive integer`);
      }
      meta.order = order;
    } else if (key === 'label') {
      meta.label = value;
    } else {
      meta.facts = value;
    }
  }

  return {
    meta,
    body: lines.slice(end + 1).join('\n'),
    bodyStartLine: end + 2,
  };
}

/** Data model produced by scripts/build-content and rendered by the app. See CONTENT-SCHEMA.md section 5. */

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'code'; v: string };

export type VocabEntry = { romaji: Inline[]; meaning: Inline[]; irregular: boolean };

/** A label and how to read it, for example `300` and `san byaku`. */
export type Reading = { label: Inline[]; reading: Inline[]; irregular: boolean };

export type Readings = { head: [Inline[], Inline[]]; rows: Reading[] };

export type Align = 'n' | 'l' | 'c' | 'r';

export type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'list'; ordered: boolean; items: Inline[][] }
  | { t: 'vocab'; entries: VocabEntry[] }
  | ({ t: 'readings' } & Readings)
  | { t: 'pairs'; halves: [Readings, Readings] }
  | { t: 'grid'; cells: Reading[] }
  | { t: 'table'; align: Align[]; head: Inline[][]; rows: Inline[][][] }
  | { t: 'tip'; c: Inline[][] }
  | { t: 'dialogue'; title: Inline[]; lines: { speaker: string; text: Inline[] }[] };

export type ContentNode = {
  /** Stable id, for example `vocab/ch3-4/3.7`. */
  id: string;
  level: 2 | 3 | 4;
  /** Heading number exactly as written (`3.1`, `1.`), when the heading starts with one. */
  number?: string;
  title: Inline[];
  /** Blocks between this heading and the next heading. */
  blocks: Block[];
  children: ContentNode[];
  /** Vocab entries in this node and below. */
  wordCount: number;
  /** Readings (rows of `readings`, `pairs` and cells of `grid`) in this node and below. */
  readingCount: number;
  source: { file: string; line: number };
};

export type ContentCollection = 'vocab' | 'exam';

export type ContentMeta = {
  label?: string;
  order?: number;
  facts?: string;
};

export type ContentFile = {
  collection: ContentCollection;
  /** File name without extension, for example `ch3-4`. */
  key: string;
  meta: ContentMeta;
  title: Inline[];
  /** Blocks between the title and the first `##`. */
  intro: Block[];
  nodes: ContentNode[];
};

export type ManifestHeading = {
  id: string;
  level: 2 | 3 | 4;
  number?: string;
  title: string;
  wordCount: number;
  readingCount: number;
};

export type ManifestFile = {
  collection: ContentCollection;
  key: string;
  label?: string;
  order?: number;
  facts?: string;
  title: string;
  wordCount: number;
  readingCount: number;
  headings: ManifestHeading[];
};

export type Manifest = { files: ManifestFile[] };

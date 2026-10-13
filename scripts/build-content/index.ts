import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentCollection, ContentFile } from '../../src/content/types.ts';
import { ContentError } from './errors.ts';
import { parseFrontMatter } from './frontmatter.ts';
import { scanMarkdown } from './parse.ts';
import { canonicalData, canonicalSource } from './project.ts';
import { buildManifest, buildReport } from './report.ts';
import { buildFile } from './tree.ts';
import { findDuplicateRomaji, validateFile, validateSource } from './validate.ts';

const COLLECTIONS: ContentCollection[] = ['vocab', 'exam'];

export type BuildResult = {
  files: ContentFile[];
  warnings: string[];
  report: string;
};

/** Converts one Markdown source string. Throws ContentError on any problem, including a failed round trip. */
export function convertSource(
  collection: ContentCollection,
  key: string,
  source: string,
  file: string,
): ContentFile {
  const text = source.replace(/\r\n/g, '\n');
  validateSource(text, file);
  const front = parseFrontMatter(text, file);
  const items = scanMarkdown(front.body, file, front.bodyStartLine);
  const content = buildFile(collection, key, front.meta, items, file);
  validateFile(content, file);

  const fromSource = canonicalSource(front.body);
  const fromData = canonicalData(content);
  if (fromSource !== fromData) {
    let at = 0;
    while (at < fromSource.length && fromSource[at] === fromData[at]) at += 1;
    throw new ContentError(
      file,
      1,
      `round trip failed near "${fromSource.slice(Math.max(0, at - 20), at + 20)}" (source) vs "${fromData.slice(Math.max(0, at - 20), at + 20)}" (data)`,
    );
  }
  return content;
}

/** Reads every `content/<collection>/*.md` under `root`. */
export function buildContent(root: string): BuildResult {
  const files: ContentFile[] = [];
  for (const collection of COLLECTIONS) {
    const dir = join(root, 'content', collection);
    const names = readdirSync(dir)
      .filter((name) => name.endsWith('.md'))
      .sort();
    for (const name of names) {
      const key = name.replace(/\.md$/, '');
      const path = `content/${collection}/${name}`;
      files.push(convertSource(collection, key, readFileSync(join(dir, name), 'utf8'), path));
    }
  }

  const vocab = files.filter((file) => file.collection === 'vocab');
  for (const file of vocab) {
    if (!file.meta.label) {
      throw new ContentError(
        `content/vocab/${file.key}.md`,
        1,
        'vocab files need a "label" in front matter',
      );
    }
  }
  const defaults = vocab.filter((file) => file.meta.order === 1);
  if (defaults.length !== 1) {
    throw new ContentError(
      'content/vocab',
      1,
      `exactly one vocab file must have "order: 1" (found ${defaults.length})`,
    );
  }
  const orders = vocab.map((file) => file.meta.order);
  if (new Set(orders).size !== orders.length) {
    throw new ContentError('content/vocab', 1, 'vocab files must have unique "order" values');
  }

  const warnings = files.flatMap(findDuplicateRomaji);
  return { files, warnings, report: buildReport(files, warnings) };
}

/** Writes manifest.json, one JSON per file and report.txt. Output is deterministic. */
export function writeOutput(result: BuildResult, outDir: string): void {
  rmSync(outDir, { recursive: true, force: true });
  for (const file of result.files) {
    const dir = join(outDir, file.collection);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${file.key}.json`), `${JSON.stringify(file)}\n`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(buildManifest(result.files))}\n`);
  writeFileSync(join(outDir, 'report.txt'), result.report);
}

import { buildContent } from '../../scripts/build-content/index.ts';
import { buildManifest } from '../../scripts/build-content/report.ts';
import type { ContentCollection, ContentFile, Manifest } from '@/content/types';

/**
 * The real Markdown files, converted in memory. Page tests mock `@/content/loaders` with these, so
 * they do not depend on `src/content/generated` having been built. Vitest runs from the project root.
 */
const built = buildContent(process.cwd());

export const contentFiles: ContentFile[] = built.files;
export const manifest: Manifest = buildManifest(built.files);

export function findFile(collection: ContentCollection, key: string): ContentFile {
  const file = contentFiles.find((item) => item.collection === collection && item.key === key);
  if (!file) throw new Error(`No content file ${collection}/${key}`);
  return file;
}

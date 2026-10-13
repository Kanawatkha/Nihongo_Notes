import { EXAM_FILES, VOCAB_FILES } from '@/config/site';
import { setParamOf } from '@/lib/setParam';
import type { ContentCollection, ContentFile, Manifest } from './types';

/** Lazy loaders for the generated JSON. Each content file is its own chunk. */
const contentModules = import.meta.glob<ContentFile>('./generated/*/*.json', {
  import: 'default',
});
const manifestModules = import.meta.glob<Manifest>('./generated/manifest.json', {
  import: 'default',
});

export async function loadContent(collection: ContentCollection, key: string): Promise<ContentFile> {
  const loader = contentModules[`./generated/${collection}/${key}.json`];
  if (!loader) throw new Error(`No generated content for ${collection}/${key}`);
  return loader();
}

export async function loadManifest(): Promise<Manifest> {
  const loader = manifestModules['./generated/manifest.json'];
  if (!loader) throw new Error('No generated manifest; run npm run content');
  return loader();
}

/**
 * Starts loading what the first screen will need, before React has rendered. The page chunk, the
 * manifest and the chosen content file (from `?set=`) are then fetched in parallel instead of one
 * after another. Without a chosen set only the manifest is needed. Failures are ignored here; the
 * page shows its own error.
 */
export function prefetchForRoute(hash: string): void {
  const [route = '', query = ''] = hash.replace(/^#/, '').split('?');
  const quiet = (promise: Promise<unknown>) => promise.catch(() => {});
  const requested = new URLSearchParams(query).get('set');

  if (route === '/exam') {
    quiet(loadManifest());
    const key = EXAM_FILES.find((file) => setParamOf(file) === requested);
    if (key) quiet(loadContent('exam', key));
    return;
  }
  // The quiz page uses the vocabulary file of the chosen set
  if (route === '/' || route === '' || route === '/quiz') {
    quiet(loadManifest());
    const key = VOCAB_FILES.find((file) => setParamOf(file) === requested);
    if (key) quiet(loadContent('vocab', key));
  }
}

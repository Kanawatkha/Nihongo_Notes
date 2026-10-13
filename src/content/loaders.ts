import { EXAM_FILES, VOCAB_FILES } from '@/config/site';
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
 * manifest and the content file are then fetched in parallel instead of one after another, which
 * shortens the time to the first words. Failures are ignored here; the page shows its own error.
 */
export function prefetchForRoute(hash: string): void {
  const [route = '', query = ''] = hash.replace(/^#/, '').split('?');
  const quiet = (promise: Promise<unknown>) => promise.catch(() => {});

  if (route === '/exam') {
    for (const key of EXAM_FILES) quiet(loadContent('exam', key));
    return;
  }
  if (route === '/' || route === '') {
    const requested = new URLSearchParams(query).get('set');
    const key = VOCAB_FILES.find((file) => file === `ch${requested}`) ?? VOCAB_FILES[0];
    quiet(loadManifest());
    quiet(loadContent('vocab', key));
  }
}

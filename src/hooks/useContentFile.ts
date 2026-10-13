import { useCallback, useEffect, useState } from 'react';
import { loadContent, loadManifest } from '@/content/loaders';
import type { ContentCollection, ContentFile, Manifest } from '@/content/types';

export type Remote<T> =
  { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; data: T };

type Settled<T> = { id: string; attempt: number; data: T | null };

/**
 * Loads data for `id` and re-loads when `id` changes. While the stored result belongs to an older
 * id or attempt the state is `loading`, so no setState runs synchronously in the effect.
 * `load` must be a stable (module-level) function.
 */
function useRemote<T>(id: string, load: (id: string) => Promise<T>): Remote<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load(id)
      .then((data) => {
        if (!cancelled) setSettled({ id, attempt, data });
      })
      .catch(() => {
        if (!cancelled) setSettled({ id, attempt, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt, load]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (!settled || settled.id !== id || settled.attempt !== attempt) return { status: 'loading' };
  if (settled.data === null) return { status: 'error', retry };
  return { status: 'ready', data: settled.data };
}

function loadContentById(id: string): Promise<ContentFile> {
  const [collection, key] = id.split('/');
  return loadContent(collection as ContentCollection, key ?? '');
}

function loadManifestAny(): Promise<Manifest> {
  return loadManifest();
}

/** One generated content file, for example `useContentFile('vocab', 'ch3-4')`. */
export function useContentFile(collection: ContentCollection, key: string): Remote<ContentFile> {
  return useRemote(`${collection}/${key}`, loadContentById);
}

export function useManifest(): Remote<Manifest> {
  return useRemote('manifest', loadManifestAny);
}

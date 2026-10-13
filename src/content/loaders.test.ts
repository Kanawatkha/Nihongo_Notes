import { describe, expect, it } from 'vitest';
import { prefetchForRoute } from '@/content/loaders';

describe('prefetchForRoute', () => {
  it.each(['#/', '#/?set=1-2', '#/?set=nope', '#/exam', '#/somewhere-else', ''])(
    'accepts %j without throwing, even when nothing is generated',
    (hash) => {
      expect(() => prefetchForRoute(hash)).not.toThrow();
    },
  );
});

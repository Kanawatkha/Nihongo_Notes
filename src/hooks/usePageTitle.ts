import { useEffect } from 'react';
import { SITE_NAME } from '@/config/site';

/** Sets `document.title` to `<page> | Nihongo Notes`. */
export function usePageTitle(page: string): void {
  useEffect(() => {
    document.title = `${page} | ${SITE_NAME}`;
  }, [page]);
}

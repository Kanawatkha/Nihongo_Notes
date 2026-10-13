import { useEffect, useState } from 'react';

/**
 * Scroll spy: the id (from `ids`, in document order) of the deepest section whose top has passed
 * the sticky bars. Uses IntersectionObserver, not scroll listeners. `ids` must be a stable array.
 */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const current = [...ids].reverse().find((id) => visible.has(id));
        if (current) setActive(current);
      },
      { rootMargin: '-130px 0px -65% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

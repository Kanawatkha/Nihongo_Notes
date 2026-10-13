import { useCallback, useState } from 'react';

const STORAGE_KEY = 'nihongo-contents-open';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

/** Open state of the contents rail (desktop), remembered between visits when storage is available. */
export function useRailOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(readStored);

  const toggle = useCallback(() => {
    setOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // storage unavailable (private window, blocked): the choice just lasts for this visit
      }
      return next;
    });
  }, []);

  return [open, toggle];
}

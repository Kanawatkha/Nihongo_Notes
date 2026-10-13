const KEY = 'nihongo-notes:after-update';
/** A saved position older than this is ignored (it belongs to an old reload, not an update). */
const MAX_AGE_MS = 60_000;

type Saved = { y: number; at: number };

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Remembers the scroll position just before an automatic update reload. */
export function saveReadingPosition(now: number = Date.now()): void {
  try {
    const saved: Saved = { y: Math.round(window.scrollY), at: now };
    storage()?.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Storage can be blocked (private windows); the page then simply reloads at the top.
  }
}

/** The saved position, or null when there is none or it is stale. Does not remove it. */
export function peekReadingPosition(now: number = Date.now()): number | null {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Saved>;
    if (typeof saved.y !== 'number' || typeof saved.at !== 'number') return null;
    if (now - saved.at > MAX_AGE_MS) return null;
    return saved.y;
  } catch {
    return null;
  }
}

/** Forgets the saved position (it is used once). */
export function clearReadingPosition(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // ignore: nothing to clear when storage is blocked
  }
}

/**
 * Scrolls to `y` once the page is tall enough. The content loads after the first paint, so this
 * polls for a short while (50 ms steps, 2.5 s in total). It uses timers, not animation frames,
 * because animation frames stop in a background tab, which is where an update reload can happen.
 */
export function restoreScroll(y: number, attempts = 50): void {
  let remaining = attempts;
  const attempt = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll >= y || remaining <= 0) {
      // `instant`: the page's CSS says smooth, but restoring a position must jump, not animate
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      return;
    }
    remaining -= 1;
    window.setTimeout(attempt, 50);
  };
  attempt();
}

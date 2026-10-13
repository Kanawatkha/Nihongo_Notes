import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { setReducedMotion } from './reducedMotion';

/** jsdom has no IntersectionObserver; Motion's whileInView needs one. */
class FakeIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// Content pipeline tests run in the node environment, where there is no window
const hasDom = typeof window !== 'undefined';

beforeEach(() => {
  if (!hasDom) return;
  setReducedMotion(false);
  // jsdom does not implement scrolling or ResizeObserver
  Element.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  if (!hasDom) return;
  cleanup();
  vi.unstubAllGlobals();
});

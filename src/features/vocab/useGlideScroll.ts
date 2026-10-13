import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';

/** Time constant of the glide: about 3 x this long to settle, whatever the distance. */
const TAU_MS = 110;

type Glide = { target: number; frame: number; last: number };

/**
 * Smoothly scrolls a small scroll container (the contents rail or chip row) toward a position.
 * It eases toward a target that may move at any time, so when the section in view changes
 * quickly the container keeps gliding to the newest target instead of restarting, as the
 * browser's own smooth scroll does. A touch, press or wheel on the container hands control back.
 */
export function useGlideScroll(ref: RefObject<HTMLElement | null>, axis: 'x' | 'y') {
  const reduceMotion = useReducedMotion();
  const glide = useRef<Glide>({ target: 0, frame: 0, last: 0 });

  const cancel = useCallback(() => {
    cancelAnimationFrame(glide.current.frame);
    glide.current.frame = 0;
  }, []);

  const glideTo = useCallback(
    (position: number) => {
      const element = ref.current;
      if (!element) return;
      const key = axis === 'x' ? 'scrollLeft' : 'scrollTop';
      const max =
        axis === 'x'
          ? element.scrollWidth - element.clientWidth
          : element.scrollHeight - element.clientHeight;
      const state = glide.current;
      state.target = Math.max(0, Math.min(max, position));

      if (reduceMotion || document.visibilityState !== 'visible') {
        cancel();
        element[key] = state.target;
        return;
      }
      if (state.frame) return;

      state.last = performance.now();
      const step = (now: number) => {
        const distance = state.target - element[key];
        if (Math.abs(distance) < 0.5) {
          element[key] = state.target;
          state.frame = 0;
          return;
        }
        const ease = 1 - Math.exp(-(now - state.last) / TAU_MS);
        state.last = now;
        // browsers may round scroll positions, so never move by less than one pixel
        const move = Math.max(Math.abs(distance * ease), Math.min(1, Math.abs(distance)));
        element[key] += Math.sign(distance) * move;
        state.frame = requestAnimationFrame(step);
      };
      state.frame = requestAnimationFrame(step);
    },
    [ref, axis, reduceMotion, cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { glideTo, cancel };
}

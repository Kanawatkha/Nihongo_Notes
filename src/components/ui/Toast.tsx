import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type ToastProps = {
  message: string | null;
};

/** Bottom-left dark toast. Shows while `message` is set; announced politely to screen readers. */
export function Toast({ message }: ToastProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] pb-[env(safe-area-inset-bottom)]"
    >
      <AnimatePresence>
        {message && (
          <motion.p
            key={message}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.15 } }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="type-caption rounded-sm bg-primary px-6 py-4 text-on-dark"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

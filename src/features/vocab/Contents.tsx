import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { Icon } from '@/components/ui/Icon';
import { UI_TEXT } from '@/config/site';
import { cn } from '@/lib/cn';
import type { ContentsItem } from './contentsItems';
import { useGlideScroll } from './useGlideScroll';

type ContentsProps = {
  items: ContentsItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

type ContentsRailProps = ContentsProps & {
  open: boolean;
  onToggle: () => void;
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.015, delayChildren: 0.12 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Sticky left rail (desktop): chapters and sections. When the section in view changes, the old
 * entry's bar fades out, the list glides so the new entry is in view, then the new bar fades in.
 * The toggle stays put at the left edge. The grid column around it shrinks to the toggle's width
 * when closed (see `.vocab-layout`) while the list keeps a fixed width, so its text never rewraps.
 */
export function ContentsRail({ items, activeId, onSelect, open, onToggle }: ContentsRailProps) {
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const { glideTo, cancel } = useGlideScroll(navRef, 'y');

  // Keep the highlighted entry visible inside the rail while the page scrolls
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) return;
    const entry = [...nav.querySelectorAll<HTMLElement>('[data-rail-id]')].find(
      (element) => element.dataset.railId === activeId,
    );
    if (!entry) return;
    const margin = 24;
    const top = entry.offsetTop;
    const bottom = top + entry.offsetHeight;
    if (top >= nav.scrollTop + margin && bottom <= nav.scrollTop + nav.clientHeight - margin) {
      return;
    }
    glideTo(top - (nav.clientHeight - entry.offsetHeight) / 2);
  }, [activeId, open, glideTo]);

  const label = open ? UI_TEXT.contentsHide : UI_TEXT.contentsShow;

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] self-start overflow-hidden lg:flex lg:flex-col">
      <div className="relative flex h-11 w-60 shrink-0 items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={label}
          title={label}
          className="relative z-10 inline-flex size-11 items-center justify-center rounded-sm text-ink transition-[background-color,transform] -outline-offset-2 hover:bg-soft-stone active:scale-95"
        >
          <Icon
            name="panel-left"
            size={20}
            className={cn(
              'transition-transform duration-500 ease-out motion-reduce:transition-none',
              !open && '-scale-x-100',
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.p
              key="label"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="type-mono-label ml-1 text-body-muted"
            >
              สารบัญ
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            key="list"
            ref={navRef}
            aria-label="สารบัญ"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            onPointerDown={cancel}
            onWheel={cancel}
            className="relative mt-2 min-h-0 w-60 flex-1 overflow-y-auto pr-2"
          >
            <motion.ul
              variants={listVariants}
              initial={reduceMotion ? false : 'hidden'}
              animate="show"
              className="space-y-0.5"
            >
              {items.map((item) => {
                const active = item.id === activeId;
                return (
                  <motion.li key={item.id} variants={rowVariants}>
                    <button
                      type="button"
                      data-rail-id={item.id}
                      onClick={() => onSelect(item.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'type-caption relative block w-full rounded-xs py-1.5 pr-2 text-left transition-colors motion-reduce:transition-none',
                        item.level === 2 ? 'mt-4 pl-3 font-medium first:mt-0' : 'pl-6',
                        active
                          ? 'text-primary delay-200 duration-300'
                          : 'text-body-muted duration-200',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-0 bottom-0 left-0 w-0.5 bg-primary transition-opacity motion-reduce:transition-none',
                          active ? 'opacity-100 delay-200 duration-300' : 'opacity-0 duration-200',
                        )}
                      />
                      {item.level === 3 && item.number && (
                        <span className="type-mono-label mr-1.5 normal-case">{item.number}</span>
                      )}
                      {item.title}
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </aside>
  );
}

/**
 * Sticky chip row (phone and tablet). When the section in view changes, the old chip's fill fades
 * out, the row glides so the new chip is centered, then the new chip's fill fades in.
 */
export function ContentsChips({ items, activeId, onSelect }: ContentsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { glideTo, cancel } = useGlideScroll(listRef, 'x');

  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) return;
    const chip = [...list.querySelectorAll<HTMLElement>('[data-chip-id]')].find(
      (element) => element.dataset.chipId === activeId,
    );
    if (!chip) return;
    glideTo(chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2);
  }, [activeId, glideTo]);

  return (
    <nav
      aria-label="สารบัญ"
      className="sticky top-14 z-30 -mx-4 border-b border-hairline bg-canvas md:top-16 md:-mx-8 lg:hidden [@media(max-height:500px)]:static"
    >
      <ul
        ref={listRef}
        onPointerDown={cancel}
        onWheel={cancel}
        className="relative flex gap-2 overflow-x-auto px-4 py-2 md:px-8"
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                data-chip-id={item.id}
                onClick={() => onSelect(item.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'type-caption relative min-h-11 rounded-xl border px-4 whitespace-nowrap transition-colors motion-reduce:transition-none',
                  item.level === 2 ? 'font-medium' : '',
                  active
                    ? 'border-primary text-on-primary delay-200 duration-300'
                    : 'border-hairline text-ink duration-200',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -inset-px rounded-xl bg-primary transition-opacity motion-reduce:transition-none',
                    active ? 'opacity-100 delay-200 duration-300' : 'opacity-0 duration-200',
                  )}
                />
                <span className="relative">{item.chip}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import type { ContentsItem } from './contentsItems';

type ContentsProps = {
  items: ContentsItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

/** Sticky left rail (desktop): chapters and sections, with a bar that slides to the section in view. */
export function ContentsRail({ items, activeId, onSelect }: ContentsProps) {
  return (
    <nav
      aria-label="สารบัญ"
      className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] self-start overflow-y-auto pr-2 lg:block"
    >
      <p className="type-mono-label mb-3 text-body-muted">สารบัญ</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'type-caption relative block w-full rounded-xs py-1.5 pr-2 text-left transition-colors',
                  item.level === 2 ? 'mt-4 pl-3 font-medium first:mt-0' : 'pl-6',
                  active ? 'text-primary' : 'text-body-muted',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="rail-bar"
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 left-0 w-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                {item.level === 3 && item.number && (
                  <span className="type-mono-label mr-1.5 normal-case">{item.number}</span>
                )}
                {item.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sticky chip row (phone and tablet). The active chip scrolls itself into view. */
export function ContentsChips({ items, activeId, onSelect }: ContentsProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) return;
    const chip = [...list.querySelectorAll<HTMLElement>('[data-chip-id]')].find(
      (element) => element.dataset.chipId === activeId,
    );
    if (!chip) return;
    list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2 });
  }, [activeId]);

  return (
    <nav
      aria-label="สารบัญ"
      className="sticky top-14 z-30 -mx-4 border-b border-hairline bg-canvas md:top-16 md:-mx-8 lg:hidden [@media(max-height:500px)]:static"
    >
      <ul ref={listRef} className="flex gap-2 overflow-x-auto px-4 py-2 md:px-8">
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
                  'type-caption min-h-11 rounded-xl border px-4 whitespace-nowrap transition-colors',
                  item.level === 2 ? 'font-medium' : '',
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-hairline bg-canvas text-ink',
                )}
              >
                {item.chip}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

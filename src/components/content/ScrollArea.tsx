import { useEffect, useRef, useState, type ReactNode } from 'react';

type ScrollAreaProps = {
  children: ReactNode;
  label?: string;
};

/**
 * Horizontal scroll wrapper for wide tables. It becomes keyboard focusable only while it actually
 * overflows (a scrollable region must be reachable without a mouse).
 */
export function ScrollArea({ children, label = 'ตาราง' }: ScrollAreaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setScrollable(element.scrollWidth > element.clientWidth + 1);
    });
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-x-auto"
      {...(scrollable ? { tabIndex: 0, role: 'region', 'aria-label': label } : {})}
    >
      {children}
    </div>
  );
}

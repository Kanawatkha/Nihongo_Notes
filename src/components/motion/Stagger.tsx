import { Children, type ReactNode } from 'react';
import { Reveal } from './Reveal';

type StaggerProps = {
  children: ReactNode;
  /** Seconds between children. */
  step?: number;
  /** Only the first `max` children animate; the rest appear instantly (keeps long lists smooth). */
  max?: number;
  /** Container element; `dl` makes each item a `div` row of dt/dd pairs. */
  as?: 'div' | 'dl';
  className?: string;
  /** Class for each item wrapper, or a function of the item index. */
  itemClassName?: string | ((index: number) => string);
};

function classFor(value: StaggerProps['itemClassName'], index: number): string | undefined {
  return typeof value === 'function' ? value(index) : value;
}

/** Reveals its children one after another, each when it scrolls into view. */
export function Stagger({
  children,
  step = 0.03,
  max = 12,
  as: Container = 'div',
  className,
  itemClassName,
}: StaggerProps) {
  return (
    <Container className={className}>
      {Children.toArray(children).map((child, index) =>
        index < max ? (
          <Reveal key={index} delay={index * step} className={classFor(itemClassName, index)}>
            {child}
          </Reveal>
        ) : (
          <div key={index} className={classFor(itemClassName, index)}>
            {child}
          </div>
        ),
      )}
    </Container>
  );
}

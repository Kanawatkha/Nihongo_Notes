import type { ButtonHTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  active: boolean;
  /** When set, the active fill is a shared element that slides between chips with this layout id. */
  layoutId?: string;
};

/**
 * Large coral taxonomy chip (DESIGN `blog-filter-chip`). Inactive: coral outline on a pale fill.
 * Active: coral fill. Used for the chapter-set switch.
 */
export function Chip({
  active,
  layoutId,
  className,
  type = 'button',
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'type-chip relative min-h-11 rounded-sm border border-coral px-3.5 py-2 text-ink transition-colors',
        !layoutId && (active ? 'bg-coral' : 'bg-coral/10 active:bg-coral/25'),
        layoutId && !active && 'bg-coral/10 active:bg-coral/25',
        className,
      )}
      {...rest}
    >
      {layoutId && active && (
        <motion.span
          layoutId={layoutId}
          aria-hidden="true"
          className="absolute -inset-px rounded-sm bg-coral"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

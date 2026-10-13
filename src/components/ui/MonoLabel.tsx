import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type MonoLabelProps = {
  children: ReactNode;
  className?: string;
};

/** Uppercase technical label (section numbers, counts, Q1...). */
export function MonoLabel({ children, className }: MonoLabelProps) {
  return <span className={cn('type-mono-label', className)}>{children}</span>;
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PageContainerProps = {
  children: ReactNode;
  /** Reading width (880 px) instead of the full 1200 px. */
  narrow?: boolean;
  className?: string;
};

/** Centered content column with the responsive page gutters (16 px phone, 32 px tablet and up). */
export function PageContainer({ children, narrow = false, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 md:px-8',
        narrow ? 'max-w-[880px]' : 'max-w-[1200px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

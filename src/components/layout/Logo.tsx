import { Link } from 'react-router-dom';
import { SITE_NAME } from '@/config/site';
import { cn } from '@/lib/cn';

/**
 * Brand mark: an outlined speech bubble (the exams are spoken) with two text lines and a coral dot.
 * Geometry on a 32 x 32 grid, 2 px stroke. public/favicon.svg uses the same shapes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <path d="M8 5H24Q28 5 28 9V17Q28 21 24 21H15L9 26.5V21H8Q4 21 4 17V9Q4 5 8 5Z" />
      <path d="M10 11H22M10 15H17" />
      <circle cx="27" cy="23.5" r="3" fill="var(--color-coral)" stroke="none" />
    </svg>
  );
}

type LogoProps = {
  /** Hide the wordmark (phones show the mark only). */
  markOnlyBelowMd?: boolean;
};

export function Logo({ markOnlyBelowMd = false }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label={SITE_NAME}
      className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-xs text-primary"
    >
      <LogoMark />
      <span
        className={cn(
          'type-feature-heading font-display tracking-tight',
          markOnlyBelowMd && 'hidden md:inline',
        )}
        lang="ja-Latn"
      >
        Nihongo <span className="text-body-muted">Notes</span>
      </span>
    </Link>
  );
}

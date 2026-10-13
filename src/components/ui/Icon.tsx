import { cn } from '@/lib/cn';

type IconProps = { className?: string };

/** Decorative chevron; the control that uses it carries the accessible name. */
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

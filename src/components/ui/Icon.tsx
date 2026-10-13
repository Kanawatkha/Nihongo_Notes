import { cn } from '@/lib/cn';

export type IconName =
  'chevron-down' | 'close' | 'share' | 'copy' | 'check' | 'panel-left' | 'dice' | 'retry' | 'flip';

const PATHS: Record<IconName, string> = {
  'chevron-down': 'M6 9l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  share:
    'M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  copy: 'M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  check: 'M5 12.5l5 5 9-10.5',
  'panel-left': 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 5v14',
  // the pips are zero-length strokes that the round caps turn into dots
  dice: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  retry: 'M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5',
  flip: 'M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 12h6M13 9l3 3-3 3',
};

type IconProps = { name: IconName; size?: number; className?: string };

/** Decorative stroke icon. The control that uses it carries the accessible name. */
export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

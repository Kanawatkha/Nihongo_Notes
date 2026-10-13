import { UI_TEXT } from '@/config/site';

/**
 * Loading placeholder: three soft-stone bars (UI-SPEC.md section 9). It is one screen tall so the
 * footer starts below the fold and does not jump when the real content arrives (CLS).
 */
export function Skeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={UI_TEXT.loading}
      className="min-h-[100dvh] space-y-4 py-8"
    >
      <div className="h-8 w-2/3 rounded-sm bg-soft-stone" />
      <div className="h-8 w-full rounded-sm bg-soft-stone" />
      <div className="h-8 w-5/6 rounded-sm bg-soft-stone" />
    </div>
  );
}

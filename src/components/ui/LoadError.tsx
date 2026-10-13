import { UI_TEXT } from '@/config/site';
import { Button } from './Button';

type LoadErrorProps = {
  onRetry: () => void;
};

/** Shown when generated content could not be loaded; the service worker normally prevents this offline. */
export function LoadError({ onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="type-body-large">{UI_TEXT.loadError}</p>
      <Button onClick={onRetry}>{UI_TEXT.retry}</Button>
    </div>
  );
}

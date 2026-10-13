import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UPDATE_CHECK_INTERVAL_MS, UpdateHost } from './UpdateHost';
import type { PwaHandlers, RegisterServiceWorker } from './registerServiceWorker';

type Harness = {
  register: RegisterServiceWorker;
  handlers: () => PwaHandlers;
  update: ReturnType<typeof vi.fn>;
};

/** A fake service worker registration that records update checks. */
function harness(): Harness {
  let captured: PwaHandlers | null = null;
  const update = vi.fn().mockResolvedValue(undefined);
  const register: RegisterServiceWorker = (handlers) => {
    captured = handlers;
    handlers.onRegistered({ update } as unknown as ServiceWorkerRegistration);
  };
  return {
    register,
    update,
    handlers: () => {
      if (!captured) throw new Error('register was not called');
      return captured;
    },
  };
}

/** The toast is gone or on its way out (its exit animation fades it to opacity 0). */
function expectToastHidden() {
  const message = screen.getByRole('status').querySelector('p');
  expect(message === null || message.style.opacity === '0').toBe(true);
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  setOnline(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('UpdateHost', () => {
  it('registers once and announces that the site works offline', () => {
    const { register, handlers } = harness();
    const onChange = vi.fn();
    render(<UpdateHost register={register} onOfflineReadyChange={onChange} />);

    act(() => handlers().onOfflineReady());
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('status')).toHaveTextContent('ใช้งานออฟไลน์ได้แล้ว');

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expectToastHidden();
  });

  it('checks for a new version every 30 minutes', () => {
    const { register, update } = harness();
    render(<UpdateHost register={register} />);
    expect(update).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
    });
    expect(update).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
    });
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('checks again when the tab becomes visible or the network returns', () => {
    const { register, update } = harness();
    render(<UpdateHost register={register} />);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(update).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('does not check while offline', () => {
    const { register, update } = harness();
    setOnline(false);
    render(<UpdateHost register={register} />);
    act(() => {
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('saves the reading position and reloads when a new version takes over', () => {
    const { register, handlers } = harness();
    const reload = vi.fn();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1234 });
    render(<UpdateHost register={register} reload={reload} />);

    act(() => handlers().onNeedReload());
    expect(reload).toHaveBeenCalledOnce();
    const saved = JSON.parse(window.sessionStorage.getItem('nihongo-notes:after-update') ?? '{}');
    expect(saved.y).toBe(1234);
  });

  it('after the reload it restores the position once and says the site was updated', () => {
    window.sessionStorage.setItem(
      'nihongo-notes:after-update',
      JSON.stringify({ y: 800, at: Date.now() }),
    );
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 5000,
    });
    const { register } = harness();
    render(<UpdateHost register={register} />);

    expect(screen.getByRole('status')).toHaveTextContent('อัปเดตเป็นเวอร์ชันล่าสุดแล้ว');
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, left: 0, behavior: 'instant' });
    expect(window.sessionStorage.getItem('nihongo-notes:after-update')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expectToastHidden();
  });

  it('ignores a stale saved position', () => {
    window.sessionStorage.setItem(
      'nihongo-notes:after-update',
      JSON.stringify({ y: 800, at: Date.now() - 5 * 60_000 }),
    );
    const { register } = harness();
    render(<UpdateHost register={register} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

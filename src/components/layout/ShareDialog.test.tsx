import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShareDialog } from './ShareDialog';

const URL_TEXT = 'https://kanawatkha.github.io/Nihongo_Notes/';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

describe('ShareDialog', () => {
  it('renders nothing while closed', () => {
    render(<ShareDialog open={false} onClose={() => {}} url={URL_TEXT} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title, hint, a QR image and the link when open', () => {
    render(<ShareDialog open onClose={() => {}} url={URL_TEXT} />);
    const dialog = screen.getByRole('dialog', { name: 'แชร์เว็บไซต์' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('สแกน QR หรือคัดลอกลิงก์')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: `QR ${URL_TEXT}` })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(URL_TEXT);
  });

  it('copies the link and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ShareDialog open onClose={() => {}} url={URL_TEXT} />);
    fireEvent.click(screen.getByRole('button', { name: 'คัดลอกลิงก์' }));
    expect(writeText).toHaveBeenCalledWith(URL_TEXT);
    await waitFor(() => expect(screen.getByText('คัดลอกลิงก์แล้ว')).toBeInTheDocument());
  });

  it('closes with the cross, Escape and a press outside the card', () => {
    const onClose = vi.fn();
    render(<ShareDialog open onClose={onClose} url={URL_TEXT} />);
    fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.pointerDown(overlay);
    expect(onClose).toHaveBeenCalledTimes(3);
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navbar } from '@/components/layout/Navbar';
import { setReducedMotion } from '@/test/reducedMotion';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  it('shows both links and marks the active one with aria-current', () => {
    renderAt('/exam');
    const vocab = screen.getByRole('link', { name: 'คำศัพท์' });
    const exam = screen.getByRole('link', { name: 'แนวสอบ' });
    expect(exam).toHaveAttribute('aria-current', 'page');
    expect(vocab).not.toHaveAttribute('aria-current');
  });

  it('marks the vocabulary link active at the root', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'คำศัพท์' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'แนวสอบ' })).not.toHaveAttribute('aria-current');
  });

  it('has a home link named after the site', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Nihongo Notes' })).toHaveAttribute('href', '/');
  });

  it('no longer shows the course code in the header', () => {
    renderAt('/');
    expect(screen.queryByText('JN60101')).not.toBeInTheDocument();
  });

  it('opens the share dialog from the share button and closes it with Escape', async () => {
    setReducedMotion(true);
    renderAt('/');
    const button = screen.getByRole('button', { name: 'แชร์เว็บไซต์' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: 'แชร์เว็บไซต์' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(`${window.location.origin}/`);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await screen.findByRole('button', { name: 'แชร์เว็บไซต์' })).toHaveFocus();
  });
});

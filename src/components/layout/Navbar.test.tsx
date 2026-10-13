import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navbar } from '@/components/layout/Navbar';

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
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('shows the course and the build date', () => {
    render(<Footer offlineReady={false} />);
    expect(screen.getByText(/JN60101/)).toBeInTheDocument();
    expect(screen.getByText(/อัปเดตล่าสุด \d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    expect(screen.queryByText(/ใช้งานออฟไลน์ได้/)).not.toBeInTheDocument();
  });

  it('says the site works offline once everything is cached', () => {
    render(<Footer offlineReady />);
    expect(screen.getByText(/ใช้งานออฟไลน์ได้ · อัปเดตล่าสุด/)).toBeInTheDocument();
  });
});

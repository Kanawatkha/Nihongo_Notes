import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';

vi.mock('@/content/loaders', async () => {
  const { contentFiles, manifest } = await import('@/test/contentFixtures');
  return {
    loadContent: async (collection: string, key: string) =>
      contentFiles.find((file) => file.collection === collection && file.key === key),
    loadManifest: async () => manifest,
  };
});

describe('App', () => {
  it('renders the vocabulary page at the root route', async () => {
    window.location.hash = '#/';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('คำศัพท์');
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the exam page at /exam', async () => {
    window.location.hash = '#/exam';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('สอบพูดครั้งที่ 2');
  });

  it('renders the not-found page for unknown routes', async () => {
    window.location.hash = '#/nope';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('ไม่พบหน้านี้');
  });
});

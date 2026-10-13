import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ExamPage } from '@/pages/ExamPage';

vi.mock('@/content/loaders', async () => {
  const { contentFiles, manifest } = await import('@/test/contentFixtures');
  return {
    loadContent: async (collection: string, key: string) =>
      contentFiles.find((file) => file.collection === collection && file.key === key),
    loadManifest: async () => manifest,
  };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/exam']}>
      <ExamPage />
    </MemoryRouter>,
  );
}

describe('ExamPage', () => {
  it('shows the current quiz with its facts', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'สอบพูดครั้งที่ 2 (บท 3-4)',
    );
    expect(screen.getByText(/พุธ 14 ต\.ค\. 2569 · 15 คะแนน/)).toBeInTheDocument();
  });

  it('shows both exam parts with their points', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('คำศัพท์ ไทย → ญี่ปุ่น')).toBeInTheDocument();
    expect(screen.getByText('ตอบคำถาม')).toBeInTheDocument();
    expect(screen.getAllByText(/คะแนน/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows all five question patterns with a link to the matching vocabulary group', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    const questions = [
      'Koko wa doko desuka?',
      'Ima nan ji desuka?',
      'Anata no denwa bangō wa nan desuka?',
      'Kore wa ikura desuka?',
      'Shigoto wa nanji kara nanji made desuka?',
    ];
    for (const question of questions) {
      expect(screen.getByRole('heading', { level: 4, name: question })).toBeInTheDocument();
    }
    const links = screen
      .getAllByRole('link', { name: 'ดูตาราง' })
      .map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      '/?set=3-4&g=1.1',
      '/?set=3-4&g=2.2',
      '/?set=3-4&g=3.1',
      '/?set=3-4&g=3.2',
      '/?set=3-4&g=2.2',
    ]);
  });

  it('draws the fill-in parts of an answer template as chips', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('สถานที่')).toHaveClass('border-coral-soft');
  });

  it('lists the worked examples with their answers', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText('Ima gogo yo-ji han desu.', { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText('Ichi man hassen en desu.', { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText('090-7423-9105', { selector: 'li' })).toBeInTheDocument();
  });

  it('keeps quiz 1 collapsed until opened', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    const toggle = screen.getByRole('button', { name: 'สอบครั้งที่ 1 (บท 1-2)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hajimemashite.')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Hajimemashite.')).toBeInTheDocument();
  });
});

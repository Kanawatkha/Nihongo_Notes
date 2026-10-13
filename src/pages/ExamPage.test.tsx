import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="search">{location.search}</output>;
}

function renderPage(path = '/exam') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ExamPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('ExamPage', () => {
  it('starts empty: a prompt and the quiz chips in order, nothing pressed, no content', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'สอบครั้งที่ 1 (บท 1-2)' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^แนวสอบ$/);
    expect(screen.getByText('เลือกชุดข้อสอบที่ต้องการดู')).toBeInTheDocument();
    const chips = within(
      screen.getByRole('group', { name: 'เลือกชุดข้อสอบที่ต้องการดู' }),
    ).getAllByRole('button');
    expect(chips.map((chip) => chip.textContent)).toEqual([
      'สอบครั้งที่ 1 (บท 1-2)',
      'สอบครั้งที่ 2 (บท 3-4)',
    ]);
    expect(chips.every((chip) => chip.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('shows a quiz with its facts after pressing its chip', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'สอบครั้งที่ 2 (บท 3-4)' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=3-4');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'สอบพูดครั้งที่ 2 (บท 3-4)',
    );
    expect(screen.getByText(/พุธ 14 ต\.ค\. 2569 · 15 คะแนน/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'สอบครั้งที่ 2 (บท 3-4)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows quiz 1 when chosen, and switches between quizzes', async () => {
    renderPage('/exam?set=1-2');
    expect(await screen.findByText('Hajimemashite.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'สอบครั้งที่ 2 (บท 3-4)' }));
    expect(
      await screen.findByRole('heading', { level: 4, name: 'Koko wa doko desuka?' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Hajimemashite.')).not.toBeInTheDocument();
  });

  it('treats an unknown ?set= like no choice', async () => {
    renderPage('/exam?set=9-9');
    await screen.findByRole('button', { name: 'สอบครั้งที่ 1 (บท 1-2)' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^แนวสอบ$/);
  });

  it('shows both exam parts with their points', async () => {
    renderPage('/exam?set=3-4');
    await screen.findByText('คำศัพท์ ไทย → ญี่ปุ่น');
    expect(screen.getByText('ตอบคำถาม')).toBeInTheDocument();
    expect(screen.getAllByText(/คะแนน/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows all five question patterns with a link to the matching vocabulary group', async () => {
    renderPage('/exam?set=3-4');
    await screen.findByRole('heading', { level: 4, name: 'Koko wa doko desuka?' });
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
    renderPage('/exam?set=3-4');
    expect(await screen.findByText('สถานที่')).toHaveClass('border-coral-soft');
  });

  it('lists the worked examples with their answers', async () => {
    renderPage('/exam?set=3-4');
    expect(
      await screen.findByText('Ima gogo yo-ji han desu.', { selector: 'li' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ichi man hassen en desu.', { selector: 'li' })).toBeInTheDocument();
    expect(screen.getByText('090-7423-9105', { selector: 'li' })).toBeInTheDocument();
  });
});

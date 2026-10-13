import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { VocabPage } from '@/pages/VocabPage';
import { findFile } from '@/test/contentFixtures';
import { plainText } from '@/lib/text';
import type { Block, ContentNode } from '@/content/types';

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

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <VocabPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function vocabRomaji(nodes: ContentNode[], out: string[] = []): string[] {
  for (const node of nodes) {
    node.blocks.forEach((block: Block) => {
      if (block.t === 'vocab') for (const entry of block.entries) out.push(plainText(entry.romaji));
    });
    vocabRomaji(node.children, out);
  }
  return out;
}

describe('VocabPage', () => {
  it('starts empty: a prompt and the set chips (บท 1-2 first), nothing pressed, no content', async () => {
    renderPage('/');
    expect(await screen.findByRole('button', { name: 'บท 1-2' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^คำศัพท์$/);
    expect(screen.getByText('เลือกบทที่ต้องการเรียน', { selector: 'p' })).toBeInTheDocument();
    const chips = within(
      screen.getByRole('group', { name: 'เลือกบทที่ต้องการเรียน' }),
    ).getAllByRole('button');
    expect(chips.map((chip) => chip.textContent)).toEqual(['บท 1-2', 'บท 3-4']);
    expect(chips.every((chip) => chip.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(screen.queryByLabelText('สารบัญ')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('treats an unknown ?set= like no choice', async () => {
    renderPage('/?set=9-9');
    await screen.findByRole('button', { name: 'บท 1-2' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^คำศัพท์$/);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('shows the chosen set with counts after pressing its chip and keeps it in the URL', async () => {
    renderPage('/');
    fireEvent.click(await screen.findByRole('button', { name: 'บท 3-4' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=3-4');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('คำศัพท์ บท 3-4');
    expect(await screen.findByText(/64 คำ · 106 รายการ · 15 หัวข้อ/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บท 3-4' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'บท 1-2' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches set through the chips', async () => {
    renderPage('/?set=3-4');
    await screen.findByRole('heading', { level: 2, name: 'คำศัพท์ตามหมวด' });
    fireEvent.click(screen.getByRole('button', { name: 'บท 1-2' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=1-2');
    expect(await screen.findByText(/111 คำ/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บท 1-2' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the set from ?set=', async () => {
    renderPage('/?set=1-2');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('บท 1-2');
  });

  it('opens and closes the contents rail with its toggle and remembers the choice', async () => {
    localStorage.clear();
    renderPage('/?set=3-4');
    await screen.findByRole('heading', { level: 2, name: 'คำศัพท์ตามหมวด' });
    const hide = screen.getByRole('button', { name: 'ซ่อนสารบัญ' });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.vocab-layout')).toHaveAttribute('data-rail', 'open');

    fireEvent.click(hide);
    const show = screen.getByRole('button', { name: 'แสดงสารบัญ' });
    expect(show).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.vocab-layout')).toHaveAttribute('data-rail', 'closed');
    expect(localStorage.getItem('nihongo-contents-open')).toBe('false');
    await waitFor(() => expect(document.querySelector('aside nav')).toBeNull());

    fireEvent.click(show);
    expect(document.querySelector('.vocab-layout')).toHaveAttribute('data-rail', 'open');
    expect(localStorage.getItem('nihongo-contents-open')).toBe('true');
    localStorage.clear();
  });

  it('starts with the rail closed when that was the last choice', async () => {
    localStorage.setItem('nihongo-contents-open', 'false');
    renderPage('/?set=3-4');
    await screen.findByRole('heading', { level: 2, name: 'คำศัพท์ตามหมวด' });
    expect(document.querySelector('.vocab-layout')).toHaveAttribute('data-rail', 'closed');
    expect(screen.getByRole('button', { name: 'แสดงสารบัญ' })).toBeInTheDocument();
    localStorage.clear();
  });

  it('renders every vocabulary word of the set', async () => {
    renderPage('/?set=3-4');
    await screen.findByRole('heading', { level: 2, name: 'คำศัพท์ตามหมวด' }); // content loaded
    const text = document.body.textContent ?? '';
    const missing = vocabRomaji(findFile('vocab', 'ch3-4').nodes).filter(
      (romaji) => !text.includes(romaji),
    );
    expect(missing).toEqual([]);
  });

  it('pairs each term with its description and marks irregular readings', async () => {
    renderPage('/?set=3-4');
    await screen.findByRole('heading', { level: 2, name: 'คำศัพท์ตามหมวด' }); // content loaded
    const term = screen.getAllByText('ip-pun')[0];
    expect(term).toBeDefined();
    expect(term?.closest('dd, dt')?.textContent).toContain('อ่านไม่ปกติ');
    const kyoshitsu = screen
      .getAllByText('kyōshitsu')
      .find((el) => el.closest('dl'))
      ?.closest('div');
    expect(within(kyoshitsu as HTMLElement).getByText('ห้องเรียน')).toBeInTheDocument();
  });

  it('lists parts and sections in the contents navigation and sets ?g= on click', async () => {
    renderPage('/?set=3-4');
    await screen.findByRole('heading', { level: 2, name: 'คำศัพท์ตามหมวด' }); // content loaded
    const navs = screen.getAllByLabelText('สารบัญ');
    expect(navs.length).toBeGreaterThan(0);
    fireEvent.click(
      within(navs[0] as HTMLElement).getByRole('button', { name: /^2\.2\s*บอกเวลา$/ }),
    );
    expect(screen.getByTestId('search')).toHaveTextContent('g=2.2');
  });

  it('scrolls to the group named in ?g=', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderPage('/?set=3-4&g=2.2');
    await waitFor(() => expect(scroll).toHaveBeenCalled());
  });
});

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { QuizPage } from '@/pages/QuizPage';

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

function renderPage(path = '/quiz') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QuizPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** The face that can be seen: the other one is aria-hidden. */
const visibleFace = () =>
  [...document.querySelectorAll<HTMLElement>('[aria-hidden]')].find(
    (element) => element.getAttribute('aria-hidden') === 'false' && element.closest('.grid'),
  );

describe('QuizPage', () => {
  it('starts empty: a prompt and the set chips, no card', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'บท 1-2' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^แบบทดสอบ$/);
    const chips = within(screen.getByRole('group', { name: 'เลือกบทที่ต้องการฝึก' })).getAllByRole(
      'button',
    );
    expect(chips.map((chip) => chip.textContent)).toEqual(['บท 1-2', 'บท 3-4']);
    expect(screen.queryByRole('button', { name: 'สุ่มข้อใหม่' })).not.toBeInTheDocument();
  });

  it('shows a card with the kind chips after choosing a set', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'บท 3-4' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=3-4');
    expect(await screen.findByRole('button', { name: 'สุ่มข้อใหม่' })).toBeInTheDocument();
    const kinds = within(screen.getByRole('group', { name: 'เลือกแบบโจทย์' })).getAllByRole(
      'button',
    );
    expect(kinds.map((chip) => chip.textContent)).toEqual([
      'สุ่มทุกแบบ',
      'คำศัพท์',
      'สถานที่',
      'บอกเวลา',
      'เบอร์โทร',
      'ราคา',
      'เวลาเริ่ม-เลิก',
    ]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('แบบทดสอบ บท 3-4');
  });

  it('turns the card to the answer and back', async () => {
    renderPage('/quiz?set=3-4&type=price');
    const reveal = await screen.findByRole('button', { name: /ดูเฉลย/ });
    expect(visibleFace()).toHaveTextContent('Kore wa ikura desuka?');
    expect(visibleFace()).toHaveTextContent(/เยน/);

    fireEvent.click(reveal);
    expect(screen.getByRole('button', { name: /ดูโจทย์/ })).toHaveAttribute('aria-pressed', 'true');
    expect(visibleFace()).toHaveTextContent(/ en desu\./);
    expect(visibleFace()).toHaveTextContent('อย่าลืม en');
    expect(screen.getByText(/^เฉลย: .+ en desu\.$/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ดูโจทย์/ }));
    expect(visibleFace()).toHaveTextContent('Kore wa ikura desuka?');
  });

  it('deals a new card with the dice and counts the cards', async () => {
    renderPage('/quiz?set=3-4&type=time');
    await screen.findByRole('button', { name: 'สุ่มข้อใหม่' });
    expect(visibleFace()).toHaveTextContent('ข้อที่ 1');
    fireEvent.click(screen.getByRole('button', { name: 'สุ่มข้อใหม่' }));
    expect(await screen.findByText('ข้อที่ 2')).toBeInTheDocument();
  });

  it('records "known" and "not yet" from the answer side', async () => {
    renderPage('/quiz?set=1-2&type=country');
    fireEvent.click(await screen.findByRole('button', { name: /ดูเฉลย/ }));
    expect(visibleFace()).toHaveTextContent(/kara kimashita\./);
    const check = screen.getByText('ตอบได้ไหม').parentElement as HTMLElement;
    fireEvent.click(within(check).getByRole('button', { name: /ตอบได้/ }));
    fireEvent.click(await screen.findByRole('button', { name: /ดูเฉลย/ }));
    fireEvent.click(within(check).getByRole('button', { name: /ยังไม่ได้/ }));
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          /^ตอบได้ 1 · ยังไม่ได้ 1$/.test(element.textContent?.trim() ?? ''),
      ),
    ).toBeInTheDocument();
  });

  it('keeps the chosen kind in the URL and only deals that kind', async () => {
    renderPage('/quiz?set=3-4');
    fireEvent.click(await screen.findByRole('button', { name: 'เบอร์โทร' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=3-4&type=phone');
    expect(screen.getByRole('button', { name: 'เบอร์โทร' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (let card = 2; card <= 6; card++) {
      await waitFor(() => expect(visibleFace()).toHaveTextContent(`ข้อที่ ${card}`));
      expect(visibleFace()).toHaveTextContent('Anata no denwa bangō wa nan desuka?');
      fireEvent.click(screen.getByRole('button', { name: 'สุ่มข้อใหม่' }));
    }
  });

  it('ignores an unknown ?type=', async () => {
    renderPage('/quiz?set=3-4&type=nope');
    expect(await screen.findByRole('button', { name: 'สุ่มทุกแบบ' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('treats an unknown ?set= like no choice', async () => {
    renderPage('/quiz?set=9-9');
    await screen.findByRole('button', { name: 'บท 1-2' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^แบบทดสอบ$/);
    expect(screen.queryByRole('button', { name: 'สุ่มข้อใหม่' })).not.toBeInTheDocument();
  });
});

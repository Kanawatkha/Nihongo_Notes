import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const labelsOf = (group: HTMLElement) =>
  within(group)
    .getAllByRole('button')
    .map((chip) => chip.textContent);

const partRow = () => screen.findByRole('group', { name: 'เลือกส่วนของข้อสอบ' });
const kindRow = () => screen.findByRole('group', { name: 'เลือกแบบโจทย์' });

afterEach(() => localStorage.clear());

describe('QuizPage', () => {
  it('starts empty: a prompt and the four set chips, no card', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'บท 1-2' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^แบบทดสอบ$/);
    const chips = within(screen.getByRole('group', { name: 'เลือกบทที่ต้องการฝึก' })).getAllByRole(
      'button',
    );
    expect(chips.map((chip) => chip.textContent)).toEqual([
      'บท 1-2',
      'บท 3-4',
      'บท 5-6',
      'ปลายภาค (บท 1-6)',
    ]);
    expect(chips.every((chip) => chip.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(screen.queryByRole('button', { name: 'สุ่มข้อใหม่' })).not.toBeInTheDocument();
  });

  it('treats an unknown ?set= like no choice', async () => {
    renderPage('/quiz?set=9-9');
    await screen.findByRole('button', { name: 'บท 1-2' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^แบบทดสอบ$/);
    expect(screen.queryByRole('button', { name: 'สุ่มข้อใหม่' })).not.toBeInTheDocument();
  });

  it('exam 3 (บท 5-6): two parts with points, then the six patterns of the exam', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'บท 5-6' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=5-6');
    expect(labelsOf(await partRow())).toEqual([
      'ทุกส่วน',
      'คำศัพท์ (5 คะแนน)',
      'ตอบคำถาม (10 คะแนน)',
    ]);
    // no pattern row until a part with several patterns is chosen
    expect(screen.queryByRole('group', { name: 'เลือกแบบโจทย์' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ตอบคำถาม (10 คะแนน)' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=5-6&part=answer');
    expect(labelsOf(await kindRow())).toEqual([
      'สุ่มทุกแบบ',
      'สิ่งของจากประเทศ',
      'สี / ขนาด',
      'สั่งของ',
      'เดือน-วันที่ (จากภาพ)',
      'วันเกิด',
      'วันนี้',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'สั่งของ' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=5-6&part=answer&type=counter');
    await waitFor(() => expect(visibleFace()).toHaveTextContent('Irasshaimase!'));
    fireEvent.click(await screen.findByRole('button', { name: /ดูเฉลย/ }));
    await waitFor(() => expect(visibleFace()).toHaveTextContent(/Sono .+ o .+ kudasai\./));
  });

  it('exam 1 (บท 1-2): self-introduction, words and picture questions', async () => {
    renderPage('/quiz?set=1-2');
    expect(labelsOf(await partRow())).toEqual([
      'ทุกส่วน',
      'แนะนำตัว (5 คะแนน)',
      'คำศัพท์ (5 คะแนน)',
      'ตอบคำถามจากรูป (5 คะแนน)',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'แนะนำตัว (5 คะแนน)' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=1-2&part=intro');
    // the self-introduction has one pattern: no row of patterns
    expect(screen.queryByRole('group', { name: 'เลือกแบบโจทย์' })).not.toBeInTheDocument();
    await waitFor(() => expect(visibleFace()).toHaveTextContent(/บรรทัดที่ \d ของบทพูดแนะนำตัว/));
    fireEvent.click(screen.getByRole('button', { name: 'ตอบคำถามจากรูป (5 คะแนน)' }));
    expect(labelsOf(await kindRow())).toEqual([
      'สุ่มทุกแบบ',
      'สิ่งของ',
      'มาจากประเทศ',
      'อาชีพ',
      'นิตยสารภาษา',
      'ทางนี้คือ',
    ]);
  });

  it('final (บท 1-6): one part, ten patterns named by the exam they come from', async () => {
    renderPage('/quiz?set=1-6');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'แบบทดสอบ ปลายภาค (บท 1-6)',
    );
    expect(screen.queryByRole('group', { name: 'เลือกส่วนของข้อสอบ' })).not.toBeInTheDocument();
    const labels = labelsOf(await kindRow());
    expect(labels).toHaveLength(11);
    expect(labels).toEqual([
      'สุ่มทุกแบบ',
      'ครั้งที่ 1 · ประเทศ',
      'ครั้งที่ 1 · อาชีพ',
      'ครั้งที่ 1 · นิตยสาร',
      'ครั้งที่ 2 · สถานที่',
      'ครั้งที่ 2 · เวลา',
      'ครั้งที่ 2 · เบอร์โทร',
      'ครั้งที่ 2 · ราคา',
      'ครั้งที่ 3 · สี / ขนาด',
      'ครั้งที่ 3 · สั่งของ',
      'ครั้งที่ 3 · วันนี้',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'ครั้งที่ 2 · สถานที่' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=1-6&type=place');
    await waitFor(() => expect(visibleFace()).toHaveTextContent('Koko wa doko desuka?'));
  });

  it('turns the card to the answer and back', async () => {
    renderPage('/quiz?set=3-4&part=answer&type=price');
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
    renderPage('/quiz?set=3-4&part=answer&type=time');
    await screen.findByRole('button', { name: 'สุ่มข้อใหม่' });
    expect(visibleFace()).toHaveTextContent('ข้อที่ 1');
    fireEvent.click(screen.getByRole('button', { name: 'สุ่มข้อใหม่' }));
    expect(await screen.findByText('ข้อที่ 2')).toBeInTheDocument();
  });

  it('records "known" and "not yet" from the answer side', async () => {
    renderPage('/quiz?set=1-2&part=answer&type=country');
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

  it('keeps the chosen part and pattern in the URL and only deals that pattern', async () => {
    renderPage('/quiz?set=3-4');
    fireEvent.click(await screen.findByRole('button', { name: 'ตอบคำถาม (10 คะแนน)' }));
    fireEvent.click(await screen.findByRole('button', { name: 'เบอร์โทร' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?set=3-4&part=answer&type=phone');
    expect(screen.getByRole('button', { name: 'เบอร์โทร' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // choosing the part dealt card 2 and choosing the pattern dealt card 3
    for (let card = 3; card <= 7; card++) {
      await waitFor(() => expect(visibleFace()).toHaveTextContent(`ข้อที่ ${card}`));
      expect(visibleFace()).toHaveTextContent('Anata no denwa bangō wa nan desuka?');
      fireEvent.click(screen.getByRole('button', { name: 'สุ่มข้อใหม่' }));
    }
  });

  it('shows only words when the words part is chosen', async () => {
    renderPage('/quiz?set=3-4&part=vocab');
    await screen.findByRole('button', { name: 'สุ่มข้อใหม่' });
    for (let i = 0; i < 4; i++) {
      await waitFor(() => expect(visibleFace()).toHaveTextContent('พูดเป็นภาษาญี่ปุ่น'));
      fireEvent.click(screen.getByRole('button', { name: 'สุ่มข้อใหม่' }));
    }
  });

  it('ignores a part or pattern the set does not have', async () => {
    renderPage('/quiz?set=3-4&part=nope&type=price');
    expect(await screen.findByRole('button', { name: 'ทุกส่วน' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('group', { name: 'เลือกแบบโจทย์' })).not.toBeInTheDocument();
    renderPage('/quiz?set=3-4&part=vocab&type=price');
    expect(screen.queryByRole('button', { name: 'ราคา' })).not.toBeInTheDocument();
  });

  it('deals the date of today for the today pattern', async () => {
    renderPage('/quiz?set=5-6&part=answer&type=today');
    expect(await screen.findByRole('button', { name: /ดูเฉลย/ })).toBeInTheDocument();
    expect(visibleFace()).toHaveTextContent('Kyō wa nan gatsu nan nichi desuka?');
    fireEvent.click(screen.getByRole('button', { name: /ดูเฉลย/ }));
    await waitFor(() => expect(visibleFace()).toHaveTextContent(/gatsu .+ desu\./));
  });

  it('today: a switch for a random day, remembered on this device', async () => {
    renderPage('/quiz?set=5-6&part=answer&type=today');
    const toggle = await screen.findByRole('switch', { name: 'สุ่มวัน' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('ใช้วันที่วันนี้ของเครื่องที่คุณใช้อยู่')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole('switch', { name: 'สุ่มวัน' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/สุ่มวันที่ทุกข้อ/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('nihongo-quiz-settings') ?? '{}').randomToday).toBe(
      true,
    );
  });

  it('today: a switch that was left on is on again on the next visit', async () => {
    localStorage.setItem(
      'nihongo-quiz-settings',
      JSON.stringify({ randomToday: true, birthday: null }),
    );
    renderPage('/quiz?set=1-6&type=today');
    expect(await screen.findByRole('switch', { name: 'สุ่มวัน' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('birthday: choose a day and a month, the card uses them and they are remembered', async () => {
    renderPage('/quiz?set=5-6&part=answer&type=birthday');
    await screen.findByText(/^ยังไม่ได้ตั้ง การ์ดใช้/);
    fireEvent.change(screen.getByLabelText('เดือน'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('วันที่'), { target: { value: '21' } });
    expect(screen.getByText(/จำไว้ในเครื่องนี้แล้ว/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('nihongo-quiz-settings') ?? '{}').birthday).toEqual({
      month: 9,
      day: 21,
    });
    await waitFor(() => expect(visibleFace()).toHaveTextContent('21 กันยายน'));
    fireEvent.click(await screen.findByRole('button', { name: /ดูเฉลย/ }));
    await waitFor(() => expect(visibleFace()).toHaveTextContent('Ku gatsu nijū ichi-nichi desu.'));
  });

  it('birthday: a saved birthday is filled in on the next visit and can be cleared', async () => {
    localStorage.setItem(
      'nihongo-quiz-settings',
      JSON.stringify({ randomToday: false, birthday: { month: 4, day: 30 } }),
    );
    renderPage('/quiz?set=5-6&part=answer&type=birthday');
    expect(await screen.findByLabelText('เดือน')).toHaveValue('4');
    expect(screen.getByLabelText('วันที่')).toHaveValue('30');
    fireEvent.click(screen.getByRole('button', { name: 'ล้าง' }));
    expect(JSON.parse(localStorage.getItem('nihongo-quiz-settings') ?? '{}').birthday).toBeNull();
    expect(screen.getByText(/^ยังไม่ได้ตั้ง การ์ดใช้/)).toBeInTheDocument();
  });

  it('birthday: the day follows the month (no 31 April)', async () => {
    renderPage('/quiz?set=5-6&part=answer&type=birthday');
    fireEvent.change(await screen.findByLabelText('วันที่'), { target: { value: '31' } });
    fireEvent.change(screen.getByLabelText('เดือน'), { target: { value: '4' } });
    expect(screen.getByLabelText('วันที่')).toHaveValue('30');
    expect(JSON.parse(localStorage.getItem('nihongo-quiz-settings') ?? '{}').birthday).toEqual({
      month: 4,
      day: 30,
    });
  });

  it('shows no options for the other patterns', async () => {
    renderPage('/quiz?set=5-6&part=answer&type=counter');
    await screen.findByRole('button', { name: 'สุ่มข้อใหม่' });
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('เดือน')).not.toBeInTheDocument();
  });
});

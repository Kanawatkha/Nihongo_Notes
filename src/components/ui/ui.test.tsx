import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { setReducedMotion } from '@/test/reducedMotion';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger } from '@/components/motion/Stagger';
import { Button, ButtonLink } from './Button';
import { Chip } from './Chip';
import { Disclosure } from './Disclosure';
import { Skeleton } from './Skeleton';
import { Toast } from './Toast';

describe('Chip', () => {
  it('exposes its state with aria-pressed and is clickable', () => {
    const onClick = vi.fn();
    render(
      <>
        <Chip active onClick={onClick}>
          บท 3-4
        </Chip>
        <Chip active={false}>บท 1-2</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'บท 3-4' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'บท 1-2' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'บท 3-4' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Button and ButtonLink', () => {
  it('renders a button of type button by default and a link for ButtonLink', () => {
    render(
      <MemoryRouter>
        <Button>OK</Button>
        <ButtonLink to="/exam" variant="outline" onDark>
          ไป
        </ButtonLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'OK' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('link', { name: 'ไป' })).toHaveAttribute('href', '/exam');
  });
});

describe('Disclosure', () => {
  it('toggles its panel and aria-expanded', () => {
    setReducedMotion(true);
    render(<Disclosure title="สอบครั้งที่ 1">เนื้อหา</Disclosure>);
    const button = screen.getByRole('button', { name: 'สอบครั้งที่ 1' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('เนื้อหา')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('เนื้อหา')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-controls', screen.getByRole('region').id);

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Toast', () => {
  it('shows the message in a polite live region and nothing when empty', () => {
    const { rerender } = render(<Toast message={null} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    rerender(<Toast message="ใช้งานออฟไลน์ได้แล้ว" />);
    expect(screen.getByRole('status')).toHaveTextContent('ใช้งานออฟไลน์ได้แล้ว');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Skeleton', () => {
  it('is a busy status region', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status', { name: 'กำลังโหลด...' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});

describe('motion wrappers', () => {
  it('Reveal renders its children without inline animation styles under reduced motion', () => {
    setReducedMotion(true);
    render(
      <Reveal>
        <p>เนื้อหา</p>
      </Reveal>,
    );
    const paragraph = screen.getByText('เนื้อหา');
    expect(paragraph.parentElement).not.toHaveAttribute('style');
  });

  it('Reveal keeps the content in the DOM before it animates in', () => {
    render(
      <Reveal>
        <p>เนื้อหา</p>
      </Reveal>,
    );
    expect(screen.getByText('เนื้อหา')).toBeInTheDocument();
  });

  it('Stagger renders every child, also beyond the animated limit', () => {
    render(
      <Stagger max={2}>
        <p>หนึ่ง</p>
        <p>สอง</p>
        <p>สาม</p>
        <p>สี่</p>
      </Stagger>,
    );
    for (const word of ['หนึ่ง', 'สอง', 'สาม', 'สี่']) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });
});

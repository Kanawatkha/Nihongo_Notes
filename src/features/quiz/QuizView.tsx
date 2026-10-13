import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { QUIZ_KINDS, type QuizKind, type QuizSetConfig } from '@/config/quiz';
import { UI_TEXT } from '@/config/site';
import type { ContentFile } from '@/content/types';
import { cn } from '@/lib/cn';
import { QuizCardView } from './QuizCardView';
import { buildDeck, createDealer, type Rng } from './quizCards';

type QuizViewProps = {
  file: ContentFile;
  config: QuizSetConfig;
  /** Kind from `?type=`, or null for every kind. */
  kind: QuizKind | null;
  onKindChange: (kind: QuizKind | null) => void;
  /** Random source; tests pass a seeded one. */
  rng?: Rng;
};

type KindChipsProps = {
  kinds: QuizKind[];
  active: QuizKind | null;
  onChange: (kind: QuizKind | null) => void;
};

/** One row of small chips: every kind, or one kind of question. */
function KindChips({ kinds, active, onChange }: KindChipsProps) {
  const options: { kind: QuizKind | null; label: string }[] = [
    { kind: null, label: UI_TEXT.allKinds },
    ...kinds.map((kind) => ({ kind, label: QUIZ_KINDS[kind].label })),
  ];
  return (
    <div
      role="group"
      aria-label={UI_TEXT.quizKinds}
      className="flex flex-wrap justify-center gap-2"
    >
      {options.map((option) => {
        const pressed = option.kind === active;
        return (
          <button
            key={option.kind ?? 'all'}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.kind)}
            className={cn(
              'type-caption min-h-11 rounded-xl border px-4 whitespace-nowrap transition-colors duration-200',
              pressed
                ? 'border-primary bg-primary text-on-primary'
                : 'border-hairline bg-canvas text-ink active:bg-soft-stone',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The quiz of one chapter set: kind chips, the flash card, and the controls. The card turns to
 * show the answer; the dice deals a new card; after looking at the answer the student marks it
 * as known or not yet (a word not known yet comes back a few cards later).
 */
export function QuizView({ file, config, kind, onKindChange, rng }: QuizViewProps) {
  const deck = useMemo(() => buildDeck(file, config), [file, config]);
  const [dealer] = useState(() => createDealer(deck, rng));
  const activeKind = kind && deck.kinds.includes(kind) ? kind : null;
  const [card, setCard] = useState(() => dealer.deal(activeKind));
  const [number, setNumber] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const [rolls, setRolls] = useState(0);
  const [tally, setTally] = useState({ known: 0, again: 0 });

  const dealNext = (nextKind: QuizKind | null) => {
    setFlipped(false);
    setCard(dealer.deal(nextKind));
    setNumber((value) => value + 1);
    setRolls((value) => value + 1);
  };

  const mark = (known: boolean) => {
    if (!known) dealer.again(card);
    setTally((value) =>
      known ? { ...value, known: value.known + 1 } : { ...value, again: value.again + 1 },
    );
    dealNext(activeKind);
  };

  const changeKind = (next: QuizKind | null) => {
    onKindChange(next);
    dealNext(next);
  };

  return (
    <div className="mx-auto w-full max-w-[720px] pb-section">
      <KindChips kinds={deck.kinds} active={activeKind} onChange={changeKind} />

      <p className="type-caption mt-6 text-center text-body-muted">
        {UI_TEXT.known} <span className="font-medium text-ink tabular-nums">{tally.known}</span>
        {' · '}
        {UI_TEXT.again} <span className="font-medium text-ink tabular-nums">{tally.again}</span>
      </p>

      <div className="mt-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 32, rotate: 1.5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -32, rotate: -1.5 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <QuizCardView
              card={card}
              number={number}
              flipped={flipped}
              onFlip={() => setFlipped((value) => !value)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <p aria-live="polite" className="sr-only">
        {flipped ? `${UI_TEXT.solution}: ${card.answer}` : ''}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          aria-pressed={flipped}
          onClick={() => setFlipped((value) => !value)}
          className="min-w-36"
        >
          <Icon name="flip" size={18} />
          {flipped ? UI_TEXT.hideAnswer : UI_TEXT.reveal}
        </Button>
        <button
          type="button"
          onClick={() => dealNext(activeKind)}
          className="type-button inline-flex min-h-12 min-w-36 items-center justify-center gap-2 rounded-pill bg-coral px-6 py-3 text-ink transition-transform active:scale-95"
        >
          <motion.span
            className="inline-flex"
            animate={{ rotate: rolls * 360 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          >
            <Icon name="dice" size={22} />
          </motion.span>
          {UI_TEXT.roll}
        </button>
      </div>

      <div
        aria-hidden={!flipped}
        inert={!flipped}
        className={cn(
          'mt-5 flex flex-wrap items-center justify-center gap-3 transition-opacity duration-300 motion-reduce:transition-none',
          flipped ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <span className="type-caption text-body-muted">{UI_TEXT.selfCheck}</span>
        <Button variant="outline" onClick={() => mark(false)}>
          <Icon name="retry" size={18} />
          {UI_TEXT.again}
        </Button>
        <Button onClick={() => mark(true)}>
          <Icon name="check" size={18} />
          {UI_TEXT.known}
        </Button>
      </div>
    </div>
  );
}

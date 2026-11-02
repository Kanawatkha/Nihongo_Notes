import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { QUIZ_KINDS, type QuizKind, type QuizSectionId, type QuizSetConfig } from '@/config/quiz';
import { UI_TEXT } from '@/config/site';
import type { ContentFile } from '@/content/types';
import { cn } from '@/lib/cn';
import { QuizCardView } from './QuizCardView';
import { QuizOptions } from './QuizOptions';
import { buildDeck, createDealer, type QuizFilter, type Rng } from './quizCards';
import { loadSettings, saveSettings, type QuizSettings } from './quizSettings';

type QuizViewProps = {
  /** The vocabulary files of `config.files`. */
  files: ContentFile[];
  config: QuizSetConfig;
  /** Part and pattern from `?part=` and `?type=`, already checked against the set. */
  filter: QuizFilter;
  onFilterChange: (filter: QuizFilter) => void;
  /** Random sources; tests pass seeded ones. */
  rng?: Rng;
  now?: () => Date;
};

type Option<T> = { value: T; label: string };

type ChipRowProps<T extends string> = {
  label: string;
  options: Option<T | null>[];
  active: T | null;
  onChange: (value: T | null) => void;
};

/** One row of small chips; the first one (value null) means "all of it". */
function ChipRow<T extends string>({ label, options, active, onChange }: ChipRowProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-center gap-2">
      {options.map((option) => (
        <button
          key={option.value ?? 'all'}
          type="button"
          aria-pressed={option.value === active}
          onClick={() => onChange(option.value)}
          className={cn(
            'type-caption min-h-11 rounded-xl border px-4 whitespace-nowrap transition-colors duration-200',
            option.value === active
              ? 'border-primary bg-primary text-on-primary'
              : 'border-hairline bg-canvas text-ink active:bg-soft-stone',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The quiz of one set: chips for the parts of the exam and for the question patterns of a part,
 * the flash card, and the controls. The card turns to show the answer; the dice deals a new card;
 * after looking at the answer the student marks it as known or not yet (a word not known yet
 * comes back a few cards later).
 */
export function QuizView({ files, config, filter, onFilterChange, rng, now }: QuizViewProps) {
  const deck = useMemo(() => buildDeck(files, config), [files, config]);
  const [dealer] = useState(() => createDealer(deck, rng, now));
  const [settings, setSettings] = useState(loadSettings);
  const [card, setCard] = useState(() => dealer.deal(filter, settings));
  const [number, setNumber] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const [rolls, setRolls] = useState(0);
  const [tally, setTally] = useState({ known: 0, again: 0 });

  const sections = config.sections
    .map((section) => ({
      section,
      kinds: section.kinds.filter((kind) => deck.kinds.includes(kind)),
    }))
    .filter((entry) => entry.kinds.length > 0);
  const single = sections.length === 1;
  // The pattern row belongs to the chosen part, or to the only part of a set that has one
  const shown = single ? sections[0] : sections.find((entry) => entry.section.id === filter.part);
  const kindLabel = (kind: QuizKind) => config.labels?.[kind] ?? QUIZ_KINDS[kind].label;

  const dealNext = (next: QuizFilter, withSettings: QuizSettings = settings) => {
    setFlipped(false);
    setCard(dealer.deal(next, withSettings));
    setNumber((value) => value + 1);
    setRolls((value) => value + 1);
  };

  const mark = (known: boolean) => {
    if (!known) dealer.again(card);
    setTally((value) =>
      known ? { ...value, known: value.known + 1 } : { ...value, again: value.again + 1 },
    );
    dealNext(filter);
  };

  const change = (next: QuizFilter) => {
    onFilterChange(next);
    dealNext(next);
  };

  // Settings are remembered on this device; a new card shows the change at once
  const changeSettings = (next: QuizSettings) => {
    setSettings(next);
    saveSettings(next);
    dealNext(filter, next);
  };

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="space-y-3">
        {!single && (
          <ChipRow<QuizSectionId>
            label={UI_TEXT.quizParts}
            active={filter.part}
            onChange={(part) => change({ part, kind: null })}
            options={[
              { value: null, label: UI_TEXT.allParts },
              ...sections.map(({ section }) => ({
                value: section.id,
                label: `${section.label} (${section.points} ${UI_TEXT.points})`,
              })),
            ]}
          />
        )}
        {shown && shown.kinds.length > 1 && (
          <ChipRow<QuizKind>
            label={UI_TEXT.quizKinds}
            active={filter.kind}
            onChange={(kind) => change({ part: single ? null : shown.section.id, kind })}
            options={[
              { value: null, label: UI_TEXT.allKinds },
              ...shown.kinds.map((kind) => ({ value: kind, label: kindLabel(kind) })),
            ]}
          />
        )}
      </div>
      <QuizOptions kind={filter.kind} settings={settings} onChange={changeSettings} />

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
          onClick={() => dealNext(filter)}
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

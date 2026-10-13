import { motion } from 'motion/react';
import { QUIZ_KINDS } from '@/config/quiz';
import { UI_TEXT } from '@/config/site';
import { cn } from '@/lib/cn';
import type { QuizCard } from './quizCards';

type QuizCardViewProps = {
  card: QuizCard;
  number: number;
  flipped: boolean;
  onFlip: () => void;
};

const FLIP = { duration: 0.55, ease: [0.22, 1, 0.36, 1] } as const;

/** Front: what the examiner says and shows. Deep green, like the exam pattern band. */
function Front({ card, number }: { card: QuizCard; number: number }) {
  return (
    <div className="flex h-full flex-col rounded-lg bg-deep-green p-6 text-on-dark sm:p-8 md:p-10">
      <div className="flex items-center justify-between gap-4">
        <p className="type-mono-label text-muted">{QUIZ_KINDS[card.kind].label}</p>
        <p className="type-mono-label text-muted">
          {UI_TEXT.cardNumber} {number}
        </p>
      </div>

      <p lang={card.question ? 'ja-Latn' : 'th'} className="type-feature-heading mt-5">
        {card.question ?? UI_TEXT.sayInJapanese}
      </p>

      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center sm:py-10">
        <p
          className={cn(
            card.promptIsThai
              ? 'type-quiz-thai break-words'
              : cn(
                  'tabular-nums',
                  card.prompt.length > 10 ? 'type-quiz-number-long' : 'type-quiz-number',
                ),
          )}
        >
          {card.promptIsThai
            ? card.prompt
            : // a phone number or a time range breaks only between words, never at a hyphen
              card.prompt.split(' ').map((word, index) => (
                <span key={index} className="whitespace-nowrap">
                  {index > 0 && ' '}
                  {word}
                </span>
              ))}
        </p>
        {card.note && <p className="type-caption mt-3 text-on-dark/70">({card.note})</p>}
      </div>

      <p className="type-caption text-center text-on-dark/60">{UI_TEXT.tapToFlip}</p>
    </div>
  );
}

/** Back: the answer to say, the spoken chunks with the irregular ones marked, and a reminder. */
function Back({ card }: { card: QuizCard }) {
  const tip = QUIZ_KINDS[card.kind].tip;
  return (
    <div className="flex h-full flex-col rounded-lg border border-hairline bg-canvas p-6 shadow-[0_24px_64px_rgb(23_23_28/0.12)] sm:p-8 md:p-10">
      <div className="flex items-center justify-between gap-4">
        <p className="type-mono-label text-body-muted">
          {UI_TEXT.solution} · {QUIZ_KINDS[card.kind].label}
        </p>
        <p className="type-mono-label text-body-muted">{card.prompt}</p>
      </div>
      {card.question && (
        <p lang="ja-Latn" className="type-caption mt-4 text-body-muted">
          {card.question}
        </p>
      )}

      <div className="flex flex-1 flex-col justify-center py-6">
        <p lang="ja-Latn" className="type-quiz-answer text-ink">
          {card.answer}
        </p>
        {card.alternatives && card.alternatives.length > 0 && (
          <p className="type-caption mt-2 text-body-muted">
            {UI_TEXT.orAlso} <span lang="ja-Latn">{card.alternatives.join(', ')}</span>
          </p>
        )}

        {card.parts && card.parts.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {card.parts.map((part, index) => (
              <li
                key={index}
                className={cn(
                  'flex flex-col rounded-sm border px-3 py-1.5',
                  part.irregular ? 'border-coral bg-coral/10' : 'border-hairline bg-soft-stone/60',
                )}
              >
                <span className="type-micro text-body-muted">{part.label}</span>
                <span lang="ja-Latn" className="type-body font-medium text-ink">
                  {part.reading}
                  {part.irregular && (
                    <>
                      <span
                        aria-hidden="true"
                        className="ml-1 inline-block size-1.5 rounded-full bg-coral align-super"
                      />
                      <span className="sr-only"> (อ่านไม่ปกติ)</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tip && (
        <p className="type-caption rounded-sm bg-pale-green px-4 py-3 text-ink">
          <span className="font-medium">{UI_TEXT.tip}</span> · {tip}
        </p>
      )}
    </div>
  );
}

/**
 * The flash card. Both faces share one grid cell, so the card is as tall as the taller face and
 * nothing jumps when it turns. The hidden face is inert, so a screen reader and the Tab key only
 * reach the face that can be seen. A press anywhere on the card turns it.
 */
export function QuizCardView({ card, number, flipped, onFlip }: QuizCardViewProps) {
  return (
    <div className="[perspective:1600px]" onClick={onFlip}>
      <motion.div
        className="grid min-h-[340px] cursor-pointer sm:min-h-[380px] md:min-h-[420px]"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={FLIP}
      >
        <div
          className="[grid-area:1/1] [backface-visibility:hidden]"
          aria-hidden={flipped}
          inert={flipped}
        >
          <Front card={card} number={number} />
        </div>
        <div
          className="[grid-area:1/1] [transform:rotateY(180deg)] [backface-visibility:hidden]"
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <Back card={card} />
        </div>
      </motion.div>
    </div>
  );
}

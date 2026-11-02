import { useId, useState } from 'react';
import { UI_TEXT } from '@/config/site';
import { cn } from '@/lib/cn';
import { MONTH_NAMES, daysInMonth } from '@/lib/readings56';
import { isValidMonthDay, type QuizSettings } from './quizSettings';
import type { QuizKind } from '@/config/quiz';

type QuizOptionsProps = {
  /** The chosen pattern: options show only for `today` and `birthday`. */
  kind: QuizKind | null;
  settings: QuizSettings;
  onChange: (settings: QuizSettings) => void;
};

const SELECT =
  'type-caption min-h-11 rounded-sm border border-hairline bg-canvas px-3 text-ink focus-visible:outline-2';

/** On/off switch (`role="switch"`) with a sliding knob. */
function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="type-body inline-flex min-h-11 items-center gap-3 rounded-sm text-ink"
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-pill transition-colors duration-200 motion-reduce:transition-none',
          checked ? 'bg-coral' : 'bg-hairline',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 size-5 rounded-full bg-canvas shadow-sm transition-transform duration-200 motion-reduce:transition-none',
            checked && 'translate-x-5',
          )}
        />
      </span>
      {label}
    </button>
  );
}

/** The own birthday: a day and a month, saved as soon as both are chosen. */
function BirthdayForm({ settings, onChange }: Omit<QuizOptionsProps, 'kind'>) {
  const dayId = useId();
  const monthId = useId();
  const [draft, setDraft] = useState({
    month: settings.birthday?.month ?? 0,
    day: settings.birthday?.day ?? 0,
  });

  const update = (next: { month: number; day: number }) => {
    // keep the day inside the month (31 -> 30 when the month changes to April)
    const limit = next.month ? daysInMonth(2024, next.month) : 31;
    const fixed = { month: next.month, day: Math.min(next.day, limit) };
    setDraft(fixed);
    if (isValidMonthDay(fixed.month, fixed.day)) onChange({ ...settings, birthday: fixed });
  };

  const clear = () => {
    setDraft({ month: 0, day: 0 });
    onChange({ ...settings, birthday: null });
  };

  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={dayId} className="type-micro text-body-muted">
          {UI_TEXT.birthdayDay}
        </label>
        <select
          id={dayId}
          value={draft.day}
          onChange={(event) => update({ ...draft, day: Number(event.target.value) })}
          className={SELECT}
        >
          <option value={0}>-</option>
          {Array.from({ length: draft.month ? daysInMonth(2024, draft.month) : 31 }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {index + 1}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={monthId} className="type-micro text-body-muted">
          {UI_TEXT.birthdayMonth}
        </label>
        <select
          id={monthId}
          value={draft.month}
          onChange={(event) => update({ ...draft, month: Number(event.target.value) })}
          className={SELECT}
        >
          <option value={0}>-</option>
          {MONTH_NAMES.slice(1).map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {(settings.birthday || draft.month || draft.day) && (
        <button
          type="button"
          onClick={clear}
          className="type-caption min-h-11 rounded-xl border border-hairline px-4 text-ink active:bg-soft-stone"
        >
          {UI_TEXT.birthdayClear}
        </button>
      )}
    </div>
  );
}

/**
 * Options of the date cards, under the pattern chips: a switch for a random day on "today", and
 * the own birthday for "birthday". Both are remembered on this device.
 */
export function QuizOptions({ kind, settings, onChange }: QuizOptionsProps) {
  if (kind === 'today') {
    return (
      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <Switch
          checked={settings.randomToday}
          label={UI_TEXT.randomDay}
          onChange={(randomToday) => onChange({ ...settings, randomToday })}
        />
        <p className="type-caption text-body-muted">
          {settings.randomToday ? UI_TEXT.randomDayOn : UI_TEXT.randomDayOff}
        </p>
      </div>
    );
  }
  if (kind === 'birthday') {
    return (
      <div className="mt-4 flex flex-col items-center gap-2 text-center">
        <p className="type-caption text-ink">{UI_TEXT.birthdayLabel}</p>
        <BirthdayForm settings={settings} onChange={onChange} />
        <p className="type-caption text-body-muted">
          {settings.birthday ? UI_TEXT.birthdaySaved : UI_TEXT.birthdayHint}
        </p>
      </div>
    );
  }
  return null;
}

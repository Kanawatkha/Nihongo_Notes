import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHero } from '@/components/layout/PageHero';
import { LoadError } from '@/components/ui/LoadError';
import { SetSwitch, type SwitchSet } from '@/components/ui/SetSwitch';
import { Skeleton } from '@/components/ui/Skeleton';
import { QUIZ_SETS, type QuizSectionId, type QuizSetConfig } from '@/config/quiz';
import { UI_TEXT } from '@/config/site';
import { QuizView } from '@/features/quiz/QuizView';
import type { QuizFilter } from '@/features/quiz/quizCards';
import { useContentFiles } from '@/hooks/useContentFile';
import { usePageTitle } from '@/hooks/usePageTitle';

const SETS = Object.values(QUIZ_SETS);

/** Reads `?part=` and `?type=` and drops what the set does not have: a part, then a pattern of it. */
function filterOf(config: QuizSetConfig, params: URLSearchParams): QuizFilter {
  const single = config.sections.length === 1;
  const requestedPart = params.get('part');
  const requestedKind = params.get('type');
  const section = single
    ? config.sections[0]
    : config.sections.find((item) => item.id === requestedPart);
  const kind = section?.kinds.find((item) => item === requestedKind) ?? null;
  return { part: single ? null : ((section?.id as QuizSectionId | undefined) ?? null), kind };
}

type QuizSetProps = {
  config: QuizSetConfig;
  filter: QuizFilter;
  onFilterChange: (filter: QuizFilter) => void;
};

function QuizSet({ config, filter, onFilterChange }: QuizSetProps) {
  const content = useContentFiles('vocab', config.files);
  if (content.status === 'loading') return <Skeleton />;
  if (content.status === 'error') return <LoadError onRetry={content.retry} />;
  return (
    <QuizView
      key={config.param}
      files={content.data}
      config={config}
      filter={filter}
      onFilterChange={onFilterChange}
    />
  );
}

/**
 * Flash cards in the shape of the oral exams, one set at a time (exam 1, 2, 3 and the final).
 * Empty until a set is chosen.
 */
export function QuizPage() {
  const [params, setParams] = useSearchParams();
  const active = SETS.find((set) => set.param === params.get('set')) ?? null;
  const filter = active ? filterOf(active, params) : { part: null, kind: null };

  usePageTitle(active ? `แบบทดสอบ ${active.label}` : 'แบบทดสอบ');

  const sets: SwitchSet[] = SETS.map((set) => ({ param: set.param, label: set.label }));

  const changeFilter = (next: QuizFilter) => {
    if (!active) return;
    const query: Record<string, string> = { set: active.param };
    if (next.part) query.part = next.part;
    if (next.kind) query.type = next.kind;
    setParams(query, { replace: true });
  };

  return (
    <PageContainer>
      <PageHero
        eyebrow={active ? `Flash cards · ${active.label}` : 'Flash cards'}
        title={active ? `แบบทดสอบ ${active.label}` : 'แบบทดสอบ'}
        subtitle={active ? UI_TEXT.quizIntro : UI_TEXT.chooseQuiz}
        titleKey={active?.param}
      />
      <SetSwitch
        sets={sets}
        activeParam={active?.param ?? null}
        onChange={(param) => setParams({ set: param })}
        label={UI_TEXT.chooseQuiz}
      />
      <div className="pt-8 pb-section">
        {active && <QuizSet config={active} filter={filter} onFilterChange={changeFilter} />}
      </div>
    </PageContainer>
  );
}

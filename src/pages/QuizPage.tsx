import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHero } from '@/components/layout/PageHero';
import { LoadError } from '@/components/ui/LoadError';
import { SetSwitch, type SwitchSet } from '@/components/ui/SetSwitch';
import { Skeleton } from '@/components/ui/Skeleton';
import { QUIZ_KINDS, QUIZ_SETS, type QuizKind } from '@/config/quiz';
import { UI_TEXT } from '@/config/site';
import type { ManifestFile } from '@/content/types';
import { QuizView } from '@/features/quiz/QuizView';
import { useContentFile, useManifest } from '@/hooks/useContentFile';
import { usePageTitle } from '@/hooks/usePageTitle';
import { setParamOf } from '@/lib/setParam';

const isKind = (value: string | null): value is QuizKind =>
  value !== null && Object.hasOwn(QUIZ_KINDS, value);

type QuizSetProps = {
  file: ManifestFile;
  kind: QuizKind | null;
  onKindChange: (kind: QuizKind | null) => void;
};

function QuizSet({ file, kind, onKindChange }: QuizSetProps) {
  const content = useContentFile('vocab', file.key);
  const config = QUIZ_SETS[file.key];
  if (content.status === 'loading' || !config) return <Skeleton />;
  if (content.status === 'error') return <LoadError onRetry={content.retry} />;
  return (
    <QuizView
      key={file.key}
      file={content.data}
      config={config}
      kind={kind}
      onKindChange={onKindChange}
    />
  );
}

/** Flash cards in the shape of the oral exam, one chapter set at a time. Empty until a set is chosen. */
export function QuizPage() {
  const [params, setParams] = useSearchParams();
  const manifest = useManifest();

  // The chapter sets of the vocabulary page that have a quiz, in chip order
  const files =
    manifest.status === 'ready'
      ? manifest.data.files
          .filter((file) => file.collection === 'vocab' && file.key in QUIZ_SETS)
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [];
  const active = files.find((file) => setParamOf(file.key) === params.get('set')) ?? null;
  const type = params.get('type');
  const kind = isKind(type) ? type : null;

  usePageTitle(active?.label ? `แบบทดสอบ ${active.label}` : 'แบบทดสอบ');

  if (manifest.status === 'error') {
    return (
      <PageContainer>
        <LoadError onRetry={manifest.retry} />
      </PageContainer>
    );
  }

  if (manifest.status === 'loading') {
    return (
      <PageContainer>
        <div className="py-section">
          <Skeleton />
        </div>
      </PageContainer>
    );
  }

  const sets: SwitchSet[] = files.map((file) => ({
    param: setParamOf(file.key),
    label: file.label ?? file.key,
  }));

  const changeKind = (next: QuizKind | null) => {
    if (!active) return;
    const query: Record<string, string> = { set: setParamOf(active.key) };
    if (next) query.type = next;
    setParams(query, { replace: true });
  };

  return (
    <PageContainer>
      <PageHero
        eyebrow={active ? `Flash cards · ${active.label ?? active.key}` : 'Flash cards'}
        title={active ? `แบบทดสอบ ${active.label ?? active.key}` : 'แบบทดสอบ'}
        subtitle={active ? UI_TEXT.quizIntro : UI_TEXT.chooseQuiz}
        titleKey={active?.key}
      />
      <SetSwitch
        sets={sets}
        activeParam={active ? setParamOf(active.key) : null}
        onChange={(param) => setParams({ set: param })}
        label={UI_TEXT.chooseQuiz}
      />
      <div className="pt-8 pb-section">
        {active && <QuizSet file={active} kind={kind} onKindChange={changeKind} />}
      </div>
    </PageContainer>
  );
}

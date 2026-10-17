import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHero } from '@/components/layout/PageHero';
import { LoadError } from '@/components/ui/LoadError';
import { SetSwitch, type SwitchSet } from '@/components/ui/SetSwitch';
import { Skeleton } from '@/components/ui/Skeleton';
import { UI_TEXT } from '@/config/site';
import type { ManifestFile } from '@/content/types';
import { ExamView } from '@/features/exam/ExamView';
import { useContentFile, useManifest } from '@/hooks/useContentFile';
import { usePageTitle } from '@/hooks/usePageTitle';
import { setParamOf } from '@/lib/setParam';

function Quiz({ file }: { file: ManifestFile }) {
  const reduceMotion = useReducedMotion();
  const content = useContentFile('exam', file.key);
  if (content.status === 'loading') return <Skeleton />;
  if (content.status === 'error') return <LoadError onRetry={content.retry} />;
  return (
    <motion.div
      key={file.key}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <ExamView file={content.data} />
    </motion.div>
  );
}

export function ExamPage() {
  const [params, setParams] = useSearchParams();
  const manifest = useManifest();

  const files =
    manifest.status === 'ready'
      ? manifest.data.files
          .filter((file) => file.collection === 'exam')
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [];
  // Nothing is shown until a quiz is chosen; an unknown `?set=` counts as not chosen
  const active = files.find((file) => setParamOf(file.key) === params.get('set')) ?? null;

  usePageTitle(active?.label ? `แนวสอบ ${active.label}` : 'แนวสอบ');

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

  return (
    <PageContainer>
      <PageHero
        eyebrow={active ? `Oral exam · ${active.label ?? active.key}` : 'Oral exam'}
        title={active ? active.title : 'แนวสอบ'}
        subtitle={active ? active.facts : UI_TEXT.chooseExam}
        titleKey={active?.key}
      />
      <SetSwitch
        sets={sets}
        activeParam={active ? setParamOf(active.key) : null}
        onChange={(param) => setParams({ set: param })}
        label={UI_TEXT.chooseExam}
      />
      <div className="mx-auto max-w-[1100px] pt-8 pb-section">
        {active && <Quiz file={active} />}
      </div>
    </PageContainer>
  );
}

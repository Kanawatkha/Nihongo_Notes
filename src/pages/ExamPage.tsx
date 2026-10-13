import { PageContainer } from '@/components/layout/PageContainer';
import { LoadError } from '@/components/ui/LoadError';
import { Skeleton } from '@/components/ui/Skeleton';
import { EXAM_FILES } from '@/config/site';
import { ArchivePanel } from '@/features/exam/ArchivePanel';
import { ExamHero } from '@/features/exam/ExamHero';
import { ExamView } from '@/features/exam/ExamView';
import { useContentFile } from '@/hooks/useContentFile';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ExamPage() {
  usePageTitle('แนวสอบ');
  // One hook per registered exam file: the current quiz and the archived one(s)
  const first = useContentFile('exam', EXAM_FILES[0]);
  const second = useContentFile('exam', EXAM_FILES[1]);
  const loaded = [first, second];

  const failed = loaded.find((remote) => remote.status === 'error');
  if (failed?.status === 'error') {
    const retryAll = () => {
      for (const remote of loaded) if (remote.status === 'error') remote.retry();
    };
    return (
      <PageContainer>
        <LoadError onRetry={retryAll} />
      </PageContainer>
    );
  }

  if (first.status !== 'ready' || second.status !== 'ready') {
    return (
      <PageContainer>
        <div className="py-section">
          <Skeleton />
        </div>
      </PageContainer>
    );
  }

  const files = [first.data, second.data];
  const current = files.find((file) => !file.meta.archived) ?? first.data;
  const archived = files.filter((file) => file !== current && file.meta.archived);

  return (
    <PageContainer>
      <ExamHero file={current} />
      <div className="mx-auto max-w-[1100px] pb-section">
        <ExamView file={current} />
        {archived.map((file) => (
          <ArchivePanel key={file.key} file={file} />
        ))}
      </div>
    </PageContainer>
  );
}

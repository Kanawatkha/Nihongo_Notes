import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadError } from '@/components/ui/LoadError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ManifestFile } from '@/content/types';
import { SetSwitch, type VocabSet } from '@/features/vocab/SetSwitch';
import { VocabHero } from '@/features/vocab/VocabHero';
import { VocabView } from '@/features/vocab/VocabView';
import { useContentFile, useManifest } from '@/hooks/useContentFile';
import { usePageTitle } from '@/hooks/usePageTitle';

/** `ch3-4` <-> `3-4`: the value of `?set=`. */
const toParam = (key: string): string => key.replace(/^ch/, '');

type SectionsProps = {
  file: ManifestFile;
  group: string | null;
  onSelect: (id: string) => void;
};

function Sections({ file, group, onSelect }: SectionsProps) {
  const content = useContentFile('vocab', file.key);
  if (content.status === 'loading') {
    return (
      <PageContainer>
        <Skeleton />
      </PageContainer>
    );
  }
  if (content.status === 'error') {
    return (
      <PageContainer>
        <LoadError onRetry={content.retry} />
      </PageContainer>
    );
  }
  const targetId = group ? `vocab/${file.key}/${group}` : null;
  return <VocabView file={content.data} targetId={targetId} onSelect={onSelect} />;
}

export function VocabPage() {
  const [params, setParams] = useSearchParams();
  const manifest = useManifest();

  const files =
    manifest.status === 'ready'
      ? manifest.data.files
          .filter((file) => file.collection === 'vocab')
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : [];
  const active =
    files.find((file) => toParam(file.key) === params.get('set')) ??
    files.find((file) => file.order === 1) ??
    files[0];

  usePageTitle(active?.label ? `คำศัพท์ ${active.label}` : 'คำศัพท์');

  if (manifest.status === 'error') {
    return (
      <PageContainer>
        <LoadError onRetry={manifest.retry} />
      </PageContainer>
    );
  }

  if (!active) {
    return (
      <PageContainer>
        <div className="py-section">
          <Skeleton />
        </div>
      </PageContainer>
    );
  }

  const sets: VocabSet[] = files.map((file) => ({
    param: toParam(file.key),
    label: file.label ?? file.key,
  }));

  const changeSet = (param: string) => setParams({ set: param });
  const selectGroup = (id: string) => {
    const group = id.split('/').slice(2).join('/');
    setParams({ set: toParam(active.key), g: group }, { replace: true });
  };

  return (
    <>
      <PageContainer>
        <VocabHero
          label={active.label ?? active.key}
          words={active.wordCount}
          readings={active.readingCount}
          sections={active.headings.filter((heading) => heading.level === 3).length}
        />
        {sets.length > 1 && (
          <SetSwitch sets={sets} activeParam={toParam(active.key)} onChange={changeSet} />
        )}
      </PageContainer>
      <Sections file={active} group={params.get('g')} onSelect={selectGroup} />
    </>
  );
}

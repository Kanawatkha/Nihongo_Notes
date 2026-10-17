import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHero } from '@/components/layout/PageHero';
import { LoadError } from '@/components/ui/LoadError';
import { Skeleton } from '@/components/ui/Skeleton';
import { SetSwitch, type SwitchSet } from '@/components/ui/SetSwitch';
import { UI_TEXT } from '@/config/site';
import type { ManifestFile } from '@/content/types';
import { VocabView } from '@/features/vocab/VocabView';
import { useContentFile, useManifest } from '@/hooks/useContentFile';
import { usePageTitle } from '@/hooks/usePageTitle';
import { setParamOf } from '@/lib/setParam';

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

/** `64 คำ · 106 รายการ · 15 หัวข้อ · โรมาจิตามสไลด์` */
function countsLine(file: ManifestFile): string {
  const sections = file.headings.filter((heading) => heading.level === 3).length;
  const parts = [`${file.wordCount} คำ`];
  if (file.readingCount > 0) parts.push(`${file.readingCount} รายการ`);
  parts.push(`${sections} หัวข้อ`, 'โรมาจิตามสไลด์');
  return parts.join(' · ');
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
  // Nothing is shown until a set is chosen; an unknown `?set=` counts as not chosen
  const active = files.find((file) => setParamOf(file.key) === params.get('set')) ?? null;

  usePageTitle(active?.label ? `คำศัพท์ ${active.label}` : 'คำศัพท์');

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

  const changeSet = (param: string) => setParams({ set: param });
  const selectGroup = (id: string) => {
    if (!active) return;
    const group = id.split('/').slice(2).join('/');
    setParams({ set: setParamOf(active.key), g: group }, { replace: true });
  };

  return (
    <>
      <PageContainer>
        <PageHero
          eyebrow={active ? `Vocabulary · ${active.label ?? active.key}` : 'Vocabulary'}
          title={active ? `คำศัพท์ ${active.label ?? active.key}` : 'คำศัพท์'}
          subtitle={active ? countsLine(active) : UI_TEXT.chooseVocab}
          titleKey={active?.key}
        />
        <SetSwitch
          sets={sets}
          activeParam={active ? setParamOf(active.key) : null}
          onChange={changeSet}
          label={UI_TEXT.chooseVocab}
        />
        {!active && <div className="pt-8 pb-section" />}
      </PageContainer>
      {active && <Sections file={active} group={params.get('g')} onSelect={selectGroup} />}
    </>
  );
}

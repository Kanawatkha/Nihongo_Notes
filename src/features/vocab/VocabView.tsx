import { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { NodeView } from '@/components/content/NodeView';
import { PageContainer } from '@/components/layout/PageContainer';
import type { ContentFile } from '@/content/types';
import { ContentsChips, ContentsRail } from './Contents';
import { contentsItems } from './contentsItems';
import { RomajiTicker } from './RomajiTicker';
import { tickerWords } from './tickerWords';
import { useActiveSection } from './useActiveSection';
import { useRailOpen } from './useRailOpen';

type VocabViewProps = {
  file: ContentFile;
  /** Node id to scroll to after the file is shown (from `?g=`), or null. */
  targetId: string | null;
  onSelect: (id: string) => void;
};

/** Ticker, contents navigation and every section of one vocabulary file. */
export function VocabView({ file, targetId, onSelect }: VocabViewProps) {
  const reduceMotion = useReducedMotion();
  const items = useMemo(() => contentsItems(file.nodes), [file]);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const words = useMemo(() => tickerWords(file), [file]);
  const activeId = useActiveSection(ids);
  const [railOpen, toggleRail] = useRailOpen();

  useEffect(() => {
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [file, targetId]);

  const select = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    onSelect(id);
  };

  return (
    <motion.div
      key={file.key}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pt-8">
        <RomajiTicker words={words} />
      </div>
      <PageContainer>
        <div className="vocab-layout relative" data-rail={railOpen ? 'open' : 'closed'}>
          <ContentsRail
            items={items}
            activeId={activeId}
            onSelect={select}
            open={railOpen}
            onToggle={toggleRail}
          />
          <ContentsChips items={items} activeId={activeId} onSelect={select} />
          <div className="min-w-0 pt-8 pb-section lg:col-start-2 lg:row-start-1">
            {file.nodes.map((node, index) => (
              <NodeView key={node.id} node={node} index={index} bands />
            ))}
          </div>
        </div>
      </PageContainer>
    </motion.div>
  );
}

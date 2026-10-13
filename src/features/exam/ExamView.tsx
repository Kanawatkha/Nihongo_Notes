import { BlockRenderer } from '@/components/content/BlockRenderer';
import { InlineContent } from '@/components/content/InlineContent';
import { NodeView } from '@/components/content/NodeView';
import { Reveal } from '@/components/motion/Reveal';
import type { Block, ContentFile, ContentNode } from '@/content/types';
import { PatternBand } from './PatternBand';
import { PracticeRows } from './PracticeRows';
import { ScoreSplit } from './ScoreSplit';
import { isPatternTable, isPracticeTable, isScoreTable } from './examBlocks';

/** Blocks that have a designed layout on this page; anything else falls back to the generic renderer. */
function ExamBlock({ block }: { block: Block }) {
  if (isScoreTable(block)) return <ScoreSplit table={block} />;
  if (isPracticeTable(block)) return <PracticeRows table={block} />;
  return <BlockRenderer block={block} />;
}

function ExamNode({ node }: { node: ContentNode }) {
  if (node.blocks.some(isPatternTable)) return <PatternBand node={node} />;

  return (
    <section id={node.id} className="mt-16 first:mt-0">
      <Reveal>
        <h2 className="type-section-heading">
          {node.number && (
            <span className="type-mono-label mr-3 inline-block align-middle text-body-muted">
              {node.number}
            </span>
          )}
          <InlineContent inlines={node.title} />
        </h2>
      </Reveal>
      {node.blocks.length > 0 && (
        <div className="mt-8 space-y-6">
          {node.blocks.map((block, index) => (
            <ExamBlock key={index} block={block} />
          ))}
        </div>
      )}
      {node.children.map((child) =>
        child.blocks.some(isPatternTable) ? (
          <PatternBand key={child.id} node={child} />
        ) : (
          <NodeView key={child.id} node={child} />
        ),
      )}
    </section>
  );
}

type ExamViewProps = {
  file: ContentFile;
};

/** The current quiz: score split, question-pattern band and the worked examples. */
export function ExamView({ file }: ExamViewProps) {
  return (
    <div>
      {file.intro.map((block, index) => (
        <ExamBlock key={index} block={block} />
      ))}
      {file.nodes.map((node) => (
        <ExamNode key={node.id} node={node} />
      ))}
    </div>
  );
}

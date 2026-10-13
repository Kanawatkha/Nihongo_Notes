import type { ContentNode } from '@/content/types';
import { cn } from '@/lib/cn';
import { countsLabel } from '@/lib/text';
import { BlockRenderer } from './BlockRenderer';
import { PartBand } from './PartBand';
import { InlineContent } from './InlineContent';

type NodeViewProps = {
  node: ContentNode;
  /** Position among the `##` nodes of the file; used to alternate band colors. */
  index?: number;
  /** Show `##` headings as dark part bands (vocabulary page). Otherwise as plain headings. */
  bands?: boolean;
};

function Counts({ node }: { node: ContentNode }) {
  const text = countsLabel(node.wordCount, node.readingCount);
  if (!text) return null;
  return <span className="type-mono-label shrink-0 text-body-muted">{text}</span>;
}

/** A heading with its blocks and, recursively, its child headings. */
export function NodeView({ node, index = 0, bands = false }: NodeViewProps) {
  const blocks =
    node.blocks.length > 0 ? (
      <div className="mt-6 space-y-6">
        {node.blocks.map((block, blockIndex) => (
          <BlockRenderer key={blockIndex} block={block} />
        ))}
      </div>
    ) : null;

  const children = node.children.map((child) => <NodeView key={child.id} node={child} bands={bands} />);

  if (node.level === 2) {
    return (
      <section id={node.id} data-section-id={node.id} className={cn('mt-16 first:mt-0')}>
        {bands ? (
          <PartBand node={node} index={index} />
        ) : (
          <h2 className="type-section-heading">
            <InlineContent inlines={node.title} />
          </h2>
        )}
        {blocks}
        {children}
      </section>
    );
  }

  if (node.level === 3) {
    return (
      <section id={node.id} data-section-id={node.id} className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="type-card-heading">
            {node.number && (
              <span className="type-mono-label mr-3 inline-block align-middle text-body-muted">
                {node.number}
              </span>
            )}
            <InlineContent inlines={node.title} />
          </h3>
          <Counts node={node} />
        </div>
        {blocks}
        {children}
      </section>
    );
  }

  return (
    <section id={node.id} data-section-id={node.id} className="mt-10">
      <div className="flex items-baseline justify-between gap-4 pb-2">
        <h4 className="type-feature-heading">
          <InlineContent inlines={node.title} />
        </h4>
        <Counts node={node} />
      </div>
      {blocks}
      {children}
    </section>
  );
}

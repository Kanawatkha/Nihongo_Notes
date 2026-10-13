import { NodeView } from '@/components/content/NodeView';
import { InlineContent } from '@/components/content/InlineContent';
import { Disclosure } from '@/components/ui/Disclosure';
import { MonoLabel } from '@/components/ui/MonoLabel';
import type { ContentFile } from '@/content/types';

type ArchivePanelProps = {
  file: ContentFile;
};

/** An earlier quiz, collapsed by default (kept for review). */
export function ArchivePanel({ file }: ArchivePanelProps) {
  return (
    <Disclosure title={file.meta.label ?? file.key} className="mt-section">
      <div className="mt-4 rounded-md bg-soft-stone p-6 md:p-8">
        <h2 className="type-section-heading">
          <InlineContent inlines={file.title} />
        </h2>
        {file.meta.facts && (
          <MonoLabel className="mt-3 block text-body-muted">{file.meta.facts}</MonoLabel>
        )}
        <div className="mt-8">
          {file.nodes.map((node) => (
            <NodeView key={node.id} node={node} />
          ))}
        </div>
      </div>
    </Disclosure>
  );
}

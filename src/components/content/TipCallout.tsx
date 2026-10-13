import type { Inline } from '@/content/types';
import { InlineContent } from './InlineContent';

type TipCalloutProps = {
  lines: Inline[][];
  /** `onDark` renders white text on a translucent panel (used inside a dark band). */
  onDark?: boolean;
};

/** Splits a leading `เคล็ดจำ:` style lead-in off the first line so it can be shown as a label. */
function splitLead(line: Inline[]): { lead: string | null; rest: Inline[] } {
  const first = line[0];
  if (first?.t === 'text') {
    const match = /^([^:]{1,16}):\s*/.exec(first.v);
    if (match) {
      const remainder = first.v.slice(match[0].length);
      const rest: Inline[] = remainder ? [{ t: 'text', v: remainder }, ...line.slice(1)] : line.slice(1);
      return { lead: match[1] ?? null, rest };
    }
  }
  return { lead: null, rest: line };
}

/** Memory-tip panel from a Markdown blockquote. */
export function TipCallout({ lines, onDark = false }: TipCalloutProps) {
  return (
    <aside
      className={
        onDark
          ? 'rounded-md bg-on-dark/10 p-5 text-on-dark'
          : 'rounded-md bg-pale-green p-5 text-ink'
      }
    >
      {lines.map((line, index) => {
        const { lead, rest } = splitLead(line);
        return (
          <p key={index} className="type-body mt-0 [&:not(:first-child)]:mt-2">
            {lead && (
              <span className="type-mono-label mr-2 inline-block align-baseline">{lead}</span>
            )}
            <InlineContent inlines={rest} />
          </p>
        );
      })}
    </aside>
  );
}

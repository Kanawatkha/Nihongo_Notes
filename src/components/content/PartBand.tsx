import { motion, useReducedMotion } from 'motion/react';
import type { ContentNode } from '@/content/types';
import { CountUp } from '@/components/motion/CountUp';
import { cn } from '@/lib/cn';
import { partParts } from '@/lib/text';

type PartBandProps = {
  node: ContentNode;
  /** Alternates the band color: even = deep green, odd = dark navy. */
  index: number;
};

/** Full-width dark band that opens a part of the vocabulary (DESIGN `dark-feature-band`). */
export function PartBand({ node, index }: PartBandProps) {
  const reduceMotion = useReducedMotion();
  const { label, title } = partParts(node);
  const total = node.wordCount + node.readingCount;
  const unit = node.wordCount > 0 && node.readingCount === 0 ? 'คำ' : 'รายการ';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-lg p-7 text-on-dark md:p-10 lg:p-12',
        index % 2 === 0 ? 'bg-deep-green' : 'bg-dark-navy',
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="type-mono-label text-on-dark/70">{label}</span>
        {total > 0 && (
          <span className="type-mono-label text-on-dark/70">
            <CountUp value={total} /> {unit}
          </span>
        )}
      </div>
      <h2 className="type-section-display mt-4">{title}</h2>
    </motion.div>
  );
}

import { HeroTitle } from '@/components/motion/HeroTitle';
import { MonoLabel } from '@/components/ui/MonoLabel';
import type { ContentFile } from '@/content/types';
import { plainText } from '@/lib/text';

type ExamHeroProps = {
  file: ContentFile;
};

/** Page opening: label, the quiz title and its facts line (date, points, time). */
export function ExamHero({ file }: ExamHeroProps) {
  return (
    <section className="py-12 text-center md:py-20 lg:py-section [@media(max-height:500px)]:py-6">
      <MonoLabel className="text-body-muted">Oral exam · {file.meta.label}</MonoLabel>
      <HeroTitle className="type-product-display mt-6">{plainText(file.title)}</HeroTitle>
      {file.meta.facts && <p className="type-body-large mt-6 text-body-muted">{file.meta.facts}</p>}
    </section>
  );
}

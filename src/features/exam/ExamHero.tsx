import { HeroTitle } from '@/components/motion/HeroTitle';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { UI_TEXT } from '@/config/site';

type ExamHeroProps = {
  /** The chosen quiz, or null while nothing is chosen. */
  chosen: { label: string; title: string; facts?: string } | null;
};

/** Page opening: label, the quiz title and its facts line (date, points, time), or the prompt to pick a quiz. */
export function ExamHero({ chosen }: ExamHeroProps) {
  return (
    <section className="py-12 text-center md:py-20 lg:py-section [@media(max-height:500px)]:py-6">
      <MonoLabel className="text-body-muted">
        {chosen ? `Oral exam · ${chosen.label}` : 'Oral exam'}
      </MonoLabel>
      <HeroTitle key={chosen?.title ?? ''} className="type-product-display mt-6">
        {chosen ? chosen.title : 'แนวสอบ'}
      </HeroTitle>
      <p className="type-body-large mt-6 text-body-muted">
        {chosen ? chosen.facts : UI_TEXT.chooseExam}
      </p>
    </section>
  );
}

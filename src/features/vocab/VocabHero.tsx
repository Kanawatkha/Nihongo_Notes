import { HeroTitle } from '@/components/motion/HeroTitle';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { COURSE_CODE, UI_TEXT } from '@/config/site';

type VocabHeroProps = {
  /** The chosen set, or null while nothing is chosen. */
  chosen: { label: string; words: number; readings: number; sections: number } | null;
};

/** Centered page opening: course label, one large headline, a line of counts or the prompt to pick a set. */
export function VocabHero({ chosen }: VocabHeroProps) {
  const counts = chosen
    ? `${[
        `${chosen.words} คำ`,
        chosen.readings > 0 ? `${chosen.readings} รายการ` : null,
        `${chosen.sections} หัวข้อ`,
      ]
        .filter(Boolean)
        .join(' · ')} · โรมาจิตามสไลด์`
    : UI_TEXT.chooseVocab;
  return (
    <section className="py-12 text-center md:py-20 lg:py-section [@media(max-height:500px)]:py-6">
      <MonoLabel className="text-body-muted">
        {COURSE_CODE} · ภาษาญี่ปุ่นเพื่อการสื่อสาร 1
      </MonoLabel>
      <HeroTitle key={chosen?.label ?? ''} className="type-hero-display mt-6">
        {chosen ? `คำศัพท์ ${chosen.label}` : 'คำศัพท์'}
      </HeroTitle>
      <p className="type-body-large mt-6 text-body-muted">{counts}</p>
    </section>
  );
}

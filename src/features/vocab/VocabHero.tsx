import { HeroTitle } from '@/components/motion/HeroTitle';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { COURSE_CODE } from '@/config/site';

type VocabHeroProps = {
  label: string;
  words: number;
  readings: number;
  sections: number;
};

/** Centered page opening: course label, one large headline, a line of counts. */
export function VocabHero({ label, words, readings, sections }: VocabHeroProps) {
  const counts = [`${words} คำ`, readings > 0 ? `${readings} รายการ` : null, `${sections} หัวข้อ`]
    .filter(Boolean)
    .join(' · ');
  return (
    <section className="py-12 text-center md:py-20 lg:py-section [@media(max-height:500px)]:py-6">
      <MonoLabel className="text-body-muted">
        {COURSE_CODE} · ภาษาญี่ปุ่นเพื่อการสื่อสาร 1
      </MonoLabel>
      <HeroTitle key={label} className="type-hero-display mt-6">
        {`คำศัพท์ ${label}`}
      </HeroTitle>
      <p className="type-body-large mt-6 text-body-muted">{counts} · โรมาจิตามสไลด์</p>
    </section>
  );
}

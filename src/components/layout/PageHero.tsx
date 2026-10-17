import { HeroTitle } from '@/components/motion/HeroTitle';
import { MonoLabel } from '@/components/ui/MonoLabel';

type PageHeroProps = {
  /** Small mono label above the title: the page's own name in English (Vocabulary, Oral exam...). */
  eyebrow: string;
  title: string;
  /** Line under the title: counts, facts or the prompt to choose a set. */
  subtitle?: string;
  /** Changes when the chosen set changes, so the title animates in again. */
  titleKey?: string;
};

/**
 * Page opening shared by every page, so all three have the same sizes and spacing at every width:
 * mono label, headline, one muted line. The set chips follow it.
 */
export function PageHero({ eyebrow, title, subtitle, titleKey = '' }: PageHeroProps) {
  return (
    <section className="py-8 text-center md:py-12 lg:py-14 [@media(max-height:500px)]:py-4">
      <MonoLabel className="text-body-muted">{eyebrow}</MonoLabel>
      <HeroTitle key={titleKey} className="type-product-display mt-4">
        {title}
      </HeroTitle>
      {subtitle && <p className="type-body-large mt-4 text-body-muted">{subtitle}</p>}
    </section>
  );
}

import { PageContainer } from '@/components/layout/PageContainer';
import { ButtonLink } from '@/components/ui/Button';
import { UI_TEXT } from '@/config/site';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle(UI_TEXT.notFound);
  return (
    <PageContainer>
      <section className="py-16 text-center md:py-section">
        <h1 className="type-section-heading">{UI_TEXT.notFound}</h1>
        <div className="mt-8">
          <ButtonLink to="/">{UI_TEXT.backToVocab}</ButtonLink>
        </div>
      </section>
    </PageContainer>
  );
}

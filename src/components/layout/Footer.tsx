import { COURSE_CODE, SITE_NAME, UI_TEXT } from '@/config/site';
import { MonoLabel } from '@/components/ui/MonoLabel';

type FooterProps = {
  /** The whole site is cached and works without a network. */
  offlineReady: boolean;
};

/** Slim dark footer: course name, offline status and the build date. */
export function Footer({ offlineReady }: FooterProps) {
  return (
    <footer className="bg-primary text-on-dark">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-[max(1rem,env(safe-area-inset-left))] py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="type-feature-heading" lang="ja-Latn">
            {SITE_NAME}
          </p>
          <p className="type-caption mt-1 text-muted">
            <MonoLabel>{COURSE_CODE}</MonoLabel> · ภาษาญี่ปุ่นเพื่อการสื่อสาร 1
          </p>
        </div>
        <p className="type-micro text-muted">
          {offlineReady && <>{UI_TEXT.offlineStatus} · </>}อัปเดตล่าสุด {__BUILD_DATE__}
        </p>
      </div>
    </footer>
  );
}

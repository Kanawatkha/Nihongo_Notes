import { useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { NAV_ITEMS, UI_TEXT } from '@/config/site';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/Icon';
import { Logo } from './Logo';
import { ShareDialog } from './ShareDialog';

/**
 * Sticky top bar. Desktop and tablet: mark + wordmark, centered links, share button on the right.
 * Phone: mark, the two links and the share button stay visible (no menu). The active link has a
 * sliding underline; the share button opens a card with a QR code and the link.
 */
export function Navbar() {
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLButtonElement>(null);
  const siteUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;

  const closeShare = useCallback(() => {
    setShareOpen(false);
    shareRef.current?.focus();
  }, []);

  return (
    <header className="sticky top-0 z-40 [@media(max-height:500px)]:static border-b border-hairline bg-canvas pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] md:grid md:h-16 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <Logo markOnlyBelowMd />

        <nav aria-label="หน้าหลัก" className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'type-body relative inline-flex min-h-11 items-center px-3 transition-colors',
                  isActive ? 'text-primary' : 'text-body-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute right-3 bottom-1 left-3 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          ref={shareRef}
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label={UI_TEXT.share}
          aria-haspopup="dialog"
          className="inline-flex size-11 items-center justify-center rounded-sm bg-coral text-ink transition-transform active:scale-95 md:justify-self-end"
        >
          <Icon name="share" size={20} />
        </button>
      </div>

      <ShareDialog open={shareOpen} onClose={closeShare} url={siteUrl} />
    </header>
  );
}

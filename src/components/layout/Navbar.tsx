import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { COURSE_CODE, NAV_ITEMS } from '@/config/site';
import { cn } from '@/lib/cn';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Logo } from './Logo';

/**
 * Sticky top bar. Desktop and tablet: mark + wordmark, centered links, course code.
 * Phone: mark and the two links stay visible (no menu). The active link has a sliding underline.
 */
export function Navbar() {
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

        <MonoLabel className="hidden justify-self-end text-body-muted md:block">
          {COURSE_CODE}
        </MonoLabel>
      </div>
    </header>
  );
}

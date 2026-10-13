import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline';

const BASE = 'type-button inline-flex min-h-11 items-center justify-center gap-2 transition-colors';

const VARIANTS: Record<Variant, string> = {
  primary: 'rounded-pill bg-primary px-6 py-3 text-on-primary active:bg-ink',
  secondary: 'rounded-xs py-2 text-ink underline underline-offset-4',
  outline: 'rounded-xl border border-primary px-4 py-1.5 text-primary active:bg-soft-stone',
};

/** Outline on a dark band uses a white border and text. */
const OUTLINE_ON_DARK =
  'rounded-xl border border-on-dark px-4 py-1.5 text-on-dark active:bg-on-dark/10';

function variantClass(variant: Variant, onDark: boolean): string {
  return variant === 'outline' && onDark ? OUTLINE_ON_DARK : VARIANTS[variant];
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  onDark?: boolean;
};

export function Button({
  variant = 'primary',
  onDark = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(BASE, variantClass(variant, onDark), className)} {...rest} />
  );
}

type ButtonLinkProps = {
  to: string;
  children: ReactNode;
  variant?: Variant;
  onDark?: boolean;
  className?: string;
};

/** An in-app link that looks like a button. */
export function ButtonLink({
  to,
  children,
  variant = 'primary',
  onDark = false,
  className,
}: ButtonLinkProps) {
  return (
    <Link to={to} className={cn(BASE, variantClass(variant, onDark), className)}>
      {children}
    </Link>
  );
}

import { motion, useReducedMotion } from 'motion/react';

type HeroTitleProps = {
  children: string;
  className?: string;
};

/** Page headline whose words rise and fade in one after another. Plain `h1` for reduced motion. */
export function HeroTitle({ children, className }: HeroTitleProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <h1 className={className}>{children}</h1>;

  const words = children.split(' ');
  return (
    <h1 className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </h1>
  );
}

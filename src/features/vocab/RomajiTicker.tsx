type RomajiTickerProps = {
  words: string[];
};

/**
 * Slow continuous strip of words under the hero (DESIGN `trust-logo-strip` feel). Purely decorative,
 * hidden from assistive technology; static and wrapped when reduced motion is requested.
 */
export function RomajiTicker({ words }: RomajiTickerProps) {
  if (words.length === 0) return null;
  return (
    <div aria-hidden="true" className="ticker py-6">
      <div className="ticker-track">
        {[1, 2].map((copy) => (
          <ul key={copy} data-copy={copy} lang="ja-Latn" className="flex shrink-0 items-center">
            {words.map((word, index) => (
              <li
                key={index}
                className="type-caption flex items-center whitespace-nowrap text-body-muted"
              >
                <span className="px-5">{word}</span>
                <span className="text-hairline">·</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* THE THREE SEATS UNDER THE PASS — three businesses, one covered purchase.
 *
 * ⚠ THE SCREEN REPEATED THE SAME NUMBER ON WHITE. Screen 9 drew the place at 68 px, the same figure
 * the celebration had just shown at 84 px, with three 12 px dots beside a sentence. Nothing on it
 * said what the shop was being asked to DO. Three empty seats do: a person reads a row of open
 * rings as places to fill, and filling them is the act at the foot.
 *
 * A FILLED SEAT CARRIES A DRAWN TICK rather than the business's initials, because the service's
 * answer is a COUNT — `joinedThroughYou` — and no name comes with it (`start/joining.ts`). A letter
 * invented for a seat would be a business this shop never brought.
 *
 * IT STANDS IN ITS OWN FILE because TWO screens draw it: screen 9 of the walk
 * (`start/referrals.tsx`) and the status page the buddy's first message links to
 * (`start/lista.tsx`), which is the same row of seats seen from outside the walk. The label is the
 * caller's, because the caller knows which language the page is in (`start/words.ts`).
 *
 * IT IS DRAWN FOR AN INK GROUND — the stage the pass lands on — so its rim and its fill are mixed
 * off the inverse pair rather than off the page's own ink.
 */
import * as React from 'react';
import { useStyletron } from 'baseui';
import { DrawnTick, MS, SPRING } from './walk';

export function Seats({ filled, total, still, label }: {
  /** how many of the seats are taken */
  filled: number;
  /** how many seats there are — the service's own `REFERRALS_PER_COVERED_PURCHASE` */
  total: number;
  still: boolean;
  /** «3 businesses = 1 more covered purchase», in the page's own language */
  label: string;
}) {
  const [css, theme] = useStyletron();
  const rim = `color-mix(in srgb, ${theme.colors.contentInversePrimary} 34%, ${theme.colors.backgroundInversePrimary})`;
  return (
    <div className={css({ display: 'grid', justifyItems: 'center', gap: theme.sizing.scale300 })}>
      <span data-testid="referrals-dots" data-filled={filled}
        className={css({ display: 'inline-flex', gap: theme.sizing.scale500, alignItems: 'center' })}>
        {Array.from({ length: total }, (_unused, index) => (
          <span key={index} data-dot={index < filled ? 'filled' : 'open'} className={css({
            boxSizing: 'border-box',
            display: 'grid', placeItems: 'center',
            width: '44px', height: '44px', flexShrink: 0, borderRadius: '50%',
            borderWidth: '2px',
            borderStyle: index < filled ? 'solid' : 'dashed',
            borderColor: index < filled ? theme.colors.contentInversePrimary : rim,
            backgroundColor: index < filled ? theme.colors.contentInversePrimary : 'transparent',
            color: theme.colors.backgroundInversePrimary,
            /* ⚠ NO RESTING SCALE. A 44 px ring drawn at 94% measures 41 px, and a seat is a thing
               a thumb-sized rule is written about: it stays 44 px and the fill is what changes. */
            transitionProperty: 'background-color, border-color',
            transitionDuration: still ? '0ms' : `${MS.fill}ms`,
            transitionTimingFunction: SPRING.land,
          })}>
            {index < filled && <DrawnTick size={22} still={still} />}
          </span>
        ))}
      </span>
      <span data-testid="referrals-seats-says" className={css({
        ...theme.typography.LabelSmall,
        color: `color-mix(in srgb, ${theme.colors.contentInversePrimary} 68%, ${theme.colors.backgroundInversePrimary})`,
      })}>{label}</span>
    </div>
  );
}

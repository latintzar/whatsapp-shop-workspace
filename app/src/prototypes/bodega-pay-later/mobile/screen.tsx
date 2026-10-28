import * as React from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SIZE } from 'baseui/button';
import { ChevronLeft } from 'lucide-react';
import { useEntered, useViewportHeight, SPRING, MS } from '../start/walk';

/** Bundled counterpart of the existing walk: its visual, scroll area and thumb-level action. */
export function MobileScreen({ children, visual, title, sentence, action, actionLabel, disabled = false,
  secondary, secondaryLabel, back, backLabel, progress = 0, dark = false, tools, welcome = false, brand, visualHeight }: {
  children?: React.ReactNode; visual?: React.ReactNode; title?: string; sentence?: string;
  action?: () => void; actionLabel?: string; disabled?: boolean; secondary?: () => void; secondaryLabel?: string;
  back?: () => void; backLabel?: string; progress?: number; dark?: boolean; tools?: React.ReactNode;
  /** The arrival is a picture-led landing, with its one act inside the screen. */
  welcome?: boolean; brand?: React.ReactNode;
  visualHeight?: string;
}) {
  const [css, theme] = useStyletron();
  const height = useViewportHeight();
  const entered = useEntered();
  return <main data-testid="mobile-onboarding" className={css({
    display: 'grid', gridTemplateRows: 'minmax(0, 1fr)', height: height ? `${height}px` : '100dvh',
    width: '100%', maxWidth: '560px', margin: '0 auto', backgroundColor: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary, overflow: 'hidden',
  })}>
    <div className={css({ minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'grid',
      /* The picture introduces each step; its bounded band leaves the action with the content
         rather than pinning it against a phone's lower edge. */
      gridTemplateRows: welcome ? 'minmax(0, 1fr)' : visual ? `${visualHeight ?? 'minmax(130px, min(40vh, 320px))'} auto` : 'auto',
      alignContent: 'start',
      opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(20px)',
      transitionProperty: 'opacity, transform', transitionDuration: `${MS.move}ms`, transitionTimingFunction: SPRING.glide,
      '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0ms', transform: 'none' },
    })}>
      {!visual && back && <div className={css({
        paddingTop: `calc(${theme.sizing.scale300} + env(safe-area-inset-top, 0px))`,
        paddingLeft: theme.sizing.scale300, paddingRight: theme.sizing.scale300,
      })}>
        <Button kind={KIND.tertiary} size={SIZE.compact} onClick={back} aria-label={backLabel ?? 'Back'}
          overrides={{ BaseButton: { style: { minWidth: '44px', minHeight: '44px', paddingLeft: 0, paddingRight: 0 } } }}>
          <ChevronLeft size={24} aria-hidden />
        </Button>
      </div>}
      {visual && <div className={css({ position: 'relative', minHeight: 0, overflow: 'hidden', display: 'grid',
        backgroundColor: dark ? theme.colors.backgroundInversePrimary : theme.colors.backgroundSecondary,
        color: dark ? theme.colors.contentInversePrimary : theme.colors.contentPrimary,
      })}>
        {visual}
        <div className={css({ position: 'absolute', top: 'env(safe-area-inset-top, 0px)', left: 0, right: 0,
          padding: theme.sizing.scale500, display: 'flex', alignItems: 'center', gap: theme.sizing.scale400,
        })}>
          {back && <Button kind={KIND.secondary} size={SIZE.compact} onClick={back} aria-label={backLabel ?? 'Back'}
            overrides={{ BaseButton: { style: { minWidth: '44px', minHeight: '44px', paddingLeft: 0, paddingRight: 0 } } }}>
            <ChevronLeft size={24} aria-hidden />
          </Button>}
          {progress > 0 && <div role="progressbar" aria-label="Onboarding" aria-valuemin={0} aria-valuemax={4}
            aria-valuenow={progress} className={css({ display: 'flex', gap: theme.sizing.scale200, flex: 1 })}>
            {[1, 2, 3, 4].map((part) => <span key={part} className={css({ height: '4px', flex: 1,
              borderRadius: theme.borders.radius100, backgroundColor: dark ? theme.colors.contentInversePrimary : theme.colors.contentPrimary,
              opacity: part <= progress ? 1 : 0.3,
            })} />)}
          </div>}
        </div>
        {welcome && <div className={css({ position: 'absolute', inset: 0, zIndex: 2, display: 'grid',
          gridTemplateRows: 'minmax(160px, 44vh) 1fr auto', pointerEvents: 'none', paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingRight: theme.sizing.scale600, paddingBottom: `max(18vh, calc(${theme.sizing.scale1200} + env(safe-area-inset-bottom, 0px)))`, paddingLeft: theme.sizing.scale600,
        })}>
          <div className={css({ justifySelf: 'center', alignSelf: 'center', pointerEvents: 'auto' })}>{brand}</div>
          <div />
          {action && actionLabel && <div className={css({ pointerEvents: 'auto' })}>
            <Button data-testid="mobile-primary" size={SIZE.large} onClick={action} disabled={disabled}
              overrides={{ BaseButton: { style: { width: '100%', minHeight: '56px', touchAction: 'manipulation' } } }}>{actionLabel}</Button>
          </div>}
        </div>}
      </div>}
      {!welcome && <div className={css({ padding: theme.sizing.scale600, display: 'grid', gap: theme.sizing.scale500, minWidth: 0 })}>
        {title && <h1 tabIndex={-1} className={css({ ...theme.typography.HeadingLarge,
          fontWeight: 600, letterSpacing: '-0.025em', margin: 0, overflowWrap: 'anywhere' })}>{title}</h1>}
        {sentence && <p className={css({ ...theme.typography.ParagraphMedium, color: theme.colors.contentSecondary, margin: 0 })}>{sentence}</p>}
        {children}
        {(action || secondary || tools) && <div className={css({ display: 'grid', gap: theme.sizing.scale300, paddingTop: theme.sizing.scale200 })}>
          {action && actionLabel && <Button data-testid="mobile-primary" size={SIZE.large} onClick={action} disabled={disabled}
            overrides={{ BaseButton: { style: { width: '100%', minHeight: '56px', touchAction: 'manipulation' } } }}>{actionLabel}</Button>}
          {secondary && secondaryLabel && <Button kind={KIND.tertiary} onClick={secondary}>{secondaryLabel}</Button>}
          {tools}
        </div>}
      </div>}
    </div>
  </main>;
}

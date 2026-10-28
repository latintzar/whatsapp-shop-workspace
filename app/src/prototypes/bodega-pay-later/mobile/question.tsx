import * as React from 'react';
import { useStyletron } from 'baseui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useViewportHeight } from '../start/walk';
import { pageLang } from '../start/words';

/** One question, a semantic input, and a thumb target inside the keyboard's visual viewport. */
export function QuestionScreen({ title, icon, step = 0, children, back, next, disabled, busy = false, help, fillContent = false, testId }: {
  title: string; icon: React.ReactNode; step?: number; children: React.ReactNode; back?: () => void;
  next?: () => void; disabled?: boolean; busy?: boolean; help?: React.ReactNode; fillContent?: boolean; testId?: string;
}) {
  const [css, theme] = useStyletron();
  const height = useViewportHeight();
  const compact = (height ?? 844) < 560;
  const en = pageLang() === 'en';
  const control = css({ display: 'grid', placeItems: 'center', width: '48px', height: '48px', border: 0,
    borderRadius: '50%', cursor: 'pointer', backgroundColor: 'transparent', color: theme.colors.contentPrimary,
    ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '3px' } });
  return <main data-testid={testId} className={css({ backgroundColor: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary, width: '100%', maxWidth: '560px', margin: '0 auto',
    height: height ? `${height}px` : '100dvh', overflowY: 'auto', boxSizing: 'border-box',
    padding: `calc(8px + env(safe-area-inset-top, 0px)) clamp(24px, 7vw, 40px) calc(16px + env(safe-area-inset-bottom, 0px))`,
  })}>
    <div className={css({ height: '48px', marginLeft: '-12px' })}>
      {back && <button type="button" className={control} onClick={back} aria-label={en ? 'Back' : 'Volver'}><ChevronLeft aria-hidden /></button>}
    </div>
    <form onSubmit={(event) => { event.preventDefault(); if (!disabled && !busy) next?.(); }} className={css({
      minHeight: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column', alignItems: 'stretch',
    })}>
      <div className={css({ marginTop: compact ? '8px' : 'clamp(12px, 5vh, 48px)', marginBottom: compact ? '12px' : theme.sizing.scale600 })}>
        <div aria-label={en ? `Step ${step + 1} of 5` : `Paso ${step + 1} de 5`} className={css({ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: compact ? '12px' : theme.sizing.scale600 })}>
          {[0, 1, 2, 3, 4].map((part) => part === step
            ? <span key={part} className={css({ width: '44px', height: '44px', display: 'grid', placeItems: 'center',
              border: `2px solid ${theme.colors.contentPrimary}`, borderRadius: '50%' })}>{icon}</span>
            : <span key={part} className={css({ width: '5px', height: '5px', borderRadius: '50%',
              backgroundColor: part < step ? theme.colors.contentPrimary : theme.colors.borderOpaque })} />)}
        </div>
        <h1 className={css({ ...theme.typography.HeadingLarge, margin: 0, fontSize: 'clamp(30px, 8.6vw, 42px)',
          lineHeight: 1.14, letterSpacing: '-0.025em', fontWeight: 600,
          overflowWrap: 'anywhere' })}>{title}</h1>
      </div>
      <div className={css({ display: 'grid', gap: theme.sizing.scale500, marginTop: compact ? '8px' : 'clamp(12px, 5vh, 48px)',
        ...(fillContent ? { flex: '1 1 auto', minHeight: 0, gridTemplateRows: 'minmax(0, 1fr)' } : {}),
      })}>{children}</div>
      {(next || help) && <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.sizing.scale400,
        marginTop: 'auto', paddingTop: compact ? '12px' : theme.sizing.scale700, paddingBottom: theme.sizing.scale400 })}>
        <div className={css({ ...theme.typography.ParagraphSmall, minWidth: 0, color: theme.colors.contentSecondary })}>{help}</div>
        {next && <button type="submit" data-testid="question-next" aria-label={en ? 'Continue' : 'Continuar'} disabled={disabled || busy}
          className={css({ width: '56px', height: '56px', flexShrink: 0, display: 'grid', placeItems: 'center', border: 0,
            borderRadius: '50%', cursor: disabled || busy ? 'default' : 'pointer',
            color: disabled || busy ? theme.colors.contentTertiary : theme.colors.contentInversePrimary,
            backgroundColor: disabled || busy ? theme.colors.backgroundSecondary : theme.colors.contentPrimary,
            ':focus-visible': { outline: `2px solid ${theme.colors.contentPrimary}`, outlineOffset: '3px' } })}>
          <ChevronRight size={28} aria-hidden />
        </button>}
      </div>}
    </form>
  </main>;
}

export function UnderlineInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [css, theme] = useStyletron();
  return <input {...props} className={css({ ...theme.typography.font650, fontWeight: 400, width: '100%',
    minWidth: 0, boxSizing: 'border-box', minHeight: '56px', border: 0, borderBottom: `1px solid ${theme.colors.contentPrimary}`,
    borderRadius: 0, color: theme.colors.contentPrimary, backgroundColor: 'transparent', padding: '8px 0',
    ':focus': { outline: 'none', borderBottomWidth: '2px' }, '::placeholder': { color: theme.colors.contentTertiary } })} />;
}

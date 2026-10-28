import * as React from 'react';
import { useStyletron } from 'baseui';
import { Store } from 'lucide-react';
import { pageLang } from '../start/words';
import { tap } from './native';
import { QuestionScreen, UnderlineInput } from './question';

/** Roles are canonical: a restaurant buys; a supplier sells. The API migrates old supplier labels. */
export type BusinessProfileKind = 'supplier' | 'bodega' | 'restaurant';
type LegacyBusinessKind = 'sells_to_bodegas' | 'sells_to_restaurants';
export type BusinessProfileDraft = { kind: BusinessProfileKind | LegacyBusinessKind | null; name: string };

/** Retained records called both supplier cases `sells_to_*`; both describe a supplier. */
export function canonicalBusinessProfileKind(value: BusinessProfileDraft['kind']): BusinessProfileKind | null {
  if (value === 'bodega' || value === 'supplier' || value === 'restaurant') return value;
  return value === 'sells_to_bodegas' || value === 'sells_to_restaurants' ? 'supplier' : null;
}

/** The persisted identifiers describe the relationship; these short labels describe it to a shop. */
export const BUSINESS_PROFILE_CHOICES: ReadonlyArray<{ kind: BusinessProfileKind; en: string; es: string }> = [
  { kind: 'supplier', en: 'Supplier', es: 'Proveedor' },
  { kind: 'bodega', en: 'Bodega', es: 'Bodega' },
  { kind: 'restaurant', en: 'Restaurant', es: 'Restaurante' },
];

const say = (en: string, es: string): string => pageLang() === 'en' ? en : es;

function ProfileChoices({ chosen, choose }: { chosen: BusinessProfileKind | null; choose: (kind: BusinessProfileKind) => void }) {
  const [css, theme] = useStyletron();
  return <div data-testid="mobile-business-kinds" className={css({
    display: 'grid', gridTemplateRows: 'repeat(3, minmax(0, 1fr))', gap: theme.sizing.scale300,
    height: '100%', minHeight: 0,
  })}>
    {BUSINESS_PROFILE_CHOICES.map(({ kind, en, es }) => {
      const selected = chosen === kind;
      return <button type="button" key={kind} data-testid={`mobile-business-kind-${kind}`}
        aria-pressed={selected} onClick={() => choose(kind)} className={css({
          appearance: 'none', width: '100%', minWidth: 0, minHeight: '44px', padding: theme.sizing.scale500,
          borderRadius: theme.borders.radius400, borderWidth: '2px', borderStyle: 'solid',
          borderColor: theme.colors.contentPrimary,
          backgroundColor: selected ? theme.colors.contentPrimary : theme.colors.backgroundPrimary,
          color: selected ? theme.colors.contentInversePrimary : theme.colors.contentPrimary,
          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
          ...theme.typography.HeadingSmall,
          fontFamily: theme.typography.LabelLarge.fontFamily,
          ':focus-visible': { outline: `3px solid ${theme.colors.contentPrimary}`, outlineOffset: '3px' },
        })}>{pageLang() === 'en' ? en : es}</button>;
    })}
  </div>;
}

/** Native profile questions: one decision, then one plainly labelled business-name field. */
export function BusinessProfile({ initial, save, complete, back }: {
  initial: BusinessProfileDraft;
  save: (patch: { kind: BusinessProfileKind; name: string }) => Promise<void>;
  complete: () => void;
  back?: () => void;
}) {
  const [css, theme] = useStyletron();
  const [pane, setPane] = React.useState<'kind' | 'name'>(() => initial.kind ? 'name' : 'kind');
  const [kind, setKind] = React.useState<BusinessProfileKind | null>(() => canonicalBusinessProfileKind(initial.kind));
  const [name, setName] = React.useState(initial.name ?? '');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  // Android's system back is dispatched by the shell while this question owns its own second pane.
  // Keep the user in the profile question and return to its choices rather than leaving onboarding.
  React.useEffect(() => {
    const returnToKinds = () => { if (pane === 'name') setPane('kind'); };
    window.addEventListener('rocoto:profile-back', returnToKinds);
    return () => window.removeEventListener('rocoto:profile-back', returnToKinds);
  }, [pane]);

  const choose = (next: BusinessProfileKind) => {
    setKind(next); setPane('name'); setError(''); void tap('selection');
  };
  const submit = async () => {
    const businessName = name.trim();
    if (!kind || !businessName || busy) return;
    setBusy(true); setError('');
    try {
      await save({ kind, name: businessName });
      await tap('confirm');
      complete();
    } catch {
      setError(say('Please try saving your business again.', 'Vuelve a guardar tu negocio.'));
      await tap('reject');
    } finally { setBusy(false); }
  };

  if (pane === 'kind') return <QuestionScreen testId="mobile-business-profile"
    title={say('What is your business?', '¿Qué es tu negocio?')} icon={<Store size={24} aria-hidden />} step={3} back={back} fillContent>
    <ProfileChoices chosen={kind} choose={choose} />
  </QuestionScreen>;

  return <QuestionScreen testId="mobile-business-name" title={say('What is it called?', '¿Cómo se llama?')}
    icon={<Store size={24} aria-hidden />} step={4} back={() => setPane('kind')} next={() => { void submit(); }}
    disabled={!kind || !name.trim()} busy={busy}>
    <UnderlineInput data-testid="mobile-business-name-input" autoFocus autoComplete="organization" name="businessName"
      value={name} onChange={(event) => setName(event.target.value)} maxLength={120}
      aria-label={say('Business name', 'Nombre del negocio')} enterKeyHint="next" />
    {error && <p role="alert" className={css({ ...theme.typography.ParagraphSmall, margin: 0, color: theme.colors.contentPrimary })}>{error}</p>}
  </QuestionScreen>;
}

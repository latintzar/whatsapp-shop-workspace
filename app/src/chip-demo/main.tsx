/* THE CHIP ENTRY'S OWN BENCH — the organ, alone, at both widths (FEED-IA §62).
 *
 * §62 calls the chip entry «ONE shared organ, designed once, reused everywhere», and its consumers
 * — the sheet's add-a-line, the New Product modal, the catalogue's search — belong to packages
 * other people are live in. So this bench exists to look at the organ WITHOUT touching any of
 * them: its own entry, its own vite config, the same providers and the same theme as `app.html`,
 * and nothing shared edited to stand it up.
 *
 * It is not a kit page and it is not a scenario. It is a bench: three seats — the three sectors
 * whose registers differ — and a live reading printed under each, so what the parser said can be
 * checked against what the chips drew, by looking.
 */
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Client as Styletron } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider, useStyletron } from 'baseui';
import { RocotoTheme, PROOF_BRAND, makeTheme } from '../rocoto-theme';
import ChipEntry from '../prototypes/cedar/chip-entry';
import type { ChipLine } from '../prototypes/cedar/chip-parse';
import type { SectorId } from '../scenarios/meta';

/** the three houses, each with the grade register its traceability profile gives it (`sale.ts`) */
const SEATS: Array<{ sector: SectorId; classes: string[]; initial: string; label: string }> = [
  { sector: 'fish', classes: ['Extra', 'A', 'B'], label: 'A fish house', initial: '' },
  { sector: 'meat', classes: ['Extra', 'I', 'II'], label: 'A meat house', initial: 'jamón ibérico de bellota loncheado' },
  { sector: 'fruit', classes: ['Extra', 'I', 'II'], label: 'A produce house', initial: 'tomate rama griego caja 6 kg' },
];

function Seat({ sector, classes, label, initial }: (typeof SEATS)[number]) {
  const [, theme] = useStyletron();
  const [line, setLine] = React.useState<ChipLine | null>(null);
  const read = React.useCallback((l: ChipLine) => setLine(l), []);

  /* THE READING, PRINTED. This is the bench's own instrument and it is the one thing here that
     would never ship: the organ says what it read by DRAWING it, and a line of debug text under
     a shipped field would be exactly the orphan sentence §51.24 bans. */
  const parts = line
    ? [
      line.quantity !== undefined ? `qty ${line.quantity}${line.unit ? ` ${line.unit}` : ''}` : null,
      line.name ? `name ${line.name.name}` : null,
      line.sort ? `sort ${line.sort.name}` : null,
      /* ⚠ `class ${line.klass}` STOOD HERE until FEED-IA §197.2 «Remove class everywhere». */
      line.packaging
        ? `pack ${line.packaging.container}${line.packaging.holds ? ` de ${line.packaging.holds.amount} ${line.packaging.holds.unit}` : ''}`
        : null,
      ...Object.entries(line.dimensions).map(([k, v]) => `${k} ${v}`),
      line.free ? `theirs «${line.free}»` : null,
    ].filter(Boolean).join('  ·  ')
    : '';

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: theme.sizing.scale300 }}>
      <h2 style={{ ...theme.typography.LabelMedium, color: theme.colors.contentSecondary, margin: 0 }}>
        {label}
      </h2>
      <ChipEntry
        registers={{ classes, sector }}
        initial={initial}
        onChange={read}
        data-testid={`chip-entry-${sector}`}
      />
      <p
        data-testid={`chip-reading-${sector}`}
        style={{
          ...theme.typography.MonoLabelXSmall,
          color: theme.colors.contentTertiary,
          margin: 0,
          minHeight: theme.sizing.scale600,
        }}
      >
        {parts}
      </p>
    </section>
  );
}

function Bench() {
  const [, theme] = useStyletron();
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.sizing.scale900,
        maxWidth: 840,
        margin: '0 auto',
        padding: theme.sizing.scale800,
      }}
    >
      {SEATS.map((s) => <Seat key={s.sector} {...s} />)}
    </main>
  );
}

const theme = new URLSearchParams(window.location.search).get('theme') === 'proof'
  ? makeTheme(PROOF_BRAND)
  : RocotoTheme;

const engine = new Styletron();
createRoot(document.getElementById('root')!).render(
  <StyletronProvider value={engine}>
    <BaseProvider theme={theme}>
      <Bench />
    </BaseProvider>
  </StyletronProvider>,
);

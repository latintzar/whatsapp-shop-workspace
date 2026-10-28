/* THE BODEGA CANDIDATE'S ENTRY — the shape of `src/main.tsx`, one prototype along.
 *
 * Styletron → `BaseProvider(RocotoTheme)` → this candidate's own router. Cedar's `app-root.tsx`
 * stays out of it on purpose: that file carries Cedar's language boot, its config provider and its
 * lazy hosts, and this surface's providers are the kit's own (DESIGN-SPEC.md §7 item 3).
 */
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Client as Styletron } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider } from 'baseui';
import { RocotoTheme } from '../../rocoto-theme';
import '../../posthog';
/* ── CEDAR'S PRINT MODULES ARE ENTERED FROM THEIR SAFE SIDE, ONCE, HERE ───────────────────────
 * Cedar holds a three-module import cycle: `print-view.tsx` imports the barrel `shell/index.ts`,
 * the barrel re-exports from `shell/printing.tsx`, and `shell/printing.tsx` imports `PACKING_MARK`
 * back off `print-view.tsx` AND READS IT AT MODULE SCOPE (its line 1768 and 2244). A cycle survives
 * that only when `shell/printing.tsx` is the module the graph enters: `print-view` then completes
 * before the read. Enter at `print-view` instead — which is what `cedar/browser-print.tsx` does, and
 * this candidate imports it in five places — and the read lands in the temporal dead zone:
 * `ReferenceError: Cannot access 'PACKING_MARK' before initialization`, thrown while the document is
 * still empty, so the whole page renders blank on EVERY route.
 *
 * Cedar's own app is safe by accident: its rail's onboarding card reaches `shell/printing.tsx`
 * through `activation-web.tsx` before anything reaches `print-view.tsx`. This candidate carried the
 * same accident while it mounted that card, and dropping the card (`shell/rail.tsx` says why) took
 * the ordering with it. The line below states the order instead of inheriting it. It adds no weight:
 * `cedar/rows.tsx` already re-exports `Fact`, `Facts` and `RailRow` out of that same file, so it is
 * in this bundle either way. Cedar's files stay Cedar's; the fix belongs to whoever owns that cycle.
 */
import '../cedar/shell/printing';
import App from './App';

const engine = new Styletron();
createRoot(document.getElementById('root')!).render(
  <StyletronProvider value={engine}>
    <BaseProvider theme={RocotoTheme}>
      <App />
    </BaseProvider>
  </StyletronProvider>
);

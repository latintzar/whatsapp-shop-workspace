import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Client as Styletron } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider } from 'baseui';
import { RocotoTheme } from '../../../rocoto-theme';
import MobileApp from './App';
import './mobile.css';

createRoot(document.getElementById('root')!).render(<StyletronProvider value={new Styletron()}>
  <BaseProvider theme={RocotoTheme}><MobileApp /></BaseProvider>
</StyletronProvider>);

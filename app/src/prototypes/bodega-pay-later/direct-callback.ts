type CallbackIO = {
  clean(): void;
  replace(path: string): void;
  request(path: string, options: RequestInit): Promise<Pick<Response, 'ok' | 'json'>>;
};

/** Runs before the main app or analytics loads. Callback values live only until their POST. */
export function routeDirectCallback(search: string, io: CallbackIO): Promise<void> | null {
  const query = new URLSearchParams(search);
  const state = query.get('state');
  if (!state?.startsWith('bodega-direct-')) return null;
  const code = query.get('code');
  const cancelled = ['error', 'error_reason', 'error_description'].some((key) => query.has(key)) || !code;
  io.clean();
  const controller = new AbortController();
  // The bridge waits up to 40 seconds for the provider exchange; let its result arrive first.
  const timeout = setTimeout(() => controller.abort(), 50000);
  const returned = '/bodega-pay-later/?connection-test=direct&returned=1';
  return (async () => {
    let accepted = false;
    try {
      const response = await io.request('/api/bodega/connection-test/complete', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(cancelled ? { state, cancelled: true } : { state, code }),
        signal: controller.signal,
      });
      const answer: unknown = response.ok ? await response.json() : null;
      accepted = Boolean(answer && typeof answer === 'object' && 'ok' in answer && answer.ok === true);
    } catch { /* Only a fixed failure marker reaches the return page. */ }
    finally { clearTimeout(timeout); }
    io.replace(accepted ? returned : `${returned}&callback=failed`);
  })();
}

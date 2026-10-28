/** The bundled app installs its authenticated transport before rendering the shared walk. */
export type NativeResponse = { status: number; data: unknown };
export type WalkRuntime = {
  request: (path: string, body?: unknown, method?: 'GET' | 'POST' | 'PUT') => Promise<NativeResponse>;
  tap: () => void;
  share?: (what: { title: string; text: string; url: string }) => Promise<void>;
};
let runtime: WalkRuntime | null = null;
export const installWalkRuntime = (value: WalkRuntime): void => { runtime = value; };
export const nativeWalk = (): WalkRuntime | null => runtime;

/** Drafts are UI state; the server alone establishes account identity and completion. */
export const walkStorage = (): Storage => runtime ? window.localStorage : window.sessionStorage;

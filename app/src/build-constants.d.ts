/** Constants Vite substitutes at build time — see `tools/build-constants.mjs`. Under any other
 *  compiler (the tool tests' Node compile) they are undefined, and every reader checks. */
declare const __POSTHOG_KEY__: string | undefined;
declare const __POSTHOG_HOST__: string | undefined;
declare const __GOOGLE_MAPS_KEY__: string | undefined;
declare const __DEV_SERVER__: boolean | undefined;
declare const __RUNTIME_BASE__: string | undefined;

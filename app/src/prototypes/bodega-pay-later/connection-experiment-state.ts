/** This journal is diagnostic evidence only. Authorization stays in the provider controller. */
export const CONNECTION_EXPERIMENT_KEY = 'rocoto-bodega-connection-experiment-v1';
export const CONNECTION_EXPERIMENT_RUN_KEY = 'rocoto-bodega-connection-experiment-run-v1';
export const MAX_EXPERIMENT_EVENTS = 80;
export const isExperimentRunId = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const statuses = ['opening', 'authorizing', 'exchanging', 'awaiting_details', 'connecting'] as const;
const outcomes = ['idle', 'active', 'completed', 'failed', 'interrupted'] as const;
const kinds = ['load', 'visibility', 'pagehide', 'pageshow', 'launch', 'status', 'completion', 'failure', 'provider_event'] as const;
const values = [...statuses, 'visible', 'hidden', 'persisted', 'fresh', 'session', 'network', 'provider', 'complete',
  'cancel', 'error', 'finish', 'finish_coexistence'] as const;

export type ExperimentStatus = typeof statuses[number];
export type ExperimentOutcome = typeof outcomes[number];
export type ExperimentEvent = {
  at: number;
  page: number;
  attempt: number;
  kind: typeof kinds[number];
  value?: typeof values[number];
};
export type ExperimentJournal = {
  version: 1;
  page: number;
  attempt: number;
  outcome: ExperimentOutcome;
  status?: ExperimentStatus;
  events: ExperimentEvent[];
};

const count = (value: unknown, maximum: number): number => typeof value === 'number' && Number.isSafeInteger(value)
  && value >= 0 && value <= maximum ? value : 0;
const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

/** Rebuild every field from an allowlist: browser storage is never a trusted diagnostic payload. */
export function sanitizeExperimentJournal(value: unknown): ExperimentJournal {
  const empty: ExperimentJournal = { version: 1, page: 0, attempt: 0, outcome: 'idle', events: [] };
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return empty;
  const source = value as Record<string, unknown>;
  const events: ExperimentEvent[] = [];
  for (const entry of Array.isArray(source.events) ? source.events.slice(-MAX_EXPERIMENT_EVENTS) : []) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    if (!includes(kinds, item.kind) || typeof item.at !== 'number' || !Number.isSafeInteger(item.at)
      || item.at < 0 || item.at > 8640000000000000) continue;
    events.push({ at: item.at, page: count(item.page, 10000), attempt: count(item.attempt, 1000), kind: item.kind,
      ...(includes(values, item.value) ? { value: item.value } : {}) });
  }
  return { version: 1, page: count(source.page, 10000), attempt: count(source.attempt, 1000),
    outcome: includes(outcomes, source.outcome) ? source.outcome : 'idle',
    ...(includes(statuses, source.status) ? { status: source.status } : {}), events };
}

export function appendExperimentEvent(journal: ExperimentJournal,
  event: Pick<ExperimentEvent, 'kind' | 'value'>, at = Date.now()): ExperimentJournal {
  const next = { ...journal };
  if (event.kind === 'load') {
    next.page = Math.min(10000, next.page + 1);
    if (next.outcome === 'active') next.outcome = 'interrupted';
  }
  if (event.kind === 'launch') {
    next.attempt = Math.min(1000, next.attempt + 1);
    next.outcome = 'active';
    delete next.status;
  }
  if (event.kind === 'status' && includes(statuses, event.value)) next.status = event.value;
  if (event.kind === 'completion') { next.outcome = 'completed'; delete next.status; }
  if (event.kind === 'failure') { next.outcome = 'failed'; delete next.status; }
  next.events = [...journal.events, { at, page: next.page, attempt: next.attempt, ...event }]
    .slice(-MAX_EXPERIMENT_EVENTS);
  return next;
}

export type SessionCheck = { status: 'recognized' | 'sign_in' | 'unknown'; phone?: string };

function normalizedPhone(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\+?[\d ()-]+$/.test(value)) return;
  const digits = value.replace(/\D/g, '');
  return /^\d{7,15}$/.test(digits) ? digits : undefined;
}

/** Only a successful authenticated response supplies identity; failures remain unknown. */
export function classifySession(source: 'bodega' | 'proof', status: number, body: unknown): SessionCheck {
  if (status === 401) return { status: 'sign_in' };
  if (status !== 200 || !body || typeof body !== 'object') return { status: 'unknown' };
  let number: unknown;
  if (source === 'bodega') {
    if (!('signedIn' in body) || typeof body.signedIn !== 'boolean') return { status: 'unknown' };
    if (!body.signedIn) return { status: 'sign_in' };
    number = 'phone' in body ? body.phone : undefined;
  } else {
    if (!('connection' in body)) return { status: 'unknown' };
    if (body.connection === null) return { status: 'sign_in' };
    if (!body.connection || typeof body.connection !== 'object') return { status: 'unknown' };
    number = 'number' in body.connection ? body.connection.number : undefined;
  }
  const phone = normalizedPhone(number);
  return { status: 'recognized', ...(phone ? { phone } : {}) };
}

export const maskedSessionPhone = (check: SessionCheck): string => check.phone ? `•••• ${check.phone.slice(-4)}` : '';
export const sessionsMismatch = (app: SessionCheck, proof: SessionCheck): boolean =>
  app.status === 'recognized' && proof.status === 'recognized' && Boolean(app.phone && proof.phone && app.phone !== proof.phone);

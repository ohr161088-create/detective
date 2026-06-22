import type { RewardLedger } from './rewardLedger';

export type TossDisconnectPayload = {
  ci?: string;
  userKey?: string;
  appUserId?: string;
  connectionId?: string;
  disconnectedAt?: string;
  [key: string]: unknown;
};

export type DisconnectRequest = {
  method: string;
  body: unknown;
};

export type DisconnectResponse = {
  status: number;
  body: { ok: true; userId: string } | { ok: false; errorCode: 'METHOD_NOT_ALLOWED' | 'MISSING_USER_IDENTIFIER' };
};

export function normalizeDisconnectPayload(body: unknown): { userId: string } | null {
  if (body == null || typeof body !== 'object') {
    return null;
  }

  const payload = body as TossDisconnectPayload;
  const userId = payload.ci || payload.userKey || payload.appUserId || payload.connectionId;

  if (typeof userId !== 'string' || userId.trim() === '') {
    return null;
  }

  return { userId: userId.trim() };
}

export async function handleTossDisconnectRequest(
  request: DisconnectRequest,
  ledger: Pick<RewardLedger, 'markUserDisconnected'>,
): Promise<DisconnectResponse> {
  if (request.method !== 'POST') {
    return { status: 405, body: { ok: false, errorCode: 'METHOD_NOT_ALLOWED' } };
  }

  const normalized = normalizeDisconnectPayload(request.body);
  if (!normalized) {
    return { status: 400, body: { ok: false, errorCode: 'MISSING_USER_IDENTIFIER' } };
  }

  ledger.markUserDisconnected(normalized.userId);
  return { status: 200, body: { ok: true, userId: normalized.userId } };
}

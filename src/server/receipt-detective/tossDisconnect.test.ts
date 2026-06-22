import { describe, expect, it } from 'vitest';
import { createInMemoryRewardLedger } from './rewardLedger';
import { handleTossDisconnectRequest, normalizeDisconnectPayload } from './tossDisconnect';

describe('toss disconnect callback', () => {
  it('normalizes CI as the preferred user identifier', () => {
    expect(normalizeDisconnectPayload({ ci: 'ci-123', userKey: 'user-123' })).toEqual({ userId: 'ci-123' });
  });

  it('marks the user disconnected from a POST callback', async () => {
    const ledger = createInMemoryRewardLedger();

    const response = await handleTossDisconnectRequest(
      {
        method: 'POST',
        body: { ci: 'ci-123', disconnectedAt: '2026-06-21T13:00:00.000Z' },
      },
      ledger,
    );

    expect(response).toEqual({ status: 200, body: { ok: true, userId: 'ci-123' } });
    expect(ledger.isUserDisconnected('ci-123')).toBe(true);
  });

  it('rejects callbacks without a user identifier', async () => {
    const ledger = createInMemoryRewardLedger();

    await expect(handleTossDisconnectRequest({ method: 'POST', body: {} }, ledger)).resolves.toEqual({
      status: 400,
      body: { ok: false, errorCode: 'MISSING_USER_IDENTIFIER' },
    });
  });

  it('rejects non-POST callbacks', async () => {
    const ledger = createInMemoryRewardLedger();

    await expect(handleTossDisconnectRequest({ method: 'GET', body: { ci: 'ci-123' } }, ledger)).resolves.toEqual({
      status: 405,
      body: { ok: false, errorCode: 'METHOD_NOT_ALLOWED' },
    });
  });
});

import { describe, expect, it } from 'vitest';
import { createInMemoryRewardLedger } from './rewardLedger';

describe('receipt detective reward ledger', () => {
  it('records one reward per user, reward type, and date', () => {
    const ledger = createInMemoryRewardLedger();

    const first = ledger.recordReward({
      userId: 'ci-user-1',
      rewardType: 'checkIn',
      rewardDate: '2026-06-21',
      attemptId: 'attempt-1',
    });
    const duplicate = ledger.recordReward({
      userId: 'ci-user-1',
      rewardType: 'checkIn',
      rewardDate: '2026-06-21',
      attemptId: 'attempt-2',
    });

    expect(first).toEqual({ ok: true, status: 'recorded' });
    expect(duplicate).toEqual({ ok: false, reason: 'DUPLICATE_REWARD' });
  });

  it('allows different reward types for the same user and date', () => {
    const ledger = createInMemoryRewardLedger();

    expect(
      ledger.recordReward({ userId: 'ci-user-1', rewardType: 'checkIn', rewardDate: '2026-06-21', attemptId: 'attempt-1' }),
    ).toEqual({ ok: true, status: 'recorded' });
    expect(
      ledger.recordReward({ userId: 'ci-user-1', rewardType: 'mission', rewardDate: '2026-06-21', attemptId: 'attempt-2' }),
    ).toEqual({ ok: true, status: 'recorded' });
  });

  it('blocks rewards after the user disconnects the service', () => {
    const ledger = createInMemoryRewardLedger();
    ledger.markUserDisconnected('ci-user-1');

    expect(
      ledger.recordReward({ userId: 'ci-user-1', rewardType: 'default', rewardDate: '2026-06-21', attemptId: 'attempt-1' }),
    ).toEqual({ ok: false, reason: 'USER_DISCONNECTED' });
  });
});

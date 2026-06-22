import { describe, expect, it } from 'vitest';
import { createRewardAttemptStore } from './rewardAttempts';
import { runRewardedPointFlow } from './rewardFlow';

describe('rewarded point flow', () => {
  it('grants 1 Toss Point after a completed rewarded ad', async () => {
    const store = createRewardAttemptStore(() => 'attempt-1');

    const result = await runRewardedPointFlow({
      attempts: store,
      ads: {
        showRewardedAd: async () => ({ completed: true }),
      },
      promotion: {
        grantTossPoint: async ({ amount }) => ({ ok: true, key: `point-${amount}` }),
      },
    });

    expect(result.status).toBe('grant_completed');
    expect(result.promotionKey).toBe('point-1');
  });

  it('does not grant Toss Point when the ad is not completed', async () => {
    const store = createRewardAttemptStore(() => 'attempt-2');

    const result = await runRewardedPointFlow({
      attempts: store,
      ads: {
        showRewardedAd: async () => ({ completed: false }),
      },
      promotion: {
        grantTossPoint: async () => {
          throw new Error('grant should not be called');
        },
      },
    });

    expect(result.status).toBe('grant_failed');
    expect(result.errorCode).toBe('AD_NOT_COMPLETED');
  });

  it('records a failure when the rewarded ad adapter throws', async () => {
    const store = createRewardAttemptStore(() => 'attempt-3');

    const result = await runRewardedPointFlow({
      attempts: store,
      ads: {
        showRewardedAd: async () => {
          throw new Error('ad failed');
        },
      },
      promotion: {
        grantTossPoint: async () => {
          throw new Error('grant should not be called');
        },
      },
    });

    expect(result.status).toBe('grant_failed');
    expect(result.errorCode).toBe('AD_ERROR');
    expect(store.getAttempt('attempt-3')).toMatchObject({ status: 'grant_failed' });
  });

  it('records a failure when the promotion adapter throws after ad completion', async () => {
    const store = createRewardAttemptStore(() => 'attempt-4');

    const result = await runRewardedPointFlow({
      attempts: store,
      ads: {
        showRewardedAd: async () => ({ completed: true }),
      },
      promotion: {
        grantTossPoint: async () => {
          throw new Error('promotion failed');
        },
      },
    });

    expect(result.status).toBe('grant_failed');
    expect(result.errorCode).toBe('PROMOTION_ERROR');
    expect(store.getAttempt('attempt-4')).toMatchObject({ status: 'grant_failed' });
  });
});

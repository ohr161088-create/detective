import type { RewardedAdAdapter } from './adAdapter';
import type { PromotionAdapter } from './promotionAdapter';
import type { RewardAttempt, RewardAttemptStore } from './rewardAttempts';

export type RewardFlowDependencies = {
  attempts: RewardAttemptStore;
  ads: RewardedAdAdapter;
  promotion: PromotionAdapter;
};

export async function runRewardedPointFlow({
  attempts,
  ads,
  promotion,
}: RewardFlowDependencies): Promise<RewardAttempt> {
  const attempt = attempts.createAttempt();
  const adResult = await ads.showRewardedAd().catch(() => null);

  if (!adResult) {
    return attempts.markGrantFailed(attempt.id, 'AD_ERROR');
  }

  if (!adResult.completed) {
    return attempts.markGrantFailed(attempt.id, 'AD_NOT_COMPLETED');
  }

  attempts.markAdCompleted(attempt.id);
  attempts.markGrantRequested(attempt.id);

  const grant = await promotion
    .grantTossPoint({
      amount: 1,
      attemptId: attempt.id,
    })
    .catch(() => null);

  if (!grant) {
    return attempts.markGrantFailed(attempt.id, 'PROMOTION_ERROR');
  }

  if (!grant.ok) {
    return attempts.markGrantFailed(attempt.id, grant.errorCode);
  }

  return attempts.markGrantCompleted(attempt.id, grant.key);
}

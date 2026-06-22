import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

export type RewardedAdResult = {
  completed: boolean;
};

export type RewardedAdAdapter = {
  showRewardedAd: () => Promise<RewardedAdResult>;
};

const REWARDED_AD_GROUP_ID = process.env.RECEIPT_DETECTIVE_REWARDED_AD_GROUP_ID ?? 'ait-ad-test-rewarded-id';

export function createAppsInTossRewardedAdAdapter(): RewardedAdAdapter {
  return {
    showRewardedAd() {
      return new Promise((resolve, reject) => {
        if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
          resolve({ completed: false });
          return;
        }

        const unregisterLoad = loadFullScreenAd({
          options: { adGroupId: REWARDED_AD_GROUP_ID },
          onEvent: (loadEvent) => {
            if (loadEvent.type !== 'loaded') {
              return;
            }

            unregisterLoad();

            let completed = false;
            const unregisterShow = showFullScreenAd({
              options: { adGroupId: REWARDED_AD_GROUP_ID },
              onEvent: (showEvent) => {
                if (showEvent.type === 'userEarnedReward') {
                  completed = true;
                }
                if (showEvent.type === 'failedToShow') {
                  unregisterShow();
                  resolve({ completed: false });
                }
                if (showEvent.type === 'dismissed') {
                  unregisterShow();
                  resolve({ completed });
                }
              },
              onError: (error) => {
                unregisterShow();
                reject(error);
              },
            });
          },
          onError: reject,
        });
      });
    },
  };
}

import * as WebFramework from '@apps-in-toss/web-framework';

export type RewardAdPlacement = 'default' | 'checkIn' | 'mission';

export type WebRewardedAdResult = {
  completed: boolean;
  reason?: 'UNSUPPORTED' | 'FAILED_TO_LOAD' | 'FAILED_TO_SHOW' | 'DISMISSED';
};

export type WebRewardedAdAdapter = {
  showRewardedAd: () => Promise<WebRewardedAdResult>;
};

type BridgeCommand<TParams> = {
  isSupported?: () => boolean;
  (params: TParams): () => void;
};

type FullScreenAdEvent = {
  type: string;
};

type FullScreenAdBridge = {
  loadFullScreenAd?: BridgeCommand<{
    options: { adGroupId: string };
    onEvent: (event: FullScreenAdEvent) => void;
    onError: (error: unknown) => void;
  }>;
  showFullScreenAd?: BridgeCommand<{
    options: { adGroupId: string };
    onEvent: (event: FullScreenAdEvent) => void;
    onError: (error: unknown) => void;
  }>;
};

export type TossAdsAttachBannerResult = {
  destroy: () => void;
};

export type TossAdsBridge = {
  initialize: {
    isSupported?: () => boolean;
    (params: {
      callbacks: {
        onInitialized: () => void;
        onInitializationFailed: (error: unknown) => void;
      };
    }): void;
  };
  attachBanner: {
    isSupported?: () => boolean;
    (
      adGroupId: string,
      container: HTMLElement,
      options: {
        theme: 'light';
        tone: 'blackAndWhite';
        variant: 'expanded';
        callbacks: Record<string, (payload: unknown) => void>;
      },
    ): TossAdsAttachBannerResult;
  };
};

export const REWARD_AD_GROUP_IDS: Record<RewardAdPlacement, string> = {
  default: 'ait.v2.live.fca2682681cf413a',
  checkIn: 'ait.v2.live.817cb7fc134f42c7',
  mission: 'ait.v2.live.0739bd46f78b4905',
};

export const BANNER_AD_GROUP_ID = 'ait.v2.live.105d3c026af94d7b';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류';
}

export function createUnsupportedWebRewardedAdAdapter(_placement: RewardAdPlacement): WebRewardedAdAdapter {
  return {
    async showRewardedAd() {
      return { completed: false, reason: 'UNSUPPORTED' };
    },
  };
}

export async function loadTossAdsBridge(): Promise<TossAdsBridge | null> {
  const webFramework = WebFramework as { TossAds?: TossAdsBridge };
  return webFramework.TossAds ?? null;
}

function loadFullScreenAdBridge(): FullScreenAdBridge {
  return WebFramework as FullScreenAdBridge;
}

function isBridgeCommandSupported<TParams>(command: BridgeCommand<TParams> | undefined): command is BridgeCommand<TParams> {
  return typeof command === 'function' && (command.isSupported?.() ?? true);
}

export function createAppsInTossWebRewardedAdAdapter(placement: RewardAdPlacement): WebRewardedAdAdapter {
  const adGroupId = REWARD_AD_GROUP_IDS[placement];

  return {
    async showRewardedAd() {
      const { loadFullScreenAd, showFullScreenAd } = loadFullScreenAdBridge();

      if (!isBridgeCommandSupported(loadFullScreenAd) || !isBridgeCommandSupported(showFullScreenAd)) {
        return { completed: false, reason: 'UNSUPPORTED' };
      }

      return new Promise<WebRewardedAdResult>((resolve, reject) => {
        let unregisterLoad: (() => void) | null = null;

        unregisterLoad = loadFullScreenAd({
          options: { adGroupId },
          onEvent: (loadEvent) => {
            if (loadEvent.type !== 'loaded') {
              return;
            }

            unregisterLoad?.();

            let completed = false;
            let unregisterShow: (() => void) | null = null;
            unregisterShow = showFullScreenAd({
              options: { adGroupId },
              onEvent: (showEvent) => {
                if (showEvent.type === 'userEarnedReward') {
                  completed = true;
                }
                if (showEvent.type === 'failedToShow') {
                  unregisterShow?.();
                  resolve({ completed: false, reason: 'FAILED_TO_SHOW' });
                }
                if (showEvent.type === 'dismissed') {
                  unregisterShow?.();
                  resolve(completed ? { completed: true } : { completed: false, reason: 'DISMISSED' });
                }
              },
              onError: (error) => {
                unregisterShow?.();
                reject(error);
              },
            });
          },
          onError: (error) => {
            unregisterLoad?.();
            reject(error);
          },
        });
      });
    },
  };
}

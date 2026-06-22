import { grantPromotionReward } from '@apps-in-toss/framework';

export type GrantTossPointParams = {
  amount: number;
  attemptId: string;
};

export type GrantTossPointResult =
  | { ok: true; key: string }
  | { ok: false; errorCode: string; message: string };

export type PromotionAdapter = {
  grantTossPoint: (params: GrantTossPointParams) => Promise<GrantTossPointResult>;
};

const PROMOTION_CODE = process.env.RECEIPT_DETECTIVE_PROMOTION_CODE ?? 'RECEIPT_DETECTIVE_TEST_PROMOTION';

export function createAppsInTossPromotionAdapter(): PromotionAdapter {
  return {
    async grantTossPoint({ amount }) {
      const result = await grantPromotionReward({
        params: {
          promotionCode: PROMOTION_CODE,
          amount,
        },
      });

      if (!result) {
        return {
          ok: false,
          errorCode: 'UNSUPPORTED_APP_VERSION',
          message: '지원하지 않는 토스앱 버전이에요.',
        };
      }

      if (result === 'ERROR') {
        return {
          ok: false,
          errorCode: 'ERROR',
          message: '토스 포인트 지급 중 알 수 없는 오류가 발생했어요.',
        };
      }

      if ('key' in result) {
        return { ok: true, key: result.key };
      }

      return { ok: false, errorCode: result.errorCode, message: result.message };
    },
  };
}

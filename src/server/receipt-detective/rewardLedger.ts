export type RewardType = 'default' | 'checkIn' | 'mission' | 'tossPointExchange';

export type RewardRecordParams = {
  userId: string;
  rewardType: RewardType;
  rewardDate: string;
  attemptId: string;
};

export type RewardRecordResult =
  | { ok: true; status: 'recorded' }
  | { ok: false; reason: 'DUPLICATE_REWARD' | 'USER_DISCONNECTED' };

export type RewardLedger = {
  recordReward: (params: RewardRecordParams) => RewardRecordResult;
  markUserDisconnected: (userId: string) => void;
  isUserDisconnected: (userId: string) => boolean;
};

function buildRewardKey({ userId, rewardType, rewardDate }: RewardRecordParams): string {
  return `${userId}:${rewardType}:${rewardDate}`;
}

export function createInMemoryRewardLedger(): RewardLedger {
  const rewardKeys = new Set<string>();
  const disconnectedUsers = new Set<string>();

  return {
    recordReward(params) {
      if (disconnectedUsers.has(params.userId)) {
        return { ok: false, reason: 'USER_DISCONNECTED' };
      }

      const rewardKey = buildRewardKey(params);
      if (rewardKeys.has(rewardKey)) {
        return { ok: false, reason: 'DUPLICATE_REWARD' };
      }

      rewardKeys.add(rewardKey);
      return { ok: true, status: 'recorded' };
    },
    markUserDisconnected(userId) {
      disconnectedUsers.add(userId);
    },
    isUserDisconnected(userId) {
      return disconnectedUsers.has(userId);
    },
  };
}

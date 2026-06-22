export type RewardAttemptStatus =
  | 'created'
  | 'ad_completed'
  | 'grant_requested'
  | 'grant_completed'
  | 'grant_failed';

export type RewardAttempt = {
  id: string;
  status: RewardAttemptStatus;
  createdAt: number;
  promotionKey?: string;
  errorCode?: string;
};

export type RewardAttemptStore = {
  createAttempt: () => RewardAttempt;
  markAdCompleted: (id: string) => RewardAttempt;
  markGrantRequested: (id: string) => RewardAttempt;
  markGrantCompleted: (id: string, promotionKey: string) => RewardAttempt;
  markGrantFailed: (id: string, errorCode: string) => RewardAttempt;
  getAttempt: (id: string) => RewardAttempt | undefined;
};

export function createRewardAttemptStore(
  createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
): RewardAttemptStore {
  const attempts = new Map<string, RewardAttempt>();

  function read(id: string): RewardAttempt {
    const attempt = attempts.get(id);
    if (!attempt) {
      throw new Error(`Reward attempt not found: ${id}`);
    }
    return attempt;
  }

  function write(attempt: RewardAttempt): RewardAttempt {
    attempts.set(attempt.id, attempt);
    return attempt;
  }

  return {
    createAttempt() {
      const id = createId();
      if (attempts.has(id)) {
        throw new Error(`Reward attempt id already exists: ${id}`);
      }

      return write({
        id,
        status: 'created',
        createdAt: Date.now(),
      });
    },
    markAdCompleted(id) {
      const attempt = read(id);
      if (attempt.status !== 'created') {
        throw new Error(`Cannot mark ad completed from status ${attempt.status}`);
      }
      return write({ ...attempt, status: 'ad_completed' });
    },
    markGrantRequested(id) {
      const attempt = read(id);
      if (attempt.status !== 'ad_completed') {
        throw new Error(`Cannot request grant from status ${attempt.status}`);
      }
      return write({ ...attempt, status: 'grant_requested' });
    },
    markGrantCompleted(id, promotionKey) {
      const attempt = read(id);
      if (attempt.status === 'grant_completed') {
        throw new Error('Reward attempt already completed');
      }
      if (attempt.status !== 'grant_requested') {
        throw new Error(`Cannot complete grant from status ${attempt.status}`);
      }
      return write({ ...attempt, status: 'grant_completed', promotionKey });
    },
    markGrantFailed(id, errorCode) {
      const attempt = read(id);
      if (attempt.status === 'grant_completed') {
        throw new Error('Reward attempt already completed');
      }
      return write({ ...attempt, status: 'grant_failed', errorCode });
    },
    getAttempt(id) {
      return attempts.get(id);
    },
  };
}

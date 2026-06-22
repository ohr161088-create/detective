import { describe, expect, it } from 'vitest';
import { createRewardAttemptStore } from './rewardAttempts';

describe('reward attempt store', () => {
  it('creates unique attempts and completes each attempt once', () => {
    let nextId = 1;
    const store = createRewardAttemptStore(() => `attempt-${nextId++}`);

    const attempt = store.createAttempt();
    expect(attempt.status).toBe('created');

    store.markAdCompleted(attempt.id);
    store.markGrantRequested(attempt.id);
    const completed = store.markGrantCompleted(attempt.id, 'reward-key-1');

    expect(completed.status).toBe('grant_completed');
    expect(completed.promotionKey).toBe('reward-key-1');
    expect(() => store.markGrantCompleted(attempt.id, 'reward-key-2')).toThrow('Reward attempt already completed');
  });

  it('records grant failures without completing the attempt', () => {
    const store = createRewardAttemptStore(() => 'attempt-2');
    const attempt = store.createAttempt();

    store.markAdCompleted(attempt.id);
    const failed = store.markGrantFailed(attempt.id, '4109');

    expect(failed.status).toBe('grant_failed');
    expect(failed.errorCode).toBe('4109');
  });

  it('does not overwrite an existing attempt when id generation collides', () => {
    const store = createRewardAttemptStore(() => 'same-attempt');

    store.createAttempt();

    expect(() => store.createAttempt()).toThrow('Reward attempt id already exists');
  });

  it('requires a grant request before marking a grant completed', () => {
    const store = createRewardAttemptStore(() => 'attempt-3');
    const attempt = store.createAttempt();

    store.markAdCompleted(attempt.id);

    expect(() => store.markGrantCompleted(attempt.id, 'reward-key-1')).toThrow(
      'Cannot complete grant from status ad_completed',
    );
  });

  it('keeps completed attempts immutable', () => {
    const store = createRewardAttemptStore(() => 'attempt-4');
    const attempt = store.createAttempt();

    store.markAdCompleted(attempt.id);
    store.markGrantRequested(attempt.id);
    store.markGrantCompleted(attempt.id, 'reward-key-1');

    expect(() => store.markGrantFailed(attempt.id, '4109')).toThrow('Reward attempt already completed');
    expect(store.getAttempt(attempt.id)).toMatchObject({
      status: 'grant_completed',
      promotionKey: 'reward-key-1',
    });
  });
});

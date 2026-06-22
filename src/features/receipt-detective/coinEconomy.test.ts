import { describe, expect, it } from 'vitest';
import {
  addAdRewardCoin,
  addCheckInAdReward,
  addDailyMissionAdReward,
  canExchangeToTossPoint,
  createInitialCoinWallet,
  DAILY_AD_REWARD_LIMIT,
  exchangeCoinsForTossPoint,
  STREAK_BONUS_COINS,
} from './coinEconomy';

describe('receipt detective coin economy', () => {
  it('grants one detective coin per completed rewarded ad up to seven times per day', () => {
    let wallet = createInitialCoinWallet('2026-06-20');

    for (let index = 0; index < DAILY_AD_REWARD_LIMIT; index += 1) {
      wallet = addAdRewardCoin(wallet, '2026-06-20');
    }

    expect(DAILY_AD_REWARD_LIMIT).toBe(7);
    expect(wallet.coinBalance).toBe(7);
    expect(wallet.todayAdRewards).toBe(7);
    expect(() => addAdRewardCoin(wallet, '2026-06-20')).toThrow('DAILY_REWARD_LIMIT_REACHED');
  });

  it('resets the daily ad reward count on a new day', () => {
    let wallet = createInitialCoinWallet('2026-06-20');

    wallet = addAdRewardCoin(wallet, '2026-06-20');
    wallet = addAdRewardCoin(wallet, '2026-06-21');

    expect(wallet.coinBalance).toBe(2);
    expect(wallet.todayAdRewards).toBe(1);
    expect(wallet.rewardDate).toBe('2026-06-21');
  });

  it('grants the detective check-in ad reward once per day', () => {
    let wallet = addCheckInAdReward(createInitialCoinWallet('2026-06-20'), '2026-06-20');

    expect(wallet.coinBalance).toBe(3);
    expect(wallet.checkInRewardDate).toBe('2026-06-20');
    expect(() => addCheckInAdReward(wallet, '2026-06-20')).toThrow('CHECK_IN_REWARD_ALREADY_CLAIMED');

    wallet = addCheckInAdReward(wallet, '2026-06-21');

    expect(wallet.coinBalance).toBe(6);
    expect(wallet.checkInRewardDate).toBe('2026-06-21');
  });

  it('grants the daily receipt mission ad reward once per day', () => {
    let wallet = createInitialCoinWallet('2026-06-20');

    wallet = addDailyMissionAdReward(wallet, '2026-06-20');

    expect(wallet.coinBalance).toBe(2);
    expect(wallet.missionRewardDate).toBe('2026-06-20');
    expect(() => addDailyMissionAdReward(wallet, '2026-06-20')).toThrow('MISSION_REWARD_ALREADY_CLAIMED');

    wallet = addDailyMissionAdReward(wallet, '2026-06-21');

    expect(wallet.coinBalance).toBe(4);
    expect(wallet.missionRewardDate).toBe('2026-06-21');
  });

  it('adds a streak bonus after watching reward ads for three consecutive days', () => {
    let wallet = createInitialCoinWallet('2026-06-20');

    wallet = addAdRewardCoin(wallet, '2026-06-20');
    wallet = addAdRewardCoin(wallet, '2026-06-21');
    wallet = addAdRewardCoin(wallet, '2026-06-22');

    expect(wallet.adStreakCount).toBe(3);
    expect(wallet.lastStreakBonusDate).toBe('2026-06-22');
    expect(wallet.coinBalance).toBe(3 + STREAK_BONUS_COINS);

    const afterSameDayAd = addAdRewardCoin(wallet, '2026-06-22');

    expect(afterSameDayAd.coinBalance).toBe(4 + STREAK_BONUS_COINS);
  });

  it('uses 30 detective coins for a 30 won Toss Point exchange', () => {
    const wallet = {
      coinBalance: 30,
      todayAdRewards: 0,
      rewardDate: '2026-06-20',
      totalTossPointsExchanged: 0,
      checkInRewardDate: '',
      missionRewardDate: '',
      adStreakCount: 0,
      adStreakDate: '',
      lastStreakBonusDate: '',
    };

    expect(canExchangeToTossPoint(wallet)).toBe(true);
    expect(exchangeCoinsForTossPoint(wallet)).toEqual({
      coinBalance: 0,
      todayAdRewards: 0,
      rewardDate: '2026-06-20',
      totalTossPointsExchanged: 30,
      checkInRewardDate: '',
      missionRewardDate: '',
      adStreakCount: 0,
      adStreakDate: '',
      lastStreakBonusDate: '',
    });
  });
});


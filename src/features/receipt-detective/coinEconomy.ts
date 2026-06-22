export const COINS_PER_AD_REWARD = 1;
export const DAILY_AD_REWARD_LIMIT = 7;
export const COINS_PER_TOSS_POINT_EXCHANGE = 30;
export const TOSS_POINT_EXCHANGE_UNITS = 30;
export const CHECK_IN_AD_REWARD_COINS = 3;
export const DAILY_MISSION_AD_REWARD_COINS = 2;
export const STREAK_REQUIRED_DAYS = 3;
export const STREAK_BONUS_COINS = 3;

export type CoinWallet = {
  coinBalance: number;
  todayAdRewards: number;
  rewardDate: string;
  totalTossPointsExchanged: number;
  checkInRewardDate: string;
  missionRewardDate: string;
  adStreakCount: number;
  adStreakDate: string;
  lastStreakBonusDate: string;
};

export function createInitialCoinWallet(rewardDate: string): CoinWallet {
  return {
    coinBalance: 0,
    todayAdRewards: 0,
    rewardDate,
    totalTossPointsExchanged: 0,
    checkInRewardDate: '',
    missionRewardDate: '',
    adStreakCount: 0,
    adStreakDate: '',
    lastStreakBonusDate: '',
  };
}

export function normalizeCoinWallet(wallet: Partial<CoinWallet>, rewardDate: string): CoinWallet {
  return {
    coinBalance: Number.isFinite(wallet.coinBalance) ? wallet.coinBalance ?? 0 : 0,
    todayAdRewards: Number.isFinite(wallet.todayAdRewards) ? wallet.todayAdRewards ?? 0 : 0,
    rewardDate: wallet.rewardDate || rewardDate,
    totalTossPointsExchanged: Number.isFinite(wallet.totalTossPointsExchanged) ? wallet.totalTossPointsExchanged ?? 0 : 0,
    checkInRewardDate: wallet.checkInRewardDate || '',
    missionRewardDate: wallet.missionRewardDate || '',
    adStreakCount: Number.isFinite(wallet.adStreakCount) ? wallet.adStreakCount ?? 0 : 0,
    adStreakDate: wallet.adStreakDate || '',
    lastStreakBonusDate: wallet.lastStreakBonusDate || '',
  };
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function applyAdStreak(wallet: CoinWallet, rewardDate: string): CoinWallet {
  if (wallet.adStreakDate === rewardDate) {
    return wallet;
  }

  const isConsecutiveDay = wallet.adStreakDate !== '' && addDays(wallet.adStreakDate, 1) === rewardDate;
  const adStreakCount = isConsecutiveDay ? wallet.adStreakCount + 1 : 1;
  const earnsStreakBonus = adStreakCount >= STREAK_REQUIRED_DAYS && wallet.lastStreakBonusDate !== rewardDate;

  return {
    ...wallet,
    coinBalance: wallet.coinBalance + (earnsStreakBonus ? STREAK_BONUS_COINS : 0),
    adStreakCount,
    adStreakDate: rewardDate,
    lastStreakBonusDate: earnsStreakBonus ? rewardDate : wallet.lastStreakBonusDate,
  };
}

export function addAdRewardCoin(
  wallet: CoinWallet,
  rewardDate: string,
  dailyAdRewardLimit = DAILY_AD_REWARD_LIMIT,
): CoinWallet {
  const normalizedWallet = normalizeCoinWallet(wallet, rewardDate);
  const isNewRewardDate = normalizedWallet.rewardDate !== rewardDate;
  const todayAdRewards = isNewRewardDate ? 0 : normalizedWallet.todayAdRewards;

  if (todayAdRewards >= dailyAdRewardLimit) {
    throw new Error('DAILY_REWARD_LIMIT_REACHED');
  }

  return applyAdStreak(
    {
      ...normalizedWallet,
      coinBalance: normalizedWallet.coinBalance + COINS_PER_AD_REWARD,
      todayAdRewards: todayAdRewards + 1,
      rewardDate,
    },
    rewardDate,
  );
}

export function addCheckInAdReward(wallet: CoinWallet, rewardDate: string): CoinWallet {
  const normalizedWallet = normalizeCoinWallet(wallet, rewardDate);
  if (normalizedWallet.checkInRewardDate === rewardDate) {
    throw new Error('CHECK_IN_REWARD_ALREADY_CLAIMED');
  }

  return applyAdStreak(
    {
      ...normalizedWallet,
      coinBalance: normalizedWallet.coinBalance + CHECK_IN_AD_REWARD_COINS,
      checkInRewardDate: rewardDate,
    },
    rewardDate,
  );
}

export function addDailyMissionAdReward(wallet: CoinWallet, rewardDate: string): CoinWallet {
  const normalizedWallet = normalizeCoinWallet(wallet, rewardDate);
  if (normalizedWallet.missionRewardDate === rewardDate) {
    throw new Error('MISSION_REWARD_ALREADY_CLAIMED');
  }

  return applyAdStreak(
    {
      ...normalizedWallet,
      coinBalance: normalizedWallet.coinBalance + DAILY_MISSION_AD_REWARD_COINS,
      missionRewardDate: rewardDate,
    },
    rewardDate,
  );
}

export function canExchangeToTossPoint(wallet: Pick<CoinWallet, 'coinBalance'>): boolean {
  return wallet.coinBalance >= COINS_PER_TOSS_POINT_EXCHANGE;
}

export function exchangeCoinsForTossPoint(wallet: CoinWallet): CoinWallet {
  if (!canExchangeToTossPoint(wallet)) {
    throw new Error('NOT_ENOUGH_COINS');
  }

  return {
    ...normalizeCoinWallet(wallet, wallet.rewardDate),
    coinBalance: wallet.coinBalance - COINS_PER_TOSS_POINT_EXCHANGE,
    totalTossPointsExchanged: wallet.totalTossPointsExchanged + TOSS_POINT_EXCHANGE_UNITS,
  };
}

export function getExchangeProgressPercent(wallet: Pick<CoinWallet, 'coinBalance'>): number {
  return Math.min(100, Math.floor((wallet.coinBalance / COINS_PER_TOSS_POINT_EXCHANGE) * 100));
}




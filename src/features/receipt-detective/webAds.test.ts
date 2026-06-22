import { describe, expect, it } from 'vitest';
import {
  BANNER_AD_GROUP_ID,
  REWARD_AD_GROUP_IDS,
  createUnsupportedWebRewardedAdAdapter,
} from './webAds';

describe('receipt detective web ads', () => {
  it('maps each web reward placement to its live ad group id', () => {
    expect(REWARD_AD_GROUP_IDS.default).toBe('ait.v2.live.fca2682681cf413a');
    expect(REWARD_AD_GROUP_IDS.checkIn).toBe('ait.v2.live.817cb7fc134f42c7');
    expect(REWARD_AD_GROUP_IDS.mission).toBe('ait.v2.live.0739bd46f78b4905');
  });

  it('uses the live banner ad group id', () => {
    expect(BANNER_AD_GROUP_ID).toBe('ait.v2.live.105d3c026af94d7b');
  });

  it('returns incomplete instead of throwing when web rewarded ads are unsupported', async () => {
    const adapter = createUnsupportedWebRewardedAdAdapter('default');

    await expect(adapter.showRewardedAd()).resolves.toEqual({
      completed: false,
      reason: 'UNSUPPORTED',
    });
  });
});

# Receipt Detective Launch Checklist

## Console Setup

- Register the app ID as `receipt-detective`.
- Set the display name to `영수증 탐정`.
- Upload the final app icon in Apps in Toss Console and set `RECEIPT_DETECTIVE_ICON_URL`.
- Create a rewarded ad group and set `RECEIPT_DETECTIVE_REWARDED_AD_GROUP_ID`.
- Create a non-game Toss Point promotion and set `RECEIPT_DETECTIVE_PROMOTION_CODE`.
- Use test ad and test promotion values only in development builds.

## Reward Policy

- Show real rewards only as `토스 포인트 1원 지급`.
- Internal rewards are called `단서 카드`, not `포인트`.
- Do not use withdrawal, cash-out, exchange, or conversion copy.
- Grant Toss Point only after the rewarded ad emits `userEarnedReward`.
- Repeated rewarded ads are allowed in v1 while ad revenue and promotion budget stay healthy.
- Stop Toss Point grants when promotion budget, fraud checks, or ad availability fail.

## Reliability

- Persist reward attempts or move point grants to a server-to-server idempotent backend before production launch.
- Do not rely only on the in-memory attempt store for production duplicate prevention.
- Add a retry or customer-support recovery path for promotion error `4110`.
- Treat promotion budget errors such as `4109` and `4112` as limit states with clear user copy.
- Confirm app reload, navigation remount, and crash-after-grant scenarios cannot duplicate a Toss Point grant.

## Verification

- Run `npm test`.
- Run `npm run typecheck`.
- Run `npm run build`.
- In Toss sandbox, complete all 3 quiz questions.
- Verify the result screen shows one free clue card.
- Verify closing an ad before reward completion does not grant Toss Point.
- Verify rewarded ad completion grants Toss Point 1 won.
- Verify repeated rewarded ads reveal additional clue cards.
